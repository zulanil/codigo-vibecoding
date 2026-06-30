"""SDD spec: GET / — health check."""


def test_health_ok(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["estado"] == "ok"
    assert "docs" in body
    assert "version" in body
