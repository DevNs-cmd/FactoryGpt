# FactoryGPT — Team Build Guide (15 Days, 6 People, 1 Repo)

This is the master doc. Share it with the whole team on Day 1. It covers:
what each person builds, exactly which files they own, how to install and
run their piece, and — most importantly — the rules that keep 6 people's
code from breaking each other's when it all gets merged.

The actual runnable scaffold (every file mentioned below, already created
with working starter code) is in the attached `factorygpt.zip`. Unzip it,
`git init`, push to your assigned repo, and everyone clones from there.

---

## 1. The one rule that prevents merge disasters

**Only `apps/backend-core` touches the database.** Every other service
(vision, chatbot, maintenance, root-cause) is stateless — it either makes
up its own data or calls backend-core's API over HTTP. Nobody but Anuj
edits `apps/backend-core/app/db/models.py`.

Why this matters: if 3 people could independently add database tables/
columns, you'd get schema conflicts and broken migrations constantly.
With one owner, the "shared" surface area shrinks to a handful of
documented endpoints — see `docs/api-contracts.md`.

## 2. Repo structure

```
FactoryGpt/
├── apps/
│   ├── frontend/                    Abhi
│   └── backend-core/                Anuj  (the only DB)
├── services/
│   ├── vision-inspection/           Krrish
│   ├── chatbot-assistant/           Gauri
│   ├── predictive-maintenance/      Neerav
│   └── root-cause-analysis/         Vedant
├── docs/api-contracts.md            shared data contract — READ FIRST
├── docker-compose.yml               boots all 6 services + postgres together
└── README.md
```

Everyone works almost entirely inside their own folder. The only
cross-folder dependency is: everyone else's service calls backend-core's
API, and the frontend calls backend-core's API. Nobody calls anyone else's
service directly except through that one funnel — see the diagram in
`docs/api-contracts.md`.

## 3. Git workflow (how merging actually stays clean)

1. `main` branch = always demo-able, protected.
2. `develop` branch = daily integration branch — everyone merges here first.
3. Branch naming: `feature/<name>-<short-task>`, e.g.
   `feature/krrish-defect-model`, `feature/gauri-notify-webhook`.
4. Since each person's day-to-day work lives inside their own folder,
   most PRs won't even touch a file anyone else is editing — that alone
   prevents most conflicts.
5. Review rule:
   - Touching `apps/backend-core/app/db/` or `app/schemas.py` → **Anuj
     must review**, since it's the shared contract.
   - Touching only your own `services/<you>/` folder → any teammate can
     review, doesn't need to be Anuj.
6. Merge `develop` → `main` once a day, after confirming all 6 `/health`
   endpoints return `ok` via `docker-compose up`.
7. If you need a field/endpoint that doesn't exist yet, **edit
   `docs/api-contracts.md` first** and ping the owner, rather than
   guessing a shape and hoping it matches later.
8. `.github/CODEOWNERS` is included so GitHub auto-requests the right
   reviewer on a PR — **swap the placeholder `@anuj` / `@krrish` etc. for
   your real GitHub usernames** once everyone's account is added to the repo.

## 4. Installation — everyone does this on Day 1

```bash
git clone <repo-url>
cd factorygpt

cp apps/backend-core/.env.example apps/backend-core/.env
cp services/vision-inspection/.env.example services/vision-inspection/.env
cp services/chatbot-assistant/.env.example services/chatbot-assistant/.env
cp services/predictive-maintenance/.env.example services/predictive-maintenance/.env
cp services/root-cause-analysis/.env.example services/root-cause-analysis/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

docker-compose up --build
```
Then confirm every service answers:
```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
```
Frontend at `http://localhost:3000`. Full API contract, request/response
shapes, and the who-calls-whom diagram: `docs/api-contracts.md`.

You don't need Docker for your day-to-day work — each service below has
its own standalone install/run command so you can develop against just
your own folder.

---

## 5. Per-person breakdown

### Krrish Goswami — AI, Computer Vision, Automation
**Folder:** `services/vision-inspection/`
**Module(s):** AI Vision Inspection (core) + Safety AI (stretch)

**Files you own:**
```
services/vision-inspection/
├── app/model/inference.py    detection logic — ships in "dummy mode"
│                              (random plausible detections) until real
│                              weights exist, so nobody's blocked on you
├── app/model/train.py        YOLO fine-tuning script skeleton
├── app/model/weights/        trained best.pt goes here (gitignored)
├── app/api/routes.py         POST /inspect — auto-fires the workflow
│                              chain on a confident detection
├── app/utils/video_feed.py   loops sample_images/ to fake a live camera
├── app/schemas.py            Defect / InspectionResult (must match
│                              docs/api-contracts.md)
├── data/sample_images/       your curated demo images go here
├── requirements.txt, Dockerfile
```

