"""
Request/response contracts for the anomaly-detection service (spec §42).

FEATURE_NAMES is the single source of truth for feature order — both
EventFeatures and the trained model (model.py) key off it, so adding a
feature means changing exactly one place.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

FEATURE_NAMES: list[str] = [
    "login_hour_deviation",
    "new_geo_location",
    "request_frequency",
    "resource_access_count",
    "file_download_count",
    "auth_failure_count",
    "unusual_endpoint_count",
]


class EventFeatures(BaseModel):
    """
    One entity's (user's) behavior over an observation window, already
    reduced to the fixed feature set spec §42 names explicitly. Computing
    these FROM raw security events is the Node backend's job
    (anomalyDetection/anomaly.service.ts) — this service only ever sees
    numbers, never raw event payloads, which keeps it a narrow, reusable
    scoring component rather than a second copy of event-processing logic.
    """

    login_hour_deviation: float = Field(
        ge=0, le=24, description="Hours between this login and the entity's typical login hour."
    )
    new_geo_location: float = Field(ge=0, le=1, description="1 if this session is from a location not seen before, else 0.")
    request_frequency: float = Field(ge=0, description="Requests per minute during the observation window.")
    resource_access_count: float = Field(ge=0, description="Distinct resources accessed during the window.")
    file_download_count: float = Field(ge=0, description="File downloads during the window.")
    auth_failure_count: float = Field(ge=0, description="Failed authentication attempts during the window.")
    unusual_endpoint_count: float = Field(ge=0, description="Accesses to endpoints outside the entity's typical set.")

    def as_vector(self) -> list[float]:
        return [getattr(self, name) for name in FEATURE_NAMES]


class FeatureContribution(BaseModel):
    feature: str
    # Standard deviations from the training baseline's mean for this
    # feature — the explainability method spec §42 asks for ("features
    # contributing to anomaly"), computed deterministically, not by a
    # second model explaining the first.
    z_score: float
    direction: str  # "higher_than_typical" | "lower_than_typical"


class AnomalyResult(BaseModel):
    is_anomaly: bool
    # 0-100, higher = more anomalous. Derived from IsolationForest's own
    # decision_function against the fitted baseline (model.py) — never
    # invented, never adjusted by an LLM.
    anomaly_score: float
    confidence: str  # "low" | "medium" | "high"
    contributing_features: list[FeatureContribution]
    model_version: str
