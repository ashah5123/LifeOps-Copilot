class VertexService:
    def generate_text(self, prompt: str) -> str:
        return f"AI response to: {prompt[:100]}"
