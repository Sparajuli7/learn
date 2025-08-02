from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a WebSocket connection and associate it with a user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "user_id": user_id,
            "message": "WebSocket connected successfully"
        }, websocket)
    
    def disconnect(self, user_id: int, websocket: WebSocket = None):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            if websocket:
                # Remove specific websocket
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
            else:
                # Remove all connections for user
                self.active_connections[user_id].clear()
            
            # Clean up empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending message to websocket: {e}")
    
    async def broadcast_to_user(self, user_id: int, message: dict):
        """Send a message to all WebSocket connections for a specific user"""
        if user_id in self.active_connections:
            # Create a copy of the list to avoid modification during iteration
            connections = self.active_connections[user_id].copy()
            
            # Send to all connections for this user
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error broadcasting to user {user_id}: {e}")
                    # Remove failed connection
                    if connection in self.active_connections.get(user_id, []):
                        self.active_connections[user_id].remove(connection)
    
    async def broadcast_to_all(self, message: dict):
        """Send a message to all connected clients"""
        for user_id in list(self.active_connections.keys()):
            await self.broadcast_to_user(user_id, message)
    
    def get_user_connection_count(self, user_id: int) -> int:
        """Get the number of active connections for a user"""
        return len(self.active_connections.get(user_id, []))
    
    def get_total_connections(self) -> int:
        """Get the total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_active_users(self) -> List[int]:
        """Get a list of user IDs with active connections"""
        return list(self.active_connections.keys())
    
    async def send_analysis_progress(self, user_id: int, progress_data: dict):
        """Send analysis progress updates to user"""
        message = {
            "type": "analysis_progress",
            "timestamp": progress_data.get("timestamp"),
            "stage": progress_data.get("stage"),
            "progress_percentage": progress_data.get("progress", 0),
            "details": progress_data.get("details", "")
        }
        await self.broadcast_to_user(user_id, message)
    
    async def send_real_time_feedback(self, user_id: int, feedback_data: dict):
        """Send real-time feedback during analysis"""
        message = {
            "type": "real_time_feedback",
            "timestamp": feedback_data.get("timestamp"),
            "feedback_type": feedback_data.get("type"),
            "data": feedback_data.get("data"),
            "suggestions": feedback_data.get("suggestions", [])
        }
        await self.broadcast_to_user(user_id, message)
    
    async def send_analysis_complete(self, user_id: int, analysis_results: dict):
        """Send complete analysis results"""
        message = {
            "type": "analysis_complete",
            "analysis_id": analysis_results.get("analysis_id"),
            "video_id": analysis_results.get("video_id"),
            "results": analysis_results.get("results"),
            "feedback": analysis_results.get("feedback"),
            "timestamp": analysis_results.get("timestamp")
        }
        await self.broadcast_to_user(user_id, message)
    
    async def send_error(self, user_id: int, error_data: dict):
        """Send error notifications"""
        message = {
            "type": "error",
            "error_code": error_data.get("code"),
            "error_message": error_data.get("message"),
            "details": error_data.get("details", ""),
            "timestamp": error_data.get("timestamp")
        }
        await self.broadcast_to_user(user_id, message)

# Global instance
manager = ConnectionManager()