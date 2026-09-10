import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db
from app.db.chroma import connect_to_chroma, close_chroma_connection, chroma_db

from app.db.indexes import setup_indexes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up CampusOS API...")
    await connect_to_mongo()
    await setup_indexes()
    connect_to_chroma()
    yield
    # Shutdown
    logger.info("Shutting down CampusOS API...")
    await close_mongo_connection()
    close_chroma_connection()

from app.api.v1.auth import router as auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

# CORS config for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    mongo_status = "ok" if db.client else "disconnected"
    chroma_status = "ok" if chroma_db.client else "disconnected"
    
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "dependencies": {
            "mongodb": mongo_status,
            "chromadb": chroma_status
        }
    }
