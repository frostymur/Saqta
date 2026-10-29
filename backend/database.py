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
    column_defs = {
        "code": "VARCHAR(64)",
        "last_seen": "TIMESTAMP",
        "water_body_type": "VARCHAR(50) DEFAULT 'urban'",
        "catchment_area_km2": "DOUBLE PRECISION",
        "response_time_h": "DOUBLE PRECISION",
        "alert_radius_m": "INTEGER",
        "settlement": "VARCHAR(255)",
        "river_name": "VARCHAR(255)",
    }
    missing = [(name, ddl) for name, ddl in column_defs.items() if name not in columns]
    if not missing:
        return
    with engine.begin() as connection:
        for name, ddl in missing:
            connection.execute(text(f"ALTER TABLE stations ADD COLUMN {name} {ddl}"))
        if "code" not in columns:
            connection.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS ix_stations_code ON stations (code)")
            )
