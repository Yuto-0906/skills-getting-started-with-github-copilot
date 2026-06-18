from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


def test_root_redirects_to_static_index():
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_activity_data():
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert data["Chess Club"]["participants"] == ["michael@mergington.edu", "daniel@mergington.edu"]


def test_signup_adds_participant_to_activity():
    response = client.post("/activities/Chess%20Club/signup?email=test@example.com")

    assert response.status_code == 200
    assert response.json() == {"message": "Signed up test@example.com for Chess Club"}
    assert "test@example.com" in activities["Chess Club"]["participants"]


def test_duplicate_signup_is_rejected():
    activities["Chess Club"]["participants"].append("duplicate@example.com")

    response = client.post("/activities/Chess%20Club/signup?email=duplicate@example.com")

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_removes_participant_from_activity():
    activities["Chess Club"]["participants"].append("remove@example.com")

    response = client.delete("/activities/Chess%20Club/signup?email=remove@example.com")

    assert response.status_code == 200
    assert response.json() == {"message": "Unregistered remove@example.com from Chess Club"}
    assert "remove@example.com" not in activities["Chess Club"]["participants"]


def test_unregister_rejects_missing_participant():
    response = client.delete("/activities/Chess%20Club/signup?email=missing@example.com")

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not signed up for this activity"