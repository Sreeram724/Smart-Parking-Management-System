from functools import wraps
import jwt
from flask import request, jsonify
from config import Config
from database import get_db
from bson import ObjectId

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header:
            parts = auth_header.split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

        if not token:
            return jsonify({"success": False, "message": "Authentication token is missing!"}), 401

        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            db = get_db()
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"success": False, "message": "User not found or account revoked!"}), 401
            
            # Format user object
            request.current_user = {
                "id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role", "driver"),
                "vehicle_number": user.get("vehicle_number", "")
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token has expired. Please log in again."}), 401
        except Exception as e:
            return jsonify({"success": False, "message": f"Token validation failed: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user.get("role") != "admin":
            return jsonify({"success": False, "message": "Admin privileges required for this action."}), 403
        return f(*args, **kwargs)
    return decorated
