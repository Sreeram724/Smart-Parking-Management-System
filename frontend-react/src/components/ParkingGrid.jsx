import React, { useState } from "react";
import { Car, Bike, Check, Lock, Clock, Sparkles, Filter, Layers, Zap } from "lucide-react";

export default function ParkingGrid({
  spots,
  zones,
  selectedZone,
  setSelectedZone,
  vehicleFilter,
  setVehicleFilter,
  onSelectSpot,
  lastUpdatedSpotId
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSpots = spots.filter((s) => {
    const matchesZone = selectedZone === "All" || s.zone === selectedZone;
    const matchesVehicle = vehicleFilter === "All" || s.vehicle_type === vehicleFilter;
    const matchesSearch = s.spot_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesVehicle && matchesSearch;
  });

  const availableCount = spots.filter((s) => s.status === "available").length;
  const occupiedCount = spots.filter((s) => s.status === "occupied").length;
  const reservedCount = spots.filter((s) => s.status === "reserved").length;

  return (
    <div className="space-y-6">
      {/* Top Controls: Zones & Filters */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Zone Selector & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5" /> Zone:
            </span>
            <button
              onClick={() => setSelectedZone("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedZone === "All"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              All Zones
            </button>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedZone === z
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800 text-xs">
              <button
                onClick={() => setVehicleFilter("All")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vehicleFilter === "All" ? "bg-gray-800 text-white font-medium" : "text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVehicleFilter("four-wheeler")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  vehicleFilter === "four-wheeler" ? "bg-gray-800 text-blue-400 font-medium" : "text-gray-400 hover:text-white"
                }`}
              >
                <Car className="w-3 h-3" /> 4-Wheeler
              </button>
              <button
                onClick={() => setVehicleFilter("two-wheeler")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  vehicleFilter === "two-wheeler" ? "bg-gray-800 text-emerald-400 font-medium" : "text-gray-400 hover:text-white"
                }`}
              >
                <Bike className="w-3 h-3" /> 2-Wheeler
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Summary Badges & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800/80">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">{availableCount} Available</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="font-semibold">{occupiedCount} Occupied</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold">{reservedCount} Reserved</span>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter spot (e.g. A1)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 px-3 py-1 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Visual Parking Lot Bay Grid */}
      <div className="bg-[#0f1422] border border-gray-800/90 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        {/* Visual Lane Markings */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-dashed border-gray-800 text-xs text-gray-500 font-mono tracking-wider">
          <span className="flex items-center gap-1 text-emerald-400/80">
            ▲ ENTRY GATE 1 (NORTH)
          </span>
          <span className="hidden sm:inline text-gray-600">-- DRIVING LANE / SPEED LIMIT 10 KM/H --</span>
          <span className="flex items-center gap-1 text-rose-400/80">
            EXIT GATE ▼
          </span>
        </div>

        {filteredSpots.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No parking slots found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredSpots.map((spot) => {
              const isAvailable = spot.status === "available";
              const isOccupied = spot.status === "occupied";
              const isReserved = spot.status === "reserved";
              const isUpdatedRecently = lastUpdatedSpotId === spot._id;

              return (
                <div
                  key={spot._id}
                  onClick={() => isAvailable && onSelectSpot(spot)}
                  className={`relative rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between h-44 ${
                    isUpdatedRecently ? "ring-2 ring-white scale-105" : ""
                  } ${
                    isAvailable
                      ? "bg-gradient-to-b from-gray-900 to-[#101c18] border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer group"
                      : isOccupied
                      ? "bg-gradient-to-b from-gray-900 to-[#221316] border-rose-500/40 cursor-not-allowed opacity-90"
                      : "bg-gradient-to-b from-gray-900 to-[#231e13] border-amber-500/40 cursor-not-allowed opacity-90"
                  }`}
                >
                  {/* Slot Parking Road Stripes */}
                  <div className="absolute top-0 bottom-0 left-1 w-0.5 bg-yellow-500/20"></div>
                  <div className="absolute top-0 bottom-0 right-1 w-0.5 bg-yellow-500/20"></div>

                  {/* Top Bar: Spot Number & Vehicle Type */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl font-black font-mono tracking-tight text-white block">
                        {spot.spot_number}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {spot.zone}
                      </span>
                    </div>
                    <div
                      className={`p-1.5 rounded-xl ${
                        spot.vehicle_type === "two-wheeler"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {spot.vehicle_type === "two-wheeler" ? (
                        <Bike className="w-4 h-4" />
                      ) : (
                        <Car className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Center Visual: Icon State */}
                  <div className="my-auto text-center">
                    {isAvailable ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 mb-1 group-hover:scale-125 transition"></span>
                        <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                          Available
                        </span>
                      </div>
                    ) : isOccupied ? (
                      <div className="inline-flex flex-col items-center">
                        <Lock className="w-4 h-4 text-rose-500 mb-1" />
                        <span className="text-xs font-bold text-rose-400 tracking-wide uppercase">
                          Occupied
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <Clock className="w-4 h-4 text-amber-500 mb-1 animate-spin" style={{ animationDuration: "6s" }} />
                        <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                          Reserved
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Price and Action */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-200 font-mono">
                      ₹{spot.price_per_hour}/hr
                    </span>
                    {isAvailable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                        Book
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
