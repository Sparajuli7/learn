'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: string
  [key: string]: any
}

interface UseWebSocketProps {
  userId: number
  onMessage?: (message: WebSocketMessage) => void
  onAnalysisProgress?: (progress: any) => void
  onAnalysisComplete?: (result: any) => void
  onError?: (error: any) => void
}

export function useWebSocket({
  userId,
  onMessage,
  onAnalysisProgress,
  onAnalysisComplete,
  onError
}: UseWebSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      const socketInstance = io(`ws://localhost:8000/ws/${userId}`, {
        transports: ['websocket'],
        upgrade: true,
        timeout: 10000,
      })

      socketInstance.on('connect', () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setIsConnected(false)
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, 2000 * reconnectAttempts.current) // Exponential backoff
        }
      })

      socketInstance.on('message', (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data)
          
          // Handle different message types
          switch (message.type) {
            case 'analysis_progress':
              onAnalysisProgress?.(message)
              break
            case 'analysis_complete':
              onAnalysisComplete?.(message)
              break
            case 'analysis_error':
            case 'error':
              onError?.(message)
              break
            case 'real_time_feedback':
              // Handle real-time feedback during analysis
              onMessage?.(message)
              break
            case 'connection_established':
              console.log('WebSocket connection established')
              break
            case 'pong':
              // Heartbeat response
              break
            default:
              onMessage?.(message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      socketInstance.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        setConnectionError(error.message)
        setIsConnected(false)
      })

      setSocket(socketInstance)

      return socketInstance
    } catch (error) {
      console.error('Error creating socket connection:', error)
      setConnectionError('Failed to create WebSocket connection')
      return null
    }
  }, [userId, onMessage, onAnalysisProgress, onAnalysisComplete, onError])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.emit('message', JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }, [socket, isConnected])

  const sendPing = useCallback(() => {
    sendMessage({ type: 'ping', timestamp: new Date().toISOString() })
  }, [sendMessage])

  useEffect(() => {
    const socketInstance = connect()

    // Setup heartbeat
    const heartbeatInterval = setInterval(() => {
      if (isConnected) {
        sendPing()
      }
    }, 30000) // Ping every 30 seconds

    return () => {
      clearInterval(heartbeatInterval)
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [connect, isConnected, sendPing])

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendPing
  }
}

// Custom hook for real-time analysis feedback
export function useRealTimeAnalysis(userId: number) {
  const [analysisProgress, setAnalysisProgress] = useState<any>(null)
  const [realtimeFeedback, setRealtimeFeedback] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalysisProgress = useCallback((progress: any) => {
    setAnalysisProgress(progress)
    setIsAnalyzing(true)
  }, [])

  const handleAnalysisComplete = useCallback((result: any) => {
    setIsAnalyzing(false)
    setAnalysisProgress(null)
    // Clear realtime feedback when analysis is complete
    setRealtimeFeedback([])
  }, [])

  const handleRealtimeFeedback = useCallback((message: WebSocketMessage) => {
    if (message.type === 'real_time_feedback') {
      setRealtimeFeedback(prev => [...prev, message])
    }
  }, [])

  const handleError = useCallback((error: any) => {
    setIsAnalyzing(false)
    setAnalysisProgress(null)
    console.error('Analysis error:', error)
  }, [])

  const {
    isConnected,
    connectionError,
    sendMessage
  } = useWebSocket({
    userId,
    onMessage: handleRealtimeFeedback,
    onAnalysisProgress: handleAnalysisProgress,
    onAnalysisComplete: handleAnalysisComplete,
    onError: handleError
  })

  return {
    isConnected,
    connectionError,
    analysisProgress,
    realtimeFeedback,
    isAnalyzing,
    sendMessage
  }
}