# FactoryGPT — API Contract (READ THIS FIRST)

This file is the single source of truth for field names, types, and endpoint
shapes across all 6 services. If your code and this file disagree, **this
file wins** — update your code, not the other way round, and if you need to
change a shape, edit this file in its own PR and tag Anuj + whoever else
consumes that field.

Freeze target: **Day 2**. After Day 2, changing a shape here requires a
heads-up in the team chat, since at least one other person's service depends
on it.

Only `backend-core` talks to the database. Every other service is stateless:
it either generates its own data or calls `backend-core`'s API. This is the
#1 rule that keeps 6 people from producing merge conflicts on the same
models/migrations file.

---

## Ports (local dev)

| Service | Owner | Port |
|---|---|---|
| frontend | Abhi | 3000 |
| backend-core | Anuj | 8000 |
| vision-inspection | Krrish | 8001 |
| chatbot-assistant | Gauri | 8002 |
| predictive-maintenance | Neerav | 8003 |
| root-cause-analysis | Vedant | 8004 |
| postgres | (shared, backend-core owns schema) | 5432 |

Every service exposes `GET /health` returning `{"status": "ok", "service": "<name>"}`.
The frontend and backend-core use this to show which modules are alive — a
service being down must never crash another service, only show as offline.

---

## Shared object shapes

These exact field names/types must be used by whoever produces or consumes
them, in every service.

### DefectDetection (produced by vision-inspection, consumed by backend-core)
```json
{
  "defect_type": "crack | scratch | dent | missing_component | ok",
  "confidence": 0.0,
  "bbox": [0, 0, 0, 0],
  "image_ref": "string",
  "timestamp": "2026-08-01T10:00:00Z"
}
```

### ProductionEvent (owned by backend-core)
```json
{
  "line_id": "string",
  "count": 0,
  "target": 0,
  "shift": "A | B | C",
  "timestamp": "2026-08-01T10:00:00Z"
}
```

### DowntimeEvent (owned by backend-core)
```json
{
  "line_id": "string",
  "machine_id": "string",
  "duration_seconds": 0,
  "reason": "string",
  "timestamp": "2026-08-01T10:00:00Z"
}
```

### MachineHealth (produced by predictive-maintenance)
```json
{
  "machine_id": "string",
  "health_score": 0,
  "vibration": 0.0,
  "temperature": 0.0,
  "rpm": 0,
  "predicted_days_to_failure": 0,
  "timestamp": "2026-08-01T10:00:00Z"
}
```

### Ticket (owned by backend-core, created via the workflow chain)
```json
{
  "id": 0,
  "source_module": "vision | maintenance | safety",
  "type": "defect | machine_health | safety",
  "status": "open | acknowledged | closed",
  "description": "string",
  "created_at": "2026-08-01T10:00:00Z"
}
```

---

## Endpoint map (who calls whom)

```
frontend  ──────────────►  backend-core (port 8000)   [ONLY entry point for frontend]
                                │
                ┌───────────────┼───────────────┬───────────────┐
                ▼               ▼               ▼               ▼
        vision-inspection  chatbot-assistant  predictive-   root-cause-
        (8001)             (8002)             maintenance   analysis
                                               (8003)        (8004)
```

The frontend never calls ports 8001-8004 directly. `backend-core` proxies
through `app/api/integrations.py`. This means any one module (e.g. vision)
can be down, buggy, or not-yet-built, and the frontend + rest of the demo
still runs — which is the whole point of the "modular, integration-first"
build.

### backend-core (Anuj) — owns the DB
- `GET /production/live` → current counts vs target
- `GET /production/downtime` → downtime log
- `POST /workflow/defect-event` → logs a defect, opens a Ticket, calls Gauri's `/notify`
- `GET /integrations/overview` → aggregates vision/maintenance/root-cause for the dashboard (each call wrapped in try/except — a dead service returns `null`, not a 500)
- `POST /integrations/chat` → proxies to chatbot-assistant `/chat`

### vision-inspection (Krrish)
- `POST /inspect` → image in, `DefectDetection[]` out
- On confidence > threshold, calls `backend-core` `POST /workflow/defect-event`

### chatbot-assistant (Gauri)
- `POST /chat` → `{message, language}` → answer, using function-calling against backend-core + root-cause-analysis
- `POST /notify` → sends the actual alert (webhook/Slack/email stand-in for WhatsApp Business API)

### predictive-maintenance (Neerav)
- `GET /machine-health` / `GET /machine-health/{machine_id}`
- Internally: on health_score < threshold, calls `backend-core` `POST /workflow/defect-event` with `source_module="maintenance"`

### root-cause-analysis (Vedant)
- `GET /root-cause` → aggregated causes by machine/shift/operator
- `GET /report` → used by both the frontend and the chatbot
- Pulls raw logs via `backend-core` `GET /production/downtime` — does **not** touch Postgres directly

---

## Git workflow (this is what actually prevents merge errors)

1. `main` = always demo-able. Nobody pushes straight to it.
2. `develop` = daily integration branch. Everyone merges here first.
3. One feature branch per person per task: `feature/<name>-<short-task>`,
   e.g. `feature/krrish-defect-model`.
4. PRs into `develop` need **one reviewer**:
   - Anyone touching `apps/backend-core/app/db/` or `app/schemas.py` → **Anuj must review**, since that's the shared contract.
   - Everything inside your own `services/<your-service>/` folder → any teammate can review, doesn't need to be Anuj.
5. Merge `develop` → `main` once a day, after running `docker-compose up` locally and confirming all 6 `/health` endpoints return `ok`.
6. Never edit someone else's service folder without pinging them first — if backend-core's contract needs to change, edit this file first, then the code.
