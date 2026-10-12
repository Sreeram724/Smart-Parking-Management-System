import React from "react";
import { Car, Radio, Shield, User, LogOut, LogIn, Key, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Navbar({ activeTab, setActiveTab, onOpenAuthModal, onTriggerSeed }) {
  const { currentUser, role, logout, login } = useAuth();
  const { isConnected } = useSocket();

  const handleQuickLogin = async (asRole) => {
    try {
      if (asRole === "admin") {
        await login("admin@smartparking.com", "admin123");
      } else {
        await login("driver@smartparking.com", "driver123");
      }
    } catch (err) {
      alert(`Login failed: ${err.message}. Try clicking 'Seed Demo Data' first!`);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0B0F19]/85 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">ParkPulse</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Smart IoT Parking Management
            </p>
          </div>
        </div>

        {/* Live Socket Status & Tabs */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* WebSocket Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-900/60 border-gray-800">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-rose-500"}`} />
            <span className="text-gray-300 hidden md:inline">Live Stream:</span>
            <span className={isConnected ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {isConnected ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab("grid")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Slots Layout
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "bookings"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              My Passes
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-amber-400"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </nav>
        </div>

        {/* User Account / Auth Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">{currentUser.name}</span>
                <span className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${role === "admin" ? "bg-amber-400" : "bg-blue-400"}`}></span>
                  {role === "admin" ? "Parking Admin" : `Driver (${currentUser.vehicle_number || "No Plate"})`}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Quick Demo Access Buttons */}
              <div className="hidden xl:flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickLogin("driver")}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 transition flex items-center gap-1"
                >
                  <User className="w-3 h-3" /> Driver Demo
                </button>
                <button
                  onClick={() => handleQuickLogin("admin")}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 transition flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" /> Admin Demo
                </button>
              </div>

              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Seed DB Demo Button */}
          <button
            onClick={onTriggerSeed}
            title="Populate demo slots and accounts"
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-purple-300 hover:text-purple-200 border border-purple-500/20 transition"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
