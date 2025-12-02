import logging
import json
import time
from typing import Type, TypeVar, Optional
from threading import Lock
from datetime import datetime

import openai
from django.conf import settings
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class LLMServiceError(Exception):
    """Base exception for LLM service errors."""
    pass


class LLMValidationError(LLMServiceError):
    """Raised when LLM response validation fails."""
    pass


class LLMAPIError(LLMServiceError):
    """Raised when OpenAI API call fails."""
    pass


class LLMService:
    """
    Singleton service for interacting with OpenAI LLM.

    This service provides a reusable OpenAI client and methods for
    extracting structured data from text using Pydantic models.
    """

    _instance: Optional['LLMService'] = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once
        if not hasattr(self, '_initialized'):
            self._client = None
            self._model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
            self._temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.7)
            self._max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 2000)
            self._initialized = True

    @property
    def client(self) -> openai.OpenAI:
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            api_key = getattr(settings, 'OPENAI_API_KEY', None)
            if not api_key:
                raise LLMServiceError(
                    "OPENAI_API_KEY not found in Django settings. "
                    "Please configure it in your settings file."
                )
            self._client = openai.OpenAI(api_key=api_key)
        return self._client

    def extract_entities(
        self,
        text: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        model: Optional[str] = None,
        user=None
    ) -> T:
        """
        Extract structured entities from text using OpenAI's structured outputs.

        Args:
            text: The text to extract entities from
            response_model: Pydantic model class defining the expected response structure
            system_prompt: Optional custom system prompt (defaults to entity extraction prompt)
            temperature: Optional temperature override (0.0-2.0)
            model: Optional model override (e.g., 'gpt-4o-mini', 'gpt-4o')

        Returns:
            An instance of response_model populated with extracted data

        Raises:
            LLMAPIError: If the OpenAI API call fails
            LLMValidationError: If the response cannot be validated against the model
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        # Default system prompt for entity extraction
        if system_prompt is None:
            system_prompt = (
                "You are a helpful assistant that extracts structured information from text. "
                "Analyze the provided text and extract all relevant entities (characters, groups, events, locations, relationships). "
                "Be thorough and accurate. If the text is just a title or very short, try to extract what you can based on your knowledge. "
                "If you cannot find any entities of a particular type, attempt to create the characters based on existing stories, return an empty array for that type. "
                "Respond in the same language as the input text."
                "Go in depth, create as many sub events as needed"
            )

        # Use configured defaults or provided overrides
        llm_temperature = temperature if temperature is not None else self._temperature
        llm_model = model or self._model

        # Generate a unique request ID for tracking
        request_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        start_time = time.time()

        # Initialize log data
        log_data = {
            'request_id': request_id,
            'model': llm_model,
            'temperature': llm_temperature,
            'response_model_name': response_model.__name__,
            'system_prompt': system_prompt,
            'user_input': text,
            'user_input_length': len(text),
            'user': user,
        }

        try:
            logger.info(
                f"[{request_id}] Starting LLM request - model={llm_model}, "
                f"response_model={response_model.__name__}, temperature={llm_temperature}"
            )

            from openai import OpenAI
            client = OpenAI()
            messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ]

            # Log the full prompt details
            logger.info(
                f"[{request_id}] LLM PROMPT:\n"
                f"{'='*80}\n"
                f"System Prompt:\n{system_prompt}\n"
                f"{'-'*80}\n"
                f"User Input (length: {len(text)} chars):\n{text[:500]}{'...' if len(text) > 500 else ''}\n"
                f"{'='*80}"
            )

            response =  client.responses.parse(
                model=llm_model,
                input=messages,
                text_format=response_model,
            )

            parsed_response = response.output_parsed

            if parsed_response is None:
                raise LLMValidationError("Received None from output_parsed")

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Log the response details
            try:
                response_dict = parsed_response.model_dump() if hasattr(parsed_response, 'model_dump') else {}
                response_json = json.dumps(response_dict, indent=2, default=str)
            except Exception as e:
                response_json = f"<Could not serialize response: {str(e)}>"
                response_dict = {}

            logger.info(
                f"[{request_id}] LLM RESPONSE:\n"
                f"{'='*80}\n"
                f"Response Type: {type(parsed_response).__name__}\n"
                f"Response Data:\n{response_json}\n"
                f"{'='*80}"
            )

            # Extract token usage if available
            prompt_tokens = None
            completion_tokens = None
            total_tokens = None

            if hasattr(response, 'usage'):
                prompt_tokens = getattr(response.usage, 'prompt_tokens', None)
                completion_tokens = getattr(response.usage, 'completion_tokens', None)
                total_tokens = getattr(response.usage, 'total_tokens', None)

                logger.info(
                    f"[{request_id}] Token Usage - "
                    f"Prompt: {prompt_tokens or 'N/A'}, "
                    f"Completion: {completion_tokens or 'N/A'}, "
                    f"Total: {total_tokens or 'N/A'}"
                )

            # Update log data with success info
            log_data.update({
                'status': 'success',
                'response_data': response_dict,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'total_tokens': total_tokens,
                'duration_ms': duration_ms,
            })

            # Save to database
            self._save_log_to_db(log_data)

            logger.info(f"[{request_id}] Successfully completed LLM request")
            return parsed_response

        except openai.APIError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data.update({
                'status': 'error',
                'error_message': str(e),
                'duration_ms': duration_ms,
            })
            self._save_log_to_db(log_data)
            logger.error(f"[{request_id}] OpenAI API error: {str(e)}")
            raise LLMAPIError(f"OpenAI API request failed: {str(e)}") from e

        except openai.APIConnectionError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data.update({
                'status': 'error',
                'error_message': str(e),
                'duration_ms': duration_ms,
            })
            self._save_log_to_db(log_data)
            logger.error(f"[{request_id}] OpenAI connection error: {str(e)}")
            raise LLMAPIError(f"Failed to connect to OpenAI: {str(e)}") from e

        except openai.RateLimitError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data.update({
                'status': 'error',
                'error_message': str(e),
                'duration_ms': duration_ms,
            })
            self._save_log_to_db(log_data)
            logger.error(f"[{request_id}] OpenAI rate limit exceeded: {str(e)}")
            raise LLMAPIError(f"OpenAI rate limit exceeded: {str(e)}") from e

        except ValidationError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data.update({
                'status': 'validation_error',
                'error_message': str(e),
                'duration_ms': duration_ms,
            })
            self._save_log_to_db(log_data)
            logger.error(f"[{request_id}] Pydantic validation error: {str(e)}")
            raise LLMValidationError(f"Failed to validate LLM response: {str(e)}") from e

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            log_data.update({
                'status': 'error',
                'error_message': str(e),
                'duration_ms': duration_ms,
            })
            self._save_log_to_db(log_data)
            logger.error(f"[{request_id}] Unexpected error during entity extraction: {str(e)}")
            raise LLMServiceError(f"Unexpected error: {str(e)}") from e

    def _save_log_to_db(self, log_data: dict):
        """
        Save LLM log to database.

        Args:
            log_data: Dictionary containing log information
        """
        try:
            from api.story.models import LLMLog

            LLMLog.objects.create(**log_data)
            logger.debug(f"[{log_data.get('request_id')}] Successfully saved log to database")
        except Exception as e:
            # Don't fail the request if logging fails
            logger.error(f"[{log_data.get('request_id')}] Failed to save log to database: {str(e)}")

    def configure(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ):
        """
        Update service configuration.

        Args:
            model: OpenAI model to use
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
        """
        if model is not None:
            self._model = model
        if temperature is not None:
            if not 0.0 <= temperature <= 2.0:
                raise ValueError("Temperature must be between 0.0 and 2.0")
            self._temperature = temperature
        if max_tokens is not None:
            if max_tokens <= 0:
                raise ValueError("max_tokens must be positive")
            self._max_tokens = max_tokens

        logger.info(
            f"LLM service configured: model={self._model}, "
            f"temperature={self._temperature}, max_tokens={self._max_tokens}"
        )


# Convenience function for backward compatibility
def get_llm_service() -> LLMService:
    """Get the singleton LLM service instance."""
    return LLMService()