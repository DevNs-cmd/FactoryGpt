# backend-core — owner: Anuj (Backend, AI)

## Why this folder is yours
Every other module either writes to this service or reads from it. It owns
the only database in the system. That's why it needs to be built first (Day
1-2) and frozen as a contract — see `/docs/api-contracts.md`.

## What's already scaffolded for you
- `app/db/models.py` — 4 tables: ProductionEvent, DowntimeEvent, DefectRecord, Ticket
- `app/db/database.py` — SQLAlchemy engine/session
- `app/schemas.py` — Pydantic response models matching the contract
- `app/api/production.py` — `GET /production/live`, `GET /production/downtime`
- `app/api/workflow.py` — `POST /workflow/defect-event` (the automation chain)
- `app/api/integrations.py` — `GET /integrations/overview`, `POST /integrations/chat` (frontend's single entry point into everyone else)
- `app/services/data_generator.py` — background thread faking a live production line every 5s
- `app/main.py` — wires it all together, creates tables on startup

## Your actual to-do list
1. **Day 1**: Get this running locally (steps below), confirm `/health` returns ok and tables get created.
2. **Day 1-2**: Review `docs/api-contracts.md`, adjust `models.py`/`schemas.py` if your team needs different fields — then **freeze it** and tell everyone.
3. **Day 3-5**: Add `GET /production/summary` (OEE-style aggregation: actual vs target %, per shift) for the dashboard.
4. **Day 6-9**: Build out `integrations.py` further as Krrish/Gauri/Neerav/Vedant's services come online — wire real calls once their `/health` endpoints work.
5. **Day 10-11**: Harden `workflow.py` — make sure a dead chatbot-assistant or dead DB write never 500s the whole chain.
6. **Ongoing**: You are the required reviewer for any PR touching `app/db/` or `app/schemas.py`.

## Installation
```bash
cd apps/backend-core
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# make sure Postgres is running (see root docker-compose.yml), then:
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for the auto-generated Swagger UI — use
this to hand teammates a live, clickable reference instead of them guessing
your endpoint shapes.

Or, once the rest of the team's services exist:
```bash
docker-compose up backend-core postgres
```
