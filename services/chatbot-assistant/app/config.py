import os

class Settings:
    PROJECT_NAME: str = "FactoryGPT Chatbot Assistant"
    
    # LLM Providers
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL: str = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")
    
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    MODEL_NAME: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "factorygpt-super-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    BACKEND_CORE_URL: str = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
    ROOTCAUSE_SERVICE_URL: str = os.getenv("ROOTCAUSE_SERVICE_URL", "http://localhost:8004")
    MAINTENANCE_SERVICE_URL: str = os.getenv("MAINTENANCE_SERVICE_URL", "http://localhost:8003")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chatbot_history.db")

settings = Settings()

