# FactoryGPT — 15-Day Team Build

One repo, six people, one integration-first build. Start here, then read
**TEAM_GUIDE.md** for the full per-person breakdown, and
**docs/api-contracts.md** for the exact data shapes everyone must respect.

## Team
| Person | Owns |
|---|---|
| Krrish Goswami | `services/vision-inspection/` |
| Gauri | `services/chatbot-assistant/` |
| Anuj | `apps/backend-core/` |
| Neerav | `services/predictive-maintenance/` |
| Vedant | `services/root-cause-analysis/` |
| Abhi | `apps/frontend/` |

## Golden rule
**Only `apps/backend-core` touches the database.** Every other service is
stateless — it generates its own data or calls backend-core's API. This one
rule is what keeps 6 people from producing merge conflicts on the same
schema/migration files.

## Quickstart (everyone, Day 1)
```bash
git clone <your-repo-url>
cd factorygpt

# each service needs its own .env — copy the example in every folder:
cp apps/backend-core/.env.example apps/backend-core/.env
cp services/vision-inspection/.env.example services/vision-inspection/.env
cp services/chatbot-assistant/.env.example services/chatbot-assistant/.env
cp services/predictive-maintenance/.env.example services/predictive-maintenance/.env
cp services/root-cause-analysis/.env.example services/root-cause-analysis/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
# then fill in any real API keys (Gauri needs ANTHROPIC_API_KEY, notify webhook, etc.)

docker-compose up --build
```
Then check every service is alive:
```bash
curl http://localhost:8000/health   # backend-core
curl http://localhost:8001/health   # vision-inspection
curl http://localhost:8002/health   # chatbot-assistant
curl http://localhost:8003/health   # predictive-maintenance
curl http://localhost:8004/health   # root-cause-analysis
```
Frontend: http://localhost:3000

## Working solo on your own service
You don't need Docker or the other 5 services running to build your own
piece — each service folder's own README has a `pip install`/`npm install` +
run command that works standalone. Docker Compose is for daily integration
testing, not your everyday dev loop.

## Repo layout
```
factorygpt/
├── apps/
│   ├── frontend/              Abhi   — Next.js dashboard
│   └── backend-core/          Anuj   — the only service with a database
├── services/
│   ├── vision-inspection/     Krrish — defect detection model + API
│   ├── chatbot-assistant/     Gauri  — LLM assistant + automation triggers
│   ├── predictive-maintenance/Neerav — synthetic sensor data + health model
│   └── root-cause-analysis/   Vedant — downtime analytics + reports
├── docs/api-contracts.md      the shared contract — read before you code
├── docker-compose.yml         boots everything together
└── TEAM_GUIDE.md              full task breakdown, per person
```
