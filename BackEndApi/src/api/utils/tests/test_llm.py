from unittest.mock import patch, MagicMock
from pydantic import BaseModel, Field
from django.test import TestCase, override_settings
from api.utils.llm import (
    LLMService,
    get_llm_service,
    LLMServiceError,
    LLMAPIError,
    LLMValidationError
)
import openai


class Character(BaseModel):
    name: str = Field(..., description="Character name")
    description: str = Field(..., description="Character description")


@override_settings(OPENAI_API_KEY='test-key')
class LLMServiceTest(TestCase):
    def setUp(self):
        # Reset singleton instance for each test
        LLMService._instance = None

    def test_singleton_pattern(self):
        """Test that LLMService follows singleton pattern."""
        service1 = LLMService()
        service2 = LLMService()
        service3 = get_llm_service()

        self.assertIs(service1, service2)
        self.assertIs(service2, service3)

    def test_configure_service(self):
        """Test service configuration."""
        service = LLMService()

        service.configure(
            model='gpt-4o',
            temperature=0.5,
            max_tokens=1000
        )

        self.assertEqual(service._model, 'gpt-4o')
        self.assertEqual(service._temperature, 0.5)
        self.assertEqual(service._max_tokens, 1000)

    def test_configure_invalid_temperature(self):
        """Test that invalid temperature raises ValueError."""
        service = LLMService()

        with self.assertRaises(ValueError):
            service.configure(temperature=3.0)

    def test_configure_invalid_max_tokens(self):
        """Test that invalid max_tokens raises ValueError."""
        service = LLMService()

        with self.assertRaises(ValueError):
            service.configure(max_tokens=-1)

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_success(self, mock_client):
        """Test successful entity extraction with structured output."""
        # Arrange
        expected_character = Character(name="John Doe", description="A brave hero")

        mock_parsed = expected_character
        mock_completion = MagicMock()
        mock_completion.message.parsed = mock_parsed
        mock_response = MagicMock()
        mock_response.choices = [mock_completion]

        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.return_value = mock_response
        mock_client.beta = mock_beta

        service = LLMService()
        text = "John Doe is a brave hero."

        # Act
        result = service.extract_entities(text, Character)

        # Assert
        self.assertIsInstance(result, Character)
        self.assertEqual(result.name, "John Doe")
        self.assertEqual(result.description, "A brave hero")
        mock_beta.chat.completions.parse.assert_called_once()

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_with_fallback(self, mock_client):
        """Test entity extraction with fallback to manual parsing."""
        # Arrange
        expected_character = Character(name="Jane Smith", description="A skilled warrior")

        mock_completion = MagicMock()
        mock_completion.message.parsed = None  # Force fallback
        mock_completion.message.content = expected_character.model_dump_json()
        mock_response = MagicMock()
        mock_response.choices = [mock_completion]

        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.return_value = mock_response
        mock_client.beta = mock_beta

        service = LLMService()
        text = "Jane Smith is a skilled warrior."

        # Act
        result = service.extract_entities(text, Character)

        # Assert
        self.assertIsInstance(result, Character)
        self.assertEqual(result.name, "Jane Smith")
        self.assertEqual(result.description, "A skilled warrior")

    def test_extract_entities_empty_text(self):
        """Test that empty text raises ValueError."""
        service = LLMService()

        with self.assertRaises(ValueError):
            service.extract_entities("", Character)

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_api_error(self, mock_client):
        """Test handling of OpenAI API errors."""
        # Arrange
        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.side_effect = openai.APIError("API error")
        mock_client.beta = mock_beta

        service = LLMService()
        text = "Some text"

        # Act & Assert
        with self.assertRaises(LLMAPIError):
            service.extract_entities(text, Character)

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_rate_limit_error(self, mock_client):
        """Test handling of rate limit errors."""
        # Arrange
        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.side_effect = openai.RateLimitError("Rate limit exceeded")
        mock_client.beta = mock_beta

        service = LLMService()
        text = "Some text"

        # Act & Assert
        with self.assertRaises(LLMAPIError):
            service.extract_entities(text, Character)

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_connection_error(self, mock_client):
        """Test handling of connection errors."""
        # Arrange
        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.side_effect = openai.APIConnectionError(request=MagicMock())
        mock_client.beta = mock_beta

        service = LLMService()
        text = "Some text"

        # Act & Assert
        with self.assertRaises(LLMAPIError):
            service.extract_entities(text, Character)

    @patch('api.utils.llm.LLMService.client', new_callable=lambda: MagicMock())
    def test_extract_entities_custom_prompt(self, mock_client):
        """Test entity extraction with custom system prompt."""
        # Arrange
        expected_character = Character(name="Test", description="Test character")

        mock_parsed = expected_character
        mock_completion = MagicMock()
        mock_completion.message.parsed = mock_parsed
        mock_response = MagicMock()
        mock_response.choices = [mock_completion]

        mock_beta = MagicMock()
        mock_beta.chat.completions.parse.return_value = mock_response
        mock_client.beta = mock_beta

        service = LLMService()
        custom_prompt = "You are a specialized character extractor."
        text = "Test is a test character."

        # Act
        result = service.extract_entities(
            text,
            Character,
            system_prompt=custom_prompt,
            temperature=0.3,
            model='gpt-4o'
        )

        # Assert
        self.assertIsInstance(result, Character)
        call_args = mock_beta.chat.completions.parse.call_args
        self.assertEqual(call_args[1]['messages'][0]['content'], custom_prompt)
        self.assertEqual(call_args[1]['temperature'], 0.3)
        self.assertEqual(call_args[1]['model'], 'gpt-4o')

    @override_settings(OPENAI_API_KEY=None)
    def test_missing_api_key(self):
        """Test that missing API key raises error."""
        # Reset singleton
        LLMService._instance = None
        service = LLMService()

        with self.assertRaises(LLMServiceError):
            # Access client property to trigger error
            _ = service.client
