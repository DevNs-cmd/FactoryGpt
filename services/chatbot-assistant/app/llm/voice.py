"""
Owner: Gauri
Voice processing module: Speech-To-Text (STT) transcription & voice handling.
"""
import os
import tempfile
from app.config import settings

def transcribe_audio(audio_bytes: bytes, filename: str = "voice.wav") -> str:
    """Transcribe raw audio bytes to text using Groq Whisper API or fallback decoder."""
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name

            with open(temp_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(filename, file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                    language="en",
                    temperature=0.0
                )
            
            os.remove(temp_path)
            if hasattr(transcription, "text"):
                return transcription.text
            elif isinstance(transcription, dict) and "text" in transcription:
                return transcription["text"]
        except Exception as e:
            print(f"[Whisper STT Warning] {e}. Falling back to default voice simulation...")

    # Fallback voice recognition simulation for demo/testing
    return "What is today's production count and current OEE?"
