# 🚗 ParkPulse — Smart Parking Management System

A production-ready, full-stack IoT-inspired Smart Parking Management System designed with real-time bidirectional WebSocket slot updates, dynamic duration-based pricing, verifiable digital parking passes with QR codes, and an administrative control panel with live analytics.

---

## 🛠 Tech Stack Overview

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 18, Tailwind CSS, Lucide Icons, Socket.io-client, Vite | Interactive parking layout grid, booking modal, digital boarding pass, admin panel |
| **Primary Backend** | Python 3.12, Flask, PyMongo, PyJWT, Bcrypt, Requests | Business logic, authentication, spot management, booking workflows, pricing engine |
| **Real-time Gateway** | Node.js, Express, Socket.io | WebSocket microservice delivering sub-second slot state broadcasts to all clients |
| **Database** | MongoDB | Document store for `users`, `parking_spots`, and `bookings` |

---

## 🏗 Architecture & Data Flow

```text
    ┌────────────────────────────────────────────────────────┐
    │              React Frontend (Port 5173)                │
    │  - Interactive Visual Parking Grid (A1, B1, C1...)     │
    │  - Live Status: Available (Green) / Occupied / Reserved│
    │  - Booking Modal & Dynamic Fare Calculator             │
    │  - Verifiable Digital Pass with SVG QR Code            │
    └───────────▲────────────────────────────────┬───────────┘
                │                                │
     WebSocket  │ `slot_updated`       REST API  │ /api/auth/*
     Broadcast  │                                │ /api/spots/*
                │                                │ /api/bookings/*
    ┌───────────┴───────────────┐   ┌────────────▼──────────────┐
    │   Node.js + Socket.io     │   │      Python Flask API     │
    │    Microservice Gateway   │   │       (Port 5000)         │
    │        (Port 4000)        │   │  - Auth & JWT Middleware  │
    └───────────▲───────────────┘   │  - Booking / Price Engine │
                │                   │  - Check-In & Check-Out   │
                │ HTTP Webhook      └────────────┬──────────────┘
                │ /api/broadcast-slot            │ PyMongo
                └────────────────────────────────┘
                                                 ▼
                                    ┌───────────────────────────┐
                                    │    MongoDB Collections    │
                                    │  - users                  │
                                    │  - parking_spots          │
                                    │  - bookings               │
                                    └───────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
WFP NOSQL/
├── backend-flask/                # Primary REST API & Business Logic (Python Flask)
│   ├── app.py                    # Flask application entrypoint & blueprints
│   ├── config.py                 # Configuration & environment variables
│   ├── database.py               # MongoDB initialization & indexes
│   ├── seed_data.py              # Database seeding script for sample demo data
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Sample environment configuration
│   ├── middleware/
│   │   └── auth_middleware.py    # JWT verification & role-based access decorators
│   ├── routes/
│   │   ├── auth_routes.py        # /api/auth (register, login, me)
│   │   ├── spot_routes.py        # /api/spots (CRUD, status patch, zones)
│   │   ├── booking_routes.py     # /api/bookings (create, my, verify, check-in, check-out)
│   │   └── admin_routes.py       # /api/admin (analytics, occupancy rate, revenue)
│   └── utils/
│       └── notifier.py           # HTTP Webhook dispatcher to Real-time Gateway
│
├── realtime-service/             # WebSocket Notification Gateway (Node.js + Express)
│   ├── package.json              # Express, Socket.io, cors
│   ├── server.js                 # Socket.io connection handling & broadcast endpoints
│   └── .env.example              # Service port configuration
│
└── frontend-react/               # Modern Dashboard Application (React + Vite)
    ├── package.json              # React 18, Lucide React, Socket.io-client, Tailwind
    ├── vite.config.js            # Vite build configuration
    ├── tailwind.config.js        # Custom parking themes & styling
    ├── postcss.config.js
    ├── index.html                # Custom HTML with Google Fonts
    └── src/
        ├── main.jsx              # React DOM mounting
        ├── App.jsx               # Master application container & socket listener
        ├── index.css             # Tailwind layers, lane styling, glow animations
        ├── context/
        │   ├── AuthContext.jsx   # Global user state, JWT tokens, persistent session
        │   └── SocketContext.jsx # Socket.io connection provider & event dispatcher
        ├── services/
        │   └── api.js            # Fetch API client abstraction
        └── components/
            ├── Navbar.jsx          # Live gateway indicator, role pills, quick-login
            ├── LoginModal.jsx      # Authentication modal with demo login shortcuts
            ├── ParkingGrid.jsx     # Visual parking bays layout, lane dividers, status badges
            ├── BookingModal.jsx    # Duration slider, dynamic price calculator, vehicle form
            ├── DigitalPassModal.jsx# Boarding pass styled ticket with pure SVG QR code
            ├── QRCodeView.jsx      # Deterministic SVG QR matrix generator
            ├── AdminPanel.jsx      # Occupancy analytics, slot CRUD, Pass check-in scanner
            └── MyBookings.jsx      # Driver's booking history and digital pass viewer
```

