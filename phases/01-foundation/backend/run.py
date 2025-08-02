#!/usr/bin/env python3
"""
SkillMirror Backend Server
Run this script to start the FastAPI backend server
"""

import uvicorn
import os
from database import create_tables, init_default_skills

def main():
    # Initialize database
    print("Initializing database...")
    create_tables()
    init_default_skills()
    print("Database initialized successfully!")
    
    # Start the server
    print("Starting SkillMirror backend server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )

if __name__ == "__main__":
    main()