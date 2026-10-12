// High-fidelity fallback dataset for offline / deployed demo mode
export const INITIAL_SPOTS = [
  // Zone A - North Gate (4-Wheelers)
  { _id: "spot_a1", spot_number: "A1", zone: "Zone A", vehicle_type: "four-wheeler", status: "available", price_per_hour: 50 },
  { _id: "spot_a2", spot_number: "A2", zone: "Zone A", vehicle_type: "four-wheeler", status: "occupied", price_per_hour: 50 },
  { _id: "spot_a3", spot_number: "A3", zone: "Zone A", vehicle_type: "four-wheeler", status: "reserved", price_per_hour: 50 },
  { _id: "spot_a4", spot_number: "A4", zone: "Zone A", vehicle_type: "four-wheeler", status: "available", price_per_hour: 50 },
  { _id: "spot_a5", spot_number: "A5", zone: "Zone A", vehicle_type: "four-wheeler", status: "available", price_per_hour: 50 },
  { _id: "spot_a6", spot_number: "A6", zone: "Zone A", vehicle_type: "four-wheeler", status: "occupied", price_per_hour: 50 },

  // Zone B - Basement Level 1 (2-Wheelers & 4-Wheelers)
  { _id: "spot_b1", spot_number: "B1", zone: "Zone B", vehicle_type: "two-wheeler", status: "available", price_per_hour: 20 },
  { _id: "spot_b2", spot_number: "B2", zone: "Zone B", vehicle_type: "two-wheeler", status: "available", price_per_hour: 20 },
  { _id: "spot_b3", spot_number: "B3", zone: "Zone B", vehicle_type: "two-wheeler", status: "occupied", price_per_hour: 20 },
  { _id: "spot_b4", spot_number: "B4", zone: "Zone B", vehicle_type: "two-wheeler", status: "available", price_per_hour: 20 },
  { _id: "spot_b5", spot_number: "B5", zone: "Zone B", vehicle_type: "four-wheeler", status: "available", price_per_hour: 50 },
  { _id: "spot_b6", spot_number: "B6", zone: "Zone B", vehicle_type: "four-wheeler", status: "available", price_per_hour: 50 },

  // Zone C - Premium & EV (Fast Charging bays)
  { _id: "spot_c1", spot_number: "C1", zone: "Zone C", vehicle_type: "four-wheeler", status: "available", price_per_hour: 80 },
  { _id: "spot_c2", spot_number: "C2", zone: "Zone C", vehicle_type: "four-wheeler", status: "occupied", price_per_hour: 80 },
  { _id: "spot_c3", spot_number: "C3", zone: "Zone C", vehicle_type: "four-wheeler", status: "available", price_per_hour: 80 },
  { _id: "spot_c4", spot_number: "C4", zone: "Zone C", vehicle_type: "two-wheeler", status: "available", price_per_hour: 30 }
];

export const INITIAL_BOOKINGS = [
  {
    _id: "booking_seed_1",
    pass_id: "PASS-2026-A3-8821",
    spot_id: "spot_a3",
    spot_number: "A3",
    zone: "Zone A",
    vehicle_type: "four-wheeler",
    vehicle_number: "DL-08-AB-4321",
    duration_hours: 2,
    total_amount: 100,
    status: "active",
    start_time: new Date(Date.now() - 30 * 60000).toISOString(),
    end_time: new Date(Date.now() + 90 * 60000).toISOString()
  },
  {
    _id: "booking_seed_2",
    pass_id: "PASS-2026-B3-4412",
    spot_id: "spot_b3",
    spot_number: "B3",
    zone: "Zone B",
    vehicle_type: "two-wheeler",
    vehicle_number: "KA-01-MG-9999",
    duration_hours: 3,
    total_amount: 60,
    status: "checked_in",
    start_time: new Date(Date.now() - 60 * 60000).toISOString(),
    end_time: new Date(Date.now() + 120 * 60000).toISOString()
  }
];

export const DEMO_USERS = {
  driver: {
    _id: "user_driver_1",
    name: "Sarah Connor (Demo Driver)",
    email: "driver@smartparking.com",
    role: "driver",
    vehicle_number: "DL-08-AB-4321"
  },
  admin: {
    _id: "user_admin_1",
    name: "Alex Vance (Demo Admin)",
    email: "admin@smartparking.com",
    role: "admin",
    vehicle_number: "KA-01-MG-9999"
  }
};

const STORAGE_KEY_SPOTS = "parkpulse_demo_spots";
const STORAGE_KEY_BOOKINGS = "parkpulse_demo_bookings";

export function getMockSpots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return [...INITIAL_SPOTS];
}

export function saveMockSpots(spots) {
  try {
    localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(spots));
  } catch (e) {
    // ignore
  }
}

export function getMockBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return [...INITIAL_BOOKINGS];
}

export function saveMockBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    // ignore
  }
}
