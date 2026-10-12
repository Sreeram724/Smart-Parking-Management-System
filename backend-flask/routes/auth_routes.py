from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from flask import Blueprint, request, jsonify
from config import Config
from database import get_db
from middleware.auth_middleware import token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "driver").strip().lower()
    vehicle_number = data.get("vehicle_number", "").strip().upper()

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Name, email, and password are required."}), 400

    if role not in ["driver", "admin"]:
        role = "driver"

    db = get_db()
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"success": False, "message": "Email is already registered."}), 409

    # Hash password with bcrypt
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user_doc = {
        "name": name,
        "email": email,
        "password_hash": hashed_pw,
        "role": role,
        "vehicle_number": vehicle_number,
        "created_at": datetime.now(timezone.utc)
    }

    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate JWT Token
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "vehicle_number": vehicle_number
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    # Verify password hash
    stored_hash = user.get("password_hash", "")
    if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    user_id = str(user["_id"])
    role = user.get("role", "driver")

    # Generate JWT Token
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user_id,
            "name": user.get("name"),
            "email": email,
            "role": role,
            "vehicle_number": user.get("vehicle_number", "")
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    return jsonify({
        "success": True,
        "user": request.current_user
    }), 200
