import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smart_parking_jwt_secret_key_2026")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/smart_parking")
    DB_NAME = os.getenv("DB_NAME", "smart_parking")
    PORT = int(os.getenv("PORT", 5000))
    SOCKET_SERVICE_URL = os.getenv("SOCKET_SERVICE_URL", "http://127.0.0.1:4000/api/broadcast-slot")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))
