import logging
import requests
from config import Config

logger = logging.getLogger(__name__)

def broadcast_slot_update(slot_data):
    """
    Sends an HTTP POST to the Node.js / Express microservice,
    which broadcasts the slot status change via Socket.io to all frontend clients.
    """
    try:
        payload = {
            "spot_id": str(slot_data.get("_id", "")),
            "spot_number": slot_data.get("spot_number"),
            "zone": slot_data.get("zone"),
            "status": slot_data.get("status"),
            "vehicle_type": slot_data.get("vehicle_type"),
            "price_per_hour": slot_data.get("price_per_hour"),
            "current_booking_id": str(slot_data.get("current_booking_id", "") or "")
        }
        res = requests.post(Config.SOCKET_SERVICE_URL, json=payload, timeout=1.5)
        if res.status_code == 200:
            logger.info(f"Broadcasted slot {payload['spot_number']} ({payload['status']}) to socket gateway.")
        else:
            logger.warning(f"Socket gateway returned HTTP {res.status_code}")
    except Exception as e:
        logger.warning(f"Could not reach Socket microservice at {Config.SOCKET_SERVICE_URL}: {e}")
