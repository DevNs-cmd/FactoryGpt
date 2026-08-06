import os

class Settings:
    PROJECT_NAME: str = "FactoryGPT Chatbot Assistant"
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    MODEL_NAME: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "factorygpt-super-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    BACKEND_CORE_URL: str = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
    ROOTCAUSE_SERVICE_URL: str = os.getenv("ROOTCAUSE_SERVICE_URL", "http://localhost:8004")
    MAINTENANCE_SERVICE_URL: str = os.getenv("MAINTENANCE_SERVICE_URL", "http://localhost:8003")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chatbot_history.db")

settings = Settings()
