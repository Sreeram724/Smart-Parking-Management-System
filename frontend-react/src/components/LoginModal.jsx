import React, { useState } from "react";
import { X, Mail, Lock, User, Car, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, role, vehicle_number: vehicleNumber });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setError("");
    setLoading(true);
    try {
      if (demoRole === "admin") {
        await login("admin@smartparking.com", "admin123");
      } else {
        await login("driver@smartparking.com", "driver123");
      }
      onClose();
    } catch (err) {
      setError(err.message || "Demo login failed. Make sure to seed database first!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3">
            <Car className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRegister ? "Create ParkPulse Account" : "Welcome to ParkPulse"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isRegister
              ? "Sign up to reserve real-time parking slots instantly"
              : "Sign in to manage parking passes and check real-time availability"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo One-Click Access Buttons */}
        <div className="mb-5 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick Test / Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("driver")}
              className="py-1.5 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 text-xs font-medium border border-blue-800/60 transition flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Sarah (Driver)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="py-1.5 px-3 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-xs font-medium border border-amber-800/60 transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Alex (Admin)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-3 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("driver")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      role === "driver"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-gray-900/50 border-gray-800 text-gray-400"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" /> Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      role === "admin"
                        ? "bg-amber-600/20 border-amber-500 text-amber-300"
                        : "bg-gray-900/50 border-gray-800 text-gray-400"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </button>
                </div>
              </div>

              {role === "driver" && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-02-AB-1234"
                    className="w-full px-3 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-xs text-blue-400 hover:underline"
          >
            {isRegister ? "Already have an account? Sign In" : "Need an account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
