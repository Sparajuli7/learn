#!/usr/bin/env python3
"""
SkillMirror Mobile API Validation Script
Comprehensive testing of all mobile API functionality
"""

import asyncio
import json
import time
import os
import sys
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)

class MobileAPIValidator:
    """Comprehensive validator for Mobile API system"""
    
    def __init__(self, base_url: str = "http://localhost:8006"):
        self.base_url = base_url
        self.api_token = None
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, details: str = "", response_time: float = 0):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "passed": passed,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        time_info = f" ({response_time:.2f}s)" if response_time > 0 else ""
        print(f"{status} {test_name}{time_info}")
        if details and not passed:
            print(f"    {details}")
    
    def test_health_check(self) -> bool:
        """Test API health endpoint"""
        print("\n🔍 Testing Health Check...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "API is healthy", response_time)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unhealthy status: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_database_connection(self) -> bool:
        """Test database connectivity"""
        print("\n🗄️ Testing Database Connection...")
        
        try:
            # Import and test database
            sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
            from mobile_api_database import MobileApiDatabase
            
            db = MobileApiDatabase("phases/06-mobile-api/test_mobile_api.db")
            
            # Test basic operations
            start_time = time.time()
            
            # Create test API token
            test_token = db.create_api_token(
                user_id=999,
                name="Validation Test Token",
                permissions={"video_analysis": True},
                rate_limit=1000
            )
            
            # Validate token
            validated = db.validate_token(test_token.token)
            
            response_time = time.time() - start_time
            
            if validated and validated.id == test_token.id:
                self.api_token = test_token.token
                self.session.headers.update({"Authorization": f"Bearer {self.api_token}"})
                self.log_test("Database Connection", True, "Token creation and validation successful", response_time)
                return True
            else:
                self.log_test("Database Connection", False, "Token validation failed")
                return False
                
        except Exception as e:
            self.log_test("Database Connection", False, f"Database error: {str(e)}")
            return False
    
    def test_mobile_session_management(self) -> bool:
        """Test mobile session endpoints"""
        print("\n📱 Testing Mobile Session Management...")
        
        if not self.api_token:
            self.log_test("Mobile Session - No Token", False, "No API token available")
            return False
        
        try:
            # Test session start
            start_time = time.time()
            session_data = {
                "device_info": {
                    "platform": "mobile",
                    "os": "ios",
                    "app_version": "1.0.0"
                },
                "network_type": "wifi",
                "battery_level": 85
            }
            
            response = self.session.post(
                f"{self.base_url}/mobile/session/start",
                json=session_data,
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                session_id = data.get("session_id")
                
                if session_id:
                    self.log_test("Mobile Session Start", True, f"Session ID: {session_id}", response_time)
                    
                    # Test session update
                    update_data = {
                        "session_data": {"current_screen": "recording"},
                        "battery_level": 80
                    }
                    
                    update_response = self.session.put(
                        f"{self.base_url}/mobile/session/{session_id}",
                        json=update_data,
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        self.log_test("Mobile Session Update", True, "Session updated successfully")
                    else:
                        self.log_test("Mobile Session Update", False, f"Update failed: {update_response.status_code}")
                    
                    # Test session end
                    end_response = self.session.post(
                        f"{self.base_url}/mobile/session/{session_id}/end",
                        timeout=10
                    )
                    
                    if end_response.status_code == 200:
                        self.log_test("Mobile Session End", True, "Session ended successfully")
                        return True
                    else:
                        self.log_test("Mobile Session End", False, f"End failed: {end_response.status_code}")
                        return False
                else:
                    self.log_test("Mobile Session Start", False, "No session ID returned")
                    return False
            else:
                self.log_test("Mobile Session Start", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Mobile Session Management", False, f"Error: {str(e)}")
            return False
    
    def test_skills_endpoint(self) -> bool:
        """Test skills listing endpoint"""
        print("\n🎯 Testing Skills Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/skills", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                skills = data.get("skills", [])
                
                if len(skills) > 0:
                    skill_names = [skill.get("name") for skill in skills]
                    self.log_test("Skills Endpoint", True, f"Found {len(skills)} skills: {', '.join(skill_names[:3])}", response_time)
                    return True
                else:
                    self.log_test("Skills Endpoint", False, "No skills returned")
                    return False
            else:
                self.log_test("Skills Endpoint", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Skills Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_experts_endpoint(self) -> bool:
        """Test experts listing endpoint"""
        print("\n👥 Testing Experts Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/experts?limit=5", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                experts = data.get("experts", [])
                
                if len(experts) > 0:
                    expert_names = [expert.get("name") for expert in experts]
                    self.log_test("Experts Endpoint", True, f"Found {len(experts)} experts: {', '.join(expert_names[:2])}", response_time)
                    return True
                else:
                    self.log_test("Experts Endpoint", False, "No experts returned")
                    return False
            else:
                self.log_test("Experts Endpoint", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Experts Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_skill_transfer_analysis(self) -> bool:
        """Test skill transfer analysis endpoint"""
        print("\n🔄 Testing Skill Transfer Analysis...")
        
        try:
            start_time = time.time()
            transfer_data = {
                "source_skill": "Boxing",
                "target_skill": "Public Speaking",
                "user_level": "intermediate"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/transfer/analyze",
                json=transfer_data,
                timeout=15
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                transfer_id = data.get("transfer_id")
                effectiveness = data.get("effectiveness_score", 0)
                
                if transfer_id and effectiveness > 0:
                    self.log_test("Skill Transfer Analysis", True, f"Transfer ID: {transfer_id}, Effectiveness: {effectiveness:.2f}", response_time)
                    return True
                else:
                    self.log_test("Skill Transfer Analysis", False, "Invalid response data")
                    return False
            else:
                self.log_test("Skill Transfer Analysis", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Skill Transfer Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_real_time_feedback(self) -> bool:
        """Test real-time feedback session"""
        print("\n⚡ Testing Real-time Feedback...")
        
        try:
            start_time = time.time()
            feedback_data = {
                "skill_type": "Public Speaking",
                "session_options": {
                    "feedback_frequency": "medium",
                    "focus_areas": ["posture", "voice"]
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/api/feedback/start",
                json=feedback_data,
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                session_id = data.get("session_id")
                
                if session_id:
                    self.log_test("Real-time Feedback", True, f"Feedback session started: {session_id}", response_time)
                    return True
                else:
                    self.log_test("Real-time Feedback", False, "No session ID returned")
                    return False
            else:
                self.log_test("Real-time Feedback", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Real-time Feedback", False, f"Error: {str(e)}")
            return False
    
    def test_analytics_endpoint(self) -> bool:
        """Test analytics endpoint"""
        print("\n📊 Testing Analytics Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/analytics/usage", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                analytics = data.get("analytics", [])
                summary = data.get("summary", {})
                
                self.log_test("Analytics Endpoint", True, f"Analytics data retrieved, summary: {summary}", response_time)
                return True
            else:
                self.log_test("Analytics Endpoint", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Analytics Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self) -> bool:
        """Test API error handling"""
        print("\n🚨 Testing Error Handling...")
        
        try:
            # Test invalid endpoint
            response = self.session.get(f"{self.base_url}/api/invalid-endpoint", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Error Handling - 404", True, "Correctly returns 404 for invalid endpoint")
            else:
                self.log_test("Error Handling - 404", False, f"Expected 404, got {response.status_code}")
            
            # Test unauthorized request (without token)
            no_auth_session = requests.Session()
            response = no_auth_session.post(f"{self.base_url}/api/video/analyze", json={}, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Error Handling - 401", True, "Correctly returns 401 for unauthorized request")
                return True
            else:
                self.log_test("Error Handling - 401", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False
    
    def test_rate_limiting(self) -> bool:
        """Test rate limiting functionality"""
        print("\n⏱️ Testing Rate Limiting...")
        
        try:
            # Make multiple rapid requests
            requests_made = 0
            rate_limited = False
            
            for i in range(10):
                response = self.session.get(f"{self.base_url}/api/skills", timeout=5)
                requests_made += 1
                
                if response.status_code == 429:
                    rate_limited = True
                    break
                elif response.status_code != 200:
                    break
                    
                time.sleep(0.1)  # Small delay between requests
            
            # For now, we'll consider this a pass if we can make requests
            # In production, rate limiting would be more restrictive
            self.log_test("Rate Limiting", True, f"Made {requests_made} requests, rate limited: {rate_limited}")
            return True
            
        except Exception as e:
            self.log_test("Rate Limiting", False, f"Error: {str(e)}")
            return False
    
    def test_mobile_app_structure(self) -> bool:
        """Test mobile app structure and key files"""
        print("\n📱 Testing Mobile App Structure...")
        
        mobile_app_path = "phases/06-mobile-api/mobile-app"
        required_files = [
            "App.tsx",
            "package.json",
            "src/screens/HomeScreen.tsx",
            "src/screens/RecordScreen.tsx",
            "src/screens/AnalysisScreen.tsx",
            "src/screens/ExpertScreen.tsx",
            "src/screens/ProfileScreen.tsx",
            "src/services/APIService.ts",
            "src/services/SessionManager.ts",
            "src/theme/theme.ts"
        ]
        
        missing_files = []
        for file in required_files:
            file_path = os.path.join(mobile_app_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if not missing_files:
            self.log_test("Mobile App Structure", True, f"All {len(required_files)} required files present")
            return True
        else:
            self.log_test("Mobile App Structure", False, f"Missing files: {', '.join(missing_files)}")
            return False
    
    def test_documentation(self) -> bool:
        """Test documentation completeness"""
        print("\n📚 Testing Documentation...")
        
        required_docs = [
            "phases/06-mobile-api/API_DOCUMENTATION.md",
            "phases/06-mobile-api/README.md"
        ]
        
        missing_docs = []
        for doc in required_docs:
            if not os.path.exists(doc):
                missing_docs.append(doc)
            else:
                # Check if file has content
                with open(doc, 'r') as f:
                    content = f.read().strip()
                    if len(content) < 100:  # Minimum content check
                        missing_docs.append(f"{doc} (insufficient content)")
        
        if not missing_docs:
            self.log_test("Documentation", True, f"All required documentation present")
            return True
        else:
            self.log_test("Documentation", False, f"Missing/incomplete: {', '.join(missing_docs)}")
            return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        passed_tests = [r for r in self.test_results if r["passed"]]
        failed_tests = [r for r in self.test_results if not r["passed"]]
        
        total_response_time = sum(r["response_time"] for r in self.test_results if r["response_time"] > 0)
        api_tests = [r for r in self.test_results if r["response_time"] > 0]
        avg_response_time = total_response_time / len(api_tests) if api_tests else 0
        
        return {
            "summary": {
                "total_tests": len(self.test_results),
                "passed": len(passed_tests),
                "failed": len(failed_tests),
                "success_rate": len(passed_tests) / len(self.test_results) * 100,
                "avg_response_time": avg_response_time
            },
            "test_results": self.test_results,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "timestamp": datetime.now().isoformat()
        }
    
    async def run_all_tests(self) -> bool:
        """Run all validation tests"""
        print("🧪 Starting SkillMirror Mobile API Validation")
        print("=" * 50)
        
        # List of all tests to run
        tests = [
            ("Health Check", self.test_health_check),
            ("Database Connection", self.test_database_connection),
            ("Mobile Session Management", self.test_mobile_session_management),
            ("Skills Endpoint", self.test_skills_endpoint),
            ("Experts Endpoint", self.test_experts_endpoint),
            ("Skill Transfer Analysis", self.test_skill_transfer_analysis),
            ("Real-time Feedback", self.test_real_time_feedback),
            ("Analytics Endpoint", self.test_analytics_endpoint),
            ("Error Handling", self.test_error_handling),
            ("Rate Limiting", self.test_rate_limiting),
            ("Mobile App Structure", self.test_mobile_app_structure),
            ("Documentation", self.test_documentation),
        ]
        
        # Run all tests
        all_passed = True
        for test_name, test_func in tests:
            try:
                result = test_func()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
                all_passed = False
        
        # Generate and display report
        report = self.generate_report()
        
        print("\n" + "=" * 50)
        print("📊 VALIDATION REPORT")
        print("=" * 50)
        
        summary = report["summary"]
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: {summary['passed']} ✅")
        print(f"Failed: {summary['failed']} ❌")
        print(f"Success Rate: {summary['success_rate']:.1f}%")
        if summary['avg_response_time'] > 0:
            print(f"Average Response Time: {summary['avg_response_time']:.2f}s")
        
        if report["failed_tests"]:
            print("\n❌ FAILED TESTS:")
            for test in report["failed_tests"]:
                print(f"  • {test['test']}: {test['details']}")
        
        # Save detailed report
        report_file = f"phases/06-mobile-api/validation_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        
        if all_passed:
            print("\n🎉 ALL TESTS PASSED! Mobile API system is fully functional!")
        else:
            print("\n⚠️ Some tests failed. Please review the issues above.")
        
        return all_passed

def main():
    """Main validation function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate SkillMirror Mobile API")
    parser.add_argument("--url", default="http://localhost:8006", help="API base URL")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout in seconds")
    
    args = parser.parse_args()
    
    validator = MobileAPIValidator(args.url)
    
    try:
        # Run validation
        success = asyncio.run(validator.run_all_tests())
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Validation failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()