**Why these are yours:** you're the only one who needs to train a model,
so isolating it means you can experiment freely without anyone else
needing to understand your model internals — they only ever see your
`/inspect` API shape.

**Task order:**
1. Days 1-2: run the service in dummy mode, confirm `/inspect` responds.
2. Days 2-3: pick a public defect dataset (casting, PCB, or surface-defect
   sets are all well-documented options) and convert to YOLO format.
3. Days 4-7: fine-tune with `app/model/train.py`, iterate until detection
   is demo-convincing.
4. Day 7: drop `best.pt` into `app/model/weights/` — this switches the
   service out of dummy mode automatically, no code change needed.
5. Day 8: curate 15-20 `data/sample_images/` that show clear, convincing
   detections.
6. Days 9-10 (stretch): reuse the same pipeline for a PPE/helmet detector
   (Safety AI).

**Install:**
```bash
cd services/vision-inspection
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```
**Starter code (already in the zip, `app/model/inference.py`):**
```python
def run_inference(image_bytes: bytes):
    """Returns a list of dicts: defect_type, confidence, bbox."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    if DUMMY_MODE:
        # placeholder so teammates aren't blocked on training
        if random.random() < 0.3:
            return []
        return [{"defect_type": random.choice(DEFECT_CLASSES),
                 "confidence": round(random.uniform(0.55, 0.97), 2),
                 "bbox": [width*0.2, height*0.2, width*0.5, height*0.5]}]
    model = _load_model()
    results = model.predict(image, verbose=False)[0]
    # ... converts YOLO output to the same shape once weights exist
```
Full file is in `services/vision-inspection/app/model/inference.py`.

---

### Gauri — AI Chatbot, AI Automation
**Folder:** `services/chatbot-assistant/`
**Module(s):** AI Factory Assistant (chatbot) + notification automation

**Files you own:**
```
services/chatbot-assistant/
├── app/llm/client.py         function-calling loop against the LLM
├── app/llm/functions.py      4 tools: recent defects, downtime log,
│                              production summary, report — each is just
│                              an HTTP call to another service
├── app/prompts/system_prompt.py   bounded system prompt (deliberately
│                              scoped — open-ended chat is a demo risk)
├── app/api/routes.py         POST /chat, POST /notify
├── app/schemas.py
├── requirements.txt, Dockerfile
```

**Why these are yours:** the chatbot only ever knows other services' HTTP
APIs, never their internals — so you can rewrite prompts/tools all week
without breaking (or being broken by) anyone else's code.

**Task order:**
1. Days 1-2: get a real API key working, confirm `/chat` answers a
   simple message.
2. Days 3-5: test all 4 tool calls against Anuj's live endpoints once
   backend-core is up.
3. Days 6-7: verify Hindi replies actually work when asked in Hindi.
4. Days 8-9: wire `/notify` to a real Slack/Teams webhook so the
   automation chain visibly fires in the demo.
5. Day 10 (stretch): auto report generation — mostly reuses `get_report`.

**Install:**
```bash
cd services/chatbot-assistant
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your real ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8002
```
**Starter code (`app/api/routes.py`):**
```python
@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    reply = ask_assistant(payload.message, payload.language)
    return {"reply": reply}

@router.post("/notify")
def notify(payload: NotifyRequest):
    """Called by backend-core's workflow chain — stands in for the spec's
    WhatsApp Business API alert."""
    message = f":rotating_light: Ticket #{payload.ticket_id}: {payload.description}"
    if NOTIFY_WEBHOOK_URL:
        httpx.post(NOTIFY_WEBHOOK_URL, json={"text": message}, timeout=3.0)
    return {"status": "sent"}
```
Full function-calling loop is in `services/chatbot-assistant/app/llm/client.py`.

---

### Anuj — Backend, AI
**Folder:** `apps/backend-core/`
**Module(s):** Production Monitoring + Workflow Automation + the shared DB

**Files you own:**
```
apps/backend-core/
├── app/db/models.py          4 tables: ProductionEvent, DowntimeEvent,
│                              DefectRecord, Ticket — THE shared contract
├── app/db/database.py        SQLAlchemy engine/session
├── app/schemas.py            Pydantic response models
├── app/api/production.py     GET /production/live, /production/downtime
├── app/api/workflow.py       POST /workflow/defect-event — the automation
│                              chain: log → ticket → notify → mock ERP
├── app/api/integrations.py   frontend's ONLY window into the other 4
│                              services (each call wrapped so a dead
│                              service never 500s the dashboard)
├── app/services/data_generator.py   fakes a live production line
├── app/main.py
├── requirements.txt, Dockerfile
```

