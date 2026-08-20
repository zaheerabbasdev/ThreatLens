from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_analyze_returns_a_full_result_for_valid_input():
    res = client.post(
        "/analyze",
        json={
            "login_hour_deviation": 0.5,
            "new_geo_location": 0,
            "request_frequency": 8,
            "resource_access_count": 5,
            "file_download_count": 1,
            "auth_failure_count": 0,
            "unusual_endpoint_count": 0,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert "anomaly_score" in body
    assert "is_anomaly" in body
    assert "confidence" in body
    assert len(body["contributing_features"]) == 3


def test_analyze_rejects_a_missing_field_with_422():
    res = client.post("/analyze", json={"login_hour_deviation": 1})
    assert res.status_code == 422


def test_analyze_rejects_a_negative_value_with_422():
    res = client.post(
        "/analyze",
        json={
            "login_hour_deviation": 0.5,
            "new_geo_location": 0,
            "request_frequency": -5,
            "resource_access_count": 5,
            "file_download_count": 1,
            "auth_failure_count": 0,
            "unusual_endpoint_count": 0,
        },
    )
    assert res.status_code == 422


def test_analyze_rejects_an_out_of_range_flag_with_422():
    res = client.post(
        "/analyze",
        json={
            "login_hour_deviation": 0.5,
            "new_geo_location": 2,  # must be 0 or 1
            "request_frequency": 8,
            "resource_access_count": 5,
            "file_download_count": 1,
            "auth_failure_count": 0,
            "unusual_endpoint_count": 0,
        },
    )
    assert res.status_code == 422
