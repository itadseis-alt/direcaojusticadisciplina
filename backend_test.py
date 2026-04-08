#!/usr/bin/env python3
"""
Backend API Testing for Sistema de Gestão Disciplinar FALINTIL-FDTL
Tests all API endpoints with different user roles and permissions
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FalintilAPITester:
    def __init__(self, base_url="https://disciplina-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.test_case_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            self.failed_tests.append(f"{test_name}: {details}")

    def make_request(self, method: str, endpoint: str, data: dict = None, 
                    token: str = None, files: dict = None) -> tuple[bool, dict, int]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {}, 0

            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code in [200, 201], response_data, response.status_code
        
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_login(self, email: str, password: str, role: str) -> bool:
        """Test login for specific user role"""
        success, response, status = self.make_request(
            'POST', 'auth/login', 
            {'email': email, 'password': password}
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.users[role] = response
            self.log_result(f"Login {role} ({email})", True)
            return True
        else:
            self.log_result(f"Login {role} ({email})", False, f"Status: {status}, Response: {response}")
            return False

    def test_auth_me(self, role: str) -> bool:
        """Test /auth/me endpoint"""
        if role not in self.tokens:
            self.log_result(f"Auth Me {role}", False, "No token available")
            return False
            
        success, response, status = self.make_request(
            'GET', 'auth/me', token=self.tokens[role]
        )
        
        if success and 'email' in response:
            self.log_result(f"Auth Me {role}", True)
            return True
        else:
            self.log_result(f"Auth Me {role}", False, f"Status: {status}")
            return False

    def test_dashboard_stats(self, role: str) -> bool:
        """Test dashboard statistics endpoint"""
        if role not in self.tokens:
            self.log_result(f"Dashboard Stats {role}", False, "No token available")
            return False
            
        success, response, status = self.make_request(
            'GET', 'dashboard/stats', token=self.tokens[role]
        )
        
        expected_fields = ['total', 'processados', 'pendentes', 'em_processo', 'arquivados', 'anulados']
        if success and all(field in response for field in expected_fields):
            self.log_result(f"Dashboard Stats {role}", True)
            return True
        else:
            self.log_result(f"Dashboard Stats {role}", False, f"Status: {status}, Missing fields")
            return False

    def test_cases_list(self, role: str) -> bool:
        """Test cases list endpoint"""
        if role not in self.tokens:
            self.log_result(f"Cases List {role}", False, "No token available")
            return False
            
        success, response, status = self.make_request(
            'GET', 'cases', token=self.tokens[role]
        )
        
        if success and 'cases' in response and 'total' in response:
            self.log_result(f"Cases List {role}", True)
            return True
        else:
            self.log_result(f"Cases List {role}", False, f"Status: {status}")
            return False

    def test_create_case(self, role: str) -> bool:
        """Test case creation (only for authorized roles)"""
        if role not in self.tokens:
            self.log_result(f"Create Case {role}", False, "No token available")
            return False
        
        # Only these roles can create cases
        if role not in ['super_admin', 'admin', 'pessoal_justica']:
            success, response, status = self.make_request(
                'POST', 'cases', 
                {
                    'data_registo': '2024-01-15',
                    'hora': '10:30',
                    'tipo_caso': 'Teste Automatizado',
                    'refere_ao': 'João Teste Silva',
                    'posto': 'Soldado',
                    'componente_unidade': '1º Batalhão',
                    'requerente': 'Comando',
                    'telefone': '77123456',
                    'nim': 'F12345',
                    'sexo': 'M'
                },
                token=self.tokens[role]
            )
            
            # Should fail with 403
            if status == 403:
                self.log_result(f"Create Case {role} (Permission Denied)", True)
                return True
            else:
                self.log_result(f"Create Case {role} (Should be denied)", False, f"Expected 403, got {status}")
                return False
        
        # Authorized roles should succeed
        success, response, status = self.make_request(
            'POST', 'cases', 
            {
                'data_registo': '2024-01-15',
                'hora': '10:30',
                'tipo_caso': 'Teste Automatizado',
                'refere_ao': 'João Teste Silva',
                'posto': 'Soldado',
                'componente_unidade': '1º Batalhão',
                'requerente': 'Comando',
                'telefone': '77123456',
                'nim': 'F12345',
                'sexo': 'M'
            },
            token=self.tokens[role]
        )
        
        if success and 'id' in response:
            self.test_case_id = response['id']
            self.log_result(f"Create Case {role}", True)
            return True
        else:
            self.log_result(f"Create Case {role}", False, f"Status: {status}, Response: {response}")
            return False

    def test_case_detail(self, role: str) -> bool:
        """Test case detail endpoint"""
        if role not in self.tokens or not self.test_case_id:
            self.log_result(f"Case Detail {role}", False, "No token or case ID available")
            return False
            
        success, response, status = self.make_request(
            'GET', f'cases/{self.test_case_id}', token=self.tokens[role]
        )
        
        if success and 'id' in response and 'numero' in response:
            self.log_result(f"Case Detail {role}", True)
            return True
        else:
            self.log_result(f"Case Detail {role}", False, f"Status: {status}")
            return False

    def test_case_status_update(self, role: str) -> bool:
        """Test case status update"""
        if role not in self.tokens or not self.test_case_id:
            self.log_result(f"Case Status Update {role}", False, "No token or case ID available")
            return False
        
        # Only these roles can update status
        if role not in ['super_admin', 'admin', 'pessoal_justica']:
            success, response, status = self.make_request(
                'PUT', f'cases/{self.test_case_id}/status',
                {'status': 'em_processo'},
                token=self.tokens[role]
            )
            
            # Should fail with 403
            if status == 403:
                self.log_result(f"Case Status Update {role} (Permission Denied)", True)
                return True
            else:
                self.log_result(f"Case Status Update {role} (Should be denied)", False, f"Expected 403, got {status}")
                return False
        
        # Authorized roles should succeed
        success, response, status = self.make_request(
            'PUT', f'cases/{self.test_case_id}/status',
            {'status': 'em_processo'},
            token=self.tokens[role]
        )
        
        if success:
            self.log_result(f"Case Status Update {role}", True)
            return True
        else:
            self.log_result(f"Case Status Update {role}", False, f"Status: {status}")
            return False

    def test_users_list(self, role: str) -> bool:
        """Test users list endpoint"""
        if role not in self.tokens:
            self.log_result(f"Users List {role}", False, "No token available")
            return False
        
        # Only super_admin and admin can list users
        if role not in ['super_admin', 'admin']:
            success, response, status = self.make_request(
                'GET', 'users', token=self.tokens[role]
            )
            
            # Should fail with 403
            if status == 403:
                self.log_result(f"Users List {role} (Permission Denied)", True)
                return True
            else:
                self.log_result(f"Users List {role} (Should be denied)", False, f"Expected 403, got {status}")
                return False
        
        # Authorized roles should succeed
        success, response, status = self.make_request(
            'GET', 'users', token=self.tokens[role]
        )
        
        if success and isinstance(response, list):
            self.log_result(f"Users List {role}", True)
            return True
        else:
            self.log_result(f"Users List {role}", False, f"Status: {status}")
            return False

    def test_activity_logs(self, role: str) -> bool:
        """Test activity logs endpoint (Super Admin only)"""
        if role not in self.tokens:
            self.log_result(f"Activity Logs {role}", False, "No token available")
            return False
        
        # Only super_admin can access activity logs
        if role != 'super_admin':
            success, response, status = self.make_request(
                'GET', 'activity-logs', token=self.tokens[role]
            )
            
            # Should fail with 403
            if status == 403:
                self.log_result(f"Activity Logs {role} (Permission Denied)", True)
                return True
            else:
                self.log_result(f"Activity Logs {role} (Should be denied)", False, f"Expected 403, got {status}")
                return False
        
        # Super admin should succeed
        success, response, status = self.make_request(
            'GET', 'activity-logs', token=self.tokens[role]
        )
        
        if success and 'logs' in response:
            self.log_result(f"Activity Logs {role}", True)
            return True
        else:
            self.log_result(f"Activity Logs {role}", False, f"Status: {status}")
            return False

    def test_export_cases(self, role: str) -> bool:
        """Test cases export endpoint"""
        if role not in self.tokens:
            self.log_result(f"Export Cases {role}", False, "No token available")
            return False
        
        # Only these roles can export
        if role not in ['super_admin', 'admin', 'pessoal_justica']:
            success, response, status = self.make_request(
                'GET', 'export/cases?format=csv', token=self.tokens[role]
            )
            
            # Should fail with 403
            if status == 403:
                self.log_result(f"Export Cases {role} (Permission Denied)", True)
                return True
            else:
                self.log_result(f"Export Cases {role} (Should be denied)", False, f"Expected 403, got {status}")
                return False
        
        # Test CSV export
        try:
            url = f"{self.base_url}/export/cases?format=csv"
            headers = {'Authorization': f'Bearer {self.tokens[role]}'}
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200 and 'text/csv' in response.headers.get('content-type', ''):
                self.log_result(f"Export Cases CSV {role}", True)
                return True
            else:
                self.log_result(f"Export Cases CSV {role}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result(f"Export Cases CSV {role}", False, str(e))
            return False

    def test_password_verification(self, role: str) -> bool:
        """Test password verification endpoint"""
        if role not in self.tokens:
            self.log_result(f"Password Verification {role}", False, "No token available")
            return False
        
        # Get the correct password for the role
        passwords = {
            'super_admin': 'Admin@2024',
            'admin': 'Demo@2024',
            'pessoal_justica': 'Demo@2024',
            'pessoal_superior': 'Demo@2024'
        }
        
        success, response, status = self.make_request(
            'POST', 'auth/verify-password',
            {'password': passwords[role]},
            token=self.tokens[role]
        )
        
        if success and response.get('verified') == True:
            self.log_result(f"Password Verification {role}", True)
            return True
        else:
            self.log_result(f"Password Verification {role}", False, f"Status: {status}")
            return False

    def run_comprehensive_tests(self):
        """Run all tests for all user roles"""
        print("🚀 Starting FALINTIL-FDTL API Testing...")
        print("=" * 60)
        
        # Test credentials from the system
        test_users = [
            ('super_admin', 'superadmin@falintil.tl', 'Admin@2024'),
            ('admin', 'admin@falintil.tl', 'Demo@2024'),
            ('pessoal_justica', 'justica@falintil.tl', 'Demo@2024'),
            ('pessoal_superior', 'superior@falintil.tl', 'Demo@2024')
        ]
        
        # Test login for all users
        print("\n📝 Testing Authentication...")
        for role, email, password in test_users:
            self.test_login(email, password, role)
        
        # Test auth/me for all logged in users
        print("\n👤 Testing User Info...")
        for role, _, _ in test_users:
            self.test_auth_me(role)
        
        # Test password verification
        print("\n🔐 Testing Password Verification...")
        for role, _, _ in test_users:
            self.test_password_verification(role)
        
        # Test dashboard stats
        print("\n📊 Testing Dashboard...")
        for role, _, _ in test_users:
            self.test_dashboard_stats(role)
        
        # Test cases functionality
        print("\n📋 Testing Cases Management...")
        for role, _, _ in test_users:
            self.test_cases_list(role)
            self.test_create_case(role)
            if self.test_case_id:
                self.test_case_detail(role)
                self.test_case_status_update(role)
        
        # Test user management
        print("\n👥 Testing User Management...")
        for role, _, _ in test_users:
            self.test_users_list(role)
        
        # Test activity logs
        print("\n📜 Testing Activity Logs...")
        for role, _, _ in test_users:
            self.test_activity_logs(role)
        
        # Test export functionality
        print("\n📤 Testing Export...")
        for role, _, _ in test_users:
            self.test_export_cases(role)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = FalintilAPITester()
    
    try:
        success = tester.run_comprehensive_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"💥 Test execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())