# SkillMirror Mobile API Documentation

## Overview

The SkillMirror Mobile API provides comprehensive access to all SkillMirror features for mobile applications and third-party integrations. This RESTful API enables video analysis, expert comparisons, skill transfer analytics, and real-time feedback capabilities.

## Base URL

```
Production: https://api.skillmirror.com
Development: http://localhost:8006
```

## Authentication

All API requests require authentication using API tokens. Include your token in the Authorization header:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### API Token Types

- **Development**: Limited functionality, 1,000 requests/hour
- **Production**: Full functionality, configurable rate limits
- **Enterprise**: Custom rate limits and dedicated support

## Rate Limiting

API requests are rate-limited based on your token type:

- Development: 1,000 requests/hour
- Production: 10,000 requests/hour (default)
- Enterprise: Custom limits

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Your rate limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## API Endpoints

### Health Check

#### GET /health

Check API service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "video_analysis": "ready",
    "expert_patterns": "ready",
    "cross_domain": "ready",
    "real_time": "ready"
  }
}
```

### Mobile Session Management

#### POST /mobile/session/start

Start a new mobile session for tracking.

**Request Body:**
```json
{
  "device_info": {
    "platform": "mobile",
    "os": "ios",
    "app_version": "1.0.0",
    "device_model": "iPhone 13",
    "screen_dimensions": {
      "width": 390,
      "height": 844
    }
  },
  "network_type": "wifi",
  "battery_level": 85,
  "app_version": "1.0.0",
  "os_version": "17.2.0"
}
```

**Response:**
```json
{
  "session_id": "mobile_1705312200_abc123",
  "created_at": "2024-01-15T10:30:00Z",
  "message": "Mobile session started successfully"
}
```

#### PUT /mobile/session/{session_id}

Update mobile session data.

**Request Body:**
```json
{
  "session_data": {
    "current_screen": "recording",
    "user_actions": ["start_recording", "apply_filter"]
  },
  "network_type": "4g",
  "battery_level": 78
}
```

#### POST /mobile/session/{session_id}/end

End a mobile session.

**Response:**
```json
{
  "session_id": "mobile_1705312200_abc123",
  "ended_at": "2024-01-15T11:15:00Z",
  "duration": 2700,
  "message": "Session ended successfully"
}
```

### Video Upload and Analysis

#### POST /api/video/upload

Upload a video file for analysis.

**Headers:**
- `Content-Type: multipart/form-data`
- `skill-type: Public Speaking`

**Form Data:**
- `file`: Video file (MP4, MOV, AVI)

**Response:**
```json
{
  "video_id": 123,
  "filename": "presentation.mp4",
  "file_size": 15728640,
  "skill_type": "Public Speaking",
  "upload_time": "2024-01-15T10:30:00Z",
  "message": "Video uploaded successfully"
}
```

#### POST /api/video/analyze

Analyze an uploaded video.

**Request Body:**
```json
{
  "video_id": 123,
  "skill_type": "Public Speaking",
  "analysis_options": {
    "include_speech": true,
    "include_gestures": true,
    "detailed_feedback": true
  }
}
```

**Response:**
```json
{
  "analysis_id": 456,
  "results": {
    "video_analysis": {
      "posture_score": 82,
      "gesture_score": 78,
      "eye_contact": 85,
      "facial_expression": 88,
      "movement_patterns": {
        "total_movements": 45,
        "effective_gestures": 32,
        "distracting_movements": 3
      }
    },
    "speech_analysis": {
      "clarity_score": 90,
      "pace_score": 75,
      "volume_score": 82,
      "filler_words": 12,
      "pause_analysis": {
        "effective_pauses": 18,
        "awkward_silences": 2
      }
    }
  },
  "confidence_score": 0.85,
  "analysis_time": "2024-01-15T10:32:30Z",
  "message": "Video analysis completed"
}
```

### Expert Comparison

#### POST /api/expert/compare

Compare user performance with an expert.

**Request Body:**
```json
{
  "user_analysis_id": 456,
  "expert_id": 1,
  "comparison_options": {
    "focus_areas": ["posture", "gestures", "speech"],
    "detailed_breakdown": true
  }
}
```

**Response:**
```json
{
  "comparison_id": "mobile_456_1",
  "expert": {
    "id": 1,
    "name": "Martin Luther King Jr.",
    "domain": "Public Speaking",
    "specialty": "Civil Rights Oratory"
  },
  "comparison_results": {
    "overall_similarity": 0.72,
    "strengths": [
      "Strong vocal projection",
      "Effective use of pauses"
    ],
    "areas_for_improvement": [
      "Increase gesture variety",
      "Maintain eye contact longer"
    ],
    "detailed_scores": {
      "posture": {
        "user_score": 82,
        "expert_score": 95,
        "similarity": 0.68
      },
      "gestures": {
        "user_score": 78,
        "expert_score": 92,
        "similarity": 0.71
      }
    }
  },
  "recommendations": {
    "priority_actions": [
      "Practice power poses for 5 minutes daily",
      "Record yourself maintaining eye contact for 30 seconds"
    ],
    "learning_resources": [
      "Expert gesture analysis video",
      "Posture improvement exercises"
    ]
  },
  "analysis_time": "2024-01-15T10:35:00Z",
  "message": "Expert comparison completed"
}
```

### Cross-Domain Skill Transfer

#### POST /api/transfer/analyze

Analyze cross-domain skill transfer potential.

**Request Body:**
```json
{
  "source_skill": "Boxing",
  "target_skill": "Public Speaking",
  "user_level": "intermediate"
}
```

**Response:**
```json
{
  "transfer_id": "mobile_1_1705312200",
  "source_skill": "Boxing",
  "target_skill": "Public Speaking",
  "transfer_analysis": {
    "effectiveness_score": 0.85,
    "confidence_level": 0.92,
    "supporting_evidence": [
      "Physical confidence transfer",
      "Timing and rhythm application",
      "Mental toughness correlation"
    ]
  },
  "learning_path": {
    "phases": [
      {
        "id": 1,
        "title": "Stance & Presence",
        "description": "Transfer physical confidence and grounding",
        "duration_weeks": 2,
        "exercises": [
          "Mirror practice sessions",
          "Power pose training",
          "Breathing technique adaptation"
        ],
        "key_concepts": [
          "Physical confidence",
          "Grounding techniques",
          "Body awareness"
        ]
      }
    ],
    "total_exercises": 15,
    "estimated_weeks": 8
  },
  "effectiveness_score": 0.85,
  "estimated_time": 8,
  "analysis_time": "2024-01-15T10:40:00Z",
  "message": "Skill transfer analysis completed"
}
```

### Real-Time Feedback

#### POST /api/feedback/start

Start a real-time feedback session.

**Request Body:**
```json
{
  "skill_type": "Public Speaking",
  "session_options": {
    "feedback_frequency": "high",
    "focus_areas": ["posture", "gestures", "voice"],
    "real_time_suggestions": true
  }
}
```

**Response:**
```json
{
  "session_id": "mobile_feedback_1_1705312200",
  "skill_type": "Public Speaking",
  "session_options": {
    "feedback_frequency": "high",
    "focus_areas": ["posture", "gestures", "voice"],
    "real_time_suggestions": true
  },
  "status": "active",
  "start_time": "2024-01-15T10:45:00Z",
  "message": "Real-time feedback session started"
}
```

### Data Retrieval

#### GET /api/skills

List available skills for analysis.

**Response:**
```json
{
  "skills": [
    {
      "id": 1,
      "name": "Public Speaking",
      "description": "Presentation and communication skills",
      "difficulty_level": "beginner"
    },
    {
      "id": 2,
      "name": "Dance/Fitness",
      "description": "Movement and coordination analysis",
      "difficulty_level": "intermediate"
    }
  ],
  "message": "Skills retrieved successfully"
}
```

#### GET /api/experts

List available experts for comparison.

**Query Parameters:**
- `skill_type` (optional): Filter by skill type
- `domain` (optional): Filter by domain
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "experts": [
    {
      "id": 1,
      "name": "Martin Luther King Jr.",
      "domain": "Public Speaking",
      "specialty": "Civil Rights Oratory",
      "achievements": [
        "I Have a Dream Speech",
        "Nobel Peace Prize",
        "Civil Rights Leader"
      ],
      "bio": "Iconic civil rights leader known for powerful speeches"
    }
  ],
  "message": "Experts retrieved successfully"
}
```

