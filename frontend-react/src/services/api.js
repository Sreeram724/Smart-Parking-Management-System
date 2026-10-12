import {
  getMockSpots,
  saveMockSpots,
  getMockBookings,
  saveMockBookings,
  DEMO_USERS,
  INITIAL_SPOTS,
  INITIAL_BOOKINGS
} from "./mockData";

export function getEffectiveApiBase() {
  const custom = localStorage.getItem("parkpulse_api_base");
  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }
  const envUrl = import.meta.env.VITE_API_BASE;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }
  return "http://localhost:5000/api";
}

export function getEffectiveSocketUrl() {
  const custom = localStorage.getItem("parkpulse_socket_url");
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, "");
  }
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:4000";
}

export const SOCKET_URL = getEffectiveSocketUrl();

function getAuthHeader() {
  const token = localStorage.getItem("parkpulse_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const baseUrl = getEffectiveApiBase();
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout before fallback

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[ParkPulse] Backend API unreachable at ${url} (${err.message}). Using local interactive demo fallback.`);
    throw err;
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    try {
      return await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      // Offline fallback login
      const isDriver = email.toLowerCase().includes("driver");
      const user = isDriver ? DEMO_USERS.driver : DEMO_USERS.admin;
      const fakeToken = "mock_jwt_token_" + Date.now();
      localStorage.setItem("parkpulse_token", fakeToken);
      localStorage.setItem("parkpulse_current_user", JSON.stringify(user));
      return { success: true, token: fakeToken, user, isDemoFallback: true };
    }
  },

  register: async (payload) => {
    try {
      return await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const newUser = {
        _id: "user_" + Date.now(),
        name: payload.name || "Demo User",
        email: payload.email,
        role: payload.role || "driver",
        vehicle_number: payload.vehicle_number || "DL-01-AB-1234",
      };
      const fakeToken = "mock_jwt_token_" + Date.now();
      localStorage.setItem("parkpulse_token", fakeToken);
      localStorage.setItem("parkpulse_current_user", JSON.stringify(newUser));
      return { success: true, token: fakeToken, user: newUser, isDemoFallback: true };
    }
  },

  getMe: async () => {
    try {
      return await request("/auth/me");
    } catch (err) {
      const stored = localStorage.getItem("parkpulse_current_user");
      if (stored) {
        return { success: true, user: JSON.parse(stored), isDemoFallback: true };
      }
      return { success: true, user: DEMO_USERS.driver, isDemoFallback: true };
    }
  },

  // Parking Spots
  getSpots: async (zone = "All", vehicleType = "All") => {
    try {
      const params = new URLSearchParams();
      if (zone && zone !== "All") params.append("zone", zone);
      if (vehicleType && vehicleType !== "All") params.append("vehicle_type", vehicleType);
      return await request(`/spots?${params.toString()}`);
    } catch (err) {
      // Offline interactive spots fallback
      let spots = getMockSpots();
      if (zone && zone !== "All") {
        spots = spots.filter((s) => s.zone === zone);
      }
      if (vehicleType && vehicleType !== "All") {
        spots = spots.filter((s) => s.vehicle_type === vehicleType);
      }
      return { success: true, spots, count: spots.length, isDemoFallback: true };
    }
  },

  getZones: async () => {
    try {
      return await request("/spots/zones");
    } catch (err) {
      return { success: true, zones: ["Zone A", "Zone B", "Zone C"], isDemoFallback: true };
    }
  },

  createSpot: async (spotData) => {
    try {
      return await request("/spots", {
        method: "POST",
        body: JSON.stringify(spotData),
      });
    } catch (err) {
      const spots = getMockSpots();
      const newSpot = {
        _id: "spot_" + Date.now(),
        spot_number: spotData.spot_number.toUpperCase(),
        zone: spotData.zone,
        vehicle_type: spotData.vehicle_type,
        price_per_hour: Number(spotData.price_per_hour) || 50,
        status: "available",
      };
      spots.push(newSpot);
      saveMockSpots(spots);
      return { success: true, spot: newSpot, message: "Spot added in local demo mode", isDemoFallback: true };
    }
  },

  deleteSpot: async (spotId) => {
    try {
      return await request(`/spots/${spotId}`, { method: "DELETE" });
    } catch (err) {
      const spots = getMockSpots().filter((s) => s._id !== spotId);
      saveMockSpots(spots);
      return { success: true, isDemoFallback: true };
    }
  },

  updateSpotStatus: async (spotId, status) => {
    try {
      return await request(`/spots/${spotId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      const spots = getMockSpots().map((s) => (s._id === spotId ? { ...s, status } : s));
      saveMockSpots(spots);
      return { success: true, isDemoFallback: true };
    }
  },

  // Bookings
  createBooking: async (bookingData) => {
    try {
      return await request("/bookings", {
        method: "POST",
        body: JSON.stringify(bookingData),
      });
    } catch (err) {
      const spots = getMockSpots();
      const spotIndex = spots.findIndex((s) => s._id === bookingData.spot_id);
      const spot = spotIndex !== -1 ? spots[spotIndex] : { spot_number: "A1", zone: "Zone A", vehicle_type: "four-wheeler" };

      // Update spot to reserved
      if (spotIndex !== -1) {
        spots[spotIndex].status = "reserved";
        saveMockSpots(spots);
      }

      const passNumber = "PASS-2026-" + (spot.spot_number || "A1") + "-" + Math.floor(1000 + Math.random() * 9000);
      const newBooking = {
        _id: "book_" + Date.now(),
        pass_id: passNumber,
        spot_id: spot._id || bookingData.spot_id,
        spot_number: spot.spot_number,
        zone: spot.zone,
        vehicle_type: spot.vehicle_type,
        vehicle_number: bookingData.vehicle_number || "KA-05-MJ-1234",
        duration_hours: Number(bookingData.duration_hours) || 2,
        total_amount: (Number(bookingData.duration_hours) || 2) * (spot.price_per_hour || 50),
        status: "active",
        start_time: bookingData.start_time || new Date().toISOString(),
        end_time: new Date(Date.now() + (Number(bookingData.duration_hours) || 2) * 3600000).toISOString(),
      };

      const bookings = getMockBookings();
      bookings.unshift(newBooking);
      saveMockBookings(bookings);

      return { success: true, booking: newBooking, isDemoFallback: true };
    }
  },

  getMyBookings: async () => {
    try {
      return await request("/bookings/my");
    } catch (err) {
      return { success: true, bookings: getMockBookings(), isDemoFallback: true };
    }
  },

  verifyPass: async (passId) => {
    try {
      return await request(`/bookings/verify/${encodeURIComponent(passId)}`);
    } catch (err) {
      const bookings = getMockBookings();
      const found = bookings.find((b) => b.pass_id?.toUpperCase() === passId.toUpperCase());
      if (found) {
        return { success: true, booking: found, isDemoFallback: true };
      }
      return { success: false, message: `Pass ID '${passId}' not found in demo database.`, isDemoFallback: true };
    }
  },

  checkIn: async (passId) => {
    try {
      return await request("/bookings/check-in", {
        method: "POST",
        body: JSON.stringify({ pass_id: passId }),
      });
    } catch (err) {
      const bookings = getMockBookings();
      const b = bookings.find((item) => item.pass_id === passId);
      if (b) {
        b.status = "checked_in";
        saveMockBookings(bookings);

        // Update spot to occupied
        const spots = getMockSpots().map((s) => (s.spot_number === b.spot_number ? { ...s, status: "occupied" } : s));
        saveMockSpots(spots);
        return { success: true, spot_number: b.spot_number, isDemoFallback: true };
      }
      return { success: false, message: "Booking not found", isDemoFallback: true };
    }
  },

  checkOut: async (passId) => {
    try {
      return await request("/bookings/check-out", {
        method: "POST",
        body: JSON.stringify({ pass_id: passId }),
      });
    } catch (err) {
      const bookings = getMockBookings();
      const b = bookings.find((item) => item.pass_id === passId);
      if (b) {
        b.status = "completed";
        saveMockBookings(bookings);

        // Update spot to available
        const spots = getMockSpots().map((s) => (s.spot_number === b.spot_number ? { ...s, status: "available" } : s));
        saveMockSpots(spots);
        return { success: true, spot_number: b.spot_number, isDemoFallback: true };
      }
      return { success: false, message: "Booking not found", isDemoFallback: true };
    }
  },

  // Admin Analytics
  getAnalytics: async () => {
    try {
      return await request("/admin/analytics");
    } catch (err) {
      const spots = getMockSpots();
      const total = spots.length;
      const available = spots.filter((s) => s.status === "available").length;
      const occupied = spots.filter((s) => s.status === "occupied").length;
      const reserved = spots.filter((s) => s.status === "reserved").length;
      const bookings = getMockBookings();
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const zoneBreakdown = {};
      spots.forEach((s) => {
        if (!zoneBreakdown[s.zone]) {
          zoneBreakdown[s.zone] = { total: 0, available: 0, occupied: 0, reserved: 0 };
        }
        zoneBreakdown[s.zone].total++;
        zoneBreakdown[s.zone][s.status]++;
      });

      return {
        success: true,
        analytics: {
          total_spots: total,
          available_spots: available,
          occupied_spots: occupied,
          reserved_spots: reserved,
          total_bookings: bookings.length,
          total_revenue: totalRevenue,
          occupancy_rate: total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0,
          zone_breakdown: zoneBreakdown,
        },
        isDemoFallback: true,
      };
    }
  },

  // Seed initial data
  seedData: async () => {
    try {
      return await request("/seed", { method: "POST" });
    } catch (err) {
      saveMockSpots([...INITIAL_SPOTS]);
      saveMockBookings([...INITIAL_BOOKINGS]);
      return {
        success: true,
        message: "Demo spots and passes restored to factory default!",
        isDemoFallback: true,
      };
    }
  },
};
