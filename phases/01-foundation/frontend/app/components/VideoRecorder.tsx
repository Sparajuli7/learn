'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { FiVideo, FiSquare, FiPlay, FiUpload, FiCamera, FiMic, FiMicOff } from 'react-icons/fi'

interface VideoRecorderProps {
  selectedSkill: string
  onAnalysisStart: () => void
  onAnalysisComplete: (result: any) => void
  onAnalysisError: (error: string) => void
}

export default function VideoRecorder({
  selectedSkill,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError
}: VideoRecorderProps) {
  const webcamRef = useRef<Webcam>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [deviceError, setDeviceError] = useState<string>('')

  useEffect(() => {
    // Check for camera and microphone permissions
    checkPermissions()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(time => time + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop()) // Clean up
    } catch (error) {
      console.error('Permission error:', error)
      setHasPermission(false)
      setDeviceError('Camera and microphone access is required for recording.')
    }
  }

  const startRecording = useCallback(() => {
    if (!webcamRef.current?.stream) {
      setDeviceError('Camera stream not available')
      return
    }

    try {
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedVideo(blob)
        setRecordedVideoUrl(URL.createObjectURL(blob))
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      setDeviceError('')
    } catch (error) {
      console.error('Recording start error:', error)
      setDeviceError('Failed to start recording. Please check your camera and microphone.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const handleAnalyze = async () => {
    if (!recordedVideo) return

    setIsProcessing(true)
    onAnalysisStart()

    try {
      const formData = new FormData()
      const file = new File([recordedVideo], 'recorded-video.webm', { type: 'video/webm' })
      formData.append('file', file)
      formData.append('skill_type', selectedSkill)
      formData.append('user_id', '1') // Default user for MVP

      // Upload recorded video
      const uploadResponse = await fetch('/api/upload-video/', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()

      // Start analysis
      const analysisResponse = await fetch(`/api/analyze-video/${uploadResult.video_id}`, {
        method: 'POST',
      })

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.statusText}`)
      }

      const analysisResult = await analysisResponse.json()
      onAnalysisComplete(analysisResult)

    } catch (error) {
      console.error('Analysis error:', error)
      onAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const retakeVideo = () => {
    setRecordedVideo(null)
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl)
      setRecordedVideoUrl(null)
    }
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (hasPermission === false) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCamera className="w-8 h-8 text-error-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
        <p className="text-gray-600 mb-4">
          Please allow camera and microphone access to record your practice session.
        </p>
        <button
          onClick={checkPermissions}
          className="btn-primary"
        >
          Grant Permissions
        </button>
        {deviceError && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{deviceError}</p>
          </div>
        )}
      </div>
    )
  }

  if (hasPermission === null) {
    return (
      <div className="p-6 text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Checking camera permissions...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Record Your Practice</h2>

      <div className="space-y-6">
        {/* Camera Feed / Video Preview */}
        <div className="relative">
          {!recordedVideo ? (
            // Live Camera Feed
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={!isMuted}
                className="w-full h-64 object-cover"
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "user"
                }}
                onUserMediaError={(error) => {
                  console.error('Camera error:', error)
                  setDeviceError('Failed to access camera. Please check your permissions.')
                }}
              />
              
              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-error-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium text-sm">REC {formatTime(recordingTime)}</span>
                </div>
              )}
              
              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted ? 'bg-error-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-4 rounded-full transition-colors ${
                    isRecording 
                      ? 'bg-error-500 hover:bg-error-600 text-white' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isRecording ? <FiSquare className="w-6 h-6" /> : <FiVideo className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : (
            // Recorded Video Playback
            <div className="relative">
              <video
                src={recordedVideoUrl || ''}
                controls
                className="w-full max-h-64 object-cover rounded-lg"
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}
        </div>

        {/* Recording Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {recordedVideo ? 'Recording Complete' : isRecording ? 'Recording...' : 'Ready to Record'}
              </p>
              <p className="text-sm text-gray-500">
                {recordedVideo 
                  ? `Duration: ${formatTime(recordingTime)} • Skill: ${selectedSkill}`
                  : isRecording 
                    ? `Recording time: ${formatTime(recordingTime)}`
                    : `Selected skill: ${selectedSkill}`
                }
              </p>
            </div>
            
            {isRecording && (
              <div className="recording-indicator">
                <div className="w-2 h-2 bg-error-500 rounded-full mr-2"></div>
                Recording
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {!recordedVideo ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!hasPermission}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-error-500 hover:bg-error-600 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              {isRecording ? (
                <>
                  <FiSquare className="w-5 h-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <FiVideo className="w-5 h-5" />
                  <span>Start Recording</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isProcessing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <FiUpload className="w-5 h-5" />
                    <span>Analyze Recording</span>
                  </>
                )}
              </button>
              
              <button
                onClick={retakeVideo}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retake
              </button>
            </>
          )}
        </div>

        {/* Error Message */}
        {deviceError && (
          <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{deviceError}</p>
          </div>
        )}

        {/* Recording Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Recording Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Position yourself in the center of the frame</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Speak clearly and at a natural pace</li>
            <li>• Record for at least 30 seconds for best analysis</li>
            <li>• Keep background noise to a minimum</li>
          </ul>
        </div>
      </div>
    </div>
  )
}