"""
FastAPI entry point (spec §42). Kept intentionally small: two endpoints,
no persistence, no auth logic of its own — this service is meant to sit
behind the Node backend (backend/src/anomalyDetection/), which is the
thing actually exposed to the internet and responsible for authn/authz,
multi-tenancy, and audit logging. See ml-service/README.md.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.model import detector
from app.schemas import AnomalyResult, EventFeatures

app = FastAPI(title="ThreatLens Anomaly Detection Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnomalyResult)
def analyze(features: EventFeatures) -> AnomalyResult:
    return detector.score(features)
