from flask import Blueprint, jsonify
from database import get_db
from middleware.auth_middleware import admin_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def get_analytics():
    db = get_db()

    total_spots = db.parking_spots.count_documents({})
    available_spots = db.parking_spots.count_documents({"status": "available"})
    occupied_spots = db.parking_spots.count_documents({"status": "occupied"})
    reserved_spots = db.parking_spots.count_documents({"status": "reserved"})

    occupancy_rate = 0.0
    if total_spots > 0:
        occupancy_rate = round(((occupied_spots + reserved_spots) / total_spots) * 100, 1)

    # Compute Total Revenue reliably
    total_revenue = 0.0
    try:
        revenue_pipeline = [
            {"$match": {"status": {"$in": ["reserved", "checked_in", "completed"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]
        revenue_res = list(db.bookings.aggregate(revenue_pipeline))
        if revenue_res and len(revenue_res) > 0:
            total_revenue = round(float(revenue_res[0].get("total", 0.0)), 2)
    except Exception:
        # Resilient fallback across all MongoDB versions and mock environments
        active_bookings = list(db.bookings.find({"status": {"$in": ["reserved", "checked_in", "completed"]}}))
        total_revenue = round(sum(float(b.get("total_amount", 0.0)) for b in active_bookings), 2)

    total_bookings = db.bookings.count_documents({})
    two_wheelers = db.parking_spots.count_documents({"vehicle_type": "two-wheeler"})
    four_wheelers = db.parking_spots.count_documents({"vehicle_type": "four-wheeler"})

    # Recent 10 bookings
    recent_bookings = []
    try:
        recent_bookings_cursor = db.bookings.find({}).sort("created_at", -1).limit(10)
        for b in recent_bookings_cursor:
            recent_bookings.append({
                "id": str(b["_id"]),
                "pass_id": b.get("pass_id"),
                "user_name": b.get("user_name"),
                "spot_number": b.get("spot_number"),
                "zone": b.get("zone"),
                "vehicle_type": b.get("vehicle_type"),
                "vehicle_number": b.get("vehicle_number"),
                "total_amount": b.get("total_amount"),
                "status": b.get("status"),
                "created_at": b.get("created_at").isoformat() if b.get("created_at") else ""
            })
    except Exception:
        pass

    return jsonify({
        "success": True,
        "analytics": {
            "total_spots": total_spots,
            "available_spots": available_spots,
            "occupied_spots": occupied_spots,
            "reserved_spots": reserved_spots,
            "occupancy_rate": occupancy_rate,
            "total_revenue": total_revenue,
            "total_bookings": total_bookings,
            "breakdown": {
                "two_wheelers": two_wheelers,
                "four_wheelers": four_wheelers
            },
            "recent_bookings": recent_bookings
        }
    }), 200
