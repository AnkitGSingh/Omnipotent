from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "OmniChat API"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/omnichat"
    
    # Clerk Authentication
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    
    # AWS Bedrock for LangChain
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
