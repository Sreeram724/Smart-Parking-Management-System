import React, { useState, useEffect } from "react";
import {
  Shield,
  PlusCircle,
  Trash2,
  CheckCircle2,
  LogOut,
  ScanLine,
  TrendingUp,
  Car,
  Bike,
  IndianRupee,
  RefreshCw,
  Search,
  AlertCircle
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel({ spots, onRefreshSpots }) {
  const { currentUser, role, login } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // New Spot Form State
  const [newSpotNumber, setNewSpotNumber] = useState("");
  const [newZone, setNewZone] = useState("Zone A");
  const [newVehicleType, setNewVehicleType] = useState("four-wheeler");
  const [newPrice, setNewPrice] = useState(50);
  const [creatingSpot, setCreatingSpot] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // Verification Scanner State
  const [verifyPassId, setVerifyPassId] = useState("");
  const [scannedBooking, setScannedBooking] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.getAnalytics();
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [role]);

  const handleCreateSpot = async (e) => {
    e.preventDefault();
    setCreatingSpot(true);
    setCreateMsg("");
    try {
      const res = await api.createSpot({
        spot_number: newSpotNumber.trim().toUpperCase(),
        zone: newZone,
        vehicle_type: newVehicleType,
        price_per_hour: parseFloat(newPrice)
      });
      if (res.success) {
        setCreateMsg(`Spot ${newSpotNumber} created successfully!`);
        setNewSpotNumber("");
        onRefreshSpots();
        loadAnalytics();
      }
    } catch (err) {
      setCreateMsg(`Error: ${err.message}`);
    } finally {
      setCreatingSpot(false);
    }
  };

  const handleDeleteSpot = async (spotId, spotNumber) => {
    if (!window.confirm(`Are you sure you want to delete spot ${spotNumber}?`)) return;
    try {
      await api.deleteSpot(spotId);
      onRefreshSpots();
      loadAnalytics();
    } catch (err) {
      alert(`Could not delete spot: ${err.message}`);
    }
  };

  const handleToggleStatus = async (spotId, newStatus) => {
    try {
      await api.updateSpotStatus(spotId, newStatus);
      onRefreshSpots();
      loadAnalytics();
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleVerifyPass = async (e) => {
    e?.preventDefault();
    if (!verifyPassId.trim()) return;
    setVerifying(true);
    setScanMessage("");
    setScannedBooking(null);

    try {
      const res = await api.verifyPass(verifyPassId.trim().toUpperCase());
      if (res.success && res.booking) {
        setScannedBooking(res.booking);
      }
    } catch (err) {
      setScanMessage(err.message || "Pass verification failed. Please check Pass ID.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedBooking) return;
    try {
      const res = await api.checkIn(scannedBooking.pass_id);
      setScanMessage(`Check-In confirmed! Spot ${res.spot_number} marked OCCUPIED.`);
      setScannedBooking({ ...scannedBooking, status: "checked_in" });
      onRefreshSpots();
      loadAnalytics();
    } catch (err) {
      setScanMessage(`Check-In failed: ${err.message}`);
    }
  };

  const handleCheckOut = async () => {
    if (!scannedBooking) return;
    try {
      const res = await api.checkOut(scannedBooking.pass_id);
      setScanMessage(`Check-Out complete! Spot ${res.spot_number} marked AVAILABLE.`);
      setScannedBooking({ ...scannedBooking, status: "completed" });
      onRefreshSpots();
      loadAnalytics();
    } catch (err) {
      setScanMessage(`Check-Out failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {(!currentUser || role !== "admin") && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Admin Mode:</strong> You are currently signed in as {currentUser?.name || "Guest"}. Switch to Parking Admin to unlock vehicle check-ins, check-outs, and slot management.
            </span>
          </div>
          <button
            onClick={async () => {
              await login("admin@smartparking.com", "admin123");
              loadAnalytics();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold whitespace-nowrap shadow-md transition"
          >
            ⚡ Switch to Admin Alex
          </button>
        </div>
      )}

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Slots
          </span>
          <div className="text-3xl font-black text-white font-mono">
            {analytics?.total_spots ?? spots.length}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Active across all zones</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Available
          </span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {analytics?.available_spots ?? spots.filter((s) => s.status === "available").length}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Ready to park</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
            Occupied
          </span>
          <div className="text-3xl font-black text-rose-400 font-mono">
            {analytics?.occupied_spots ?? spots.filter((s) => s.status === "occupied").length}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Currently parked</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Occupancy Rate
          </span>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {analytics?.occupancy_rate ?? 0}%
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Utilization percentage</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl col-span-2 md:col-span-1">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
            Total Revenue
          </span>
          <div className="text-3xl font-black text-blue-400 font-mono">
            ₹{analytics?.total_revenue ?? 0}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">From all reservations</span>
        </div>
      </div>

      {/* Admin Action Rows: Scanner & Slot Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-In / Check-Out QR Scanner Simulation */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vehicle Check-In & Check-Out Verification</h3>
              <p className="text-xs text-gray-400">Scan QR Code or enter Pass ID (e.g. PASS-DEMO01)</p>
            </div>
          </div>

          <form onSubmit={handleVerifyPass} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter Pass ID (e.g. PASS-DEMO01)..."
              value={verifyPassId}
              onChange={(e) => setVerifyPassId(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono text-sm uppercase focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify Pass"}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
            <span>Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setVerifyPassId("PASS-DEMO01");
              }}
              className="px-2 py-0.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 font-mono text-blue-400"
            >
              PASS-DEMO01
            </button>
            <button
              type="button"
              onClick={() => {
                setVerifyPassId("PASS-DEMO02");
              }}
              className="px-2 py-0.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 font-mono text-blue-400"
            >
              PASS-DEMO02
            </button>
          </div>

          {scanMessage && (
            <div className="mb-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-blue-300">
              {scanMessage}
            </div>
          )}

          {scannedBooking && (
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-base">{scannedBooking.pass_id}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  scannedBooking.status === "checked_in"
                    ? "bg-rose-500/20 text-rose-400"
                    : scannedBooking.status === "completed"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {scannedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block">Driver:</span>
                  <span className="text-gray-200 font-semibold">{scannedBooking.user_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Vehicle Plate:</span>
                  <span className="text-gray-200 font-mono font-semibold">{scannedBooking.vehicle_number}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Assigned Slot:</span>
                  <span className="text-gray-200 font-mono font-semibold">{scannedBooking.spot_number} ({scannedBooking.zone})</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Paid:</span>
                  <span className="text-emerald-400 font-mono font-semibold">₹{scannedBooking.total_amount}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={scannedBooking.status === "checked_in" || scannedBooking.status === "completed"}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40"
                >
                  ✓ Check-In (Mark Occupied)
                </button>
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={scannedBooking.status === "completed"}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-40"
                >
                  ↑ Check-Out (Free Slot)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add New Parking Spot */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Parking Slot</h3>
              <p className="text-xs text-gray-400">Add physical bays dynamically to any parking zone</p>
            </div>
          </div>

          {createMsg && (
            <div className="mb-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-emerald-300">
              {createMsg}
            </div>
          )}

          <form onSubmit={handleCreateSpot} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Spot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. D1, C5"
                  value={newSpotNumber}
                  onChange={(e) => setNewSpotNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono text-sm uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Zone</label>
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Zone A">Zone A (North Gate)</option>
                  <option value="Zone B">Zone B (Basement Level 1)</option>
                  <option value="Zone C">Zone C (Premium & EV)</option>
                  <option value="Zone D">Zone D (Rooftop / Valet)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Vehicle Type</label>
                <select
                  value={newVehicleType}
                  onChange={(e) => {
                    const vt = e.target.value;
                    setNewVehicleType(vt);
                    setNewPrice(vt === "two-wheeler" ? 20 : 50);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="four-wheeler">Four-Wheeler (Car)</option>
                  <option value="two-wheeler">Two-Wheeler (Bike)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Price / Hour (₹)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingSpot}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 mt-2"
            >
              {creatingSpot ? "Adding Slot..." : "Add Parking Spot"}
            </button>
          </form>
        </div>
      </div>

      {/* Spots Management Control Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Parking Slot Inventory & Live Controls</h3>
            <p className="text-xs text-gray-400">Real-time status toggles and slot maintenance</p>
          </div>
          <button
            onClick={() => {
              onRefreshSpots();
              loadAnalytics();
            }}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Spot</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Quick Override</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {spots.map((spot) => (
                <tr key={spot._id} className="hover:bg-gray-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                    {spot.spot_number}
                  </td>
                  <td className="py-3 px-4 text-gray-300">{spot.zone}</td>
                  <td className="py-3 px-4 capitalize">
                    {spot.vehicle_type === "two-wheeler" ? "🛵 2-Wheeler" : "🚗 4-Wheeler"}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-300">₹{spot.price_per_hour}/hr</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        spot.status === "available"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : spot.status === "occupied"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {spot.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(spot._id, "available")}
                        className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 text-[10px] border border-emerald-800/40"
                      >
                        Free
                      </button>
                      <button
                        onClick={() => handleToggleStatus(spot._id, "occupied")}
                        className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-[10px] border border-rose-800/40"
                      >
                        Occupy
                      </button>
                      <button
                        onClick={() => handleToggleStatus(spot._id, "reserved")}
                        className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-400 text-[10px] border border-amber-800/40"
                      >
                        Reserve
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSpot(spot._id, spot.spot_number)}
                      className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
