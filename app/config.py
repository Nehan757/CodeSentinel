from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    GITHUB_TOKEN: str
    GITHUB_WEBHOOK_SECRET: str
    OPENAI_MODEL: str = "gpt-4o"

    class Config:
        env_file = ".env"


settings = Settings()
