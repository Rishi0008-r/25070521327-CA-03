# 🚆 ConfirmRail Server (Backend)

The backend REST API and WebSocket engine for the **ConfirmRail** Indian Railways ticket booking and real-time tracking platform. Built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Socket.io**.

---

## 🌟 Architecture & Features

1. **Dual-Search & Station Autocomplete API**:
   - `GET /api/trains/search`: Bidirectional search by origin/destination station code, station name, city alias, or train number/name.
   - `GET /api/trains/stations`: 138 curated junctions across all 18 Indian Railway zonal divisions.
2. **Dynamic Date Schedule Adaptation**:
   - Searches for any calendar date automatically adapt timetable matrices with realistic seed pricing and seat counts.
3. **Machine Learning / Algorithmic Waitlist Prediction**:
   - Computes confirmation probabilities (CNF %, RAC %, WL %) based on historical quota patterns, train type, and days to departure.
4. **Ixigo Smart Split-Ticket Routing**:
   - Discovers connecting options across major junction hubs when direct trains have high waitlists or limited availability.
5. **Real-Time GPS Telemetry Engine (Socket.io)**:
   - High-frequency 3-second simulation broadcast for active trains across geographic coordinates with speedometer, current station, and next station announcements.
6. **Robust Dual-Mode Database Connection**:
   - Automatically connects to local MongoDB on port `27017` (`mongodb://127.0.0.1:27017/train_ticket_booking`).
   - Seamlessly falls back to an in-memory MongoDB instance via `mongodb-memory-server` if local MongoDB is unreachable.

---

## 📁 Directory Structure

```
server/
├── config/
│   └── db.js                 # MongoDB connection with auto In-Memory fallback & seeding
├── data/
│   └── stations.js           # 138 stations with GPS coords, platforms, zones, and categories
├── middleware/
│   └── authMiddleware.js     # JWT Bearer verification & Admin guards
├── models/
│   ├── User.js               # Passenger & Controller accounts with bcrypt
│   ├── Train.js              # Intermediate halts, classes, tariffs & text indexes
│   ├── Schedule.js           # ConfirmTkt availability states (CNF, RAC, WL) & coach layout
│   ├── Booking.js            # 10-digit PNR, fare breakdown, quota & charting status
│   ├── Station.js            # Station schema with geographic coordinates
│   └── FareRule.js           # IRCTC base fares and distance slabs
├── routes/
│   ├── authRoutes.js         # Register, Login, Profile
│   ├── trainRoutes.js        # Search, stations autocomplete, live status, schedule details
│   └── bookingRoutes.js      # Atomic booking, PNR status, cancellation & seat release
├── sockets/
│   └── trainSocket.js        # 3-second GPS telemetry & station crossing broadcaster
├── utils/
│   ├── waitlistPredictor.js  # ConfirmTkt probability calculation engine
│   └── splitTicketEngine.js  # Smart connecting split routing
├── .env                      # Environment config (PORT=5001)
├── .env.example
├── package.json
├── seed.js                   # 1,200+ Pan-India trains & 138 stations seeder
└── server.js                 # Express HTTP & Socket.io server (serves client/dist)
```

---

## 🛠️ API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Server health, MongoDB status, active connections |
| `/api/trains/search` | GET | Search trains by route (`from`, `to`), train query, or date |
| `/api/trains/stations` | GET | Autocomplete list of all 138 stations |
| `/api/trains/live/:trainNumber` | GET | Station-by-station transit progression & delay |
| `/api/trains/schedule/:id` | GET | Complete coach seat availability matrix |
| `/api/bookings/pnr/:pnr` | GET | Retrieve booking by 10-digit PNR |
| `/api/bookings/book` | POST | Atomic seat reservation & PNR generation |
| `/api/auth/login` | POST | Passenger login & JWT token issue |

---

## 🚀 Running the Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```
Seeds 138 stations, 1,200+ realistic trains, daily timetables, fare rules, and demo accounts in MongoDB.

### 3. Start Development Server
```bash
npm run dev
```
Starts with Nodemon on `http://localhost:5001`.
