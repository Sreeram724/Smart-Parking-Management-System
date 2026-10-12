import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import ParkingGrid from "./components/ParkingGrid";
import BookingModal from "./components/BookingModal";
import DigitalPassModal from "./components/DigitalPassModal";
import AdminPanel from "./components/AdminPanel";
import MyBookings from "./components/MyBookings";
import LoginModal from "./components/LoginModal";
import { useSocket } from "./context/SocketContext";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { getMockSpots } from "./services/mockData";

export default function App() {
  const { socket, isConnected } = useSocket();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "bookings" | "admin"
  const [spots, setSpots] = useState(() => getMockSpots());
  const [zones, setZones] = useState(["Zone A", "Zone B", "Zone C"]);
  const [selectedZone, setSelectedZone] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  // Modals state
  const [selectedSpotForBooking, setSelectedSpotForBooking] = useState(null);
  const [activeDigitalPass, setActiveDigitalPass] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [lastUpdatedSpotId, setLastUpdatedSpotId] = useState(null);
  const [seedNotice, setSeedNotice] = useState("");

  // Fetch spots from Flask API (or fallback to local mock store)
  const fetchSpots = useCallback(async () => {
    try {
      const res = await api.getSpots();
      if (res.success && res.spots && res.spots.length > 0) {
        setSpots(res.spots);
      } else {
        setSpots(getMockSpots());
      }
      const zoneRes = await api.getZones();
      if (zoneRes.success && zoneRes.zones && zoneRes.zones.length > 0) {
        setZones(zoneRes.zones);
      }
    } catch (err) {
      console.warn("Could not load spots from API, retaining interactive demo slots:", err);
      setSpots(getMockSpots());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Real-time WebSocket event listener
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (updatedSlot) => {
      console.log("[App.jsx] Real-time slot update received:", updatedSlot);

      setLastUpdatedSpotId(updatedSlot.spot_id || updatedSlot._id);

      setSpots((prevSpots) => {
        const spotId = updatedSlot.spot_id || updatedSlot._id;

        if (updatedSlot.status === "deleted") {
          return prevSpots.filter((s) => s._id !== spotId);
        }

        const index = prevSpots.findIndex((s) => s._id === spotId);
        if (index !== -1) {
          const next = [...prevSpots];
          next[index] = {
            ...next[index],
            ...updatedSlot,
            _id: spotId,
          };
          return next;
        } else {
          // New spot created
          return [...prevSpots, { ...updatedSlot, _id: spotId }];
        }
      });

      // Clear recent glow animation after 2.5s
      setTimeout(() => {
        setLastUpdatedSpotId(null);
      }, 2500);
    };

    socket.on("slot_updated", handleSlotUpdate);

    return () => {
      socket.off("slot_updated", handleSlotUpdate);
    };
  }, [socket]);

  // Seed demo data handler
  const handleTriggerSeed = async () => {
    try {
      setSeedNotice("Seeding database with demo spots and accounts...");
      const res = await api.seedData();
      setSeedNotice(res.message || "Database seeded!");
      fetchSpots();
      setTimeout(() => setSeedNotice(""), 3500);
    } catch (err) {
      setSeedNotice(`Seed error: ${err.message}`);
      setTimeout(() => setSeedNotice(""), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onTriggerSeed={handleTriggerSeed}
      />

      {/* Floating Notice if any */}
      {seedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{seedNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "grid" && (
          <ParkingGrid
            spots={spots}
            zones={zones}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            vehicleFilter={vehicleFilter}
            setVehicleFilter={setVehicleFilter}
            onSelectSpot={(spot) => setSelectedSpotForBooking(spot)}
            lastUpdatedSpotId={lastUpdatedSpotId}
          />
        )}

        {activeTab === "bookings" && (
          <MyBookings onOpenPass={(booking) => setActiveDigitalPass(booking)} />
        )}

        {activeTab === "admin" && (
          <AdminPanel spots={spots} onRefreshSpots={fetchSpots} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
        <p>ParkPulse © 2026 • Full-Stack Smart Parking Management Architecture</p>
        <p className="mt-1 text-[11px] text-gray-600">
          React.js • Tailwind CSS • Python Flask • Node.js Socket.io • MongoDB
        </p>
      </footer>

      {/* Modals */}
      <BookingModal
        spot={selectedSpotForBooking}
        isOpen={!!selectedSpotForBooking}
        onClose={() => setSelectedSpotForBooking(null)}
        onBookingSuccess={(booking) => {
          setSelectedSpotForBooking(null);
          setActiveDigitalPass(booking);
          fetchSpots();
        }}
      />

      <DigitalPassModal
        booking={activeDigitalPass}
        isOpen={!!activeDigitalPass}
        onClose={() => setActiveDigitalPass(null)}
      />

      <LoginModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
