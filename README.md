# Fulcrum · Order operations

A responsive, browser-based prototype for the ABC Power Equipment Order Tracking & Fulfillment System (OTFS). It covers order intake and processing, shipment preparation and tracking, return resolution, and fulfillment reporting.

## Run it

### Frontend-only demo

Open `index.html` in a modern browser. The app falls back to browser `localStorage` when the API is unavailable.

### Full stack with MongoDB

Requirements: Node.js 20+ and a MongoDB instance (local or hosted).

```powershell
npm install
Copy-Item .env.example .env
# Edit .env if your MongoDB URI differs
npm start
```

Then open <http://localhost:3000>. The Express server serves the app and exposes JSON endpoints under `/api`. The browser app loads existing MongoDB orders on startup and syncs order workflow changes to MongoDB. If the database is empty, it seeds it from the sample orders already in the browser. The workspace can also load from a clean browser with the default sample set.

The project folder includes a `.vscode` launch configuration and tasks. For a local database, first run **Terminal → Run Task → Start local MongoDB** and leave that terminal running. Then use **Run and Debug → Fulcrum OTFS (API + web app)**, or **Terminal → Run Task → Start Fulcrum OTFS**. Both app launch options use `.env` in the project root. The included `.env` defaults to `127.0.0.1:27017`; the MongoDB task locates the newest version installed under `C:\Program Files\MongoDB\Server` and stores database files under `data\mongodb`. Keep real database credentials in `.env` and do not commit that file.

### API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server and database status |
| `GET` | `/api/orders` | List orders |
| `GET` | `/api/orders/:id` | Read one order |
| `POST` | `/api/orders` | Create an order |
| `PUT` | `/api/orders/:id` | Create or update one order |
| `DELETE` | `/api/orders/:id` | Delete one order |
| `PUT` | `/api/orders/sync` | Upsert the prototype's current order records |
| `GET` | `/api/metrics` | MongoDB-aggregated operational counts and revenue |

## Included workflows

- Review operational KPIs, recent orders, delivery performance, live activity, and target progress.
- Search, filter, sort, inspect, and export orders as CSV.
- Create an order with customer, address, item, quantity, and payment state.
- Generate a demo shipping label for ready-to-ship orders. The prototype records a carrier, tracking number, and shipment timeline.
- Move orders through the fulfillment milestones: Processing → Ready to ship → Label created → In transit → Delivered.
- Review return requests and record a refund, exchange, or decline; start a return from a delivered order.
- Review the scorecard against the project guideline targets and reset the sample data.
- Use the compact navigation drawer on phones and tablets. Order, shipment, return, and recent-order tables become labeled cards on phone screens; wider scorecards retain horizontal scrolling where needed. Header menus support keyboard focus and close with Escape or an outside click.

## Demo boundaries

Carrier labels, tracking scans, payments, refunds, and notifications are still demo behavior. MongoDB persists orders and the metrics endpoint aggregates order state, but no live carrier, payment, or inventory service is connected. Production use still needs authentication, role-based access, audit logs, request throttling, secrets management, and validated carrier/payment integrations.

## Project target references

The dashboard scorecard reflects the guideline targets: 2-day order processing, 99% label accuracy, 95% on-time delivery, +20% customer NPS, and a 40% reduction in fulfillment complaints. Demo values are illustrative and are not calculated from actual company operations.
