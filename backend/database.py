from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

# Handle SQLite vs PostgreSQL check_same_thread
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Tiny additive migrations for deployments that already have the DB."""
    inspector = inspect(engine)
    if "stations" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("stations")}
    if "code" in columns:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE stations ADD COLUMN code VARCHAR(64)"))
        connection.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_stations_code ON stations (code)")
        )
