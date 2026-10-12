import React, { useState } from "react";
import { X, Clock, Car, Bike, CreditCard, ShieldCheck, Calendar, IndianRupee } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function BookingModal({ spot, isOpen, onClose, onBookingSuccess }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [duration, setDuration] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState(currentUser?.vehicle_number || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !spot) return null;

  const rate = spot.price_per_hour || (spot.vehicle_type === "two-wheeler" ? 20 : 50);
  const totalAmount = rate * duration;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("Please sign in or select a demo account before reserving a slot.");
      return;
    }

    if (!vehicleNumber.trim()) {
      setError("Please provide your vehicle registration plate number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.createBooking({
        spot_id: spot._id,
        duration_hours: duration,
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        start_time: new Date().toISOString()
      });

      if (res.success && res.booking) {
        onBookingSuccess(res.booking);
      }
    } catch (err) {
      setError(err.message || "Failed to complete reservation. Spot might have just been reserved.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl overflow-hidden">
        {/* Subtle accent bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            {spot.vehicle_type === "two-wheeler" ? (
              <Bike className="w-6 h-6 text-emerald-400" />
            ) : (
              <Car className="w-6 h-6 text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Reserve Slot <span className="text-blue-400 font-mono">#{spot.spot_number}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {spot.zone} • {spot.vehicle_type === "two-wheeler" ? "Two-Wheeler (Motorcycle/Scooter)" : "Four-Wheeler (Car/SUV)"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-5">
          {/* Vehicle Plate Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Vehicle Plate Number
            </label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. DL-04-AB-1234"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Parking Duration (Hours)
              </label>
              <span className="text-sm font-bold text-blue-400 font-mono">{duration} hr{duration > 1 ? "s" : ""}</span>
            </div>

            {/* Range slider */}
            <input
              type="range"
              min="1"
              max="12"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 2, 4, 8].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setDuration(hrs)}
                  className={`py-1 rounded-lg text-xs font-semibold border transition ${
                    duration === hrs
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {hrs} hr{hrs > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Price Calculation Breakdown */}
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Dynamic Fare Calculation
            </h4>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Hourly Base Rate:</span>
              <span className="font-mono text-gray-200">₹{rate} / hr</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Duration Booked:</span>
              <span className="font-mono text-gray-200">{duration} Hours</span>
            </div>
            <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Estimated Payable:</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* Confirmation info */}
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Digital parking pass with unique QR verification code generated upon confirmation.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
          >
            {loading ? "Confirming Reservation..." : `Confirm Booking & Pay ₹${totalAmount}`}
          </button>
        </form>
      </div>
    </div>
  );
}
