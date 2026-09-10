from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CampusOS API"

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "campusos"

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # JWT Authentication
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # development only!
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI Provider
    GEMINI_API_KEY: str = ""
    AI_PROVIDER: str = "gemini"
    AI_MODEL: str = "gemini-1.5-flash"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
