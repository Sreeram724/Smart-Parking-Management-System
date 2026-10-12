import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db
from routes.auth_routes import auth_bp
from routes.spot_routes import spot_bp
from routes.booking_routes import booking_bp
from routes.admin_routes import admin_bp

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize MongoDB
    init_db()

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(spot_bp, url_prefix="/api/spots")
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Smart Parking Python Flask API",
            "version": "1.0.0"
        }), 200

    @app.route("/api/seed", methods=["POST"])
    def trigger_seed():
        from seed_data import seed
        seed()
        return jsonify({"success": True, "message": "Database successfully populated with initial demo data!"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "API endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"success": False, "message": "Internal server error occurred."}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    logger.info(f"Starting Flask API Server on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=True)
