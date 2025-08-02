import cv2
import mediapipe as mp
import numpy as np
import json
from typing import Dict, List, Any, Tuple
import asyncio
import os

class VideoAnalyzer:
    def __init__(self):
        # Initialize MediaPipe
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose = mp.solutions.pose
        self.mp_hands = mp.solutions.hands
        self.mp_face_mesh = mp.solutions.face_mesh
        
        # Initialize pose detection
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize hand tracking
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Initialize face mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    async def analyze_video(self, video_path: str, skill_type: str) -> Dict[str, Any]:
        """Analyze video for joint tracking and movement patterns"""
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")
        
        # Video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Analysis data storage
        pose_data = []
        hand_data = []
        face_data = []
        frame_analysis = []
        
        frame_idx = 0
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process frame
                frame_result = await self._analyze_frame(rgb_frame, frame_idx, fps)
                
                if frame_result:
                    pose_data.append(frame_result.get('pose'))
                    hand_data.append(frame_result.get('hands'))
                    face_data.append(frame_result.get('face'))
                    frame_analysis.append(frame_result.get('metrics'))
                
                frame_idx += 1
                
                # Process every 5th frame for performance
                for _ in range(4):
                    ret, _ = cap.read()
                    if not ret:
                        break
                    frame_idx += 1
        
        finally:
            cap.release()
        
        # Generate comprehensive analysis
        analysis_result = {
            "duration": duration,
            "total_frames": frame_count,
            "processed_frames": len(frame_analysis),
            "fps": fps,
            "joint_tracking": await self._analyze_joint_tracking(pose_data),
            "hand_analysis": await self._analyze_hand_movements(hand_data),
            "face_analysis": await self._analyze_face_expressions(face_data),
            "movement_score": await self._calculate_movement_score(frame_analysis, skill_type),
            "confidence_score": await self._calculate_confidence_score(pose_data, face_data),
            "skill_specific_metrics": await self._get_skill_specific_metrics(
                pose_data, hand_data, face_data, skill_type
            )
        }
        
        return analysis_result
    
    async def _analyze_frame(self, frame: np.ndarray, frame_idx: int, fps: float) -> Dict[str, Any]:
        """Analyze a single frame for pose, hands, and face"""
        
        # Pose detection
        pose_results = self.pose.process(frame)
        pose_landmarks = None
        if pose_results.pose_landmarks:
            pose_landmarks = [
                [lm.x, lm.y, lm.z, lm.visibility] 
                for lm in pose_results.pose_landmarks.landmark
            ]
        
        # Hand detection
        hand_results = self.hands.process(frame)
        hand_landmarks = []
        if hand_results.multi_hand_landmarks:
            for hand_lms in hand_results.multi_hand_landmarks:
                hand_landmarks.append([
                    [lm.x, lm.y, lm.z] for lm in hand_lms.landmark
                ])
        
        # Face detection
        face_results = self.face_mesh.process(frame)
        face_landmarks = None
        if face_results.multi_face_landmarks:
            face_landmarks = [
                [lm.x, lm.y, lm.z] 
                for lm in face_results.multi_face_landmarks[0].landmark
            ]
        
        # Calculate frame metrics
        metrics = {
            "timestamp": frame_idx / fps,
            "pose_detected": pose_landmarks is not None,
            "hands_detected": len(hand_landmarks),
            "face_detected": face_landmarks is not None,
            "stability_score": self._calculate_stability(pose_landmarks) if pose_landmarks else 0.0
        }
        
        return {
            "pose": pose_landmarks,
            "hands": hand_landmarks,
            "face": face_landmarks,
            "metrics": metrics
        }
    
    async def _analyze_joint_tracking(self, pose_data: List) -> Dict[str, Any]:
        """Analyze joint tracking quality and movement patterns"""
        
        valid_poses = [p for p in pose_data if p is not None]
        if not valid_poses:
            return {"tracking_quality": 0.0, "detected_joints": 0}
        
        # Count consistently tracked joints (MediaPipe has 33 pose landmarks)
        joint_detection_rates = []
        for joint_idx in range(33):
            detections = sum(1 for pose in valid_poses if len(pose) > joint_idx and pose[joint_idx][3] > 0.5)
            detection_rate = detections / len(valid_poses)
            joint_detection_rates.append(detection_rate)
        
        avg_detection_rate = np.mean(joint_detection_rates)
        detected_joints = sum(1 for rate in joint_detection_rates if rate > 0.7)
        
        # Analyze movement smoothness
        movement_variance = self._calculate_movement_variance(valid_poses)
        
        return {
            "tracking_quality": avg_detection_rate,
            "detected_joints": detected_joints,
            "movement_smoothness": 1.0 - min(movement_variance, 1.0),
            "pose_consistency": len(valid_poses) / len(pose_data)
        }
    
    async def _analyze_hand_movements(self, hand_data: List) -> Dict[str, Any]:
        """Analyze hand movement patterns and gestures"""
        
        valid_hands = [h for h in hand_data if h]
        if not valid_hands:
            return {"hand_activity": 0.0, "gesture_count": 0}
        
        # Calculate hand activity level
        hand_movements = []
        for i in range(1, len(valid_hands)):
            if valid_hands[i] and valid_hands[i-1]:
                movement = self._calculate_hand_movement(valid_hands[i-1], valid_hands[i])
                hand_movements.append(movement)
        
        avg_movement = np.mean(hand_movements) if hand_movements else 0.0
        
        return {
            "hand_activity": min(avg_movement * 10, 1.0),  # Normalize to 0-1
            "gesture_count": len([m for m in hand_movements if m > 0.1]),
            "hand_consistency": len(valid_hands) / len(hand_data)
        }
    
    async def _analyze_face_expressions(self, face_data: List) -> Dict[str, Any]:
        """Analyze facial expressions and eye contact patterns"""
        
        valid_faces = [f for f in face_data if f is not None]
        if not valid_faces:
            return {"expression_activity": 0.0, "eye_contact_score": 0.0}
        
        # Simplified expression analysis (would need more sophisticated model for full analysis)
        face_movements = []
        for i in range(1, len(valid_faces)):
            if valid_faces[i] and valid_faces[i-1]:
                movement = self._calculate_face_movement(valid_faces[i-1], valid_faces[i])
                face_movements.append(movement)
        
        avg_expression_activity = np.mean(face_movements) if face_movements else 0.0
        
        # Estimate eye contact (simplified - would need gaze tracking for accuracy)
        eye_contact_score = 0.8 if len(valid_faces) > len(face_data) * 0.7 else 0.5
        
        return {
            "expression_activity": min(avg_expression_activity * 5, 1.0),
            "eye_contact_score": eye_contact_score,
            "face_consistency": len(valid_faces) / len(face_data)
        }
    
    async def _calculate_movement_score(self, frame_analysis: List, skill_type: str) -> float:
        """Calculate overall movement quality score based on skill type"""
        
        if not frame_analysis:
            return 0.0
        
        # Extract stability scores
        stability_scores = [f.get("stability_score", 0.0) for f in frame_analysis]
        avg_stability = np.mean(stability_scores)
        
        # Skill-specific scoring
        if skill_type == "Public Speaking":
            # Favor stability and controlled movement
            return avg_stability * 0.8 + 0.2
        
        elif skill_type == "Dance/Fitness":
            # Favor dynamic movement with control
            movement_variance = np.var(stability_scores)
            return (avg_stability * 0.6) + (min(movement_variance * 2, 0.4))
        
        else:
            # Default scoring
            return avg_stability
    
    async def _calculate_confidence_score(self, pose_data: List, face_data: List) -> float:
        """Calculate confidence score based on posture and facial analysis"""
        
        valid_poses = [p for p in pose_data if p is not None]
        valid_faces = [f for f in face_data if f is not None]
        
        if not valid_poses:
            return 0.0
        
        # Analyze posture for confidence indicators
        confidence_indicators = []
        
        for pose in valid_poses:
            if len(pose) >= 12:  # Ensure we have shoulder landmarks
                # Shoulder alignment (landmarks 11 and 12)
                left_shoulder = pose[11]
                right_shoulder = pose[12]
                
                if left_shoulder[3] > 0.5 and right_shoulder[3] > 0.5:  # Good visibility
                    shoulder_alignment = abs(left_shoulder[1] - right_shoulder[1])
                    confidence_indicators.append(1.0 - min(shoulder_alignment * 5, 1.0))
        
        posture_confidence = np.mean(confidence_indicators) if confidence_indicators else 0.5
        
        # Face presence as confidence indicator
        face_presence = len(valid_faces) / len(face_data) if face_data else 0.5
        
        return (posture_confidence * 0.7) + (face_presence * 0.3)
    
    async def _get_skill_specific_metrics(
        self, pose_data: List, hand_data: List, face_data: List, skill_type: str
    ) -> Dict[str, Any]:
        """Generate skill-specific analysis metrics"""
        
        if skill_type == "Public Speaking":
            return {
                "posture_stability": await self._analyze_posture_stability(pose_data),
                "gesture_frequency": await self._analyze_gesture_frequency(hand_data),
                "head_movement": await self._analyze_head_movement(pose_data)
            }
        
        elif skill_type == "Dance/Fitness":
            return {
                "rhythm_consistency": await self._analyze_rhythm(pose_data),
                "movement_range": await self._analyze_movement_range(pose_data),
                "coordination_score": await self._analyze_coordination(pose_data, hand_data)
            }
        
        elif skill_type == "Sports/Athletics":
            return {
                "form_analysis": await self._analyze_athletic_form(pose_data),
                "balance_score": await self._analyze_balance(pose_data),
                "power_indicators": await self._analyze_power_movements(pose_data)
            }
        
        else:
            return {"general_metrics": "analyzed"}
    
    # Helper methods for calculations
    def _calculate_stability(self, pose_landmarks) -> float:
        """Calculate pose stability for current frame"""
        if not pose_landmarks or len(pose_landmarks) < 2:
            return 0.0
        
        # Use hip landmarks for stability (indices 23, 24)
        if len(pose_landmarks) >= 25:
            left_hip = pose_landmarks[23]
            right_hip = pose_landmarks[24]
            
            if left_hip[3] > 0.5 and right_hip[3] > 0.5:
                hip_center_y = (left_hip[1] + right_hip[1]) / 2
                # Stability based on hip height consistency (simplified)
                return max(0.0, 1.0 - abs(hip_center_y - 0.5) * 2)
        
        return 0.5
    
    def _calculate_movement_variance(self, poses: List) -> float:
        """Calculate movement variance across poses"""
        if len(poses) < 2:
            return 0.0
        
        movements = []
        for i in range(1, len(poses)):
            if poses[i] and poses[i-1] and len(poses[i]) >= 25 and len(poses[i-1]) >= 25:
                # Calculate movement of key points
                movement = 0.0
                valid_points = 0
                
                for j in range(min(len(poses[i]), len(poses[i-1]))):
                    if poses[i][j][3] > 0.5 and poses[i-1][j][3] > 0.5:
                        dx = poses[i][j][0] - poses[i-1][j][0]
                        dy = poses[i][j][1] - poses[i-1][j][1]
                        movement += (dx * dx + dy * dy) ** 0.5
                        valid_points += 1
                
                if valid_points > 0:
                    movements.append(movement / valid_points)
        
        return np.var(movements) if movements else 0.0
    
    def _calculate_hand_movement(self, hands1: List, hands2: List) -> float:
        """Calculate hand movement between frames"""
        if not hands1 or not hands2:
            return 0.0
        
        total_movement = 0.0
        comparisons = 0
        
        for h1, h2 in zip(hands1, hands2):
            if h1 and h2 and len(h1) == len(h2):
                movement = 0.0
                for p1, p2 in zip(h1, h2):
                    dx = p1[0] - p2[0]
                    dy = p1[1] - p2[1]
                    movement += (dx * dx + dy * dy) ** 0.5
                
                total_movement += movement / len(h1)
                comparisons += 1
        
        return total_movement / comparisons if comparisons > 0 else 0.0
    
    def _calculate_face_movement(self, face1: List, face2: List) -> float:
        """Calculate facial movement between frames"""
        if not face1 or not face2 or len(face1) != len(face2):
            return 0.0
        
        movement = 0.0
        for p1, p2 in zip(face1, face2):
            dx = p1[0] - p2[0]
            dy = p1[1] - p2[1]
            movement += (dx * dx + dy * dy) ** 0.5
        
        return movement / len(face1)
    
    # Skill-specific analysis methods (simplified implementations)
    async def _analyze_posture_stability(self, pose_data: List) -> float:
        valid_poses = [p for p in pose_data if p is not None]
        if not valid_poses:
            return 0.0
        
        stability_scores = [self._calculate_stability(pose) for pose in valid_poses]
        return np.mean(stability_scores)
    
    async def _analyze_gesture_frequency(self, hand_data: List) -> float:
        movements = []
        for i in range(1, len(hand_data)):
            if hand_data[i] and hand_data[i-1]:
                movement = self._calculate_hand_movement(hand_data[i-1], hand_data[i])
                movements.append(movement)
        
        # Count significant gestures
        gestures = [m for m in movements if m > 0.1]
        return len(gestures) / len(hand_data) if hand_data else 0.0
    
    async def _analyze_head_movement(self, pose_data: List) -> float:
        # Simplified head movement analysis
        return 0.7  # Placeholder
    
    async def _analyze_rhythm(self, pose_data: List) -> float:
        # Simplified rhythm analysis
        return 0.8  # Placeholder
    
    async def _analyze_movement_range(self, pose_data: List) -> float:
        # Simplified movement range analysis
        return 0.75  # Placeholder
    
    async def _analyze_coordination(self, pose_data: List, hand_data: List) -> float:
        # Simplified coordination analysis
        return 0.8  # Placeholder
    
    async def _analyze_athletic_form(self, pose_data: List) -> Dict[str, float]:
        # Simplified athletic form analysis
        return {"form_score": 0.8, "technique_score": 0.75}
    
    async def _analyze_balance(self, pose_data: List) -> float:
        # Simplified balance analysis
        return 0.85  # Placeholder
    
    async def _analyze_power_movements(self, pose_data: List) -> float:
        # Simplified power movement analysis
        return 0.7  # Placeholder