## ⚡ Quick Start (1-Click Run)

You can launch the entire ecosystem (Flask Backend, Socket.io Real-time Gateway, and React Frontend) with a single double-click:

- **Windows:** Double-click [`start_all.bat`](file:///c:/Users/Lenovo/Downloads/WAYFARER-main/WFP%20NOSQL/start_all.bat) or run `.\start_all.ps1` in PowerShell.
- **Embedded Database Fallback:** If you do not have a local MongoDB daemon running, the backend **automatically activates an embedded in-memory MongoDB engine with pre-seeded demo spots and accounts**, allowing the prototype to work 100% out-of-the-box with zero database setup required!

---

## 🛠 Manual Step-by-Step Run Commands

### 1. Database (MongoDB)
- **Automatic Fallback:** Runs in-memory with pre-seeded demo data if no MongoDB server is detected.
- **Using Real MongoDB / Docker (Optional):**
```bash
docker run -d -p 27017:27017 --name mongodb-parking mongo:latest
```

**Option A — Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb-parking mongo:latest
```

**Option B — Using MongoDB Community Server:**
Ensure the `mongod` service is running on `mongodb://127.0.0.1:27017`.

**Option C — Using MongoDB Atlas:**
Set `MONGO_URI` in `backend-flask/.env` to your cloud connection string:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_parking?retryWrites=true&w=majority
```

---

### 2. Run Python Flask Backend
```bash
cd backend-flask

# Create and activate a Python virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed the database with sample demo spots and accounts
python seed_data.py

# Start the Flask API server (runs on http://localhost:5000)
python app.py
```

---

### 3. Run Node.js Real-Time Socket.io Gateway
Open a new terminal window:
```bash
cd realtime-service

# Install dependencies
npm install

# Start the service (runs on http://localhost:4000)
npm start
```

---

### 4. Run Frontend React App
Open a third terminal window:
```bash
cd frontend-react

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Pre-configured Vehicle |
|---|---|---|---|
| **Admin** | `admin@smartparking.com` | `admin123` | `KA-01-MG-9999` |
| **Driver / User** | `driver@smartparking.com` | `driver123` | `DL-08-AB-4321` |

> *Tip: You can also use the 1-click **"Sarah (Driver)"** and **"Alex (Admin)"** buttons in the top navbar or Sign-In modal to test immediately!*

---

## 📋 API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a driver or admin account.
- `POST /api/auth/login` — Login and receive a JWT token.
- `GET /api/auth/me` — Retrieve current user profile (requires Bearer token).

### Parking Spots (`/api/spots`)
- `GET /api/spots?zone=Zone A&vehicle_type=four-wheeler` — List spots with filters.
- `GET /api/spots/zones` — Get distinct available parking zones.
- `POST /api/spots` — Add a new parking spot *(Admin only)*.
- `DELETE /api/spots/<spot_id>` — Delete a parking spot *(Admin only)*.
- `PATCH /api/spots/<spot_id>/status` — Update spot status (`available`, `occupied`, `reserved`) *(Admin only)*.

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Create a reservation, calculate dynamic fare, generate `pass_id`.
- `GET /api/bookings/my` — Get authenticated user's parking passes.
- `GET /api/bookings/verify/<pass_id>` — Verify a booking pass by its ID.
- `POST /api/bookings/check-in` — Admin check-in vehicle (marks spot as `occupied`).
- `POST /api/bookings/check-out` — Admin check-out vehicle (frees spot to `available`).

### Admin Analytics (`/api/admin`)
- `GET /api/admin/analytics` — Real-time metrics: Total Slots, Available, Occupied, Reserved, Occupancy Rate %, and Total Revenue.
