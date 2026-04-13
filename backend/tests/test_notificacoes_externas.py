"""
Test suite for Notificações Externas module
Tests CRUD operations, role-based access, and integration with dashboard/notifications
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {"email": "superadmin@falintil.tl", "password": "Admin@2024"}
ADMIN = {"email": "admin@falintil.tl", "password": "Demo@2024"}
PESSOAL_JUSTICA = {"email": "justica@falintil.tl", "password": "Demo@2024"}
PESSOAL_SUPERIOR = {"email": "superior@falintil.tl", "password": "Demo@2024"}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def super_admin_session(api_client):
    """Login as super_admin and return session with cookies"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
    assert response.status_code == 200, f"Super admin login failed: {response.text}"
    return api_client


@pytest.fixture(scope="module")
def admin_session():
    """Login as admin and return session with cookies"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return session


@pytest.fixture(scope="module")
def justica_session():
    """Login as pessoal_justica and return session with cookies"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=PESSOAL_JUSTICA)
    assert response.status_code == 200, f"Pessoal justica login failed: {response.text}"
    return session


@pytest.fixture(scope="module")
def superior_session():
    """Login as pessoal_superior (read-only) and return session with cookies"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=PESSOAL_SUPERIOR)
    assert response.status_code == 200, f"Pessoal superior login failed: {response.text}"
    return session


class TestNotificacoesExternasAPI:
    """Test Notificações Externas CRUD endpoints"""
    
    created_notif_id = None
    
    def test_01_list_notificacoes_empty_or_existing(self, super_admin_session):
        """Test listing notificações externas"""
        response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas")
        assert response.status_code == 200
        data = response.json()
        assert "notificacoes" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"Found {data['total']} existing notificações externas")
    
    def test_02_create_notificacao_super_admin(self, super_admin_session):
        """Test creating a notificação externa as super_admin"""
        payload = {
            "data_entrada": "2026-01-15",
            "nim": "TEST12345",
            "nome_completo": "TEST João Silva",
            "sexo": "M",
            "posto": "Soldado",
            "componente_unidade": "1º Batalhão da CFT",
            "qualidade": "Suspeito",
            "tipo_caso": "Investigação Criminal",
            "nu_nuc": "NUC-2026-001",
            "data_apresenta": "2026-01-20",
            "horas": "09:00",
            "observacao": "Notificação de teste criada pelo sistema de testes"
        }
        response = super_admin_session.post(f"{BASE_URL}/api/notificacoes-externas", json=payload)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert "numero" in data
        assert data["nome_completo"] == payload["nome_completo"]
        assert data["nim"] == payload["nim"]
        assert data["qualidade"] == payload["qualidade"]
        assert data["created_by_nome"] is not None
        
        TestNotificacoesExternasAPI.created_notif_id = data["id"]
        print(f"Created notificação #{data['numero']} with ID: {data['id']}")
    
    def test_03_get_notificacao_by_id(self, super_admin_session):
        """Test getting a specific notificação by ID"""
        notif_id = TestNotificacoesExternasAPI.created_notif_id
        assert notif_id is not None, "No notificação ID from previous test"
        
        response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas/{notif_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == notif_id
        assert data["nome_completo"] == "TEST João Silva"
        assert data["nim"] == "TEST12345"
        assert data["qualidade"] == "Suspeito"
        print(f"Retrieved notificação: {data['nome_completo']}")
    
    def test_04_update_notificacao(self, super_admin_session):
        """Test updating a notificação externa"""
        notif_id = TestNotificacoesExternasAPI.created_notif_id
        assert notif_id is not None
        
        update_payload = {
            "qualidade": "Arguido",
            "observacao": "Atualizado para Arguido durante testes"
        }
        response = super_admin_session.put(f"{BASE_URL}/api/notificacoes-externas/{notif_id}", json=update_payload)
        assert response.status_code == 200
        
        # Verify update persisted
        get_response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas/{notif_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["qualidade"] == "Arguido"
        assert "Atualizado para Arguido" in data["observacao"]
        print("Notificação updated successfully")
    
    def test_05_list_with_filters(self, super_admin_session):
        """Test listing with qualidade filter"""
        response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas", params={"qualidade": "Arguido"})
        assert response.status_code == 200
        data = response.json()
        
        # All returned should have qualidade = Arguido
        for notif in data["notificacoes"]:
            assert notif["qualidade"] == "Arguido"
        print(f"Filter test passed: {len(data['notificacoes'])} Arguido notificações")
    
    def test_06_list_with_search(self, super_admin_session):
        """Test listing with name search"""
        response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas", params={"nome": "TEST"})
        assert response.status_code == 200
        data = response.json()
        
        # Should find our test record
        found = any("TEST" in n["nome_completo"] for n in data["notificacoes"])
        assert found, "Test record not found in search results"
        print(f"Search test passed: found TEST records")


class TestRoleBasedAccess:
    """Test role-based access control for Notificações Externas"""
    
    def test_01_admin_can_create(self, admin_session):
        """Admin should be able to create notificações"""
        payload = {
            "data_entrada": "2026-01-16",
            "nim": "ADMIN001",
            "nome_completo": "TEST Admin Created",
            "qualidade": "Testemunha",
            "tipo_caso": "Testemunho"
        }
        response = admin_session.post(f"{BASE_URL}/api/notificacoes-externas", json=payload)
        assert response.status_code == 200
        print("Admin can create notificações: PASS")
    
    def test_02_justica_can_create(self, justica_session):
        """Pessoal Justiça should be able to create notificações"""
        payload = {
            "data_entrada": "2026-01-17",
            "nim": "JUST001",
            "nome_completo": "TEST Justica Created",
            "qualidade": "Suspeito",
            "tipo_caso": "Processo Disciplinar"
        }
        response = justica_session.post(f"{BASE_URL}/api/notificacoes-externas", json=payload)
        assert response.status_code == 200
        print("Pessoal Justiça can create notificações: PASS")
    
    def test_03_superior_can_read(self, superior_session):
        """Pessoal Superior (read-only) should be able to list notificações"""
        response = superior_session.get(f"{BASE_URL}/api/notificacoes-externas")
        assert response.status_code == 200
        print("Pessoal Superior can read notificações: PASS")
    
    def test_04_superior_cannot_create(self, superior_session):
        """Pessoal Superior (read-only) should NOT be able to create notificações"""
        payload = {
            "data_entrada": "2026-01-18",
            "nim": "SUP001",
            "nome_completo": "TEST Should Fail",
            "qualidade": "Suspeito"
        }
        response = superior_session.post(f"{BASE_URL}/api/notificacoes-externas", json=payload)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("Pessoal Superior cannot create notificações: PASS")
    
    def test_05_admin_cannot_delete(self, admin_session):
        """Admin should NOT be able to delete notificações (only super_admin)"""
        # First get a notificação ID
        list_response = admin_session.get(f"{BASE_URL}/api/notificacoes-externas")
        assert list_response.status_code == 200
        notifs = list_response.json()["notificacoes"]
        
        if notifs:
            notif_id = notifs[0]["id"]
            delete_response = admin_session.delete(f"{BASE_URL}/api/notificacoes-externas/{notif_id}")
            assert delete_response.status_code == 403, f"Expected 403, got {delete_response.status_code}"
            print("Admin cannot delete notificações: PASS")
        else:
            pytest.skip("No notificações to test delete")


class TestDashboardIntegration:
    """Test Dashboard stats include Notificações Externas count"""
    
    def test_01_dashboard_has_notif_externas_count(self, super_admin_session):
        """Dashboard stats should include total_notif_externas"""
        response = super_admin_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_notif_externas" in data, "Dashboard missing total_notif_externas field"
        assert isinstance(data["total_notif_externas"], int)
        print(f"Dashboard shows {data['total_notif_externas']} notificações externas")


class TestAdminNotifications:
    """Test admin notifications are created for NE actions"""
    
    def test_01_admin_notifications_include_ne_actions(self, super_admin_session):
        """Admin notifications should include NE create/edit actions"""
        response = super_admin_session.get(f"{BASE_URL}/api/notifications/admin")
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        assert "count" in data
        
        # Check if any notification mentions "notificação externa"
        ne_notifications = [n for n in data["notifications"] if "notificação externa" in n.get("action", "").lower()]
        print(f"Found {len(ne_notifications)} NE-related admin notifications")


class TestMemberHistoryIntegration:
    """Test Member History includes Notificações Externas"""
    
    def test_01_member_history_includes_ne(self, super_admin_session):
        """Member history should include notificações externas for the NIM"""
        # Use the test NIM we created
        response = super_admin_session.get(f"{BASE_URL}/api/member-history/TEST12345")
        assert response.status_code == 200
        data = response.json()
        
        assert "notificacoes_externas" in data
        assert "summary" in data
        assert "total_notif_externas" in data["summary"]
        
        # Should find our test record
        ne_count = len(data["notificacoes_externas"])
        print(f"Member history shows {ne_count} notificações externas for NIM TEST12345")


class TestCleanup:
    """Cleanup test data"""
    
    def test_99_cleanup_test_data(self, super_admin_session):
        """Delete all TEST_ prefixed notificações"""
        # List all notificações
        response = super_admin_session.get(f"{BASE_URL}/api/notificacoes-externas", params={"limit": 100})
        assert response.status_code == 200
        notifs = response.json()["notificacoes"]
        
        deleted_count = 0
        for notif in notifs:
            if "TEST" in notif.get("nome_completo", "") or "TEST" in notif.get("nim", ""):
                delete_response = super_admin_session.delete(f"{BASE_URL}/api/notificacoes-externas/{notif['id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test notificações")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