### Analytics

#### GET /api/analytics/usage

Get API usage analytics.

**Query Parameters:**
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `endpoint` (optional): Filter by specific endpoint

**Response:**
```json
{
  "analytics": [
    {
      "date": "2024-01-15T00:00:00Z",
      "endpoint": "/api/video/upload",
      "total_requests": 150,
      "successful_requests": 148,
      "failed_requests": 2,
      "avg_response_time": 2.3,
      "unique_users": 45
    }
  ],
  "summary": {
    "total_requests": 1500,
    "success_rate": 0.987,
    "avg_response_time": 2.1
  },
  "message": "Usage analytics retrieved successfully"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "detail": "Error description",
  "error_code": "INVALID_TOKEN",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or missing API token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## SDKs and Libraries

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install skillmirror-api`
- **Python**: `pip install skillmirror-api`
- **Swift (iOS)**: Swift Package Manager
- **Kotlin (Android)**: Maven/Gradle

### JavaScript Example

```javascript
import { SkillMirrorAPI } from 'skillmirror-api';

const api = new SkillMirrorAPI({
  apiToken: 'your_api_token',
  baseURL: 'https://api.skillmirror.com'
});

// Upload and analyze video
const uploadResult = await api.uploadVideo(videoFile, 'Public Speaking');
const analysisResult = await api.analyzeVideo(uploadResult.video_id, 'Public Speaking');

// Compare with expert
const comparison = await api.compareWithExpert(analysisResult.analysis_id, 1);
```

### Python Example

```python
from skillmirror_api import SkillMirrorAPI

api = SkillMirrorAPI(
    api_token='your_api_token',
    base_url='https://api.skillmirror.com'
)

# Upload and analyze video
upload_result = api.upload_video('video.mp4', 'Public Speaking')
analysis_result = api.analyze_video(upload_result['video_id'], 'Public Speaking')

# Compare with expert
comparison = api.compare_with_expert(analysis_result['analysis_id'], 1)
```

## Webhooks

Configure webhooks to receive real-time notifications about analysis completion, expert comparisons, and other events.

### Webhook Events

- `video.analysis.completed`
- `expert.comparison.completed`
- `skill.transfer.analyzed`
- `feedback.session.ended`

### Webhook Payload Example

```json
{
  "event": "video.analysis.completed",
  "data": {
    "analysis_id": 456,
    "video_id": 123,
    "user_id": 789,
    "skill_type": "Public Speaking",
    "confidence_score": 0.85,
    "completed_at": "2024-01-15T10:32:30Z"
  },
  "timestamp": "2024-01-15T10:32:31Z"
}
```

## Support

- **Documentation**: https://docs.skillmirror.com
- **API Status**: https://status.skillmirror.com
- **Support Email**: api-support@skillmirror.com
- **Developer Forum**: https://forum.skillmirror.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial release of Mobile API
- Video upload and analysis endpoints
- Expert comparison functionality
- Cross-domain skill transfer analysis
- Real-time feedback capabilities
- Mobile session management
- Comprehensive analytics and monitoring