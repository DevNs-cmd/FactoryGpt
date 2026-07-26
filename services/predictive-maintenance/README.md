# predictive-maintenance — owner: Neerav (AI, Backend)

## Why this folder is yours
This is fully self-contained — no real sensors exist, so you generate your
own synthetic data and your own health model inside this folder. You only
ever reach outside it to call `backend-core`'s `/workflow/defect-event`
when a machine's health drops — you never touch its database.

## What's already scaffolded for you
- `app/data/synthetic_sensors.py` — fake vibration/temperature/RPM readings
  per machine, with a slow built-in degradation trend so some machines
  visibly get worse over the demo period
- `app/model/health_score.py` — turns readings into a 0-100 health score +
  a rough days-to-failure estimate (simple thresholding, not deep ML — that's fine here)
- `app/api/routes.py` — `GET /machine-health`, `GET /machine-health/{id}`;
  auto-fires an alert to backend-core once per machine when health drops
  below the threshold

## Your actual to-do list
1. **Day 1-2**: Get this running standalone, hit `/machine-health` a few times, confirm the degradation trend is visible (health scores trending down slowly, not randomly jumping).
2. **Day 3-5**: Tune `_degradation_rate` and the penalty weights in `health_score.py` so at least 1-2 machines visibly cross into "at risk" territory by demo day — a demo where nothing ever degrades isn't convincing.
3. **Day 6-7**: Once `backend-core` is live, confirm the alert actually creates a Ticket and Gauri's `/notify` fires — test this together with Anuj.
4. **Day 8 (stretch)**: Swap the threshold logic for a small `scikit-learn` regression trained on the synthetic history, if you want a "real model" story for the demo write-up — not required, thresholding is a legitimate MVP.
5. **Ongoing**: Since you and Anuj are both backend, check in daily so you're not duplicating data-generation logic — his loop fakes production/downtime, yours fakes sensor health; keep them separate.

## Installation
```bash
cd services/predictive-maintenance
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8003
```
Test it:
```bash
curl http://localhost:8003/machine-health
```
