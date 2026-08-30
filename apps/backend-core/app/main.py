"""
Owner: Anuj
Entrypoint for FactoryGPT Backend Core with Auth & Multi-Tenant Support.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine, SessionLocal
from app.api import auth, production, workflow, integrations
from app.services.data_generator import start_background_generator

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FactoryGPT Backend Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(production.router)
app.include_router(workflow.router)
app.include_router(integrations.router)


def auto_migrate_db():
    """Ensures newly added columns exist in existing SQLite databases."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            if "sqlite" in str(engine.url):
                res = conn.execute(text("PRAGMA table_info(users)"))
                cols = [r[1] for r in res.fetchall()]
                if cols and "is_approved" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 1"))
                    conn.commit()
    except Exception as e:
        print(f"[auto_migrate] Warning: {e}")


@app.on_event("startup")
def on_startup():
    auto_migrate_db()
    # Ensure default factory and seed data exists if fresh database
    from app.db.seed_data import ensure_default_factory_seeded
    db = SessionLocal()
    try:
        ensure_default_factory_seeded(db)
    except Exception as e:
        print(f"[startup] Warning initializing default factory: {e}")
    finally:
        db.close()

    # Note: Automated background ticking is disabled so custom factories start cleanly at 0.


@app.get("/health")
def health():
    return {"status": "ok", "service": "backend-core"}
