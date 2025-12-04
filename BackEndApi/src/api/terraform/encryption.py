"""Encryption utilities for secure credential storage."""
import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from django.conf import settings


class CredentialEncryption:
    """
    Handles encryption and decryption of sensitive credentials.

    Uses Fernet (symmetric encryption) with a key derived from Django's SECRET_KEY.
    This ensures credentials are encrypted at rest in the database.
    """

    _cipher = None

    @classmethod
    def _get_cipher(cls):
        """Get or create the Fernet cipher instance."""
        if cls._cipher is None:
            # Derive a 32-byte key from Django's SECRET_KEY
            secret_key = settings.SECRET_KEY.encode()

            # Use PBKDF2HMAC to derive a proper encryption key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'terraform_credentials_salt',  # Static salt for key derivation
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(secret_key))
            cls._cipher = Fernet(key)

        return cls._cipher

    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """
        Encrypt a plaintext string.

        Args:
            plaintext: The string to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ""

        cipher = cls._get_cipher()
        encrypted_bytes = cipher.encrypt(plaintext.encode())
        return encrypted_bytes.decode()

    @classmethod
    def decrypt(cls, encrypted_text: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            encrypted_text: The base64-encoded encrypted string

        Returns:
            Decrypted plaintext string
        """
        if not encrypted_text:
            return ""

        cipher = cls._get_cipher()
        decrypted_bytes = cipher.decrypt(encrypted_text.encode())
        return decrypted_bytes.decode()

    @classmethod
    def rotate_key(cls):
        """
        Rotate the encryption key.

        WARNING: This will invalidate all existing encrypted data.
        Must be called with a migration to re-encrypt existing credentials.
        """
        cls._cipher = None


def encrypt_field(value: str) -> str:
    """Convenience function to encrypt a field value."""
    return CredentialEncryption.encrypt(value)


def decrypt_field(value: str) -> str:
    """Convenience function to decrypt a field value."""
    return CredentialEncryption.decrypt(value)
