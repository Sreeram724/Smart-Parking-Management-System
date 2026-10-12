import React, { useState, useEffect } from "react";
import { Ticket, QrCode, Clock, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MyBookings({ onOpenPass }) {
  const { isAuthenticated, login } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl">
        <Ticket className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white mb-1">Access Your Parking Passes</h3>
        <p className="text-xs text-gray-400 mb-4">
          Please sign in to view your active parking reservations and digital passes.
        </p>
        <button
          onClick={() => login("driver@smartparking.com", "driver123")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20"
        >
          ⚡ 1-Click Login as Driver (Sarah)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" /> My Parking Passes
          </h2>
          <p className="text-xs text-gray-400">View current reservations and digital QR entry tickets</p>
        </div>
        <button
          onClick={loadBookings}
          className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-xs">Loading passes...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">No parking passes yet.</p>
          <p className="text-xs text-gray-500 mt-1">Book an available slot from the visual parking layout!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-blue-500/50 transition shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-400">{b.pass_id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      b.status === "checked_in"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : b.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-white font-mono">{b.spot_number}</span>
                  <span className="text-xs text-gray-400">{b.zone}</span>
                </div>

                <div className="space-y-1 text-xs text-gray-400 mb-4">
                  <div className="flex justify-between">
                    <span>Vehicle Plate:</span>
                    <span className="text-gray-200 font-mono font-semibold">{b.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-gray-200">{b.duration_hours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400 font-mono font-bold">₹{b.total_amount}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenPass(b)}
                className="w-full py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <QrCode className="w-4 h-4" /> View Digital Pass QR
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
