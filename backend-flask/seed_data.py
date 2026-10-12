import bcrypt
from datetime import datetime, timezone, timedelta
from database import get_db

def seed_database(target_db=None):
    db = target_db if target_db is not None else get_db()
    if db is None:
        print("[!] Cannot access database.")
        return

    # Check if data already exists to avoid redundant re-seeding if called repeatedly
    if db.parking_spots.count_documents({}) > 0 and db.users.count_documents({}) > 0:
        return

    print("[*] Seeding database with initial demo data...")
    db.users.delete_many({})
    db.parking_spots.delete_many({})
    db.bookings.delete_many({})

    # 1. Create Default Users
    admin_pw = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    driver_pw = bcrypt.hashpw("driver123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    admin_user = {
        "name": "Alex Vance (Admin)",
        "email": "admin@smartparking.com",
        "password_hash": admin_pw,
        "role": "admin",
        "vehicle_number": "KA-01-MG-9999",
        "created_at": datetime.now(timezone.utc)
    }
    admin_id = db.users.insert_one(admin_user).inserted_id

    driver_user = {
        "name": "Sarah Connor",
        "email": "driver@smartparking.com",
        "password_hash": driver_pw,
        "role": "driver",
        "vehicle_number": "DL-08-AB-4321",
        "created_at": datetime.now(timezone.utc)
    }
    driver_id = db.users.insert_one(driver_user).inserted_id

    # 2. Create Parking Spots across Zones A, B, C
    sample_spots = [
        # Zone A - North Gate (4-wheelers)
        {"spot_number": "A1", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 50},
        {"spot_number": "A2", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "occupied", "price_per_hour": 50},
        {"spot_number": "A3", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "reserved", "price_per_hour": 50},
        {"spot_number": "A4", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 50},
        {"spot_number": "A5", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 50},
        {"spot_number": "A6", "zone": "Zone A", "vehicle_type": "four-wheeler", "status": "occupied", "price_per_hour": 50},

        # Zone B - Basement Level 1 (2-wheelers & 4-wheelers)
        {"spot_number": "B1", "zone": "Zone B", "vehicle_type": "two-wheeler", "status": "available", "price_per_hour": 20},
        {"spot_number": "B2", "zone": "Zone B", "vehicle_type": "two-wheeler", "status": "available", "price_per_hour": 20},
        {"spot_number": "B3", "zone": "Zone B", "vehicle_type": "two-wheeler", "status": "occupied", "price_per_hour": 20},
        {"spot_number": "B4", "zone": "Zone B", "vehicle_type": "two-wheeler", "status": "available", "price_per_hour": 20},
        {"spot_number": "B5", "zone": "Zone B", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 50},
        {"spot_number": "B6", "zone": "Zone B", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 50},

        # Zone C - Premium & EV (Fast Charging bays)
        {"spot_number": "C1", "zone": "Zone C", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 80},
        {"spot_number": "C2", "zone": "Zone C", "vehicle_type": "four-wheeler", "status": "occupied", "price_per_hour": 80},
        {"spot_number": "C3", "zone": "Zone C", "vehicle_type": "four-wheeler", "status": "available", "price_per_hour": 80},
        {"spot_number": "C4", "zone": "Zone C", "vehicle_type": "two-wheeler", "status": "available", "price_per_hour": 30},
    ]

    now = datetime.now(timezone.utc)
    for spot in sample_spots:
        spot["current_booking_id"] = None
        spot["created_at"] = now
        spot["updated_at"] = now
        db.parking_spots.insert_one(spot)

    # 3. Create Sample Bookings for Occupied and Reserved spots
    spot_a3 = db.parking_spots.find_one({"spot_number": "A3"})
    if spot_a3:
        b1 = {
            "user_id": driver_id,
            "user_name": "Sarah Connor",
            "user_email": "driver@smartparking.com",
            "spot_id": spot_a3["_id"],
            "spot_number": "A3",
            "zone": "Zone A",
            "vehicle_type": "four-wheeler",
            "vehicle_number": "DL-08-AB-4321",
            "start_time": now,
            "end_time": now + timedelta(hours=3),
            "duration_hours": 3,
            "price_per_hour": 50.0,
            "total_amount": 150.0,
            "status": "reserved",
            "pass_id": "PASS-DEMO01",
            "created_at": now
        }
        res1 = db.bookings.insert_one(b1)
        db.parking_spots.update_one({"_id": spot_a3["_id"]}, {"$set": {"current_booking_id": res1.inserted_id}})

    spot_a2 = db.parking_spots.find_one({"spot_number": "A2"})
    if spot_a2:
        b2 = {
            "user_id": driver_id,
            "user_name": "Michael Knight",
            "user_email": "driver@smartparking.com",
            "spot_id": spot_a2["_id"],
            "spot_number": "A2",
            "zone": "Zone A",
            "vehicle_type": "four-wheeler",
            "vehicle_number": "MH-02-GT-7777",
            "start_time": now - timedelta(hours=1),
            "end_time": now + timedelta(hours=2),
            "duration_hours": 3,
            "price_per_hour": 50.0,
            "total_amount": 150.0,
            "status": "checked_in",
            "pass_id": "PASS-DEMO02",
            "created_at": now - timedelta(hours=1)
        }
        res2 = db.bookings.insert_one(b2)
        db.parking_spots.update_one({"_id": spot_a2["_id"]}, {"$set": {"current_booking_id": res2.inserted_id}})

    print("[+] Database successfully seeded with 16 spots, 2 demo passes, and test accounts.")

def seed():
    seed_database()

if __name__ == "__main__":
    seed()
