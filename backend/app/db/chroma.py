import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)

from typing import Optional, Any
class ChromaDatabase:
    client: Optional[Any] = None

chroma_db = ChromaDatabase()

def connect_to_chroma():
    try:
        logger.info("Connecting to ChromaDB...")
        chroma_db.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(allow_reset=True)
        )
        # Simple health check
        chroma_db.client.heartbeat()
        
        # Ensure institutional_memory collection exists
        chroma_db.client.get_or_create_collection(name="institutional_memory")
        
        logger.info("Successfully connected to ChromaDB.")
    except Exception as e:
        logger.error(f"Could not connect to ChromaDB: {e}")
        # Not raising to allow app startup

def close_chroma_connection():
    # ChromaDB HTTP client doesn't need explicit teardown like a persistent TCP connection
    pass

def get_chroma_client():
    return chroma_db.client
    
def get_memory_collection():
    if chroma_db.client is None:
        return None
    return chroma_db.client.get_or_create_collection(name="institutional_memory")
