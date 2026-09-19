# UrbanRoute IQ

> **Women Safety Mode · Real-time Routing · Live Map**

An urban mobility decision cockpit that compares multiple routes and compares them using an unvalidated heuristic by combining live ETA, traffic conditions, weather data, and a contextual safety score. Built with a dedicated **Women Safety Mode** that applies additional risk weighting to route selection.

---

## Limitations

This is a routing prototype, not an emergency service. Route scores are heuristics and do not establish personal safety. There are no verified police-post, lighting, safe-zone or traffic-bottleneck overlays. Do not use the app as evidence that a route is safe.

## Features

- 🗺️ **Live interactive map** — routes drawn on OpenStreetMap via Leaflet
- 🔀 **Route A vs Route B comparison** — distance, ETA, derived risk, and safety score side-by-side
- 🚨 **Women Safety Mode** — extra penalty applied to risk scoring for an experimental comparison
- 🚦 **Real-time traffic ETA** — Google Directions API with live traffic (`duration_in_traffic`)
- 🌦️ **Auto weather fetch** — Open-Meteo forecast for the travel hour (no API key required)
- 📍 **Address autocomplete** — powered by Nominatim (free, no key)
- 📅 **Calendar reminder** — one-click `.ics` download with a 5-minute lead reminder
- **SOS / live location sharing is not implemented.** The disabled demo control never notifies contacts.
- 🐳 **Docker-ready** — hardened non-root container, single `docker run` command

---

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js 22 (zero-dependency custom HTTP server) |
| Map UI | Leaflet 1.9 + OpenStreetMap tiles |
| Primary routing | Google Directions API (traffic-aware, multi-modal) |
| Fallback routing | OSRM (public instance, driving) |
| Geocoding / autocomplete | Nominatim (OpenStreetMap) |
| Weather | Open-Meteo hourly forecast |
| Container | Docker (node:22-alpine, non-root) |
| Cloud deploy | Google Cloud Run |

---

## Prerequisites

- **Node.js ≥ 22** (for local development)
- **Docker** (optional, for containerised runs)
- **Google Maps API key** with the *Directions API* enabled (optional — the app falls back to OSRM when no key is provided)

---

## Getting started

### 1. Clone and configure

```bash
git clone https://github.com/hemkesh2021-dotcom/PromptWars_WomenSafety.git
cd PromptWars_WomenSafety
```

Create a `.env` file in the project root:

```ini
# .env — never commit this file
GOOGLE_MAPS_API_KEY=your_actual_key
```

> `.env` is already listed in `.gitignore`. Without this key the app still works using the free OSRM fallback.

### 2. Run locally

```bash
node server.js          # or: npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run with Docker

```bash
# Build the image
docker build -t urbanroute-iq .

# Run (pass your key as an env var)
docker run -p 3000:3000 -e GOOGLE_MAPS_API_KEY=your_actual_key urbanroute-iq
```

---

## API reference

All endpoints are served by the Node.js backend to keep API keys server-side and avoid CORS issues.

### `GET /api/directions`

Fetches traffic-aware routes from the Google Directions API.

| Parameter | Required | Description |
|---|---|---|
| `origin` | ✅ | Start address or `lat,lng` |
| `destination` | ✅ | End address or `lat,lng` |
| `transport_mode` | | `driving` (default) or `transit` |
| `departure_time` | | Unix timestamp |
| `arrival_time` | | Unix timestamp |

Returns an array of routes with distance, ETA, traffic ETA, and encoded polyline.

---

### `GET /api/geocode`

Resolves an address string to coordinates via Nominatim.

| Parameter | Required | Description |
|---|---|---|
| `q` | ✅ | Address / place name |

---

### `GET /api/autocomplete`

Returns up to 5 address suggestions for a partial query.

| Parameter | Required | Description |
|---|---|---|
| `q` | ✅ | Partial address / place name |

---

### `GET /api/route`

OSRM fallback — returns driving routes when Google key is unavailable.

| Parameter | Required | Description |
|---|---|---|
| `startLat` | ✅ | Origin latitude |
| `startLng` | ✅ | Origin longitude |
| `endLat` | ✅ | Destination latitude |
| `endLng` | ✅ | Destination longitude |

---

### `GET /api/weather`

Fetches an hourly weather forecast from Open-Meteo (free, no key required).

| Parameter | Required | Description |
|---|---|---|
| `lat` | ✅ | Latitude |
| `lng` | ✅ | Longitude |
| `date` | ✅ | `YYYY-MM-DD` within the available forecast |
| `hour` | ✅ | `0`–`23` |

---

## Heuristic scoring

`buildRouteProfile` in `app.js` combines user-selected contextual risk, weather, traffic, time of day, distance and travel duration. `pickBestRoute` changes the score weights in Women Safety Mode. These weights have not been validated against personal-safety outcomes. A higher displayed score does not establish that a route is safe, and the app has no verified crime, lighting or police-location dataset.

---

## Deploy to Google Cloud Run

```bash
gcloud run deploy urbanroute-iq \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
```

The `Dockerfile` uses a non-root `appuser` and the `node:22-alpine` base image.

---

## License

MIT

## Security and verification

`npm test` checks the actual HTTP handler for blocked server files, traversal, invalid input and rate limiting. Only the three frontend files are publicly served. API requests are capped at 30/minute per socket address; a reverse proxy can therefore share this limit across clients. For deployment, configure trusted-proxy identity and a shared rate-limit/quota service before scaling out; do not trust arbitrary forwarded headers. Restrict the Google key and configure provider quotas. Upstream calls have a 10-second deadline and a 2 MiB response limit.
