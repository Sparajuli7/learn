'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiVideo, FiX, FiPlay, FiCheck, FiAlertCircle } from 'react-icons/fi'

interface VideoUploadProps {
  selectedSkill: string
  onAnalysisStart: () => void
  onAnalysisComplete: (result: any) => void
  onAnalysisError: (error: string) => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
}

export default function VideoUpload({
  selectedSkill,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  uploadProgress,
  setUploadProgress
}: VideoUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB')
        setUploadStatus('error')
        return
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Please upload a valid video file')
        setUploadStatus('error')
        return
      }

      setUploadedFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setUploadStatus('idle')
      setErrorMessage('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleUpload = async () => {
    if (!uploadedFile) return

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('skill_type', selectedSkill)
      formData.append('user_id', '1') // Default user for MVP

      // Upload video
      const uploadResponse = await fetch('/api/upload-video/', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()
      setUploadStatus('success')
      setUploadProgress(100)

      // Start analysis
      onAnalysisStart()
      
      const analysisResponse = await fetch(`/api/analyze-video/${uploadResult.video_id}`, {
        method: 'POST',
      })

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.statusText}`)
      }

      const analysisResult = await analysisResponse.json()
      onAnalysisComplete(analysisResult)

    } catch (error) {
      console.error('Upload/Analysis error:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      onAnalysisError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    setUploadStatus('idle')
    setErrorMessage('')
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Your Video</h2>

      {!uploadedFile ? (
        // Upload Area
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <FiUpload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
              </p>
              <p className="text-gray-500 mt-1">
                or <span className="text-primary-600 font-medium">browse files</span>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Supports: MP4, MOV, AVI, MKV, WebM</p>
              <p>Maximum size: 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        // Uploaded File Preview
        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative">
            <video
              src={videoUrl || ''}
              controls
              className="w-full max-h-64 object-cover rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          </div>

          {/* File Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiVideo className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadedFile.size)} • {selectedSkill}
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUploading}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <div className="mt-4 flex items-center space-x-2 text-success-600">
                <FiCheck className="w-4 h-4" />
                <span className="text-sm">Upload successful!</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="mt-4 flex items-center space-x-2 text-error-600">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={isUploading || uploadStatus === 'success'}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                isUploading || uploadStatus === 'success'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Analyzing...</span>
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <FiCheck className="w-5 h-5" />
                  <span>Analysis Complete</span>
                </>
              ) : (
                <>
                  <FiPlay className="w-5 h-5" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>

            <button
              onClick={removeFile}
              disabled={isUploading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace Video
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Tips for Best Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting and clear audio</li>
          <li>• Record in landscape orientation</li>
          <li>• Keep the camera stable and at eye level</li>
          <li>• Make sure your full body is visible (for movement analysis)</li>
        </ul>
      </div>
    </div>
  )
}