import logging
from pymongo import MongoClient, ASCENDING
import mongomock
from config import Config

logger = logging.getLogger(__name__)

mongo_client = None
db = None
is_mock_db = False

def init_db():
    global mongo_client, db, is_mock_db
    try:
        # Use appropriate timeout: 5000ms for cloud Atlas clusters, 1500ms for local
        timeout = 5000 if "mongodb+srv" in Config.MONGO_URI else 1500
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=timeout)
        client.admin.command('ismaster')
        mongo_client = client
        db = mongo_client[Config.DB_NAME]
        is_mock_db = False

        # Ensure collection indexes on real MongoDB
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.parking_spots.create_index([("spot_number", ASCENDING), ("zone", ASCENDING)], unique=True)
        db.bookings.create_index([("pass_id", ASCENDING)], unique=True)
        db.bookings.create_index([("user_id", ASCENDING)])
        db.bookings.create_index([("spot_id", ASCENDING)])

        logger.info(f"Connected to REAL MongoDB server: {Config.DB_NAME}")

        # Auto-seed if real database is brand new / empty
        if db.parking_spots.count_documents({}) == 0:
            try:
                from seed_data import seed_database
                seed_database(db)
                logger.info("Connected MongoDB auto-seeded with initial demo dataset.")
            except Exception as s_err:
                logger.warning(f"Seed notice: {s_err}")

        return db
    except Exception as e:
        logger.warning(
            f"[ParkPulse Notice] Could not connect to real MongoDB at {Config.MONGO_URI} ({e}). "
            f"Activating Embedded In-Memory MongoDB Engine for instant zero-dependency prototyping!"
        )
        is_mock_db = True
        mongo_client = mongomock.MongoClient()
        db = mongo_client[Config.DB_NAME]

        # Auto-seed mock database so it's immediately usable
        try:
            from seed_data import seed_database
            seed_database(db)
            logger.info("Embedded database auto-seeded with demo spots, admin, and driver accounts.")
        except Exception as seed_err:
            logger.warning(f"Auto-seed notice: {seed_err}")

        return db

def get_db():
    global db
    if db is None:
        init_db()
    return db
