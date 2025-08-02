#!/usr/bin/env python3
"""
Cross-Domain Skill Transfer Demo
Demonstrates the core functionality without requiring full Phase 1/2 setup
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict

# Create demo database
def create_demo_database():
    """Create a demo database with cross-domain transfer data"""
    conn = sqlite3.connect('cross_domain_demo.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skill_transfers (
            id INTEGER PRIMARY KEY,
            source_skill TEXT NOT NULL,
            target_skill TEXT NOT NULL,
            mapping_data TEXT NOT NULL,
            effectiveness REAL DEFAULT 0.0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transfer_progress (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            transfer_id INTEGER NOT NULL,
            progress_percentage REAL DEFAULT 0.0,
            completed_steps TEXT DEFAULT '[]',
            current_step INTEGER DEFAULT 0,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_completed BOOLEAN DEFAULT FALSE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transfer_feedback (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            transfer_id INTEGER NOT NULL,
            feedback TEXT,
            improvement_score REAL,
            effectiveness_rating REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Sample data
    transfers = [
        {
            'source_skill': 'Boxing',
            'target_skill': 'Public Speaking',
            'effectiveness': 0.85,
            'mapping_data': json.dumps({
                'mappings': [
                    {
                        'source_component': 'Footwork',
                        'target_component': 'Stage Presence',
                        'mapping_strength': 0.85,
                        'description': 'Boxing footwork translates to confident stage movement',
                        'examples': [
                            'Balanced stance → Confident posture',
                            'Quick movement → Dynamic stage presence',
                            'Pivot techniques → Audience engagement'
                        ],
                        'difficulty_level': 2,
                        'estimated_hours': 15
                    },
                    {
                        'source_component': 'Timing & Rhythm',
                        'target_component': 'Speech Rhythm',
                        'mapping_strength': 0.9,
                        'description': 'Boxing timing enhances speech pacing and pauses',
                        'examples': [
                            'Reading opponent rhythm → Reading audience energy',
                            'Combo timing → Key message delivery',
                            'Strategic pauses → Dramatic effect'
                        ],
                        'difficulty_level': 3,
                        'estimated_hours': 20
                    }
                ]
            })
        },
        {
            'source_skill': 'Coding',
            'target_skill': 'Cooking',
            'effectiveness': 0.75,
            'mapping_data': json.dumps({
                'mappings': [
                    {
                        'source_component': 'Debugging',
                        'target_component': 'Taste Testing',
                        'mapping_strength': 0.85,
                        'description': 'Systematic debugging approach applies to flavor refinement',
                        'examples': [
                            'Isolate bugs → Identify flavor issues',
                            'Test edge cases → Try recipe variations',
                            'Performance optimization → Balance flavors'
                        ],
                        'difficulty_level': 3,
                        'estimated_hours': 18
                    }
                ]
            })
        },
        {
            'source_skill': 'Music',
            'target_skill': 'Business',
            'effectiveness': 0.8,
            'mapping_data': json.dumps({
                'mappings': [
                    {
                        'source_component': 'Improvisation',
                        'target_component': 'Strategic Adaptation',
                        'mapping_strength': 0.9,
                        'description': 'Musical improvisation enhances business agility',
                        'examples': [
                            'Real-time adaptation → Market response',
                            'Theme development → Strategy building',
                            'Reading the room → Audience adaptation'
                        ],
                        'difficulty_level': 4,
                        'estimated_hours': 25
                    }
                ]
            })
        }
    ]
    
    for transfer in transfers:
        cursor.execute('''
            INSERT INTO skill_transfers (source_skill, target_skill, mapping_data, effectiveness)
            VALUES (?, ?, ?, ?)
        ''', (transfer['source_skill'], transfer['target_skill'], 
              transfer['mapping_data'], transfer['effectiveness']))
    
    conn.commit()
    conn.close()
    print("✅ Demo database created successfully!")

def get_transfer_recommendations(user_skills: List[str]) -> List[Dict]:
    """Get cross-domain transfer recommendations"""
    conn = sqlite3.connect('cross_domain_demo.db')
    cursor = conn.cursor()
    
    recommendations = []
    
    cursor.execute('SELECT * FROM skill_transfers')
    transfers = cursor.fetchall()
    
    for transfer in transfers:
        id, source_skill, target_skill, mapping_data, effectiveness, created_at = transfer
        
        if source_skill in user_skills:
            mapping_info = json.loads(mapping_data)
            
            recommendation = {
                'transfer_id': id,
                'source_skill': source_skill,
                'target_skill': target_skill,
                'effectiveness': effectiveness,
                'recommendation_score': effectiveness * 0.9,  # Simple scoring
                'total_estimated_hours': sum(m['estimated_hours'] for m in mapping_info['mappings']),
                'num_mappings': len(mapping_info['mappings']),
                'key_mappings': mapping_info['mappings'][:3],
                'learning_path': generate_learning_path(mapping_info['mappings'])
            }
            recommendations.append(recommendation)
    
    conn.close()
    return sorted(recommendations, key=lambda x: x['recommendation_score'], reverse=True)

def generate_learning_path(mappings: List[Dict]) -> Dict:
    """Generate a structured learning path"""
    total_hours = sum(m['estimated_hours'] for m in mappings)
    
    phases = []
    for i, mapping in enumerate(mappings):
        phase = {
            'phase_number': i + 1,
            'title': f"Master {mapping['target_component']}",
            'description': mapping['description'],
            'estimated_hours': mapping['estimated_hours'],
            'difficulty': mapping['difficulty_level'],
            'exercises': [
                {
                    'title': f"Practice {mapping['target_component']} Basics",
                    'description': f"Apply {mapping['source_component']} principles",
                    'duration': 30,
                    'examples': mapping['examples'][:2]
                }
            ]
        }
        phases.append(phase)
    
    return {
        'total_phases': len(phases),
        'total_hours': total_hours,
        'estimated_weeks': max(1, total_hours // 10),
        'phases': phases
    }

def start_transfer_journey(user_id: int, transfer_id: int) -> Dict:
    """Start a skill transfer journey"""
    conn = sqlite3.connect('cross_domain_demo.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transfer_progress (user_id, transfer_id, progress_percentage, current_step)
        VALUES (?, ?, 0.0, 0)
    ''', (user_id, transfer_id))
    
    progress_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        'status': 'started',
        'progress_id': progress_id,
        'message': 'Transfer journey started successfully!'
    }

def demo_cross_domain_engine():
    """Run a complete demo of the cross-domain engine"""
    print("🎯 Cross-Domain Skill Transfer Engine Demo")
    print("=" * 50)
    
    # Create demo database
    create_demo_database()
    
    # Demo user skills
    user_skills = ['Boxing', 'Music', 'Coding']
    print(f"👤 User Skills: {', '.join(user_skills)}")
    print()
    
    # Get recommendations
    print("🔍 Getting Transfer Recommendations...")
    recommendations = get_transfer_recommendations(user_skills)
    
    for rec in recommendations:
        print(f"\n📋 Transfer: {rec['source_skill']} → {rec['target_skill']}")
        print(f"   ✨ Effectiveness: {rec['effectiveness']:.0%}")
        print(f"   ⏱️  Total Time: {rec['total_estimated_hours']} hours")
        print(f"   📚 Learning Path: {rec['learning_path']['total_phases']} phases")
        
        print("   🎯 Key Mappings:")
        for mapping in rec['key_mappings']:
            print(f"      • {mapping['source_component']} → {mapping['target_component']}")
            print(f"        Strength: {mapping['mapping_strength']:.0%} | {mapping['description']}")
    
    # Demo starting a transfer
    if recommendations:
        print(f"\n🚀 Starting Transfer Journey: {recommendations[0]['source_skill']} → {recommendations[0]['target_skill']}")
        result = start_transfer_journey(user_id=1, transfer_id=recommendations[0]['transfer_id'])
        print(f"   ✅ {result['message']}")
        print(f"   📊 Progress ID: {result['progress_id']}")
    
    # Show learning path details
    if recommendations:
        learning_path = recommendations[0]['learning_path']
        print(f"\n📚 Detailed Learning Path:")
        print(f"   📊 {learning_path['total_phases']} phases, {learning_path['total_hours']} hours, ~{learning_path['estimated_weeks']} weeks")
        
        for phase in learning_path['phases'][:2]:  # Show first 2 phases
            print(f"\n   Phase {phase['phase_number']}: {phase['title']}")
            print(f"   📖 {phase['description']}")
            print(f"   ⏱️  {phase['estimated_hours']} hours | Difficulty: {phase['difficulty']}/5")
            
            for exercise in phase['exercises']:
                print(f"      🎯 Exercise: {exercise['title']}")
                print(f"         📝 {exercise['description']}")
                if exercise['examples']:
                    print(f"         💡 Examples: {', '.join(exercise['examples'])}")
    
    print(f"\n🎉 Demo Complete! Database saved as 'cross_domain_demo.db'")
    print("💡 This demonstrates the core cross-domain skill transfer functionality!")

if __name__ == "__main__":
    demo_cross_domain_engine()