# frontend — owner: Abhi (Frontend)

## Why this matters for you specifically
You're the only frontend person covering 5 modules. The single biggest risk
to the whole team's timeline is you becoming a bottleneck — that's why the
component library (`src/components/ui/`) comes before any page, and why
`src/lib/api.ts` is the *only* file that talks to the backend. Every page
below is built by composing 3-4 reusable pieces, not writing bespoke UI
per module.

## What's already scaffolded for you
- `src/lib/api.ts` — the one file that calls backend-core; everything else
  imports from here
- `src/components/ui/` — `Card`, `Table`, `AlertBanner` — reuse these
  everywhere instead of writing new markup per module
- `src/components/dashboard/DashboardOverview.tsx` — pulls
  `/integrations/overview`, shows each module as online/offline
- `src/components/production/ProductionTable.tsx` — polls live production
  every 5s
- `src/components/chatbot/ChatWidget.tsx` — a working chat UI against
  Gauri's service (via backend-core's proxy)
- `src/pages/` — dashboard (`/`), production, vision (placeholder), chat

## Your actual to-do list
1. **Day 1-2**: Get this running with `npm install && npm run dev`, confirm the nav + dashboard shell render even with backend-core not yet up (should show "offline" banners, not a crash — test this on purpose).
2. **Day 3-5**: Once Anuj's `/production/live` is real, confirm `ProductionTable` shows live-updating rows.
3. **Day 6-8**: Build the real Vision Inspection page once Krrish's `/inspect` + sample images exist — an image (or looping feed) with bounding-box overlays drawn on top, plus a scrolling defect log using the `Table` component you already have.
4. **Day 8-10**: Wire up an Alerts panel (`src/components/alerts/`) using `AlertBanner` — pull tickets from a new backend-core endpoint (ask Anuj to add `GET /workflow/tickets` if it doesn't exist yet).
5. **Day 10-12**: Add Predictive Maintenance + Root Cause widgets to the main dashboard using `Card` — this is quick since the components already exist, you're just adding new `Card` instances with new data sources.
6. **Day 13-14**: Visual polish pass — spacing, empty/loading states, make sure every page still works if a service is down.
7. **Ongoing**: Resist the urge to write one-off styled divs per page — if you're about to copy-paste markup, that's the signal to make it a new shared component instead.

## Installation
```bash
cd apps/frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Visit `http://localhost:3000`.
