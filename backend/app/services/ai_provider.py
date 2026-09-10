"""
AI Provider Abstraction Layer

Provides a clean interface over LLM providers so the application is not
hard-coded to a single vendor. The provider is selected by AI_PROVIDER env var.

Supported providers:
  gemini — Google Gemini via google-generativeai SDK
  mock   — Deterministic mock for automated tests

NEVER hard-code API keys. All secrets must come from environment variables.
"""
from abc import ABC, abstractmethod
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base for all LLM providers."""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """
        Generate a response from the LLM.

        Args:
            system_prompt: Instructions and context for the model.
            user_prompt:   The user's question / task.

        Returns:
            The raw text response from the model.

        Raises:
            AIProviderError: On any provider-level failure.
        """
        ...


class AIProviderError(Exception):
    """Raised when the AI provider fails to generate a response."""
    pass


class GeminiProvider(AIProvider):
    """Google Gemini provider using the official SDK."""

    def __init__(self) -> None:
        try:
            import google.generativeai as genai  # type: ignore[import-untyped]
            if not settings.GEMINI_API_KEY:
                raise AIProviderError(
                    "GEMINI_API_KEY is not configured. "
                    "Set it in the .env file or environment."
                )
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(settings.AI_MODEL)
            logger.info("GeminiProvider initialised with model=%s", settings.AI_MODEL)
        except ImportError as exc:
            raise AIProviderError(
                "google-generativeai is not installed. "
                "Run: pip install google-generativeai"
            ) from exc

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            import asyncio
            import google.generativeai as genai  # type: ignore[import-untyped]

            full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

            # The SDK's generate_content is synchronous; run in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self._model.generate_content(full_prompt)
            )
            return response.text
        except Exception as exc:
            logger.error("Gemini generation failed: %s", exc)
            raise AIProviderError(f"Gemini generation failed: {exc}") from exc


class MockProvider(AIProvider):
    """
    Deterministic mock provider for automated tests.
    Returns structured, predictable text so tests can validate parsing
    without making real API calls.
    """

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        return (
            "ANSWER: Based on the institutional data provided, here is the information you requested.\n"
            "CLAIM[VERIFIED]: The data was retrieved from the CampusOS database. Source: events\n"
            "CLAIM[DERIVED]: Counts were calculated from the available records. Source: events\n"
            "CLAIM[RECOMMENDATION]: Consider scheduling events during off-peak periods.\n"
            "SOURCES: events, clubs"
        )


def get_ai_provider() -> AIProvider:
    """
    Factory that returns the configured AI provider instance.
    Reads AI_PROVIDER from settings (env var).
    """
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "mock":
        return MockProvider()
    else:
        logger.warning(
            "Unknown AI_PROVIDER '%s', falling back to mock provider.",
            provider_name
        )
        return MockProvider()
