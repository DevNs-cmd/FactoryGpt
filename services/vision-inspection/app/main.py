"""Owner: Krrish."""
from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="FactoryGPT Vision Inspection")
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "vision-inspection"}
