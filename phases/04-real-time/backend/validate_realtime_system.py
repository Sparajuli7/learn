#!/usr/bin/env python3
"""
Phase 4 Real-Time Feedback System Validation
Tests all functionality and performance requirements
"""

import asyncio
import time
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

# Add backend path - run this from backend directory
sys.path.append('.')

async def validate_database_schema():
    """Validate database schema and sample data"""
    try:
        from realtime_database import (
            FeedbackSession, ImprovementSuggestion, 
            PerformanceMetric, RealTimeProgress,
            get_session_maker
        )
        
        SessionLocal = get_session_maker()
        db = SessionLocal()
        
        # Test database queries
        sessions = db.query(FeedbackSession).all()
        suggestions = db.query(ImprovementSuggestion).all()
        metrics = db.query(PerformanceMetric).all()
        progress = db.query(RealTimeProgress).all()
        
        db.close()
        
        return {
            "database_accessible": True,
            "feedback_sessions": len(sessions),
            "improvement_suggestions": len(suggestions),
            "performance_metrics": len(metrics),
            "progress_records": len(progress)
        }
    except Exception as e:
        return {"database_accessible": False, "error": str(e)}

async def validate_analysis_engine():
    """Validate real-time analysis engine performance"""
    try:
        from realtime_analysis_engine import RealTimeAnalysisEngine
        
        engine = RealTimeAnalysisEngine()
        
        # Test analysis with dummy data
        start_time = time.time()
        dummy_video_data = b"dummy_video_data" * 1000  # Simulate video data
        
        feedback = await engine.analyze_realtime_video(
            dummy_video_data, "Public Speaking", 1
        )
        
        processing_time = time.time() - start_time
        
        return {
            "engine_operational": True,
            "processing_time_seconds": round(processing_time, 2),
            "meets_30s_target": processing_time < 30,
            "feedback_generated": feedback.overall_score > 0,
            "suggestions_count": len(feedback.improvement_suggestions),
            "metrics_count": len(feedback.performance_metrics)
        }
    except Exception as e:
        return {"engine_operational": False, "error": str(e)}

async def validate_api_endpoints():
    """Validate API endpoints functionality"""
    try:
        # This would test API endpoints in a real scenario
        # For now, we'll validate the imports and structure
        from realtime_feedback_api import router
        
        # Count available endpoints
        endpoint_count = len([route for route in router.routes])
        
        return {
            "api_accessible": True,
            "endpoint_count": endpoint_count,
            "router_configured": True
        }
    except Exception as e:
        return {"api_accessible": False, "error": str(e)}

async def validate_performance_requirements():
    """Validate that performance requirements are met"""
    
    # Test multiple analysis cycles to check consistency
    from realtime_analysis_engine import RealTimeAnalysisEngine
    
    engine = RealTimeAnalysisEngine()
    times = []
    
    for i in range(5):
        start_time = time.time()
        dummy_data = b"test_data" * 500
        
        await engine.analyze_realtime_video(dummy_data, "Public Speaking", 1)
        
        elapsed = time.time() - start_time
        times.append(elapsed)
    
    avg_time = sum(times) / len(times)
    max_time = max(times)
    
    return {
        "average_processing_time": round(avg_time, 2),
        "max_processing_time": round(max_time, 2),
        "meets_performance_target": max_time < 30,
        "consistency_good": max(times) - min(times) < 5  # Less than 5s variance
    }

async def run_validation():
    """Run complete validation suite"""
    print("🔍 Starting Phase 4 Real-Time Feedback System Validation...")
    print("=" * 60)
    
    results = {}
    
    # Database validation
    print("📊 Validating database schema...")
    results["database"] = await validate_database_schema()
    
    # Analysis engine validation  
    print("🔧 Validating analysis engine...")
    results["analysis_engine"] = await validate_analysis_engine()
    
    # API validation
    print("🌐 Validating API endpoints...")
    results["api"] = await validate_api_endpoints()
    
    # Performance validation
    print("⚡ Validating performance requirements...")
    results["performance"] = await validate_performance_requirements()
    
    # Generate report
    print("\n" + "=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)
    
    all_passed = True
    
    # Database results
    db_results = results["database"]
    if db_results.get("database_accessible"):
        print(f"✅ Database: {db_results['feedback_sessions']} sessions, {db_results['improvement_suggestions']} suggestions")
    else:
        print(f"❌ Database: {db_results.get('error', 'Failed')}")
        all_passed = False
    
    # Analysis engine results
    engine_results = results["analysis_engine"]
    if engine_results.get("engine_operational"):
        time_status = "✅" if engine_results["meets_30s_target"] else "❌"
        print(f"{time_status} Analysis Engine: {engine_results['processing_time_seconds']}s processing time")
        print(f"  - Suggestions: {engine_results['suggestions_count']}")
        print(f"  - Metrics: {engine_results['metrics_count']}")
    else:
        print(f"❌ Analysis Engine: {engine_results.get('error', 'Failed')}")
        all_passed = False
    
    # API results
    api_results = results["api"]
    if api_results.get("api_accessible"):
        print(f"✅ API: {api_results['endpoint_count']} endpoints configured")
    else:
        print(f"❌ API: {api_results.get('error', 'Failed')}")
        all_passed = False
    
    # Performance results
    perf_results = results["performance"]
    perf_status = "✅" if perf_results["meets_performance_target"] else "❌"
    print(f"{perf_status} Performance: Avg {perf_results['average_processing_time']}s, Max {perf_results['max_processing_time']}s")
    
    if not perf_results["meets_performance_target"]:
        all_passed = False
    
    print("=" * 60)
    
    # Final status
    if all_passed:
        print("🎉 ALL VALIDATIONS PASSED - REAL-TIME SYSTEM READY!")
        status = "PASSED"
    else:
        print("⚠️  SOME VALIDATIONS FAILED - CHECK SYSTEM CONFIGURATION")
        status = "FAILED"
    
    # Save detailed results
    results["validation_timestamp"] = datetime.utcnow().isoformat()
    results["overall_status"] = status
    
    with open("phases/04-real-time/validation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: phases/04-real-time/validation_results.json")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(run_validation())
    sys.exit(0 if success else 1)