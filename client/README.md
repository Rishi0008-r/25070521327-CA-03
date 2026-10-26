# 🚆 ConfirmRail Client (Frontend)

The official frontend single-page application (SPA) for the **ConfirmRail** Indian Railways ticket booking and real-time tracking platform. Built with **React 19**, **Vite**, **TailwindCSS**, and **Socket.io Client**.

---

## 🌟 Key Features

1. **Dual-Search Engine**:
   - **Route Search**: Find trains across 138 major junctions in all 18 Indian Railway zones.
   - **Direct Train Search**: Instant search by train number (e.g. `12952`, `22436`) or train name (`Rajdhani`, `Shatabdi`, `Vande Bharat`).
2. **ConfirmTkt-Style Availability Chips**:
   - Color-coded availability chips (`AVAILABLE`, `RAC`, `WL`) with ML-driven confirmation probability percentages and forecast trends.
3. **Interactive Visual Coach Layout**:
   - Interactive berth and seat selector with Window, Aisle, Lower, Middle, Upper filters.
4. **Itemized IRCTC Fare Breakdown**:
   - Real-time fare calculation including Base Fare, Reservation Fee, Superfast Surcharge, Tatkal Fee, and 5% GST.
5. **Real-Time GPS Train Tracking & Radar**:
   - Linear station-by-station progression speedometer and interactive all-India geospatial SVG radar map.
6. **Live PNR Status & Scannable QR Boarding Pass**:
   - Complete passenger manifest with assigned coach/berth, live confirmation prediction, and downloadable boarding ticket.
7. **Authentic Railway Audio Announcements**:
   - Web Audio API 3-tone IRCTC chime synthesizer.

---

## 📁 Directory Structure

```
client/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.jsx              # Header navigation & chime controls
│   │   ├── StationAutocomplete.jsx # 138-station searchable selector
│   │   ├── ConfirmTktCard.jsx      # Train card with availability chips
│   │   ├── FareBreakdownModal.jsx  # Itemized IRCTC fare modal
│   │   ├── SeatGrid.jsx            # Coach berth selector
│   │   ├── TicketCard.jsx          # Scannable QR boarding pass
│   │   ├── IndiaRailwayMap.jsx     # Geospatial India radar map
│   │   └── PresentationModal.jsx   # Presentation & testing tools
│   ├── context/
│   │   ├── AuthContext.jsx         # Passenger JWT session management
│   │   └── SocketContext.jsx       # Real-time WebSocket connection
│   ├── data/
│   │   └── stations.js             # 138 major stations across 18 zones
│   ├── pages/
│   │   ├── Home.jsx                # Landing page & quick search
│   │   ├── BookingFlow.jsx         # Main booking & search page
│   │   ├── PNRStatus.jsx           # PNR status & prediction
│   │   ├── LiveTrainStatus.jsx     # Spot your train timeline
│   │   ├── LiveTracking.jsx        # Radar telemetry log
│   │   ├── ScheduleBoard.jsx       # Dynamic departure board
│   │   ├── Dashboard.jsx           # Passenger booking history
│   │   ├── Login.jsx               # Login with demo prefill
│   │   └── Register.jsx            # Passenger registration
│   ├── utils/
│   │   ├── api.js                  # Axios client with JWT interceptor
│   │   └── audio.js                # Web Audio API chime synthesizer
│   ├── App.jsx                     # Router config
│   ├── index.css                   # Tailwind CSS styling
│   └── main.jsx                    # React entry point
├── package.json
├── tailwind.config.js
└── vite.config.js                  # Dev server with proxy to :5001
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The client will start on `http://localhost:5173/` with automatic hot module replacement (HMR) and proxying of `/api` and `/socket.io` to the server on port `5001`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle inside `dist/`.
