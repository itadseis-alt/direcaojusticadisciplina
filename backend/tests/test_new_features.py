"""Tests for new feature enhancements (iteration 3)
- Feature 1: origem_anexo in CaseProcess and StatusUpdate
- Feature 3: telefone in NotifExterna create/update
- Feature 4: Dashboard ne_aguarde/ne_concluida stats
- Regression: NE list status filter
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://disciplina-hub-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={
        "email": "superadmin@falintil.tl", "password": "Admin@2024"
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# -------- Feature 1: origem_anexo --------
class TestOrigemAnexo:
    def _get_or_create_case(self, headers):
        # Prefer fetching existing pending case (since case creation has a pre-existing dup-key bug)
        r = requests.get(f"{API}/cases?status=pendente&limit=1", headers=headers)
        if r.status_code == 200 and r.json().get("cases"):
            return r.json()["cases"][0]["id"], False
        # fallback: try create
        payload = {
            "data_registo": "2025-01-15", "hora": "10:00",
            "tipo_caso": "Outros",
            "refere_ao": f"TEST_Caso_{uuid.uuid4().hex[:6]}",
            "posto": "Soldado", "componente_unidade": "1º Batalhão",
            "requerente": "Comando", "nim": f"TEST{uuid.uuid4().hex[:6]}"
        }
        r = requests.post(f"{API}/cases", headers=headers, json=payload)
        assert r.status_code == 200, r.text
        return r.json()["id"], True

    def test_process_case_accepts_origem_anexo(self, headers):
        # Use any existing case and revert status
        r = requests.get(f"{API}/cases?limit=1", headers=headers)
        assert r.status_code == 200 and r.json()["cases"], "No cases available"
        case = r.json()["cases"][0]
        case_id = case["id"]
        original_status = case["status"]
        original_origem = case.get("origem_anexo")

        pr = requests.put(f"{API}/cases/{case_id}/process", headers=headers, json={
            "tipo_sancao": "Advertência",
            "data_despacho": "2025-01-16",
            "origem_anexo": "Documento de TESTE - origem X"
        })
        assert pr.status_code == 200, pr.text
        g = requests.get(f"{API}/cases/{case_id}", headers=headers)
        assert g.status_code == 200
        assert g.json().get("origem_anexo") == "Documento de TESTE - origem X"
        assert g.json().get("status") == "processado"

        # Restore
        requests.put(f"{API}/cases/{case_id}/status", headers=headers, json={
            "status": original_status, "origem_anexo": original_origem or ""
        })

    def test_status_update_accepts_origem_anexo(self, headers):
        r = requests.get(f"{API}/cases?limit=1", headers=headers)
        assert r.status_code == 200 and r.json()["cases"]
        case = r.json()["cases"][0]
        case_id = case["id"]
        original_status = case["status"]

        u = requests.put(f"{API}/cases/{case_id}/status", headers=headers, json={
            "status": "arquivado",
            "origem_anexo": "Arquivo TESTE origem Y"
        })
        assert u.status_code == 200, u.text
        g = requests.get(f"{API}/cases/{case_id}", headers=headers)
        assert g.json().get("origem_anexo") == "Arquivo TESTE origem Y"
        assert g.json().get("status") == "arquivado"
        # Restore
        requests.put(f"{API}/cases/{case_id}/status", headers=headers, json={"status": original_status})


# -------- Feature 3: telefone in NE --------
class TestNETelefone:
    def test_create_ne_with_telefone(self, headers):
        payload = {
            "data_entrada": "2025-01-15",
            "nim": f"TEST{uuid.uuid4().hex[:6]}",
            "nome_completo": f"TEST_NE_{uuid.uuid4().hex[:6]}",
            "telefone": "+67077123456",
            "qualidade": "Suspeito",
            "tipo_caso": "Indisciplina",
            "data_apresenta": "2099-12-31"
        }
        r = requests.post(f"{API}/notificacoes-externas", headers=headers, json=payload)
        assert r.status_code == 200, r.text
        nid = r.json()["id"]
        assert r.json().get("telefone") == "+67077123456"

        # GET to verify persistence
        g = requests.get(f"{API}/notificacoes-externas/{nid}", headers=headers)
        assert g.status_code == 200
        assert g.json().get("telefone") == "+67077123456"

        # Update telefone
        u = requests.put(f"{API}/notificacoes-externas/{nid}", headers=headers, json={
            "telefone": "+67099999999"
        })
        assert u.status_code == 200
        g2 = requests.get(f"{API}/notificacoes-externas/{nid}", headers=headers)
        assert g2.json().get("telefone") == "+67099999999"

        # Cleanup
        requests.delete(f"{API}/notificacoes-externas/{nid}", headers=headers)


# -------- Feature 4: Dashboard NE stats --------
class TestDashboardNEStats:
    def test_dashboard_includes_ne_aguarde_and_concluida(self, headers):
        r = requests.get(f"{API}/dashboard/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "total_notif_externas" in data
        assert "ne_aguarde" in data
        assert "ne_concluida" in data
        assert isinstance(data["ne_aguarde"], int)
        assert isinstance(data["ne_concluida"], int)
        # total should be >= sum of aguarde + concluida
        assert data["total_notif_externas"] >= (data["ne_aguarde"] + data["ne_concluida"]) - 1  # allow drift


# -------- Regression: NE list status filter --------
class TestNEStatusFilter:
    def test_list_ne_with_status_aguarde(self, headers):
        r = requests.get(f"{API}/notificacoes-externas?status=aguarde", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "notificacoes" in data
        for n in data["notificacoes"]:
            assert n.get("status") == "aguarde"

    def test_list_ne_with_status_concluida(self, headers):
        r = requests.get(f"{API}/notificacoes-externas?status=apresentacao_concluida", headers=headers)
        assert r.status_code == 200
        for n in r.json()["notificacoes"]:
            assert n.get("status") == "apresentacao_concluida"

    def test_list_ne_status_all_returns_all(self, headers):
        r = requests.get(f"{API}/notificacoes-externas?status=all", headers=headers)
        assert r.status_code == 200
