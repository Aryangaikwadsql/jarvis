"use client"

import { useEffect, useRef, useState } from "react"

// Animated Progress Bar Component
function AnimatedProgressBar({
  value,
  max = 100,
  color = "#00ffff",
  label,
  unit = "%"
}: {
  value: number
  max?: number
  color?: string
  label?: string
  unit?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-cyan-400/80">{label}</span>
          <span className="text-cyan-300 font-bold">{value}{unit}</span>
        </div>
      )}
      <div className="w-full bg-black/60 rounded-full h-2 border border-cyan-500/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}40`
          }}
        />
      </div>
    </div>
  )
}

// CPU Usage Graph Component
function CPUUsageGraph({ usage = 23 }: { usage?: number }) {
  const [history, setHistory] = useState<number[]>(Array(20).fill(0))

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const newHistory = [...prev.slice(1), usage + Math.random() * 10 - 5]
        return newHistory.map(val => Math.max(0, Math.min(100, val)))
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [usage])

  return (
    <div className="space-y-2">
      <div className="text-xs text-cyan-400/80">CPU Usage</div>
      <div className="flex items-end gap-1 h-12">
        {history.map((val, i) => (
          <div
            key={i}
            className="bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-sm transition-all duration-300"
            style={{
              width: '4px',
              height: `${val}%`,
              opacity: 0.7 + (i / history.length) * 0.3,
              boxShadow: i === history.length - 1 ? `0 0 8px #00ffff` : 'none'
            }}
          />
        ))}
      </div>
      <div className="text-right text-xs text-cyan-300 font-bold">{usage.toFixed(1)}%</div>
    </div>
  )
}

// Memory Usage Component
function MemoryUsageGraph({ used = 1.2, total = 8 }: { used?: number; total?: number }) {
  const percentage = (used / total) * 100

  return (
    <div className="space-y-2">
      <div className="text-xs text-cyan-400/80">Memory Usage</div>
      <div className="relative">
        <div className="w-full bg-black/60 rounded-full h-3 border border-cyan-500/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              background: percentage > 80
                ? 'linear-gradient(90deg, #ff4081, #ff6b9d)'
                : 'linear-gradient(90deg, #00ffff, #00cccc)',
              boxShadow: `0 0 10px ${percentage > 80 ? '#ff4081' : '#00ffff'}40`
            }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-cyan-300 font-bold">{used.toFixed(1)}GB / {total}GB</span>
        </div>
      </div>
    </div>
  )
}