**Why these are yours:** every other module reads from or writes to this
service. It has to be built and its contract frozen (Day 2) before
everyone else can build against it with confidence.

**Task order:**
1. Day 1: get it running, confirm `/health` + tables get created.
2. Days 1-2: review `docs/api-contracts.md` with the team, adjust fields
   if needed, then **freeze it**.
3. Days 3-5: add `GET /production/summary` (OEE-style: actual vs target %,
   per shift).
4. Days 6-9: extend `integrations.py` as everyone else's `/health`
   endpoints come online.
5. Days 10-11: harden `workflow.py` so a dead downstream service never
   breaks the chain.
6. Ongoing: required reviewer for any PR touching `app/db/` or `schemas.py`.

**Install:**
```bash
cd apps/backend-core
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
**Starter code (`app/api/integrations.py`):**
```python
def _safe_get(url: str):
    try:
        r = httpx.get(url, timeout=3.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return None   # a dead service shows as offline, never crashes the dashboard

@router.get("/overview")
def overview():
    return {
        "vision": _safe_get(f"{VISION_URL}/health"),
        "maintenance": _safe_get(f"{MAINTENANCE_URL}/machine-health"),
        "root_cause": _safe_get(f"{ROOTCAUSE_URL}/root-cause"),
    }
```
Full DB models, schemas, and workflow chain are in `apps/backend-core/app/`.

---

### Neerav — AI, Backend
**Folder:** `services/predictive-maintenance/`
**Module(s):** Predictive Maintenance (simulated)

**Files you own:**
```
services/predictive-maintenance/
├── app/data/synthetic_sensors.py   fake vibration/temp/RPM per machine,
│                                    with a built-in degradation trend
├── app/model/health_score.py       0-100 health score + days-to-failure
├── app/api/routes.py               GET /machine-health(/{id}); auto-fires
│                                    an alert to backend-core on low health
├── app/schemas.py
├── requirements.txt, Dockerfile
```

**Why these are yours:** fully self-contained — you generate your own
data and never touch anyone's database. The only outward call is to
backend-core's `/workflow/defect-event` when health drops.

**Task order:**
1. Days 1-2: run standalone, confirm the degradation trend is visible
   over repeated calls (not just random noise).
2. Days 3-5: tune the degradation rate / penalty weights so 1-2 machines
   visibly become "at risk" by demo day.
3. Days 6-7: confirm with Anuj that a low-health alert actually creates a
   Ticket and fires Gauri's `/notify`.
4. Day 8 (stretch): swap thresholding for a small scikit-learn regression
   if you want a "real model" story.
5. Ongoing: sync with Anuj daily since you're both backend — his loop
   fakes production/downtime, yours fakes sensor health; keep them separate.

**Install:**
```bash
cd services/predictive-maintenance
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8003
```
**Starter code (`app/model/health_score.py`):**
```python
def compute_health(reading: dict) -> dict:
    vibration_penalty = max(0, (reading["vibration"] - VIBRATION_SAFE_MAX)) * 15
    temp_penalty = max(0, (reading["temperature"] - TEMP_SAFE_MAX)) * 2
    health_score = max(0, min(100, round(100 - vibration_penalty - temp_penalty)))
    # ... maps score bands to a rough days-to-failure estimate
    return {**reading, "health_score": health_score, "predicted_days_to_failure": days_to_failure}
```
Full synthetic data generator is in `services/predictive-maintenance/app/data/synthetic_sensors.py`.

---

### Vedant — DSA, Backend, Data Analysis
**Folder:** `services/root-cause-analysis/`
**Module(s):** Root Cause Analysis + Inventory Intelligence (stretch)

**Files you own:**
```
services/root-cause-analysis/
├── app/analytics/queries.py    pulls downtime logs from backend-core over
│                                HTTP, aggregates with pandas (never touches
│                                Postgres directly)
├── app/analytics/report.py     generate_report() — ONE shared function
│                                used by both your /report and Gauri's chatbot
├── app/api/routes.py           GET /root-cause, GET /report
├── app/inventory/routes.py     stretch-goal CRUD + reorder rule
├── app/schemas.py
├── requirements.txt, Dockerfile
```

**Why these are yours:** read-only against the rest of the system, so you
can rewrite your aggregation logic freely without any schema/migration
risk to Anuj's database.

**Task order:**
1. Days 1-2: run against Anuj's `/production/downtime` once it's live,
   confirm `/root-cause` returns something sensible.
2. Days 3-6: add shift/operator breakdowns — raise it early with Anuj if
   `operator_id` needs adding to his schema (that's a contract change).
3. Day 7-8: polish `generate_report()`'s wording — this is literally what
   the chatbot returns to "generate quality report."
4. Days 9-12 (stretch): flesh out Inventory Intelligence if ahead of schedule.
5. Ongoing: keep your aggregation scoped to production/downtime data;
   don't reach into Neerav's sensor logic.

**Install:**
```bash
cd services/root-cause-analysis
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8004
```
**Starter code (`app/analytics/queries.py`):**
```python
def root_cause_breakdown() -> dict:
    df = _fetch_downtime_df()   # pulled from backend-core, never from Postgres directly
    by_reason = (df.groupby("reason")
                   .agg(count=("reason", "size"),
                        total_downtime_seconds=("duration_seconds", "sum"))
                   .sort_values("total_downtime_seconds", ascending=False))
    worst_machine = df.groupby("machine_id")["duration_seconds"].sum().idxmax()
    worst_line = df.groupby("line_id")["duration_seconds"].sum().idxmax()
    return {"by_reason": by_reason.to_dict(orient="records"),
            "worst_machine": worst_machine, "worst_line": worst_line}
```
Full analytics + report code is in `services/root-cause-analysis/app/analytics/`.

---

### Abhi — Frontend
**Folder:** `apps/frontend/`
**Module(s):** Main Dashboard + every module's UI

**Files you own:**
```
apps/frontend/
├── src/lib/api.ts                    the ONLY file that calls the backend
├── src/components/ui/                Card, Table, AlertBanner — build
│                                      once, reuse everywhere (this is
│                                      what stops you being the bottleneck)
├── src/components/dashboard/DashboardOverview.tsx
├── src/components/production/ProductionTable.tsx
├── src/components/chatbot/ChatWidget.tsx
├── src/pages/                        dashboard (/), production, vision, chat
├── package.json, Dockerfile
```

**Why these are yours:** you're the only frontend person for 5 modules —
the component-library-first approach is what makes that possible in 15
days instead of you writing bespoke UI six times over.

**Task order:**
1. Days 1-2: run it, confirm the dashboard shows "offline" banners
   gracefully when backend-core isn't up yet (test this on purpose).
2. Days 3-5: confirm `ProductionTable` shows live rows once Anuj's
   endpoint is real.
3. Days 6-8: build the real Vision page once Krrish's `/inspect` + sample
   images exist — bounding-box overlays + a defect log table.
4. Days 8-10: alerts panel using `AlertBanner`, pulling from a tickets
   endpoint (coordinate with Anuj if it doesn't exist yet).
5. Days 10-12: add Predictive Maintenance + Root Cause `Card`s to the
   dashboard — quick, since the components already exist.
6. Days 13-14: polish pass — spacing, loading/empty states, resilience.

**Install:**
```bash
cd apps/frontend
npm install
cp .env.local.example .env.local
npm run dev
```
**Starter code (`src/lib/api.ts`):**
```ts
export const api = {
  getLiveProduction: () => request("/production/live"),
  getDowntime: () => request("/production/downtime"),
  getOverview: () => request("/integrations/overview"),
  sendChatMessage: (message: string, language = "en") =>
    request("/integrations/chat", { method: "POST", body: JSON.stringify({ message, language }) }),
};
```
Full components are in `apps/frontend/src/components/`.

---

## 6. Why the work is aligned this way

- Each person's module matches their strongest stated skill — nobody
  learns a new domain under deadline pressure.
- **Anuj's DB/API is the one shared foundation**, frozen early (Day 2) so
  nobody else builds on shifting ground.
- The three backend-leaning people (Anuj, Neerav, Vedant) each own a
  **distinct data problem** — production/workflow, sensor health,
  analytics — with no overlapping files.
- **Abhi is deliberately protected** with a components-first approach,
  since one frontend developer serving five modules is the single
  biggest timeline risk on this team.
- Every service is stateless except backend-core, so any one module can
  be late, broken, or missing on demo day and the rest of the system
  still runs — which is also literally what "modular, integration-first"
  means in your mentor's instructions.

## 7. Demo day narrative

Your story: you built the full detect → analyze → notify → act loop,
working end-to-end, across a real multi-service system — and the modules
you didn't fully build (Digital Twin, real ERP/IoT integration, full
security stack) are clearly scoped as next steps. That's a stronger demo
than five disconnected half-finished modules.
