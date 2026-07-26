# root-cause-analysis — owner: Vedant (DSA, Backend, Data Analysis)

## Why this folder is yours
This service is read-only against the rest of the system — it pulls raw
logs from `backend-core` over HTTP and does the actual analysis in pandas.
It never touches Postgres directly, so you can rewrite your aggregation
logic as many times as you want without any migration/schema risk to
Anuj's database.

## What's already scaffolded for you
- `app/analytics/queries.py` — fetches downtime logs from backend-core,
  aggregates by reason/machine/line with pandas
- `app/analytics/report.py` — `generate_report()`, a single function
  reused by both your own `/report` endpoint and Gauri's chatbot
  (via HTTP) — so "generate a report" isn't built twice
- `app/api/routes.py` — `GET /root-cause`, `GET /report`
- `app/inventory/routes.py` — a **stretch-goal** inventory CRUD, only build
  this out once root-cause analysis itself is solid

## Your actual to-do list
1. **Day 1-2**: Get this running against Anuj's `/production/downtime` once his service is up; confirm `GET /root-cause` returns something sensible even with just a handful of fake events.
2. **Day 3-6**: Extend the aggregation — add breakdowns by shift and by operator once those fields exist in the downtime data (check with Anuj if `operator_id` needs adding to his schema).
3. **Day 6**: Sync with Anuj on adding an operator/shift dimension to `DowntimeEvent` if it's missing — this needs a contract change, so raise it early, not on day 10.
4. **Day 7-8**: Polish `generate_report()`'s wording so it reads like an actual report, not a raw stats dump — this is what the chatbot will literally return to a manager asking "generate quality report."
5. **Day 9-12 (stretch)**: If ahead of schedule, flesh out `app/inventory/routes.py` into a small Inventory Intelligence module — it's mostly CRUD + one threshold check, well within your skillset.
6. **Ongoing**: Since Neerav also touches sensor-style data, keep your aggregation scoped to production/downtime data only — don't reach into his synthetic sensor logic.

## Installation
```bash
cd services/root-cause-analysis
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8004
```
Test it (once backend-core has some fake downtime events logged):
```bash
curl http://localhost:8004/root-cause
curl http://localhost:8004/report
```
