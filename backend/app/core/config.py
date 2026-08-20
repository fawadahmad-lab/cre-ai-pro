from pydantic_settings import BaseSettings
from typing import Optional
import os
from  dotenv import load_dotenv
load_dotenv()
class Settings(BaseSettings):
    PROJECT_NAME: str = "CRE AI Pro"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: os.getenv("DATABASE_URL","")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY","")
    GROQ_MODEL: os.getenv("GROQ_MODEL","")
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