// Network Status Component
function NetworkStatusGraph({
  status = "Connected",
  ping = 45,
  upload = 25.3,
  download = 89.7
}: {
  status?: string
  ping?: number
  upload?: number
  download?: number
}) {
  const [pingHistory, setPingHistory] = useState<number[]>(Array(10).fill(ping))

  useEffect(() => {
    const interval = setInterval(() => {
      setPingHistory(prev => {
        const newPing = ping + Math.random() * 20 - 10
        return [...prev.slice(1), Math.max(0, newPing)]
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [ping])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-cyan-400/80">Network</span>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          status === "Connected" ? "bg-green-400" : "bg-red-400"
        }`} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-cyan-400/60">Ping</div>
          <div className="text-cyan-300 font-bold">{ping}ms</div>
        </div>
        <div>
          <div className="text-cyan-400/60">Status</div>
          <div className={`font-bold ${status === "Connected" ? "text-green-400" : "text-red-400"}`}>
            {status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-cyan-400/60">UP {upload} Mbps</span>
          <span className="text-cyan-400/60">DOWN {download} Mbps</span>
        </div>
        <div className="flex gap-1">
          <div className="flex-1 bg-black/60 rounded h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(upload / 100 * 100, 100)}%` }}
            />
          </div>
          <div className="flex-1 bg-black/60 rounded h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${Math.min(download / 100 * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// AI Core Status Component
function AICoreStatus({
  temperature = 42,
  processes = 12,
  activeModels = 3
}: {
  temperature?: number
  processes?: number
  activeModels?: number
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-cyan-400/80 font-bold">AI Core Status</div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-cyan-400/60">Temperature</div>
          <div className={`text-sm font-bold ${
            temperature > 70 ? "text-red-400" : temperature > 50 ? "text-yellow-400" : "text-cyan-400"
          }`}>
            {temperature} C
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-cyan-400/60">Processes</div>
          <div className="text-sm font-bold text-cyan-400">{processes}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-cyan-400/60">Active Models</div>
          <div className="text-sm font-bold text-cyan-400">{activeModels}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-cyan-400/60">Status</div>
          <div className="text-sm font-bold text-green-400">ONLINE</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-cyan-400/60">Core Load</div>
        <div className="w-full bg-black/60 rounded-full h-2 border border-cyan-500/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full transition-all duration-1000"
            style={{ width: "68%" }}
          />
        </div>
      </div>
    </div>
  )
}

// Floating Holographic Panel Component
function HolographicPanel({
  title,
  children,
  position = "top-left",
  isMinimized = false,
  onToggle
}: {
  title: string
  children: React.ReactNode
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  isMinimized?: boolean
  onToggle?: () => void
}) {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-20 left-4",
    "bottom-right": "bottom-20 right-4"
  }

  return (
    <div className={`absolute ${positionClasses[position]} pointer-events-auto z-10`}>
      <div className="bg-black/20 backdrop-blur-xl border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 hover:border-cyan-400/60">
        <div
          className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 border-b border-cyan-500/30 cursor-pointer flex items-center justify-between"
          onClick={onToggle}
        >
          <div className="text-cyan-300 text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            {title}
          </div>
          <div className={`transform transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>

        {!isMinimized && (
          <div className="p-3 animate-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Typewriter Effect Hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!text) {
      setDisplayText("")
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    setDisplayText("")

    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i))
        i++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return { displayText, isTyping }
}

// Soundwave Animation Component
function SoundwaveAnimation({ isActive = false }: { isActive?: boolean }) {
  const bars = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ${
            isActive ? "animate-pulse" : "h-1"
          }`}
          style={{
            height: isActive ? `${Math.random() * 20 + 5}px` : "4px",
            animationDelay: `${bar * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

interface CommandLogEntry {
  command: string
  timestamp: string
}

interface JarvisUIProps {
  connectionStatus: "Connected" | "Disconnected"
  currentAnimation: string
  commandLog: CommandLogEntry[]
  connectionError?: string | null
  isListening?: boolean
  isSpeaking?: boolean
  isProcessing?: boolean
  currentTranscript?: string
  onSendText?: (text: string) => void
  onToggleVoice?: () => void
  onUndo?: () => void
  isVoiceMode?: boolean
  messages?: Array<{ role: string; content: string; timestamp: Date }>
}

export function JarvisUI({
  connectionStatus,
  currentAnimation,
  commandLog,
  connectionError,
  isListening,
  isSpeaking,
  isProcessing,
  currentTranscript,
  onSendText,
  onToggleVoice,
  onUndo,
  isVoiceMode,
  messages,
}: JarvisUIProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const [systemTime, setSystemTime] = useState(new Date())
  const [inputText, setInputText] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  // Get the latest assistant message for typewriter effect
  const latestAssistantMessage = messages?.slice().reverse().find(msg => msg.role === "assistant")
  const { displayText: typedText, isTyping } = useTypewriter(latestAssistantMessage?.content || "", 30)

  // Update system time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-scroll to bottom when new commands or messages are added
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [commandLog, messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
  }

  const handleSend = () => {
    if (inputText.trim() && onSendText) {
      onSendText(inputText.trim())
      setInputText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none font-mono">
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="bg-gradient-to-r from-black/90 via-black/80 to-black/90 border-b border-cyan-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-6">
              <div className="text-cyan-400 text-sm font-bold">J.A.R.V.I.S.</div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "Connected" ? "bg-cyan-400 animate-pulse" : "bg-red-500 animate-pulse"
                  }`}
                />
                <span className="text-cyan-400 text-xs">{connectionStatus === "Connected" ? "ONLINE" : "OFFLINE"}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-cyan-400/80">
              <div>SYSTEM TIME: {isMounted ? systemTime.toLocaleTimeString() : 'LOADING...'}</div>
              <div>ROBOT STATUS: ACTIVE</div>
              <div>MODE: AUTONOMOUS</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-4 pointer-events-auto">
        <div className="bg-black/30 border border-cyan-500/60 rounded-lg backdrop-blur-lg overflow-hidden max-h-64 w-80 flex flex-col shadow-2xl">
          <div className="bg-gradient-to-r from-cyan-500/30 to-blue-500/30 px-3 py-1 border-b border-cyan-500/40">
            <div className="text-cyan-300 text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              ANIMATION CORE
            </div>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 text-xs">Current State:</span>
            </div>
            <div
              className={`text-sm font-bold ${
                currentAnimation !== "idle" ? "text-yellow-400 animate-pulse" : "text-cyan-400"
              }`}
            >
              {currentAnimation.toUpperCase()}
            </div>
            {currentAnimation !== "idle" && (
              <div className="mt-2">
                <div className="w-full bg-cyan-900/40 rounded-full h-2 shadow-inner">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full animate-pulse shadow-lg" style={{ width: "60%" }} />
                </div>
                <div className="text-cyan-400/60 text-xs mt-1">Executing...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <div className="bg-black/95 border border-cyan-500/50 rounded-lg backdrop-blur-sm overflow-hidden max-h-48 flex flex-col">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-cyan-400 text-xs font-bold ml-2">COMMAND INTERFACE</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleVoice}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  isVoiceMode ? "bg-cyan-600 text-white" : "bg-cyan-900 text-cyan-400"
                }`}
              >
                {isVoiceMode ? "Voice ON" : "Voice OFF"}
              </button>
              <button
                onClick={onUndo}
                disabled={!messages || messages.length === 0}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  messages && messages.length > 0
                    ? "bg-red-900 text-red-400 hover:bg-red-800"
                    : "bg-gray-900 text-gray-600 cursor-not-allowed"
                }`}
                title="Undo last message"
              >
                UNDO
              </button>
              <SoundwaveAnimation isActive={isListening || isSpeaking} />
              {isListening && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Listening..." />
              )}
              {isSpeaking && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Speaking..." />
              )}
              {isProcessing && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Processing..." />
              )}
            </div>
          </div>

          {/* Command Log */}
          <div ref={logRef} className="p-3 flex-1 overflow-y-auto bg-black/50">
            {messages && messages.length > 0 ? (
              <div className="space-y-1">
                {messages.slice(-10).map((msg, index) => {
                  const isLatestAssistant = msg === latestAssistantMessage
                  return (
                    <div
                      key={index}
                      className={`text-xs flex items-start gap-2 ${
                        msg.role === "user" ? "text-green-400" : "text-cyan-400"
                      }`}
                    >
                      <span className="text-cyan-300 w-20 flex-shrink-0">
                        [{new Date(msg.timestamp).toLocaleTimeString()}]
                      </span>
                      <span>{'>'}</span>
                      <span className="flex-1">
                        {isLatestAssistant && isTyping ? typedText : msg.content}
                        {isLatestAssistant && isTyping && (
                          <span className="animate-pulse text-cyan-300">|</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-cyan-400/60 text-xs animate-pulse">{'>'} Awaiting command input...</div>
            )}
            {currentTranscript && (
              <div className="text-yellow-400 text-xs mt-1">
                {'>'} Listening: {currentTranscript}
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="border-t border-cyan-500/30 p-2">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isVoiceMode ? "Voice mode active - type to send text..." : "Type a command or question..."}
              className="w-full bg-black/80 border border-cyan-500/50 rounded px-2 py-1 text-xs text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              disabled={false}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-16 left-4 pointer-events-auto">
        <div className="bg-black/20 border border-cyan-500/40 rounded-lg p-3 backdrop-blur-md shadow-2xl">
          <div className="text-cyan-400 text-xs space-y-1">
            <div className="font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              SYSTEM STATUS
            </div>
            <div className="flex justify-between">
              <span>Power:</span>
              <span className="text-green-400 font-bold">100%</span>
            </div>
            <div className="flex justify-between">
              <span>CPU:</span>
              <span className="text-cyan-400 font-bold">23%</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="text-cyan-400 font-bold">1.2GB</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span className={connectionStatus === "Connected" ? "text-green-400" : "text-red-400"}>
                {connectionStatus === "Connected" ? "STABLE" : "ERROR"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/40 animate-pulse" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-500/40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/40 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-500/40 animate-pulse" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" />
      </div>

      {connectionStatus === "Disconnected" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-red-900/90 border-2 border-red-500/70 rounded-lg p-6 backdrop-blur-sm animate-pulse">
            <div className="text-red-400 text-center">
              <div className="text-lg font-bold mb-2">SYSTEM OFFLINE</div>
              <div className="text-sm mb-3">Backend connection lost</div>
              <div className="text-xs text-red-400/70 space-y-1">
                <div>1. Start Python backend: python scripts/backend_server.py</div>
                <div>2. Verify port 8000 is available</div>
                <div>3. Check firewall settings</div>
              </div>
              <div className="mt-3 text-xs text-red-300">Attempting reconnection...</div>
            </div>
          </div>
        </div>
      )}

      {connectionError && (
        <div className="absolute top-1/4 right-4 pointer-events-auto">
          <div className="bg-orange-900/80 border border-orange-500/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-orange-400 text-xs">
              <div className="font-bold">CONNECTION ERROR</div>
              <div className="mt-1">{connectionError}</div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
