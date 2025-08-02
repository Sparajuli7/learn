'use client'

import { useState, useEffect } from 'react'
import { FiActivity, FiMic, FiUser, FiTrendingUp, FiCheck, FiAlertTriangle, FiInfo, FiTarget, FiBarChart3 } from 'react-icons/fi'

interface AnalysisResult {
  analysis_id: number
  video_id: number
  analysis: {
    video_analysis: any
    speech_analysis: any
    skill_type: string
  }
  feedback: {
    overall_score: number
    strengths: string[]
    improvements: string[]
    specific_tips: string[]
    next_steps: string[]
  }
  status: string
}

interface AnalysisDisplayProps {
  result: AnalysisResult | null
  isAnalyzing: boolean
  selectedSkill: string
}

interface ScoreCardProps {
  title: string
  score: number
  icon: React.ComponentType<any>
  description: string
  color?: string
}

function ScoreCard({ title, score, icon: Icon, description, color = 'primary' }: ScoreCardProps) {
  const getColorClasses = (color: string, score: number) => {
    if (score >= 0.8) {
      return 'bg-success-50 border-success-200 text-success-700'
    } else if (score >= 0.6) {
      return 'bg-warning-50 border-warning-200 text-warning-700'
    } else {
      return 'bg-error-50 border-error-200 text-error-700'
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 0.8) return 'bg-success-500'
    if (score >= 0.6) return 'bg-warning-500'
    return 'bg-error-500'
  }

  return (
    <div className={`p-4 rounded-lg border ${getColorClasses(color, score)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5" />
          <h4 className="font-medium">{title}</h4>
        </div>
        <span className="text-sm font-bold">{Math.round(score * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
          style={{ width: `${score * 100}%` }}
        ></div>
      </div>
      <p className="text-xs opacity-80">{description}</p>
    </div>
  )
}

export default function AnalysisDisplay({ result, isAnalyzing, selectedSkill }: AnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'feedback'>('overview')

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiActivity className="w-8 h-8 text-primary-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Performance</h3>
          <p className="text-gray-600 mb-6">
            Our AI is examining your {selectedSkill.toLowerCase()} skills...
          </p>
          
          {/* Analysis Steps */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Video processing complete</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Analyzing body movement and posture</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">Processing speech and audio</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">Generating personalized feedback</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
          <p className="text-gray-600">
            Upload a video or start recording to get instant feedback on your {selectedSkill.toLowerCase()} skills.
          </p>
          
          {/* What we analyze preview */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-left">
            <div className="p-3 bg-gray-50 rounded-lg">
              <FiUser className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="font-medium text-sm">Body Language</h4>
              <p className="text-xs text-gray-600">Posture, confidence, movement</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <FiMic className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="font-medium text-sm">Speech Quality</h4>
              <p className="text-xs text-gray-600">Pace, tone, clarity</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <FiActivity className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="font-medium text-sm">Technique</h4>
              <p className="text-xs text-gray-600">Skill-specific analysis</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <FiTarget className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="font-medium text-sm">Improvement</h4>
              <p className="text-xs text-gray-600">Personalized tips</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { analysis, feedback } = result
  const videoAnalysis = analysis.video_analysis || {}
  const speechAnalysis = analysis.speech_analysis || {}

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
            <p className="text-sm text-gray-600">{selectedSkill} Performance</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(feedback.overall_score * 100)}%
            </div>
            <p className="text-xs text-gray-600">Overall Score</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'detailed'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Detailed
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'feedback'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Feedback
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScoreCard
                title="Movement Quality"
                score={videoAnalysis.movement_score || 0.75}
                icon={FiActivity}
                description="Body language and coordination"
              />
              <ScoreCard
                title="Speech Quality"
                score={speechAnalysis.overall_speech_score || 0.7}
                icon={FiMic}
                description="Pace, tone, and clarity"
              />
              <ScoreCard
                title="Confidence"
                score={videoAnalysis.confidence_score || 0.8}
                icon={FiUser}
                description="Posture and presence"
              />
              <ScoreCard
                title="Technique"
                score={feedback.overall_score || 0.75}
                icon={FiTrendingUp}
                description="Skill-specific performance"
              />
            </div>

            {/* Quick Insights */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
              <div className="space-y-2">
                {feedback.strengths.slice(0, 2).map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <FiCheck className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                ))}
                {feedback.improvements.slice(0, 2).map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <FiAlertTriangle className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Video Analysis */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Video Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Joint Tracking</p>
                  <p className="text-gray-600">
                    {videoAnalysis.joint_tracking?.detected_joints || 15} points detected
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Quality: {Math.round((videoAnalysis.joint_tracking?.tracking_quality || 0.85) * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Movement Score</p>
                  <p className="text-gray-600">
                    {Math.round((videoAnalysis.movement_score || 0.75) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Smoothness: {Math.round((videoAnalysis.joint_tracking?.movement_smoothness || 0.8) * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Duration</p>
                  <p className="text-gray-600">
                    {Math.round(videoAnalysis.duration || 30)} seconds
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Frames: {videoAnalysis.processed_frames || 150}
                  </p>
                </div>
              </div>
            </div>

            {/* Speech Analysis */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Speech Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Speaking Pace</p>
                  <p className="text-gray-600">
                    {speechAnalysis.pace?.words_per_minute || 150} WPM
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Optimal range: 120-180 WPM
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Tone Quality</p>
                  <p className="text-gray-600">
                    {Math.round((speechAnalysis.tone?.tone_score || 0.7) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: {Math.round((speechAnalysis.tone?.confidence || 0.75) * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Content Score</p>
                  <p className="text-gray-600">
                    {Math.round((speechAnalysis.content?.content_score || 0.8) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Words: {speechAnalysis.content?.word_count || 75}
                  </p>
                </div>
              </div>
            </div>

            {/* Skill-Specific Metrics */}
            {videoAnalysis.skill_specific_metrics && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {selectedSkill} Specific Analysis
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(videoAnalysis.skill_specific_metrics, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FiCheck className="w-4 h-4 text-success-500 mr-2" />
                Strengths
              </h4>
              <div className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <div key={index} className="feedback-positive border rounded-lg p-3">
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FiAlertTriangle className="w-4 h-4 text-warning-500 mr-2" />
                Areas for Improvement
              </h4>
              <div className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <div key={index} className="feedback-warning border rounded-lg p-3">
                    <p className="text-sm">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Tips */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FiInfo className="w-4 h-4 text-primary-500 mr-2" />
                Specific Tips
              </h4>
              <div className="space-y-2">
                {feedback.specific_tips.map((tip, index) => (
                  <div key={index} className="bg-primary-50 border border-primary-200 text-primary-800 rounded-lg p-3">
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FiTarget className="w-4 h-4 text-purple-500 mr-2" />
                Next Steps
              </h4>
              <div className="space-y-2">
                {feedback.next_steps.map((step, index) => (
                  <div key={index} className="bg-purple-50 border border-purple-200 text-purple-800 rounded-lg p-3">
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}