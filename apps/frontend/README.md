# FactoryGPT — Next.js ERP Portal (`apps/frontend`)

The Next.js ERP Portal is a 7-module dashboard that integrates all backend data feeds into a unified industrial interface.

---

## 🌟 Pages & Features Built

- 📊 **Executive Dashboard (`/`)**: Top KPI cards, line-wise efficiency bar charts, shift comparison charts, recent workflow tickets feed, and microservice status.
- 🏭 **Production Monitoring (`/production`)**: Tabbed interface featuring real-time production progress counters (updated every 5s) and downtime logs.
- 👁️ **AI Vision Inspection (`/vision`)**: Defect detection QA log, open vs resolved defect stats, and vision service status.
- 🔧 **Predictive Maintenance (`/maintenance`)**: Real-time machine health monitoring cards with SVG ring gauges, vibration/temp/RPM telemetry, failure forecasts, and manual health check triggers.
- 🔍 **Root Cause Analysis (`/rootcause`)**: Top downtime reason highlights, worst machine/line metrics, horizontal downtime bar charts, and occurrence donut charts.
- 🎫 **Workflow Tickets (`/tickets`)**: Centralized automated work orders & tickets triggered by Vision, Maintenance, and Safety alerts with source/status filtering.
- 💬 **Factory Assistant (`/chat`)**: Multi-lingual (EN/HI) AI assistant with suggested prompt chips, message history, and automated telemetry lookups.

---

## 🛠️ Architecture Rules

- **`src/lib/api.ts` is the single source of truth** for all backend communication.
- The frontend ONLY calls `backend-core` at `http://localhost:8000` — never ports 8001-8004 directly.
- **Fail-Safe Rendering:** If any service goes down, the portal displays an offline badge without breaking the rest of the application.

---

## 🚀 Quickstart

```bash
cd apps/frontend
npm install --legacy-peer-deps
npm run dev
```

Visit **`http://localhost:3000`** in your browser.
