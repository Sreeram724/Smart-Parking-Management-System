from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify
from database import get_db
from middleware.auth_middleware import admin_required
from utils.notifier import broadcast_slot_update

spot_bp = Blueprint("spots", __name__)

@spot_bp.route("", methods=["GET"])
def get_spots():
    zone = request.args.get("zone")
    vehicle_type = request.args.get("vehicle_type")

    query = {}
    if zone and zone != "All":
        query["zone"] = zone
    if vehicle_type and vehicle_type != "All":
        query["vehicle_type"] = vehicle_type

    db = get_db()
    spots = list(db.parking_spots.find(query).sort("spot_number", 1))

    serialized = []
    for s in spots:
        serialized.append({
            "_id": str(s["_id"]),
            "spot_number": s.get("spot_number"),
            "zone": s.get("zone", "Zone A"),
            "vehicle_type": s.get("vehicle_type", "four-wheeler"),
            "status": s.get("status", "available"), # available, occupied, reserved
            "price_per_hour": s.get("price_per_hour", 50),
            "current_booking_id": str(s.get("current_booking_id", "") or ""),
            "updated_at": s.get("updated_at", datetime.now(timezone.utc)).isoformat()
        })

    return jsonify({"success": True, "spots": serialized, "count": len(serialized)}), 200


@spot_bp.route("/zones", methods=["GET"])
def get_zones():
    db = get_db()
    zones = db.parking_spots.distinct("zone")
    if not zones:
        zones = ["Zone A", "Zone B", "Zone C"]
    return jsonify({"success": True, "zones": sorted(zones)}), 200


@spot_bp.route("", methods=["POST"])
@admin_required
def create_spot():
    data = request.get_json() or {}
    spot_number = str(data.get("spot_number", "")).strip().upper()
    zone = str(data.get("zone", "Zone A")).strip()
    vehicle_type = str(data.get("vehicle_type", "four-wheeler")).strip().lower()
    price_per_hour = data.get("price_per_hour")

    if not spot_number:
        return jsonify({"success": False, "message": "Spot number is required."}), 400

    if vehicle_type not in ["two-wheeler", "four-wheeler"]:
        vehicle_type = "four-wheeler"

    if price_per_hour is None or float(price_per_hour) <= 0:
        price_per_hour = 20 if vehicle_type == "two-wheeler" else 50
    else:
        price_per_hour = float(price_per_hour)

    db = get_db()
    existing = db.parking_spots.find_one({"spot_number": spot_number, "zone": zone})
    if existing:
        return jsonify({"success": False, "message": f"Spot {spot_number} already exists in {zone}."}), 409

    now = datetime.now(timezone.utc)
    new_spot = {
        "spot_number": spot_number,
        "zone": zone,
        "vehicle_type": vehicle_type,
        "status": "available",
        "price_per_hour": price_per_hour,
        "current_booking_id": None,
        "created_at": now,
        "updated_at": now
    }

    result = db.parking_spots.insert_one(new_spot)
    new_spot["_id"] = result.inserted_id

    # Broadcast to Socket.io Microservice
    broadcast_slot_update(new_spot)

    return jsonify({
        "success": True,
        "message": f"Spot {spot_number} created successfully.",
        "spot": {
            "_id": str(new_spot["_id"]),
            "spot_number": spot_number,
            "zone": zone,
            "vehicle_type": vehicle_type,
            "status": "available",
            "price_per_hour": price_per_hour
        }
    }), 201


@spot_bp.route("/<spot_id>", methods=["DELETE"])
@admin_required
def delete_spot(spot_id):
    db = get_db()
    try:
        oid = ObjectId(spot_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid spot ID."}), 400

    spot = db.parking_spots.find_one({"_id": oid})
    if not spot:
        return jsonify({"success": False, "message": "Spot not found."}), 404

    db.parking_spots.delete_one({"_id": oid})

    # Notify via real-time gateway (status deleted)
    broadcast_slot_update({
        "_id": str(oid),
        "spot_number": spot.get("spot_number"),
        "zone": spot.get("zone"),
        "status": "deleted"
    })

    return jsonify({"success": True, "message": f"Spot {spot.get('spot_number')} deleted successfully."}), 200


@spot_bp.route("/<spot_id>/status", methods=["PATCH"])
@admin_required
def update_spot_status(spot_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()

    if new_status not in ["available", "occupied", "reserved"]:
        return jsonify({"success": False, "message": "Status must be 'available', 'occupied', or 'reserved'."}), 400

    db = get_db()
    try:
        oid = ObjectId(spot_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid spot ID."}), 400

    now = datetime.now(timezone.utc)
    updated_spot = db.parking_spots.find_one_and_update(
        {"_id": oid},
        {"$set": {"status": new_status, "updated_at": now}},
        return_document=True
    )

    if not updated_spot:
        return jsonify({"success": False, "message": "Spot not found."}), 404

    # Broadcast via real-time socket gateway
    broadcast_slot_update(updated_spot)

    return jsonify({
        "success": True,
        "message": f"Spot status updated to {new_status}.",
        "spot": {
            "_id": str(updated_spot["_id"]),
            "spot_number": updated_spot.get("spot_number"),
            "zone": updated_spot.get("zone"),
            "status": updated_spot.get("status"),
            "vehicle_type": updated_spot.get("vehicle_type"),
            "price_per_hour": updated_spot.get("price_per_hour")
        }
    }), 200
