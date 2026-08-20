from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1 import properties, chat, leads

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    properties.router,
    prefix=f"{settings.API_V1_STR}/properties",
    tags=["properties"]
)

app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_STR}/chat",
    tags=["chat"]
)

app.include_router(
    leads.router,
    prefix=f"{settings.API_V1_STR}/leads",
    tags=["leads"]
)

@app.get("/")
def root():
    return {"message": "CRE AI Pro API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}