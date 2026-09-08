"""Lightweight runtime schema sync for SQLite.

`Base.metadata.create_all()` only creates missing TABLES - it never adds
missing COLUMNS to existing ones, which crashes after model changes. This
module adds any missing columns via ALTER TABLE at startup.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# column -> DDL fragment (SQLite types only)
EXPECTED_COLUMNS: dict[str, dict[str, str]] = {
    "properties": {
        "updated_at": "DATETIME",
        "is_active": "BOOLEAN DEFAULT 1",
    },
    "leads": {
        "is_active": "BOOLEAN DEFAULT 1",
        "updated_at": "DATETIME",
        "conversation_id": "VARCHAR(100)",
    },
}


def ensure_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in EXPECTED_COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for column, ddl in columns.items():
                if column not in existing:
                    logger.info("Schema sync: adding %s.%s", table, column)
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
