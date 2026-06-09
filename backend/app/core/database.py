from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger("uvicorn.error")

db_url = settings.DATABASE_URL
connect_args = {}

if settings.USE_SQLITE_FALLBACK:
    try:
        # Attempt to test postgresql connection
        temp_engine = create_engine(db_url, connect_timeout=3)
        with temp_engine.connect() as conn:
            pass
        logger.info("Successfully connected to PostgreSQL database.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed. Falling back to SQLite. Error: {e}")
        db_url = settings.SQLITE_DATABASE_URL
        connect_args = {"check_same_thread": False}
else:
    logger.info("Using PostgreSQL database (no fallback).")

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
