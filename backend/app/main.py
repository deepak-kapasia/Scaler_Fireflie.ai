import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database.connection import engine, Base
from app.api.routes import router

# Import models so SQLAlchemy registers them
import app.models.models  # noqa

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fireflies Clone API",
    description="Meeting notes and transcription platform API",
    version="1.0.0",
)

cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [o.strip() for o in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "service": "fireflies-clone-api"}
