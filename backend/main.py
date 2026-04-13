"""
DataWise Backend — FastAPI
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import questionnaire, analysis, assumptions, upload

app = FastAPI(
    title="DataWise API",
    description="Scientifically-validated data analysis pipeline",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for beta — lock down for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questionnaire.router, prefix="/api/questionnaire", tags=["Questionnaire"])
app.include_router(upload.router,        prefix="/api/upload",        tags=["Upload"])
app.include_router(assumptions.router,   prefix="/api/assumptions",   tags=["Assumptions"])
app.include_router(analysis.router,      prefix="/api/analysis",      tags=["Analysis"])


@app.get("/")
def root():
    return {"status": "ok", "app": "DataWise API v0.1.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
