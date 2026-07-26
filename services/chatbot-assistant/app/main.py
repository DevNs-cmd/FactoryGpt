"""Owner: Gauri."""
from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="FactoryGPT Chatbot Assistant")
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "chatbot-assistant"}
