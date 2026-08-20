# ThreatLens Anomaly Detection Service

Phase 8 of the ThreatLens build. A small, self-hosted Python/FastAPI service that scores
one entity's (user's) recent behavior for anomalies using scikit-learn's `IsolationForest` —
explainable, not a neural network (spec §42). It sits behind the Node backend
(`backend/src/anomalyDetection/`), which is the thing actually exposed to the internet and
responsible for authn/authz, multi-tenancy, rate limiting, and audit logging. This service has
no auth of its own and should never be reachable from outside the backend's network.

## Endpoints

- `GET /health` — liveness check, `{"status": "ok"}`
- `POST /analyze` — takes a `EventFeatures` JSON body (see below), returns an `AnomalyResult`

### Request

Seven numeric features, the exact set spec §42 names ("login time, geographic changes, request
frequency, resource access, file downloads, authentication failures, unusual endpoint access"):

```json
{
  "login_hour_deviation": 12.0,
  "new_geo_location": 1,
  "request_frequency": 3.2,
  "resource_access_count": 18,
  "file_download_count": 6,
  "auth_failure_count": 2,
  "unusual_endpoint_count": 1
}
```

Computing these FROM raw event history is the Node backend's job
(`anomalyDetection/featureExtraction.ts`) — this service only ever sees the finished numbers,
never raw event payloads. That keeps it a narrow, reusable scoring component instead of a
second copy of event-processing logic, and means it never needs to know what "an event" or
"an organization" is.

### Response

```json
{
  "is_anomaly": true,
  "anomaly_score": 87.3,
  "confidence": "high",
  "contributing_features": [
    {"feature": "auth_failure_count", "z_score": 3.1, "direction": "higher_than_typical"},
    {"feature": "new_geo_location", "z_score": 2.4, "direction": "higher_than_typical"},
    {"feature": "login_hour_deviation", "z_score": 1.8, "direction": "higher_than_typical"}
  ],
  "model_version": "isolation-forest-synthetic-baseline-v1"
}
```

## How scoring works (`app/model.py`)

1. **Isolation Forest**, fit once at process startup (spec §42: "do not start with an
   unnecessarily complex neural network" — this is the explainable baseline it names
   explicitly).
2. **`anomaly_score` (0-100)** is `IsolationForest.decision_function`'s raw output, rescaled
   deterministically against the training data's own observed range — never an arbitrary
   constant, never adjusted after the fact.
3. **`confidence`** is a deterministic function of how far the decision value sits from zero
   relative to that same training range — not a second model guessing at the first one's
   reliability.
4. **`contributing_features`** — IsolationForest has no built-in per-sample feature
   attribution, so this is a separate, transparent statistical computation: each input
   feature's z-score against the training baseline's mean/std, ranked by magnitude, top 3
   returned with a plain-language direction. This is the "features contributing to anomaly"
   spec §42 asks for.

Every one of these is a plain arithmetic/statistical operation on `IsolationForest`'s own
output — nothing here is an LLM, and nothing here explains a score after the fact the way
Phase 6's AI layer explains an incident; the number and its explanation are produced by the
same deterministic path.

## The training baseline — an honest placeholder

There's no real historical org telemetry to train on yet (this is the first phase to produce
`SecurityEvent` data at all). The model is fit against a **synthetic baseline** — 800 samples
drawn from distributions chosen to resemble ordinary behavior (routine login hours, rare new
locations, moderate steady activity, rare auth failures) — generated with a fixed random seed
so every score this service produces is exactly reproducible. This is a deliberate,
documented stand-in for a real training pipeline over actual org data, which is future work
(see "Not yet built" below) — it lets the scoring *mechanism* be built and tested for real now
without pretending a training pipeline exists before one does.

## Development

```bash
python -m venv .venv
source .venv/Scripts/activate   # .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest
```

Node's `ML_SERVICE_URL=http://localhost:8000` (see `backend/.env.example`) points the backend
at this service; leaving it unset disables anomaly detection with a clean `503`, the same
"never fabricate, just say so" posture as Phase 6/7's providers.

## Testing

- `tests/test_model.py` (9 tests) — `AnomalyDetector` scored against a clearly-typical and a
  clearly-extreme feature vector: typical behavior scores low and isn't flagged, extreme
  behavior scores high and is flagged, scores are deterministic across instances/calls
  (same fixed seed), the top contributing feature is the one constructed to be most extreme,
  every contribution reports a direction, confidence is always one of the three documented
  levels, and the score always stays within 0-100.
- `tests/test_api.py` (5 tests) — the FastAPI app via `TestClient`: `/health` returns ok,
  `/analyze` returns a full result for valid input, and malformed/out-of-range input is
  rejected with `422` (Pydantic validation, not a 500).

**Verified for real.** After three earlier failed attempts (`pip install` kept failing against
severely throttled network access — the same class of limitation `backend/README.md`'s Phase 5
section describes for MongoDB), a later attempt succeeded and the full suite actually ran:

```
14 passed, 1 warning in 36.23s
```

A live, end-to-end round trip was also verified, for the first time: the real FastAPI service
running (`uvicorn app.main:app`), the real Node backend pointed at it via `ML_SERVICE_URL`,
and a real authenticated `POST /security-events/analyze/:userId` request flowing through
deterministic feature extraction → a real HTTP call → real `IsolationForest` scoring → back
through the full stack. It correctly flagged the seeded suspicious-activity cluster (off-hours
login, new location, failed auth attempts) with `anomalyScore: 91.1`, `confidence: "high"`, and
`login_hour_deviation` correctly ranked as the top contributing feature.

If `pip install -r requirements.txt` ever fails for you the same way it did here initially, the
large `scipy`/`numpy` wheels are the likely culprit on a slow connection — simply re-running
`pip install -r requirements.txt` picks up from pip's own cache rather than re-downloading
every package from zero, which is what eventually got this environment past it.

## Not yet built

- A real training pipeline over actual org `SecurityEvent` history, replacing the synthetic
  baseline described above — needs enough real data to exist first
- Per-organization models (today's baseline is global, not tenant-specific)
- Model retraining/versioning strategy, and `model_version` currently a fixed string
