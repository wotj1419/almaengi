from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model_default: str = "gpt-4o-mini"
    openai_model_complex: str = "gpt-4o"

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "labor_law"

    @property
    def qdrant_url(self) -> str:
        return f"http://{self.qdrant_host}:{self.qdrant_port}"

    ai_redis_host: str = "localhost"
    ai_redis_port: int = 6381
    ai_redis_password: str = ""
    cache_ttl_seconds: int = 86400

    @property
    def redis_url(self) -> str:
        if self.ai_redis_password:
            return f"redis://:{self.ai_redis_password}@{self.ai_redis_host}:{self.ai_redis_port}"
        return f"redis://{self.ai_redis_host}:{self.ai_redis_port}"

    internal_api_host: str = "localhost"
    internal_api_port: int = 8080
    internal_api_key: str = ""

    @property
    def internal_api_url(self) -> str:
        return f"http://{self.internal_api_host}:{self.internal_api_port}"

    search_top_k: int = 20
    rerank_top_k: int = 5
    max_context_tokens: int = 4000

    model_config = {"env_file": "../.env"}


def get_settings() -> Settings:
    return Settings()
