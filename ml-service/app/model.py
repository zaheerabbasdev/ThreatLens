"""
Explainable anomaly detection (spec §42): Isolation Forest, deliberately not
a neural network — every number this module produces is traceable back to a
concrete statistical computation, never a black box.

There is no real historical org telemetry to train on yet (Phase 8 is the
first thing to produce SecurityEvent data at all), so the model is fit once,
at process startup, against a synthetic baseline of what "typical" behavior
looks like for the seven features spec §42 names. This is an intentional,
documented placeholder for a real training pipeline (see README's "Not yet
built" section) — it lets the anomaly-detection *mechanism* (scoring,
explainability, the API contract) be built and tested for real now, without
pretending a training pipeline exists before it does.
"""

from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest

from app.schemas import FEATURE_NAMES, AnomalyResult, EventFeatures, FeatureContribution

MODEL_VERSION = "isolation-forest-synthetic-baseline-v1"

# Fixed seed: the baseline, the fitted model, and therefore every score this
# service produces are exactly reproducible run to run — required for the
# scoring logic to be meaningfully unit-testable at all.
_RNG_SEED = 42
_BASELINE_SAMPLE_COUNT = 800


def _generate_synthetic_baseline(rng: np.random.Generator) -> np.ndarray:
    """
    Each column matches FEATURE_NAMES's order. Distributions are chosen to
    resemble ordinary analyst/user behavior: logins close to a routine hour,
    rare new-location logins, moderate steady request/resource activity, and
    auth failures/unusual-endpoint hits that are individually rare events
    (Poisson) rather than routine ones.
    """
    n = _BASELINE_SAMPLE_COUNT
    login_hour_deviation = np.clip(np.abs(rng.normal(0, 1.5, n)), 0, 24)
    new_geo_location = rng.binomial(1, 0.03, n).astype(float)
    request_frequency = np.clip(rng.normal(8, 3, n), 0, None)
    resource_access_count = np.clip(rng.normal(5, 2, n), 0, None)
    file_download_count = np.clip(rng.normal(1, 1, n), 0, None)
    auth_failure_count = rng.poisson(0.1, n).astype(float)
    unusual_endpoint_count = rng.poisson(0.2, n).astype(float)

    return np.column_stack(
        [
            login_hour_deviation,
            new_geo_location,
            request_frequency,
            resource_access_count,
            file_download_count,
            auth_failure_count,
            unusual_endpoint_count,
        ]
    )


class AnomalyDetector:
    """Fit once (at import/startup), score many times — IsolationForest.fit is not cheap enough to redo per request, and doesn't need to be: the baseline doesn't change within a process lifetime."""

    def __init__(self) -> None:
        rng = np.random.default_rng(_RNG_SEED)
        baseline = _generate_synthetic_baseline(rng)

        self._mean = baseline.mean(axis=0)
        self._std = baseline.std(axis=0)
        # Guard against a zero-variance column making z-scores explode/NaN —
        # none of the current synthetic features are constant, but a future
        # real-data baseline might have one.
        self._std[self._std == 0] = 1.0

        self._model = IsolationForest(n_estimators=200, contamination=0.05, random_state=_RNG_SEED)
        self._model.fit(baseline)

        # decision_function's own range on the training data — used to
        # rescale an arbitrary decision value onto a stable, deterministic
        # 0-100 "anomaly score" (spec §42) instead of an unbounded raw score.
        baseline_decisions = self._model.decision_function(baseline)
        self._decision_scale = float(np.max(np.abs(baseline_decisions))) or 1.0

    def score(self, features: EventFeatures) -> AnomalyResult:
        vector = np.array([features.as_vector()])

        # sklearn's convention: positive decision = inlier, negative = outlier.
        decision = float(self._model.decision_function(vector)[0])
        is_anomaly = bool(self._model.predict(vector)[0] == -1)

        # Map decision (unbounded, centered near 0) onto 0-100 where 100 is
        # maximally anomalous, clipped to the training data's own observed
        # range rather than an arbitrary constant.
        normalized = -decision / self._decision_scale  # ~[-1, 1], higher = more anomalous
        anomaly_score = round(float(np.clip(50 + 50 * normalized, 0, 100)), 1)

        magnitude = abs(normalized)
        confidence = "high" if magnitude > 0.66 else "medium" if magnitude > 0.33 else "low"

        contributing = self._contributing_features(vector[0])

        return AnomalyResult(
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            confidence=confidence,
            contributing_features=contributing,
            model_version=MODEL_VERSION,
        )

    def _contributing_features(self, vector: np.ndarray, top_n: int = 3) -> list[FeatureContribution]:
        """
        Per-feature z-score against the training baseline — the deterministic
        explainability method spec §42 asks for ("features contributing to
        anomaly"). IsolationForest has no built-in per-sample feature
        attribution, so this is a separate, transparent statistical
        computation, not an approximation the model itself produced.
        """
        z_scores = (vector - self._mean) / self._std
        ranked = sorted(zip(FEATURE_NAMES, z_scores), key=lambda pair: abs(pair[1]), reverse=True)
        return [
            FeatureContribution(
                feature=name,
                z_score=round(float(z), 2),
                direction="higher_than_typical" if z >= 0 else "lower_than_typical",
            )
            for name, z in ranked[:top_n]
        ]


# One instance per process — see the class docstring for why fitting is a
# startup cost, not a per-request one.
detector = AnomalyDetector()
