#!/usr/bin/env python3
"""
Comprehensive API Testing Script
Tests all endpoints in the Back-End-Web project
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple

BASE_URL = "http://localhost:3000/api"
RESULTS_FILE = "COMPREHENSIVE_API_TEST_RESULTS.md"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class APITester:
    def __init__(self):
        self.token = None
        self.customer_id = None
        self.user_id = None
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_result(self, module: str, test_name: str, endpoint: str, 
                   method: str, success: bool, response: dict, 
                   request_body: dict = None, status_code: int = None):
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASSED"
            color = Colors.GREEN
        else:
            self.failed_tests += 1
            status = "❌ FAILED"
            color = Colors.RED
            
        print(f"{color}{status}{Colors.END} - {module}: {test_name}")
        
        self.results.append({
            'module': module,
            'test_name': test_name,
            'endpoint': endpoint,
            'method': method,
            'status': status,
            'success': success,
            'request_body': request_body,
            'response': response,
            'status_code': status_code
        })
    
    def test_api(self, method: str, endpoint: str, data: dict = None, 
                 use_auth: bool = False, description: str = "", 
                 module: str = "") -> Tuple[bool, dict, int]:
        url = f"{BASE_URL}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {'error': f'Unknown method: {method}'}, 0
            
            try:
                json_response = response.json()
            except:
                json_response = {'raw_response': response.text}
            
            success = response.status_code < 400 and json_response.get('success', False)
            
            self.log_result(module, description, endpoint, method, success, 
                          json_response, data, response.status_code)
            
            return success, json_response, response.status_code
        except Exception as e:
            error_response = {'error': str(e)}
            self.log_result(module, description, endpoint, method, False, 
                          error_response, data, 0)
            return False, error_response, 0
    
    def setup_authentication(self):
        """Register and login to get authentication token"""
        timestamp = int(time.time())
        
        # Register a new user
        register_data = {
            "username": f"testuser{timestamp}",
            "password": "Test@123456",
            "email": f"testuser{timestamp}@example.com",
            "phone": f"09{str(timestamp)[-8:]}",
            "full_name": "Test User",
            "role_name": "customer"
        }
        
        success, response, _ = self.test_api(
            'POST', '/auth/register', register_data,
            description="User Registration", module="Auth"
        )
        
        if success:
            # Login
            login_data = {
                "username": register_data['username'],
                "password": register_data['password']
            }
            
            success, response, _ = self.test_api(
                'POST', '/auth/login', login_data,
                description="User Login", module="Auth"
            )
            
            if success and 'data' in response:
                self.token = response['data'].get('token')
                user_data = response['data'].get('user', {})
                self.user_id = user_data.get('id')
                customer_data = user_data.get('customers', {})
                self.customer_id = customer_data.get('id') if customer_data else None
                return True
        
        return False
    
    def test_auth_module(self):
        """Test Authentication endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Auth Module ==={Colors.END}")
        
        # Test /auth/me
        self.test_api('GET', '/auth/me', use_auth=True,
                     description="Get Current User", module="Auth")
        
        # Test logout
        self.test_api('POST', '/auth/logout', use_auth=True,
                     description="User Logout", module="Auth")
    
    def test_product_module(self):
        """Test Product endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Product Module ==={Colors.END}")
        
        # Get all products
        self.test_api('GET', '/products?page=1&limit=10',
                     description="Get All Products (Paginated)", module="Products")
        
        # Get product by ID
        self.test_api('GET', '/products/1',
                     description="Get Product By ID", module="Products")
        
        # Search products
        self.test_api('GET', '/products/search?keyword=thuốc&page=1&limit=5',
                     description="Search Products", module="Products")
        
        # Get best sellers
        self.test_api('GET', '/products/best-sellers?limit=5',
                     description="Get Best Sellers", module="Products")
    
    def test_category_module(self):
        """Test Category endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Category Module ==={Colors.END}")
        
        self.test_api('GET', '/categories',
                     description="Get All Categories", module="Categories")
        
        self.test_api('GET', '/categories/1',
                     description="Get Category By ID", module="Categories")
    
    def test_cart_module(self):
        """Test Cart endpoints"""
        if not self.customer_id:
            print(f"{Colors.YELLOW}Skipping Cart tests - No customer ID{Colors.END}")
            return
        
        print(f"\n{Colors.BLUE}=== Testing Cart Module ==={Colors.END}")
        
        # Get cart
        self.test_api('GET', f'/cart/{self.customer_id}', use_auth=True,
                     description="Get Cart", module="Cart")
        
        # Get cart summary
        self.test_api('GET', f'/cart/{self.customer_id}/summary', use_auth=True,
                     description="Get Cart Summary", module="Cart")
        
        # Add to cart
        add_data = {
            "productId": 1,
            "productUnitId": 1,
            "quantity": 2
        }
        success, response, _ = self.test_api('POST', f'/cart/{self.customer_id}/add', 
                                            add_data, use_auth=True,
                                            description="Add Product to Cart", 
                                            module="Cart")
        
        # Get cart after adding
        self.test_api('GET', f'/cart/{self.customer_id}', use_auth=True,
                     description="Get Cart After Adding", module="Cart")
    
    def test_branch_module(self):
        """Test Branch endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Branch Module ==={Colors.END}")
        
        self.test_api('GET', '/branches',
                     description="Get All Branches", module="Branches")
        
        self.test_api('GET', '/branches/1',
                     description="Get Branch By ID", module="Branches")
    
    def test_city_module(self):
        """Test City endpoints"""
        print(f"\n{Colors.BLUE}=== Testing City Module ==={Colors.END}")
        
        self.test_api('GET', '/cities', use_auth=True,
                     description="Get All Cities", module="Cities")
    
    def test_review_module(self):
        """Test Review endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Review Module ==={Colors.END}")
        
        # Get all reviews
        self.test_api('GET', '/reviews',
                     description="Get All Reviews", module="Reviews")
        
        # Get product reviews (correct endpoint)
        self.test_api('GET', '/products/1/reviews',
                     description="Get Product Reviews", module="Reviews")
        
        # Get product rating stats
        self.test_api('GET', '/products/1/rating-stats',
                     description="Get Product Rating Stats", module="Reviews")
    
    def test_order_module(self):
        """Test Order endpoints"""
        if not self.customer_id:
            print(f"{Colors.YELLOW}Skipping Order tests - No customer ID{Colors.END}")
            return
        
        print(f"\n{Colors.BLUE}=== Testing Order Module ==={Colors.END}")
        
        self.test_api('GET', '/orders', use_auth=True,
                     description="Get All Orders", module="Orders")
    
    def test_voucher_module(self):
        """Test Voucher endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Voucher Module ==={Colors.END}")
        
        self.test_api('GET', '/vouchers', use_auth=True,
                     description="Get All Vouchers", module="Vouchers")
    
    def test_flashsale_module(self):
        """Test Flashsale endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Flashsale Module ==={Colors.END}")
        
        self.test_api('GET', '/flashsales', use_auth=True,
                     description="Get All Flashsales", module="Flashsales")
        
        self.test_api('GET', '/flashsales/active',
                     description="Get Active Flashsales", module="Flashsales")
    
    def generate_report(self):
        """Generate markdown report"""
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            f.write("# Comprehensive API Test Results\n\n")
            f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"**Base URL**: {BASE_URL}\n\n")
            
            # Summary
            f.write("## Summary\n\n")
            f.write(f"- **Total Tests**: {self.total_tests}\n")
            f.write(f"- **Passed**: ✅ {self.passed_tests}\n")
            f.write(f"- **Failed**: ❌ {self.failed_tests}\n")
            success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
            f.write(f"- **Success Rate**: {success_rate:.2f}%\n\n")
            
            # Group by module
            modules = {}
            for result in self.results:
                module = result['module']
                if module not in modules:
                    modules[module] = []
                modules[module].append(result)
            
            # Write results by module
            for module, tests in modules.items():
                f.write(f"## {module} Module\n\n")
                
                for test in tests:
                    f.write(f"### {test['test_name']}\n\n")
                    f.write(f"- **Endpoint**: `{test['method']} {test['endpoint']}`\n")
                    f.write(f"- **Status**: {test['status']}\n")
                    
                    if test['status_code']:
                        f.write(f"- **HTTP Status**: {test['status_code']}\n")
                    
                    if test['request_body']:
                        f.write(f"- **Request Body**:\n```json\n{json.dumps(test['request_body'], indent=2, ensure_ascii=False)}\n```\n")
                    
                    if test['response']:
                        f.write(f"- **Response**:\n```json\n{json.dumps(test['response'], indent=2, ensure_ascii=False)}\n```\n")
                    
                    f.write("\n---\n\n")
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"{Colors.BLUE}╔══════════════════════════════════════════════╗{Colors.END}")
        print(f"{Colors.BLUE}║  Comprehensive API Testing Suite            ║{Colors.END}")
        print(f"{Colors.BLUE}╚══════════════════════════════════════════════╝{Colors.END}\n")
        
        # Setup authentication
        print(f"{Colors.YELLOW}Setting up authentication...{Colors.END}")
        if not self.setup_authentication():
            print(f"{Colors.RED}Failed to setup authentication. Some tests will be skipped.{Colors.END}")
        else:
            print(f"{Colors.GREEN}Authentication setup successful!{Colors.END}")
        
        # Run all test modules
        self.test_auth_module()
        self.test_product_module()
        self.test_category_module()
        self.test_cart_module()
        self.test_branch_module()
        self.test_city_module()
        self.test_review_module()
        self.test_order_module()
        self.test_voucher_module()
        self.test_flashsale_module()
        
        # Generate report
        print(f"\n{Colors.BLUE}Generating test report...{Colors.END}")
        self.generate_report()
        
        # Print summary
        print(f"\n{Colors.BLUE}╔══════════════════════════════════════════════╗{Colors.END}")
        print(f"{Colors.BLUE}║              Test Summary                    ║{Colors.END}")
        print(f"{Colors.BLUE}╚══════════════════════════════════════════════╝{Colors.END}")
        print(f"\nTotal Tests: {self.total_tests}")
        print(f"{Colors.GREEN}Passed: {self.passed_tests}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.failed_tests}{Colors.END}")
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        print(f"Success Rate: {success_rate:.2f}%")
        print(f"\nResults saved to: {Colors.YELLOW}{RESULTS_FILE}{Colors.END}\n")

if __name__ == '__main__':
    tester = APITester()
    tester.run_all_tests()
