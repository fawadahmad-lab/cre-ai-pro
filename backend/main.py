import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import bookings, chat, conversations, leads, properties, stats
from app.core.config import settings
from app.db.base import Base
from app.db.ensure_schema import ensure_schema
from app.db.session import engine

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)
ensure_schema(engine)

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router, prefix=f"{settings.API_V1_STR}/properties", tags=["properties"])
app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["leads"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(conversations.router, prefix=f"{settings.API_V1_STR}/conversations", tags=["conversations"])
app.include_router(bookings.router, prefix=f"{settings.API_V1_STR}/bookings", tags=["bookings"])
app.include_router(stats.router, prefix=f"{settings.API_V1_STR}/stats", tags=["stats"])


@app.get("/")
def root():
    return {"message": "CRE AI Pro API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
