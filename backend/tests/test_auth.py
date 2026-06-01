def test_supabase_config(client):
    res = client.get("/api/auth/config")
    assert res.status_code == 200
    data = res.get_json()
    assert "supabase_url" in data or data.get("supabase_url") == ""


def test_me_requires_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
