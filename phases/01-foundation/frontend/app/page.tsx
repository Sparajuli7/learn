'use client'

import { useState } from 'react'
import Header from './components/Header'
import VideoUpload from './components/VideoUpload'
import VideoRecorder from './components/VideoRecorder'
import AnalysisDisplay from './components/AnalysisDisplay'
import SkillSelector from './components/SkillSelector'
import { FiUpload, FiVideo, FiActivity } from 'react-icons/fi'

interface AnalysisResult {
  analysis_id: number
  video_id: number
  analysis: any
  feedback: any
  status: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload')
  const [selectedSkill, setSelectedSkill] = useState('Public Speaking')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
  }

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setIsAnalyzing(false)
    setAnalysisResult(result)
  }

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false)
    console.error('Analysis error:', error)
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            Master Your Skills with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload or record your practice sessions and get instant, detailed feedback 
            on your technique, confidence, and areas for improvement.
          </p>
          
          {/* Skill Selector */}
          <div className="mb-8">
            <SkillSelector
              selectedSkill={selectedSkill}
              onSkillChange={setSelectedSkill}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Video Input */}
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all ${
                    activeTab === 'upload'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiUpload className="w-5 h-5" />
                  <span>Upload Video</span>
                </button>
                <button
                  onClick={() => setActiveTab('record')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all ${
                    activeTab === 'record'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiVideo className="w-5 h-5" />
                  <span>Record Live</span>
                </button>
              </div>

              {/* Video Input Component */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === 'upload' ? (
                  <VideoUpload
                    selectedSkill={selectedSkill}
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalysisError={handleAnalysisError}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                  />
                ) : (
                  <VideoRecorder
                    selectedSkill={selectedSkill}
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalysisError={handleAnalysisError}
                  />
                )}
              </div>

              {/* Progress Indicator */}
              {isAnalyzing && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <FiActivity className="w-6 h-6 text-primary-600 animate-pulse" />
                    <h3 className="text-lg font-semibold">Analyzing Your Performance</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Processing video and audio...</span>
                      <span>This may take up to 2 minutes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Analysis Results */}
            <div className="space-y-6">
              <AnalysisDisplay
                result={analysisResult}
                isAnalyzing={isAnalyzing}
                selectedSkill={selectedSkill}
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">
            What SkillMirror Analyzes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiActivity className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Body Movement</h3>
              <p className="text-gray-600 text-sm">15+ joint tracking points for posture and movement analysis</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiVideo className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="font-semibold mb-2">Speech Quality</h3>
              <p className="text-gray-600 text-sm">Pace, tone, clarity, and confidence analysis</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiUpload className="w-6 h-6 text-warning-600" />
              </div>
              <h3 className="font-semibold mb-2">Content Analysis</h3>
              <p className="text-gray-600 text-sm">Word choice, structure, and message effectiveness</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiActivity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Feedback</h3>
              <p className="text-gray-600 text-sm">Instant suggestions and improvement tips</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}