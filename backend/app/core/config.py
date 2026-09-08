from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CRE AI Pro"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./cre_ai_pro.db"

    # Local LLM (Ollama)
    OLLAMA_MODEL: str = "llama3.2:1b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Email (Resend) - leave empty to skip sending
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "CRE AI Pro <onboarding@resend.dev>"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
