"""
Owner: Anuj
Entrypoint. Everyone else's service can be developed and demoed
independently, but THIS is what the frontend and the rest of the team
depend on being up.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.api import production, workflow, integrations
from app.services.data_generator import start_background_generator

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FactoryGPT Backend Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(production.router)
app.include_router(workflow.router)
app.include_router(integrations.router)


@app.on_event("startup")
def on_startup():
    start_background_generator(interval_seconds=5)


@app.get("/health")
def health():
    return {"status": "ok", "service": "backend-core"}
