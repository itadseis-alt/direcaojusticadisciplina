"""Tests for 11 new feature enhancements (iteration 4)
- Point 1: GET /api/notifications/overdue-em-processo
- Point 5: GET /api/member-history/{nim} cumulative sanctions
- Point 7: PUT /api/users/{id}/toggle-active + login 403 for deactivated
- Point 8-9: User registration with NIM, Sexo, Posto, Componente fields
- Point 10: Cases list filter by unidade
- Regression: login still works for active users; cases CRUD readable
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    'REACT_APP_BACKEND_URL',
    'https://disciplina-hub-1.preview.emergentagent.com'
).rstrip('/')
API = f"{BASE_URL}/api"

SUPER = {"email": "superadmin@falintil.tl", "password": "Admin@2024"}
JUSTICA = {"email": "justica@falintil.tl", "password": "Demo@2024"}


@pytest.fixture(scope="module")
def super_token():
    r = requests.post(f"{API}/auth/login", json=SUPER, timeout=20)
    assert r.status_code == 200, f"Super login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def super_headers(super_token):
    return {"Authorization": f"Bearer {super_token}",
            "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def justica_token():
    r = requests.post(f"{API}/auth/login", json=JUSTICA, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"justica login failed: {r.status_code}")
    return r.json()["token"]


# -------- Regression: Login --------
class TestLoginRegression:
    def test_super_login_ok(self):
        r = requests.post(f"{API}/auth/login", json=SUPER, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and isinstance(body["token"], str)
        assert body.get("email") == SUPER["email"]
        assert body.get("tipo") == "super_admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": SUPER["email"], "password": "Wrong@1"},
                          timeout=20)
        assert r.status_code in (401, 403)


# -------- Point 1: Overdue em_processo notifications --------
class TestOverdueEmProcesso:
    def test_endpoint_returns_structure(self, super_headers):
        r = requests.get(f"{API}/notifications/overdue-em-processo",
                         headers=super_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "notifications" in data
        assert "count" in data
        assert isinstance(data["notifications"], list)
        assert data["count"] == len(data["notifications"])
        for n in data["notifications"]:
            assert "id" in n
            assert "numero" in n
            assert "dias_em_processo" in n
            assert n["dias_em_processo"] > 30

    def test_endpoint_requires_auth(self):
        r = requests.get(f"{API}/notifications/overdue-em-processo", timeout=20)
        assert r.status_code == 401

    def test_endpoint_accessible_for_justica(self, justica_token):
        h = {"Authorization": f"Bearer {justica_token}"}
        r = requests.get(f"{API}/notifications/overdue-em-processo",
                         headers=h, timeout=20)
        assert r.status_code == 200


# -------- Point 5: Member history cumulative sanctions --------
class TestMemberHistoryCumulative:
    def test_member_history_returns_cumulative_fields(self, super_headers):
        # Find a member who has at least one case
        r = requests.get(f"{API}/cases?limit=1", headers=super_headers, timeout=20)
        assert r.status_code == 200
        cases = r.json().get("cases", [])
        if not cases:
            pytest.skip("No cases in DB")
        nim = cases[0].get("nim")
        if not nim:
            pytest.skip("First case has no NIM")
        h = requests.get(f"{API}/member-history/{nim}",
                        headers=super_headers, timeout=20)
        assert h.status_code == 200, h.text
        data = h.json()
        assert "summary" in data
        s = data["summary"]
        assert "total_anos_pena" in s
        assert "penas_detalhes" in s
        assert isinstance(s["total_anos_pena"], int)
        assert isinstance(s["penas_detalhes"], list)
        # Sum of detalhes anos == total_anos_pena
        assert sum(p["anos"] for p in s["penas_detalhes"]) == s["total_anos_pena"]


# -------- Point 7: Toggle active + login block --------
class TestToggleActive:
    @pytest.fixture
    def temp_user(self, super_headers):
        nim = f"TEST{uuid.uuid4().hex[:6]}"
        payload = {
            "nim": nim,
            "nome": f"TEST_User_{uuid.uuid4().hex[:5]}",
            "sexo": "M",
            "posto": "Soldado",
            "componente_unidade": "1º Batalhão",
            "email": f"test_{uuid.uuid4().hex[:8]}@falintil.tl",
            "senha": "Temp@1234",
            "tipo": "pessoal_superior"
        }
        r = requests.post(f"{API}/users", headers=super_headers,
                          json=payload, timeout=20)
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        yield {"id": uid, "email": payload["email"],
               "password": payload["senha"], "payload": payload}
        # cleanup
        requests.delete(f"{API}/users/{uid}", headers=super_headers, timeout=20)

    def test_create_user_includes_new_fields(self, super_headers, temp_user):
        # Verify user was created with NIM, sexo, posto, componente
        r = requests.get(f"{API}/users", headers=super_headers, timeout=20)
        assert r.status_code == 200
        users = r.json()["users"] if isinstance(r.json(), dict) and "users" in r.json() else r.json()
        match = [u for u in users if u["id"] == temp_user["id"]]
        assert match, "Created user not found in list"
        u = match[0]
        assert u.get("nim") == temp_user["payload"]["nim"]
        assert u.get("sexo") == "M"
        assert u.get("posto") == "Soldado"
        assert u.get("componente_unidade") == "1º Batalhão"
        assert u.get("ativo") is True

    def test_toggle_active_blocks_login(self, super_headers, temp_user):
        # 1) login OK initially
        r = requests.post(f"{API}/auth/login", json={
            "email": temp_user["email"], "password": temp_user["password"]
        }, timeout=20)
        assert r.status_code == 200, f"initial login failed: {r.text}"

        # 2) toggle inactive
        t = requests.put(f"{API}/users/{temp_user['id']}/toggle-active",
                         headers=super_headers, timeout=20)
        assert t.status_code == 200, t.text
        body = t.json()
        assert body.get("ativo") is False
        assert "message" in body

        # 3) login should now be 403
        r2 = requests.post(f"{API}/auth/login", json={
            "email": temp_user["email"], "password": temp_user["password"]
        }, timeout=20)
        assert r2.status_code == 403, f"expected 403 got {r2.status_code}: {r2.text}"
        assert "desativada" in r2.text.lower() or "desativ" in r2.text.lower()

        # 4) toggle back active
        t2 = requests.put(f"{API}/users/{temp_user['id']}/toggle-active",
                          headers=super_headers, timeout=20)
        assert t2.status_code == 200
        assert t2.json().get("ativo") is True

        # 5) login should work again
        r3 = requests.post(f"{API}/auth/login", json={
            "email": temp_user["email"], "password": temp_user["password"]
        }, timeout=20)
        assert r3.status_code == 200

    def test_toggle_super_admin_forbidden(self, super_headers):
        # Find super_admin user id
        r = requests.get(f"{API}/users", headers=super_headers, timeout=20)
        users = r.json()["users"] if isinstance(r.json(), dict) and "users" in r.json() else r.json()
        sa = next((u for u in users if u.get("tipo") == "super_admin"), None)
        if not sa:
            pytest.skip("No super_admin user")
        t = requests.put(f"{API}/users/{sa['id']}/toggle-active",
                         headers=super_headers, timeout=20)
        assert t.status_code == 400
        assert "Super Admin" in t.text or "super_admin" in t.text


# -------- Point 10: Cases filter by unidade --------
class TestCasesUnidadeFilter:
    def test_filter_by_unidade(self, super_headers):
        # First fetch any case to get a real unidade value
        r = requests.get(f"{API}/cases?limit=5", headers=super_headers, timeout=20)
        assert r.status_code == 200
        cases = r.json().get("cases", [])
        if not cases:
            pytest.skip("No cases")
        unidade = next((c.get("componente_unidade")
                        for c in cases if c.get("componente_unidade")), None)
        if not unidade:
            pytest.skip("No unidade values")
        r2 = requests.get(f"{API}/cases?unidade={unidade}",
                          headers=super_headers, timeout=20)
        assert r2.status_code == 200
        for c in r2.json().get("cases", []):
            assert c.get("componente_unidade") == unidade


# -------- Regression: Cases list & dashboard --------
class TestRegression:
    def test_dashboard_stats(self, super_headers):
        r = requests.get(f"{API}/dashboard/stats",
                         headers=super_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "pendentes", "em_processo", "processados",
                  "arquivados", "anulados"]:
            assert k in d, f"missing {k} in dashboard stats"

    def test_list_cases(self, super_headers):
        r = requests.get(f"{API}/cases?limit=5",
                         headers=super_headers, timeout=20)
        assert r.status_code == 200
        assert "cases" in r.json()
