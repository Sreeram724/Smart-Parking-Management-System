import React from "react";
import { X, CheckCircle, Car, Bike, Printer, Share2, Sparkles, MapPin, Clock, Calendar } from "lucide-react";
import QRCodeView from "./QRCodeView";

export default function DigitalPassModal({ booking, isOpen, onClose }) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedStartTime = booking.start_time
    ? new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Immediate";

  const formattedEndTime = booking.end_time
    ? new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "+ Duration";

  const qrData = JSON.stringify({
    pass_id: booking.pass_id,
    spot: booking.spot_number,
    zone: booking.zone,
    vehicle: booking.vehicle_number,
    amount: booking.total_amount,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">ParkPulse Verified</span>
          </div>
          <h3 className="text-xl font-black">Digital Parking Pass</h3>
          <p className="text-xs text-blue-100/90 mt-0.5">Present this pass at entry checkpoint</p>
        </div>

        {/* Pass Body */}
        <div className="p-6 space-y-6">
          {/* Status and Pass ID */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Pass Identifier</span>
              <span className="text-xl font-extrabold text-blue-400 font-mono tracking-wider">{booking.pass_id}</span>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>{booking.status?.toUpperCase() || "RESERVED"}</span>
            </div>
          </div>

          {/* QR Code and Main Spot details */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-900/90 border border-gray-800">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Assigned Spot</span>
              <div className="text-3xl font-black text-white font-mono">{booking.spot_number}</div>
              <div className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {booking.zone}
              </div>
            </div>

            {/* Crisp SVG QR Component */}
            <div className="text-center">
              <QRCodeView text={qrData} size={110} />
              <span className="text-[9px] text-gray-500 block mt-1 font-mono">Scan for Check-In</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/80">
              <span className="text-[10px] text-gray-500 font-semibold uppercase block mb-0.5">Vehicle Plate</span>
              <span className="text-sm font-bold text-white font-mono">{booking.vehicle_number}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/80">
              <span className="text-[10px] text-gray-500 font-semibold uppercase block mb-0.5">Vehicle Type</span>
              <span className="text-sm font-semibold text-gray-200 capitalize">
                {booking.vehicle_type?.replace("-", " ") || "Four Wheeler"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/80">
              <span className="text-[10px] text-gray-500 font-semibold uppercase block mb-0.5">Valid Window</span>
              <span className="text-xs font-semibold text-gray-200 font-mono">
                {formattedStartTime} - {formattedEndTime}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/80">
              <span className="text-[10px] text-gray-500 font-semibold uppercase block mb-0.5">Total Paid</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">₹{booking.total_amount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 border border-gray-700 transition"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
            >
              <CheckCircle className="w-4 h-4" /> Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
