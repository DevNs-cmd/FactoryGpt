"""Owner: Neerav."""
from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="FactoryGPT Predictive Maintenance")
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "predictive-maintenance"}
