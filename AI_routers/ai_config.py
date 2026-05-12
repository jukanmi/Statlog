import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GCP_AI_ENDPOINT: str = os.getenv("GCP_AI_ENDPOINT", "http://<GCP-IP>:8000/generate_stats")
    MAX_RETRIES: int = 2
    TIMEOUT: float = 90.0

settings = Settings()
