"""Owner: Vedant."""
from fastapi import FastAPI
from app.api.routes import router
from app.inventory.routes import router as inventory_router

app = FastAPI(title="FactoryGPT Root Cause Analysis")
app.include_router(router)
app.include_router(inventory_router)  # remove this line if inventory stretch goal is dropped


@app.get("/health")
def health():
    return {"status": "ok", "service": "root-cause-analysis"}
