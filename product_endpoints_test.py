#!/usr/bin/env python3
"""
Product Endpoints Test Suite - Focused on Review Request
Tests the specific product endpoints for frontend integration:
1. GET /api/products - Should return list of all products
2. GET /api/products/barcode/{barcode} - Test barcode search functionality
3. GET /api/products/{product_id}/price-comparison - Test price comparison endpoint
"""

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://product-catalog-72.preview.emergentagent.com/api"

class ProductEndpointsTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.test_products = []  # Store created test products
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def setup_auth(self):
        """Setup authentication for testing"""
        print("\n=== Setting up Authentication ===")
        
        # Create test user
        test_user = {
            "username": f"testuser_{int(time.time())}",
            "password": "SecurePass123!",
            "role": "depo"
        }
        
        try:
            # Register user
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=test_user,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Auth Setup - Register", False, 
                              f"Registration failed: {response.status_code}", response.text)
                return False
            
            # Login user
            login_data = {
                "username": test_user["username"],
                "password": test_user["password"]
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Auth Setup - Login", False, 
                              f"Login failed: {response.status_code}", response.text)
                return False
            
            data = response.json()
            self.auth_token = data["access_token"]
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            
            self.log_result("Auth Setup", True, 
                          f"Authentication successful for user: {test_user['username']}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Auth Setup Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def create_test_products(self):
        """Create 2-3 test products with different brands, categories, and barcodes"""
        print("\n=== Creating Test Products ===")
        
        test_products_data = [
            {
                "name": "Aspirin 500mg Tablet",
                "barcode": f"8690123456789",
                "quantity": 150,
                "min_quantity": 20,
                "brand": "Bayer",
                "category": "İlaç",
                "purchase_price": 12.50,
                "sale_price": 18.75,
                "description": "Ağrı kesici ve ateş düşürücü ilaç"
            },
            {
                "name": "Parol 500mg Tablet",
                "barcode": f"8690987654321",
                "quantity": 200,
                "min_quantity": 30,
                "brand": "Atabay",
                "category": "İlaç",
                "purchase_price": 8.25,
                "sale_price": 12.50,
                "description": "Parasetamol içeren ağrı kesici"
            },
            {
                "name": "Dijital Termometre",
                "barcode": f"8691122334455",
                "quantity": 75,
                "min_quantity": 10,
                "brand": "Omron",
                "category": "Medikal Cihaz",
                "purchase_price": 45.00,
                "sale_price": 65.00,
                "description": "Dijital ateş ölçer"
            }
        ]
        
        created_count = 0
        
        for product_data in test_products_data:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/products",
                    json=product_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    product = response.json()
                    self.test_products.append(product)
                    created_count += 1
                    self.log_result(f"Product Creation - {product_data['name']}", True, 
                                  f"Created successfully (ID: {product['id']})")
                else:
                    self.log_result(f"Product Creation - {product_data['name']}", False, 
                                  f"Failed: {response.status_code}", response.text)
                    
            except requests.exceptions.RequestException as e:
                self.log_result(f"Product Creation - {product_data['name']}", False, 
                              f"Connection error: {str(e)}")
        
        if created_count > 0:
            self.log_result("Test Products Setup", True, 
                          f"Created {created_count} test products successfully")
            return True
        else:
            self.log_result("Test Products Setup", False, 
                          "Failed to create any test products")
            return False
    
    def test_get_products_endpoint(self):
        """Test GET /api/products - Should return list of all products"""
        print("\n=== Testing GET /api/products ===")
        
        if not self.auth_token:
            self.log_result("GET Products Auth", False, "No authentication token available")
            return False
        
        try:
            response = self.session.get(f"{BACKEND_URL}/products", timeout=10)
            
            if response.status_code != 200:
                self.log_result("GET Products Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                products = response.json()
            except json.JSONDecodeError as e:
                self.log_result("GET Products JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            # Should return a list
            if not isinstance(products, list):
                self.log_result("GET Products Format", False, 
                              f"Expected list, got {type(products)}", products)
                return False
            
            # Verify our test products are in the list
            test_product_ids = [p["id"] for p in self.test_products]
            found_products = [p for p in products if p["id"] in test_product_ids]
            
            if len(found_products) != len(self.test_products):
                self.log_result("GET Products Content", False, 
                              f"Expected {len(self.test_products)} test products, found {len(found_products)}")
                return False
            
            # Verify product fields are complete
            required_fields = ["id", "name", "barcode", "brand", "category", "quantity", "sale_price"]
            for product in found_products:
                missing_fields = [field for field in required_fields if field not in product]
                if missing_fields:
                    self.log_result("GET Products Fields", False, 
                                  f"Missing fields in product {product.get('name', 'Unknown')}: {missing_fields}")
                    return False
            
            self.log_result("GET /api/products", True, 
                          f"Endpoint working correctly. Returned {len(products)} products, including all {len(self.test_products)} test products")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("GET Products Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def test_get_product_by_barcode(self):
        """Test GET /api/products/barcode/{barcode} - Test barcode search functionality"""
        print("\n=== Testing GET /api/products/barcode/{barcode} ===")
        
        if not self.auth_token:
            self.log_result("Barcode Search Auth", False, "No authentication token available")
            return False
        
        if not self.test_products:
            self.log_result("Barcode Search Setup", False, "No test products available")
            return False
        
        # Test with existing barcode
        test_product = self.test_products[0]
        test_barcode = test_product["barcode"]
        
        try:
            response = self.session.get(f"{BACKEND_URL}/products/barcode/{test_barcode}", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Barcode Search Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                product = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Barcode Search JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            # Verify it's the correct product
            if product["id"] != test_product["id"]:
                self.log_result("Barcode Search Match", False, 
                              f"Wrong product returned. Expected ID: {test_product['id']}, Got: {product['id']}")
                return False
            
            if product["barcode"] != test_barcode:
                self.log_result("Barcode Search Barcode", False, 
                              f"Barcode mismatch. Expected: {test_barcode}, Got: {product['barcode']}")
                return False
            
            # Verify all required fields are present
            required_fields = ["id", "name", "barcode", "brand", "category", "quantity", "sale_price"]
            missing_fields = [field for field in required_fields if field not in product]
            if missing_fields:
                self.log_result("Barcode Search Fields", False, 
                              f"Missing fields in response: {missing_fields}")
                return False
            
            self.log_result("Barcode Search - Valid Barcode", True, 
                          f"Found product: {product['name']} (Barcode: {product['barcode']})")
            
            # Test with non-existent barcode
            fake_barcode = "9999999999999"
            response = self.session.get(f"{BACKEND_URL}/products/barcode/{fake_barcode}", timeout=10)
            
            if response.status_code != 404:
                self.log_result("Barcode Search - Invalid Barcode", False, 
                              f"Expected 404 for non-existent barcode, got {response.status_code}")
                return False
            
            self.log_result("Barcode Search - Invalid Barcode", True, 
                          "Correctly returned 404 for non-existent barcode")
            
            self.log_result("GET /api/products/barcode/{barcode}", True, 
                          "Barcode search functionality working correctly")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Barcode Search Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def test_product_price_comparison(self):
        """Test GET /api/products/{product_id}/price-comparison - Test price comparison endpoint"""
        print("\n=== Testing GET /api/products/{product_id}/price-comparison ===")
        
        if not self.auth_token:
            self.log_result("Price Comparison Auth", False, "No authentication token available")
            return False
        
        if not self.test_products:
            self.log_result("Price Comparison Setup", False, "No test products available")
            return False
        
        # Test with existing product
        test_product = self.test_products[0]
        product_id = test_product["id"]
        
        try:
            response = self.session.get(f"{BACKEND_URL}/products/{product_id}/price-comparison", timeout=15)
            
            if response.status_code != 200:
                self.log_result("Price Comparison Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                comparison_data = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Price Comparison JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            # Verify required fields in response
            required_fields = ["product_id", "product_name", "brand", "category", "current_price", "barcode", "price_results"]
            missing_fields = [field for field in required_fields if field not in comparison_data]
            
            if missing_fields:
                self.log_result("Price Comparison Fields", False, 
                              f"Missing required fields: {missing_fields}", comparison_data)
                return False
            
            # Verify data correctness
            data_issues = []
            if comparison_data["product_id"] != product_id:
                data_issues.append(f"product_id mismatch: expected {product_id}, got {comparison_data['product_id']}")
            if comparison_data["product_name"] != test_product["name"]:
                data_issues.append(f"product_name mismatch: expected {test_product['name']}, got {comparison_data['product_name']}")
            if comparison_data["brand"] != test_product["brand"]:
                data_issues.append(f"brand mismatch: expected {test_product['brand']}, got {comparison_data['brand']}")
            if comparison_data["category"] != test_product["category"]:
                data_issues.append(f"category mismatch: expected {test_product['category']}, got {comparison_data['category']}")
            if comparison_data["current_price"] != test_product["sale_price"]:
                data_issues.append(f"current_price mismatch: expected {test_product['sale_price']}, got {comparison_data['current_price']}")
            if comparison_data["barcode"] != test_product["barcode"]:
                data_issues.append(f"barcode mismatch: expected {test_product['barcode']}, got {comparison_data['barcode']}")
            
            if data_issues:
                self.log_result("Price Comparison Data Validation", False, 
                              f"Data validation issues: {data_issues}", comparison_data)
                return False
            
            # Verify price_results is a list
            if not isinstance(comparison_data["price_results"], list):
                self.log_result("Price Comparison Results Format", False, 
                              f"price_results should be a list, got {type(comparison_data['price_results'])}")
                return False
            
            # Check if we have price results (could be empty if SerpAPI fails, but should still be a list)
            result_count = len(comparison_data["price_results"])
            
            self.log_result("Price Comparison Data Validation", True, 
                          "All product data fields match correctly")
            
            self.log_result("GET /api/products/{product_id}/price-comparison", True, 
                          f"Price comparison endpoint working. Product: {comparison_data['product_name']}, Results: {result_count}")
            
            # Test with non-existent product ID
            fake_product_id = "fake-product-id-12345"
            response = self.session.get(f"{BACKEND_URL}/products/{fake_product_id}/price-comparison", timeout=10)
            
            if response.status_code != 404:
                self.log_result("Price Comparison - Invalid Product", False, 
                              f"Expected 404 for non-existent product, got {response.status_code}")
                return False
            
            self.log_result("Price Comparison - Invalid Product", True, 
                          "Correctly returned 404 for non-existent product")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Price Comparison Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def run_product_endpoint_tests(self):
        """Run all product endpoint tests as requested in review"""
        print(f"🚀 Starting Product Endpoints Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Step 1: Setup authentication
        auth_success = self.setup_auth()
        if not auth_success:
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return False
        
        # Step 2: Create test products
        products_created = self.create_test_products()
        if not products_created:
            print("❌ Test product creation failed. Cannot proceed with endpoint tests.")
            return False
        
        # Step 3: Test GET /api/products
        products_test = self.test_get_products_endpoint()
        
        # Step 4: Test GET /api/products/barcode/{barcode}
        barcode_test = self.test_get_product_by_barcode()
        
        # Step 5: Test GET /api/products/{product_id}/price-comparison
        price_comparison_test = self.test_product_price_comparison()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 PRODUCT ENDPOINTS TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        # Show specific endpoint results
        endpoint_results = {
            "GET /api/products": products_test,
            "GET /api/products/barcode/{barcode}": barcode_test,
            "GET /api/products/{product_id}/price-comparison": price_comparison_test
        }
        
        print(f"\n📊 ENDPOINT RESULTS:")
        for endpoint, success in endpoint_results.items():
            status = "✅ WORKING" if success else "❌ FAILED"
            print(f"  {status} {endpoint}")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Overall assessment
        critical_endpoints_working = all(endpoint_results.values())
        
        if critical_endpoints_working:
            print(f"\n✅ All requested product endpoints are working correctly!")
            print(f"✅ Frontend integration should work properly with these endpoints.")
            return True
        else:
            print(f"\n❌ Some product endpoints are not working correctly.")
            print(f"❌ Frontend integration may have issues.")
            return False

def main():
    """Main test execution"""
    tester = ProductEndpointsTester()
    success = tester.run_product_endpoint_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()