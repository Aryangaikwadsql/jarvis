"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import { RobotScene } from "@/components/robot-scene"
import { JarvisUI } from "@/components/jarvis-ui"
import { useWebSocket } from "@/hooks/use-websocket"
import { useAnimationManager } from "@/hooks/use-animation-manager"
import { useConversation } from "@/hooks/use-conversation"
import { useEffect, useRef } from "react"

export default function Home() {
  const websocket = useWebSocket("ws://localhost:8000/ws")
  const animationManager = useAnimationManager()
  const conversation = useConversation()

  useEffect(() => {
    if (websocket.lastMessage) {
      const { command } = websocket.lastMessage
      console.log(`[Jarvis] Executing command: ${command}`)
      animationManager.executeAnimation(command)
    }
  }, [websocket.lastMessage])

  // Handle voice input with debouncing for continuous speech
  const lastProcessedRef = useRef<string>("")
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const currentTranscript = conversation.currentTranscript?.trim()

    if (currentTranscript && currentTranscript.length > 2) { // Minimum meaningful input
      // Clear existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }

      // Set new timeout - process after 1.5 seconds of no new input
      processingTimeoutRef.current = setTimeout(async () => {
        // Only process if this is different from last processed input
        if (currentTranscript !== lastProcessedRef.current) {
          lastProcessedRef.current = currentTranscript
          try {
            await conversation.processUserInput(currentTranscript)
            // Trigger robot animation when responding
            setTimeout(() => {
              if ((window as any).playRobotAnimation) {
                (window as any).playRobotAnimation('nod')
              }
            }, 500)
          } catch (error) {
            console.error('Voice processing error:', error)
          }
        }
          }, 1500) // Wait 1.5 seconds after user stops speaking
    }

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [conversation.currentTranscript, conversation])

  const toggleVoiceMode = () => {
    conversation.toggleVoiceMode()
  }

  const handleTextInput = async (text: string) => {
    if (text.trim()) {
      await conversation.processUserInput(text)
    }
  }

  const handleUndo = () => {
    if (conversation.messages.length > 0) {
      // Remove the last message from the conversation
      conversation.undoMessage()
      console.log("Undid last message")
    }
  }

  // Add initial greeting on app load with robot wave animation
  useEffect(() => {
    console.log('Greeting useEffect triggered, messages length:', conversation.messages.length)
    if (conversation.messages.length === 0) {
      console.log('Setting up greeting timeout...')
      const greetingTimeout = setTimeout(() => {
        console.log('Executing greeting...')
        conversation.addMessage("assistant", "Welcome.")
        conversation.speak("Jarvis online. Systems are fully operational and awaiting your command.")
        if ((window as any).playRobotAnimation) {
          (window as any).playRobotAnimation('wave')
        } else {
          console.log('Robot animation function not available')
        }
      }, 1000) // Reduced delay for faster greeting

      return () => clearTimeout(greetingTimeout)
    }
  }, []) // Changed back to empty dependency array for one-time execution

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* 3D Canvas - Full Screen */}
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 3], fov: 45 }}
        className="w-full h-full max-w-5xl rounded-lg shadow-2xl border border-gray-800"
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <RobotScene
            isListening={conversation.isListening}
            isThinking={conversation.isProcessing}
            isSpeaking={conversation.isSpeaking}
          />
        </Suspense>
      </Canvas>

      {/* Jarvis UI Overlay */}
      <JarvisUI
        connectionStatus={websocket.isConnected ? "Connected" : "Disconnected"}
        currentAnimation={animationManager.currentAnimation}
        commandLog={animationManager.commandHistory}
        connectionError={websocket.connectionError}
        isListening={conversation.isListening}
        isSpeaking={conversation.isSpeaking}
        isProcessing={conversation.isProcessing}
        currentTranscript={conversation.currentTranscript}
        onSendText={handleTextInput}
        onToggleVoice={toggleVoiceMode}
        onUndo={handleUndo}
        isVoiceMode={conversation.isVoiceModeEnabled}
        messages={conversation.messages}
      />
    </div>
  )
}
