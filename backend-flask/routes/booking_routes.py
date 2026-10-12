import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from flask import Blueprint, request, jsonify
from database import get_db
from middleware.auth_middleware import token_required, admin_required
from utils.notifier import broadcast_slot_update

booking_bp = Blueprint("bookings", __name__)

def generate_pass_id():
    # E.g. PASS-A9B42C
    return f"PASS-{uuid.uuid4().hex[:6].upper()}"

@booking_bp.route("", methods=["POST"])
@token_required
def create_booking():
    data = request.get_json() or {}
    spot_id = data.get("spot_id")
    duration_hours = int(data.get("duration_hours", 1))
    vehicle_number = data.get("vehicle_number", "").strip().upper() or request.current_user.get("vehicle_number", "")
    start_time_raw = data.get("start_time")

    if not spot_id:
        return jsonify({"success": False, "message": "Spot ID is required."}), 400

    if duration_hours < 1 or duration_hours > 24:
        return jsonify({"success": False, "message": "Duration must be between 1 and 24 hours."}), 400

    if not vehicle_number:
        return jsonify({"success": False, "message": "Vehicle number is required."}), 400

    db = get_db()
    try:
        spot_oid = ObjectId(spot_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid spot ID."}), 400

    spot = db.parking_spots.find_one({"_id": spot_oid})
    if not spot:
        return jsonify({"success": False, "message": "Parking spot not found."}), 404

    if spot.get("status") != "available":
        return jsonify({"success": False, "message": f"Spot {spot.get('spot_number')} is currently {spot.get('status')}."}), 409

    # Calculate timestamps
    now = datetime.now(timezone.utc)
    if start_time_raw:
        try:
            start_time = datetime.fromisoformat(start_time_raw.replace("Z", "+00:00"))
        except Exception:
            start_time = now
    else:
        start_time = now

    end_time = start_time + timedelta(hours=duration_hours)
    price_per_hour = float(spot.get("price_per_hour", 50))
    total_amount = round(price_per_hour * duration_hours, 2)
    pass_id = generate_pass_id()

    booking_doc = {
        "user_id": ObjectId(request.current_user["id"]),
        "user_name": request.current_user.get("name"),
        "user_email": request.current_user.get("email"),
        "spot_id": spot_oid,
        "spot_number": spot.get("spot_number"),
        "zone": spot.get("zone"),
        "vehicle_type": spot.get("vehicle_type"),
        "vehicle_number": vehicle_number,
        "start_time": start_time,
        "end_time": end_time,
        "duration_hours": duration_hours,
        "price_per_hour": price_per_hour,
        "total_amount": total_amount,
        "status": "reserved", # reserved -> checked_in -> completed / cancelled
        "pass_id": pass_id,
        "created_at": now
    }

    result = db.bookings.insert_one(booking_doc)
    booking_id = result.inserted_id

    # Update spot status to reserved
    updated_spot = db.parking_spots.find_one_and_update(
        {"_id": spot_oid},
        {"$set": {"status": "reserved", "current_booking_id": booking_id, "updated_at": now}},
        return_document=True
    )

    # Real-time WebSocket notification
    broadcast_slot_update(updated_spot)

    return jsonify({
        "success": True,
        "message": "Parking spot booked successfully!",
        "booking": {
            "id": str(booking_id),
            "pass_id": pass_id,
            "spot_number": spot.get("spot_number"),
            "zone": spot.get("zone"),
            "vehicle_type": spot.get("vehicle_type"),
            "vehicle_number": vehicle_number,
            "duration_hours": duration_hours,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "price_per_hour": price_per_hour,
            "total_amount": total_amount,
            "status": "reserved"
        }
    }), 201


@booking_bp.route("/my", methods=["GET"])
@token_required
def get_my_bookings():
    db = get_db()
    user_id = ObjectId(request.current_user["id"])
    bookings = list(db.bookings.find({"user_id": user_id}).sort("created_at", -1).limit(50))

    serialized = []
    for b in bookings:
        serialized.append({
            "id": str(b["_id"]),
            "pass_id": b.get("pass_id"),
            "spot_number": b.get("spot_number"),
            "zone": b.get("zone"),
            "vehicle_type": b.get("vehicle_type"),
            "vehicle_number": b.get("vehicle_number"),
            "duration_hours": b.get("duration_hours"),
            "start_time": b.get("start_time").isoformat() if b.get("start_time") else "",
            "end_time": b.get("end_time").isoformat() if b.get("end_time") else "",
            "total_amount": b.get("total_amount"),
            "status": b.get("status"),
            "created_at": b.get("created_at").isoformat() if b.get("created_at") else ""
        })

    return jsonify({"success": True, "bookings": serialized}), 200


@booking_bp.route("/verify/<pass_id>", methods=["GET"])
def verify_pass(pass_id):
    db = get_db()
    booking = db.bookings.find_one({"pass_id": pass_id.strip().upper()})
    if not booking:
        return jsonify({"success": False, "message": "No booking found with this Pass ID."}), 404

    return jsonify({
        "success": True,
        "booking": {
            "id": str(booking["_id"]),
            "pass_id": booking.get("pass_id"),
            "user_name": booking.get("user_name"),
            "user_email": booking.get("user_email"),
            "spot_id": str(booking.get("spot_id")),
            "spot_number": booking.get("spot_number"),
            "zone": booking.get("zone"),
            "vehicle_type": booking.get("vehicle_type"),
            "vehicle_number": booking.get("vehicle_number"),
            "duration_hours": booking.get("duration_hours"),
            "start_time": booking.get("start_time").isoformat() if booking.get("start_time") else "",
            "end_time": booking.get("end_time").isoformat() if booking.get("end_time") else "",
            "total_amount": booking.get("total_amount"),
            "status": booking.get("status")
        }
    }), 200


@booking_bp.route("/check-in", methods=["POST"])
@admin_required
def check_in():
    data = request.get_json() or {}
    pass_id = data.get("pass_id", "").strip().upper()

    if not pass_id:
        return jsonify({"success": False, "message": "Pass ID is required."}), 400

    db = get_db()
    booking = db.bookings.find_one({"pass_id": pass_id})
    if not booking:
        return jsonify({"success": False, "message": "Booking pass not found."}), 404

    if booking.get("status") == "checked_in":
        return jsonify({"success": False, "message": "Vehicle is already checked-in."}), 400

    if booking.get("status") == "completed":
        return jsonify({"success": False, "message": "This parking pass has already been completed/checked out."}), 400

    now = datetime.now(timezone.utc)
    # Update booking status
    db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "checked_in", "checked_in_at": now}}
    )

    # Update spot status to occupied
    updated_spot = db.parking_spots.find_one_and_update(
        {"_id": booking["spot_id"]},
        {"$set": {"status": "occupied", "updated_at": now}},
        return_document=True
    )

    if updated_spot:
        broadcast_slot_update(updated_spot)

    return jsonify({
        "success": True,
        "message": f"Check-in verified! Spot {booking.get('spot_number')} marked as OCCUPIED.",
        "pass_id": pass_id,
        "spot_number": booking.get("spot_number"),
        "status": "checked_in"
    }), 200


@booking_bp.route("/check-out", methods=["POST"])
@admin_required
def check_out():
    data = request.get_json() or {}
    pass_id = data.get("pass_id", "").strip().upper()

    if not pass_id:
        return jsonify({"success": False, "message": "Pass ID is required."}), 400

    db = get_db()
    booking = db.bookings.find_one({"pass_id": pass_id})
    if not booking:
        return jsonify({"success": False, "message": "Booking pass not found."}), 404

    if booking.get("status") == "completed":
        return jsonify({"success": False, "message": "Vehicle has already checked out."}), 400

    now = datetime.now(timezone.utc)
    db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "completed", "checked_out_at": now}}
    )

    # Release spot to available
    updated_spot = db.parking_spots.find_one_and_update(
        {"_id": booking["spot_id"]},
        {"$set": {"status": "available", "current_booking_id": None, "updated_at": now}},
        return_document=True
    )

    if updated_spot:
        broadcast_slot_update(updated_spot)

    return jsonify({
        "success": True,
        "message": f"Check-out complete! Spot {booking.get('spot_number')} is now AVAILABLE.",
        "pass_id": pass_id,
        "spot_number": booking.get("spot_number"),
        "status": "completed"
    }), 200
