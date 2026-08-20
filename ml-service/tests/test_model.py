from app.model import AnomalyDetector
from app.schemas import EventFeatures

TYPICAL = EventFeatures(
    login_hour_deviation=0.5,
    new_geo_location=0,
    request_frequency=8,
    resource_access_count=5,
    file_download_count=1,
    auth_failure_count=0,
    unusual_endpoint_count=0,
)

EXTREME = EventFeatures(
    login_hour_deviation=14,
    new_geo_location=1,
    request_frequency=90,
    resource_access_count=40,
    file_download_count=25,
    auth_failure_count=12,
    unusual_endpoint_count=9,
)


def test_typical_behavior_scores_low_and_is_not_flagged():
    result = AnomalyDetector().score(TYPICAL)
    assert result.is_anomaly is False
    assert result.anomaly_score < 50


def test_extreme_behavior_scores_high_and_is_flagged():
    result = AnomalyDetector().score(EXTREME)
    assert result.is_anomaly is True
    assert result.anomaly_score > 50


def test_extreme_scores_strictly_higher_than_typical():
    typical_score = AnomalyDetector().score(TYPICAL).anomaly_score
    extreme_score = AnomalyDetector().score(EXTREME).anomaly_score
    assert extreme_score > typical_score


def test_score_is_deterministic_across_instances_and_calls():
    a = AnomalyDetector().score(EXTREME)
    b = AnomalyDetector().score(EXTREME)
    assert a.anomaly_score == b.anomaly_score
    assert a.is_anomaly == b.is_anomaly
    assert a.contributing_features == b.contributing_features


def test_contributing_features_are_the_most_deviant_ones():
    result = AnomalyDetector().score(EXTREME)
    names = {c.feature for c in result.contributing_features}
    assert len(result.contributing_features) == 3
    # request_frequency (90 vs baseline mean ~8) is the most extreme input
    # by construction — it must show up as a top contributor.
    assert "request_frequency" in names


def test_contributing_features_report_direction():
    result = AnomalyDetector().score(EXTREME)
    for contribution in result.contributing_features:
        assert contribution.direction in ("higher_than_typical", "lower_than_typical")
        # EXTREME's values are all above the synthetic baseline's typical
        # range, so every top contributor should read "higher_than_typical".
        assert contribution.direction == "higher_than_typical"


def test_confidence_is_one_of_the_three_documented_levels():
    result = AnomalyDetector().score(EXTREME)
    assert result.confidence in ("low", "medium", "high")


def test_anomaly_score_is_always_within_0_100():
    for features in (TYPICAL, EXTREME):
        result = AnomalyDetector().score(features)
        assert 0 <= result.anomaly_score <= 100


def test_model_version_is_reported():
    result = AnomalyDetector().score(TYPICAL)
    assert result.model_version
