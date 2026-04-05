"""Vertex AI (Gemini) service wrapper.

Provides a simple ``generate()`` method that calls the Gemini model via
the Vertex AI SDK.  When GCP is not configured the service returns
deterministic mock responses so the app works locally without credentials.
"""

from __future__ import annotations

import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _try_import_vertex():
    """Lazy import so the app doesn't crash if the SDK is absent."""
    try:
        from vertexai.generative_models import GenerativeModel
        return GenerativeModel
    except ImportError:
        return None


class VertexService:
    """Thin wrapper around Vertex AI GenerativeModel."""

    def __init__(self) -> None:
        self._model = None
        GenerativeModel = _try_import_vertex()

        if GenerativeModel and settings.is_gcp_configured:
            try:
                import vertexai
                vertexai.init(
                    project=settings.google_cloud_project,
                    location=settings.vertex_location,
                )
                # Verify credentials are actually available before marking as live
                from google.auth import default as _default_creds
                _default_creds()
                self._model = GenerativeModel(settings.vertex_model_name)
                logger.info("Vertex AI initialised with model %s", settings.vertex_model_name)
            except Exception as exc:
                logger.warning("Vertex AI init failed, using mock: %s", exc)

    @property
    def is_live(self) -> bool:
        return self._model is not None

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        """Generate text from the model.

        Args:
            prompt: The user/content prompt.
            system_prompt: Optional system instruction prepended to the call.

        Returns:
            Generated text, or a mock response if Vertex is unavailable.
        """
        if not self._model:
            return self._mock_generate(prompt, system_prompt)

        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self._model.generate_content(full_prompt)
            return response.text
        except Exception as exc:
            logger.error("Vertex generate failed, falling back to mock: %s", exc)
            return self._mock_generate(prompt, system_prompt)

    def generate_json(self, prompt: str, system_prompt: str = "") -> dict:
        """Generate and parse a JSON response from the model.

        Tries to extract JSON from the model output.  Returns a dict on
        success, or a fallback dict with a ``raw`` key on parse failure.
        """
        raw = self.generate(prompt, system_prompt)
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return {"raw": raw}

    # ------------------------------------------------------------------
    # Mock fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _mock_generate(prompt: str, system_prompt: str) -> str:
        """Return a deterministic mock response for local development."""
        return (
            f"[Mock Vertex AI response]\n"
            f"System: {system_prompt[:80] if system_prompt else '(none)'}\n"
            f"Prompt preview: {prompt[:200]}"
        )
