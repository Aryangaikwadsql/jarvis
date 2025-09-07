"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface WebSocketMessage {
  command: string
  timestamp: string
}

export interface WebSocketState {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  connectionError: string | null
}

export function useWebSocket(url: string) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    connectionError: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      console.log(`[WebSocket] Attempting to connect to ${url}`)

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[WebSocket] Connected successfully")
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }))
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("[WebSocket] Received message:", message)

          setState((prev) => ({
            ...prev,
            lastMessage: message,
          }))
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error)
        }
      }

      ws.onclose = (event) => {
        console.log("[WebSocket] Connection closed:", event.code, event.reason)
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }))

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error("[WebSocket] Connection error:", error)
        setState((prev) => ({
          ...prev,
          connectionError: "Connection failed",
        }))
      }
    } catch (error) {
      console.error("[WebSocket] Failed to create connection:", error)
      setState((prev) => ({
        ...prev,
        connectionError: "Failed to create connection",
      }))
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect")
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    console.warn("[WebSocket] Cannot send message - not connected")
    return false
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  }
}
