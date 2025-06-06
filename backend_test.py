
import requests
import sys
import json
import time
from datetime import datetime

class BackendAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                    return False, response.json()
                except:
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_status_endpoint_get(self):
        """Test getting status checks"""
        success, response = self.run_test(
            "GET Status Checks",
            "GET",
            "status",
            200
        )
        return success, response

    def test_status_endpoint_post(self):
        """Test creating a status check"""
        client_name = f"test_client_{datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "POST Status Check",
            "POST",
            "status",
            200,
            data={"client_name": client_name}
        )
        return success, response

def main():
    # Get backend URL from environment variable
    backend_url = "https://16239e9c-531a-4223-9264-1dc86275ca41.preview.emergentagent.com/api"
    
    print(f"Testing backend API at: {backend_url}")
    
    # Setup tester
    tester = BackendAPITester(backend_url)
    
    # Run tests
    root_success = tester.test_root_endpoint()
    if not root_success:
        print("❌ Root endpoint test failed, stopping tests")
        return 1
    
    status_get_success, status_get_response = tester.test_status_endpoint_get()
    if not status_get_success:
        print("❌ GET status endpoint test failed")
    else:
        print(f"Retrieved {len(status_get_response)} status checks")
    
    status_post_success, status_post_response = tester.test_status_endpoint_post()
    if not status_post_success:
        print("❌ POST status endpoint test failed")
    else:
        print(f"Created status check with ID: {status_post_response.get('id', 'unknown')}")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
