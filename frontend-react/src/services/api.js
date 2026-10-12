const rawApiBase = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const API_BASE = rawApiBase.replace(/\/+$/, "").endsWith("/api")
  ? rawApiBase.replace(/\/+$/, "")
  : `${rawApiBase.replace(/\/+$/, "")}/api`;

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

function getAuthHeader() {
  const token = localStorage.getItem("parkpulse_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request("/auth/me"),

  // Parking Spots
  getSpots: (zone = "All", vehicleType = "All") => {
    const params = new URLSearchParams();
    if (zone && zone !== "All") params.append("zone", zone);
    if (vehicleType && vehicleType !== "All") params.append("vehicle_type", vehicleType);
    return request(`/spots?${params.toString()}`);
  },

  getZones: () => request("/spots/zones"),

  createSpot: (spotData) =>
    request("/spots", {
      method: "POST",
      body: JSON.stringify(spotData),
    }),

  deleteSpot: (spotId) =>
    request(`/spots/${spotId}`, {
      method: "DELETE",
    }),

  updateSpotStatus: (spotId, status) =>
    request(`/spots/${spotId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Bookings
  createBooking: (bookingData) =>
    request("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  getMyBookings: () => request("/bookings/my"),

  verifyPass: (passId) => request(`/bookings/verify/${encodeURIComponent(passId)}`),

  checkIn: (passId) =>
    request("/bookings/check-in", {
      method: "POST",
      body: JSON.stringify({ pass_id: passId }),
    }),

  checkOut: (passId) =>
    request("/bookings/check-out", {
      method: "POST",
      body: JSON.stringify({ pass_id: passId }),
    }),

  // Admin
  getAnalytics: () => request("/admin/analytics"),

  // Seed initial data
  seedData: () =>
    request("/seed", {
      method: "POST",
    }),
};
