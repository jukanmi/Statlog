import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GCP_AI_ENDPOINT: str = os.getenv("GCP_AI_ENDPOINT", "http://<GCP-IP>:8000/generate_stats")
    MAX_RETRIES: int = 3
    TIMEOUT: float = 5.0

settings = Settings()
