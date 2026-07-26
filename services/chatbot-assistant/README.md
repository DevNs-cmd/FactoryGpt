# chatbot-assistant — owner: Gauri (AI Chatbot, AI Automation)

## Why this folder is yours
The chatbot needs to call other services (backend-core, root-cause-analysis)
but never touches their internals — it only knows their HTTP APIs. That
isolation is what lets you iterate on prompts/tools all week without
breaking anyone else's code, and vice versa.

## What's already scaffolded for you
- `app/llm/client.py` — the function-calling loop (Claude by default, swap
  provider/model in one place if needed)
- `app/llm/functions.py` — 4 tools: recent defects, downtime log, production
  summary, report — each just an HTTP call to another service
- `app/prompts/system_prompt.py` — a deliberately **bounded** system prompt
  (open-ended chat is a demo risk; scoped Q&A is not)
- `app/api/routes.py` — `POST /chat` and `POST /notify`
  (`/notify` is what Anuj's workflow chain calls when a defect/alert fires —
  this is your "automation" half)

## Your actual to-do list
1. **Day 1-2**: Get a real API key set up, confirm `/chat` responds to a simple message with no tool calls needed.
2. **Day 3-5**: Test each of the 4 supported question types end-to-end against Anuj's live endpoints once `backend-core` is running (`get_recent_defects`, `get_downtime_log`, `get_production_summary`, `get_report`).
3. **Day 6-7**: Add Hindi support — test that the model replies in Hindi when asked in Hindi (the system prompt already tells it to; verify it actually does).
4. **Day 8-9**: Wire `/notify` to a real Slack/Discord/Teams webhook (2-minute setup on their side) so the automation chain visibly fires during the demo.
5. **Day 10 (stretch)**: Auto report generation — this mostly reuses `get_report`; just make sure the phrasing sounds like a written report, not a data dump.
6. **Ongoing**: If you need a new question type, add both a function in `functions.py` AND its entry in `TOOLS` — the model can only call what's declared there.

## Installation
```bash
cd services/chatbot-assistant
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your real ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8002
```
Test it:
```bash
curl -X POST http://localhost:8002/chat -H "Content-Type: application/json" \
  -d '{"message": "Show today'"'"'s rejected products", "language": "en"}'
```
