"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ConversationState {
  messages: ConversationMessage[]
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  currentTranscript: string
  isVoiceModeEnabled: boolean
  isWakeWordResponse: boolean
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentTranscript: "",
    isVoiceModeEnabled: true,
    isWakeWordResponse: false,
  })

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messageIdRef = useRef(0)
  const isSpeakingRef = useRef(false)
  const isListeningRef = useRef(false)
  const isProcessingRef = useRef(false)

  // Wake word detection state
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(true)
  const [wakeWordDetected, setWakeWordDetected] = useState(false)
  const [isIntentionallyStopped, setIsIntentionallyStopped] = useState(false)
  const [commandMode, setCommandMode] = useState(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastProcessedTranscriptRef = useRef("")
  const hasDetectedWakeWord = useRef(false)
  const speechEndTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true // Enable interim results for real-time transcription
        recognitionRef.current.lang = "en-US"
        recognitionRef.current.maxAlternatives = 1

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started - waiting for wake word')
          isListeningRef.current = true
          setState(prev => ({ ...prev, isListening: true, currentTranscript: "Listening for 'Hey Jarvis'..." }))
          setIsIntentionallyStopped(false)
          hasDetectedWakeWord.current = false

          // Always start in wake word detection mode
          hasDetectedWakeWord.current = false

          // Always start in wake word detection mode
          setIsWaitingForWakeWord(true)
          setWakeWordDetected(false)
          setCommandMode(false)
          lastProcessedTranscriptRef.current = "" // Clear any previous transcript
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""
          let hasFinalResults = false

          // Separate final and interim results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = result[0].transcript

            if (result.isFinal) {
              finalTranscript += transcript
              hasFinalResults = true
            } else {
              interimTranscript += transcript
            }
          }

          // Use final transcript if available, otherwise use interim
          const currentTranscript = finalTranscript || interimTranscript
          const cleanTranscript = currentTranscript.trim()
          const lowerTranscript = cleanTranscript.toLowerCase()

          // Show what we're hearing with appropriate indicators
          if (hasFinalResults) {
            setState(prev => ({ ...prev, currentTranscript: `🎯 "${cleanTranscript}"` }))
          } else {
            setState(prev => ({ ...prev, currentTranscript: `🎤 "${cleanTranscript}"...` }))
          }

          console.log('Transcript received:', cleanTranscript, 'Final:', hasFinalResults, 'Mode:', isWaitingForWakeWord ? 'wake_word' : commandMode ? 'command' : 'unknown')

          // Check for stop command first - this should work in any mode
          if (lowerTranscript.includes("stop")) {
            console.log("Stop command detected, stopping speech synthesis")
            if (synthRef.current && isSpeakingRef.current) {
              synthRef.current.cancel()
              isSpeakingRef.current = false
              setState(prev => ({ ...prev, isSpeaking: false }))
            }
            // Reset to wake word detection mode
            setCommandMode(false)
            setWakeWordDetected(false)
            setIsWaitingForWakeWord(true)
            lastProcessedTranscriptRef.current = ""
            return // Don't process further
          }

          // Wake word detection - allow even during speaking to interrupt
          if (isWaitingForWakeWord) {
            // Check if wake word is detected - make it more flexible
            const wakeWords = [
              "hey jarvis", "hey jarvise", "hi jarvis", "hello jarvis",
              "jarvis", "hey jarvis", "hi jarvis", "hello jarvis",
              "okay jarvis", "ok jarvis", "wake up jarvis"
            ]
            const wakeWordDetected = wakeWords.some(w => lowerTranscript.includes(w))

            console.log('🔍 Wake word check - Transcript:', `"${lowerTranscript}"`, 'Final:', hasFinalResults, 'Wake words:', wakeWords, 'Detected:', wakeWordDetected)

            if (wakeWordDetected) {
              console.log("🎯 Wake word detected! Processing...")
              // If currently speaking, stop it
              if (synthRef.current && isSpeakingRef.current) {
                synthRef.current.cancel()
                isSpeakingRef.current = false
                setState(prev => ({ ...prev, isSpeaking: false }))
              }
              hasDetectedWakeWord.current = true
              setWakeWordDetected(true)
              setIsWaitingForWakeWord(false)
              setCommandMode(true)
              setState(prev => ({ ...prev, isWakeWordResponse: true }))

              // Immediate visual feedback
              setState(prev => ({ ...prev, currentTranscript: "🎯 Wake word detected! Listening..." }))

              speak("Aha, I'm listening")
              lastProcessedTranscriptRef.current = ""

              // Stop recognition briefly to reset, then restart for command mode
              if (recognitionRef.current) {
                recognitionRef.current.stop()
              }

              // Restart recognition in command mode after a short delay
              setTimeout(() => {
                if (recognitionRef.current && !isListeningRef.current) {
                  try {
                    console.log('🔄 Restarting recognition for command mode')
                    recognitionRef.current.start()
                  } catch (error) {
                    console.warn("❌ Failed to restart recognition after wake word:", error)
                    // If restart fails, try again after a longer delay
                    setTimeout(() => {
                      if (recognitionRef.current && !isListeningRef.current) {
                        try {
                          recognitionRef.current.start()
                        } catch (retryError) {
                          console.warn("❌ Failed to restart recognition on retry:", retryError)
                        }
                      }
                    }, 2000)
                  }
                }
              }, 500)
          } else if (commandMode) {
            // Only process commands if not speaking and not in buffer period to prevent self-detection
            if (isSpeakingRef.current || speechEndTimeoutRef.current) {
              console.log('Ignoring command processing - currently speaking or in buffer period')
              return
            }

            // Filter out wake words - don't process them as input
            const wakeWords = ["hey jarvis", "hey jarvise", "hi jarvis", "hello jarvis", "jarvis"]
            const isWakeWord = wakeWords.some(w => cleanTranscript.toLowerCase().includes(w))

            // Only process final results to avoid premature processing
            if (!isWakeWord &&
                cleanTranscript.length > 2 &&
                !isProcessingRef.current &&
                cleanTranscript !== lastProcessedTranscriptRef.current &&
                hasFinalResults) { // Only process final results

              // Clear any existing debounce timeout
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
              }

              // Set processing flag immediately
              isProcessingRef.current = true
              lastProcessedTranscriptRef.current = cleanTranscript

              // Show processing indicator
              setState(prev => ({ ...prev, currentTranscript: `⚡ Processing: "${cleanTranscript}"` }))

              // Increased debounce timeout to allow users to complete their speech
              debounceTimeoutRef.current = setTimeout(() => {
                // Stop listening temporarily to process
                setIsIntentionallyStopped(true)
                if (recognitionRef.current) {
                  recognitionRef.current.stop()
                }

                // Process the input
                processUserInput(cleanTranscript).then(() => {
                  // Clear processing flag
                  isProcessingRef.current = false

                  // Exit command mode and reset wake word detection
                  setCommandMode(false)
                  setWakeWordDetected(false)
                  setIsWaitingForWakeWord(true)

                  // Wait for speech to complete and buffer period before restarting
                  const waitForSpeechEnd = () => {
                    if (!isSpeakingRef.current && !speechEndTimeoutRef.current) {
                      // Speech has ended and buffer period is over, safe to restart
                      setIsIntentionallyStopped(false)
                      if (recognitionRef.current && !isListeningRef.current && state.isVoiceModeEnabled) {
                        try {
                          console.log('🔄 Restarting recognition for wake word detection after command processing')
                          recognitionRef.current.start()
                        } catch (error) {
                          console.warn("Failed to restart recognition after processing:", error)
                        }
                      }
                    } else {
                      // Still speaking or in buffer period, wait a bit longer
                      setTimeout(waitForSpeechEnd, 500)
                    }
                  }

                  // Start checking after a brief initial delay
                  setTimeout(waitForSpeechEnd, 500)
                }).catch((error) => {
                  console.error("Error processing user input:", error)
                  isProcessingRef.current = false
                })
              }, 2500) // Increased to 2.5 seconds to allow users to complete their speech
            }
          }
        }
        }

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended')
          isListeningRef.current = false
          setState(prev => ({ ...prev, isListening: false }))
          hasDetectedWakeWord.current = false

          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
            restartTimeoutRef.current = null
          }

          // DO NOT auto-restart - only restart when wake word is detected
          // This prevents continuous listening and only activates on "hey jarvis"
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          isListeningRef.current = false
          setState(prev => ({ ...prev, isListening: false }))
          setIsIntentionallyStopped(false)

          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
            restartTimeoutRef.current = null
          }

          // Only auto-restart on error if voice mode is enabled
          if (state.isVoiceModeEnabled) {
            restartTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current && !isListeningRef.current && state.isVoiceModeEnabled && !isSpeakingRef.current && !isProcessingRef.current) {
                try {
                  recognitionRef.current.start()
                } catch (error) {
                  console.warn("Failed to restart recognition after error:", error)
                }
              }
            }, 1000)
          }
        }
      }
          setIsIntentionallyStopped(false)

      // Speech Synthesis - Initialize with voice loading
      synthRef.current = window.speechSynthesis

      // Wait for voices to be loaded before proceeding
      const loadVoices = () => {
        if (synthRef.current) {
          const voices = synthRef.current.getVoices() || []
          if (voices.length > 0) {
            console.log('Voices loaded successfully:', voices.length)
          } else {
            // If voices aren't loaded yet, wait a bit and try again
            setTimeout(loadVoices, 100)
          }
        }
      }

      // Some browsers load voices asynchronously
      if (synthRef.current) {
        loadVoices()
        // Also listen for voiceschanged event
        synthRef.current.onvoiceschanged = loadVoices
      }
    }

    // Auto-start recognition if voice mode is enabled
    if (state.isVoiceModeEnabled && recognitionRef.current && !isListeningRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
      try {
        console.log('Auto-starting speech recognition for wake word detection')
        recognitionRef.current.start()
      } catch (error) {
        console.warn("Failed to auto-start recognition:", error)
      }
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [state.isVoiceModeEnabled])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      recognitionRef.current.start()
    }
  }, [state.isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop()
    }
  }, [state.isListening])

  // Helper function to check if speech synthesis is allowed
  const isSpeechSynthesisAllowed = useCallback((): boolean => {
    if (!synthRef.current) return false

    // Check if speech synthesis is currently blocked
    if (synthRef.current.speaking || synthRef.current.pending) {
      console.warn('Speech synthesis already in progress')
      return false
    }

    // Try to create a test utterance to check permissions
    try {
      const testUtterance = new SpeechSynthesisUtterance('')
      testUtterance.volume = 0 // Silent test
      testUtterance.onstart = () => {
        console.log('Speech synthesis permission check passed')
      }
      testUtterance.onerror = (event: any) => {
        if (event.error?.type === 'not-allowed') {
          console.warn('Speech synthesis blocked by browser - user interaction required')
          return false
        }
      }
      // Note: We don't actually speak the test utterance, just check if it can be created
      return true
    } catch (error) {
      console.error('Speech synthesis not supported:', error)
      return false
    }
  }, [])

  const speak = useCallback((text: string) => {
    console.log('Speak function called with text:', text)
    if (synthRef.current) {
      console.log('Speech synthesis available')

      // Check if speech synthesis is allowed (requires user interaction)
      if (!isSpeechSynthesisAllowed()) {
        console.warn('Speech synthesis not allowed - user interaction may be required')
        // Add a message to inform the user
        addMessage("assistant", "Speech synthesis is blocked. Please interact with the page first (click anywhere) to enable voice responses.")
        return
      }

      setState(prev => ({ ...prev, isSpeaking: true }))
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0 // Normal speed for better responsiveness
      utterance.pitch = 0.8 // Slightly lower pitch for pleasant voice
      utterance.volume = 1.0 // Full volume

      // Get available voices
      const voices = synthRef.current.getVoices()
      console.log('Available voices:', voices.length)

      // Priority list for hard male Jarvis-like voices
      const preferredVoices = [
        'Alex',
        'Microsoft David Desktop', // Windows male voice (preferred)
        'Microsoft Mark', // Windows male voice (hard/authoritative)
        'Microsoft Paul', // Windows male voice (deep)
        'Microsoft George', // Windows male voice (formal)
        'Microsoft Michael', // Windows male voice (professional)
        'Microsoft Ravi', // Windows male voice (accented but authoritative)
        'Microsoft Zira Desktop', // Windows female voice (fallback)
        'Bruce', // macOS male voice (hard)
        'Fred', // macOS male voice (deep)
        'Daniel', // iOS male voice
        'Tom', // iOS male voice (hard)
        'Paul', // iOS male voice (authoritative)
        'Google UK English Male', // Chrome male voice (hard)
        'Google US English Male', // Chrome male voice
        'Google UK English', // Chrome male voice (authoritative)
        'Google US English', // Chrome US voice
        'Samantha', // macOS female (fallback)
        'Victoria' // macOS female (fallback)
      ]

      let selectedVoice: SpeechSynthesisVoice | null = null

      // First try to find preferred voices
      for (const preferredName of preferredVoices) {
        selectedVoice = voices.find(voice =>
          voice.name.includes(preferredName) ||
          voice.name.toLowerCase().includes(preferredName.toLowerCase())
        ) || null
        if (selectedVoice) break
      }

      // If no preferred voice found, try to find any English male voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          (voice.name.toLowerCase().includes('male') ||
           voice.name.toLowerCase().includes('david') ||
           voice.name.toLowerCase().includes('alex') ||
           voice.name.toLowerCase().includes('daniel') ||
           voice.name.toLowerCase().includes('tom') ||
           voice.name.toLowerCase().includes('paul'))
        ) || null
      }

      // If still no voice found, use any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || null
      }

      // Apply the selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('Using voice:', selectedVoice.name)
      } else {
        console.log('Using default voice - no specific voice selected')
      }

      utterance.onstart = () => {
        console.log('Speech started successfully')
        isSpeakingRef.current = true

        // Stop speech recognition while speaking to prevent self-detection
        if (recognitionRef.current && state.isListening) {
          console.log('Stopping speech recognition while speaking')
          recognitionRef.current.stop()
        }

        // Clear any existing speech end timeout
        if (speechEndTimeoutRef.current) {
          clearTimeout(speechEndTimeoutRef.current)
          speechEndTimeoutRef.current = null
        }
      }

      utterance.onend = () => {
        console.log('Speech ended successfully')
        isSpeakingRef.current = false
        setState(prev => ({ ...prev, isSpeaking: false }))

        // Set a buffer period after speech ends to prevent immediate self-detection
        speechEndTimeoutRef.current = setTimeout(() => {
          console.log('Speech buffer period ended, ready for wake word detection')
          speechEndTimeoutRef.current = null
        }, 2000) // 2 second buffer to prevent self-detection

        // DO NOT auto-restart speech recognition after speaking
        // Only restart when wake word "hey jarvis" is detected
        // This prevents the bot from listening to itself
      }

      utterance.onerror = (event: any) => {
        console.error('Speech synthesis error:', event.error, 'Type:', event.error?.type || 'Unknown', 'Voice:', selectedVoice?.name || 'Default')
        isSpeakingRef.current = false
        setState(prev => ({ ...prev, isSpeaking: false }))

        // Handle different types of speech synthesis errors
        if (event.error?.type === 'not-allowed') {
          console.warn('Speech synthesis blocked by browser - user interaction may be required')
          // Don't retry, just log the issue
          return
        }

        // Try fallback to default voice if specific voice failed
        if (selectedVoice && (event.error?.type === 'voice-unavailable' || event.error?.type === 'synthesis-failed' || event.error?.type === 'not-allowed')) {
          console.log('Voice failed, trying default voice...')
          const fallbackUtterance = new SpeechSynthesisUtterance(text)
          fallbackUtterance.rate = 1.0
          fallbackUtterance.pitch = 0.8
          fallbackUtterance.volume = 1.0
          fallbackUtterance.voice = null // Use default voice

          fallbackUtterance.onstart = () => {
            console.log('Fallback speech started successfully')
            isSpeakingRef.current = true
          }

          fallbackUtterance.onend = () => {
            console.log('Fallback speech ended successfully')
            isSpeakingRef.current = false
            setState(prev => ({ ...prev, isSpeaking: false }))
          }

          fallbackUtterance.onerror = (fallbackEvent: any) => {
            console.error('Fallback voice also failed:', fallbackEvent.error)
            isSpeakingRef.current = false
            setState(prev => ({ ...prev, isSpeaking: false }))
          }

          try {
            if (synthRef.current) {
              synthRef.current.speak(fallbackUtterance)
              console.log('Retried with default voice')
            } else {
              console.error('Speech synthesis not available for fallback')
            }
          } catch (retryError) {
            console.error('Default voice speak() call failed:', retryError)
          }
          return
        }

        // DO NOT auto-restart speech recognition after speech error
        // Only restart when wake word "hey jarvis" is detected
      }

      try {
        console.log('About to call synthRef.current.speak()')
        if (synthRef.current) {
          synthRef.current.speak(utterance)
          console.log('Called synthRef.current.speak() successfully')
        } else {
          console.error('Speech synthesis not available at speak call')
          isSpeakingRef.current = false
          setState(prev => ({ ...prev, isSpeaking: false }))
        }
      } catch (error) {
        console.error('Failed to call speak():', error)
        isSpeakingRef.current = false
        setState(prev => ({ ...prev, isSpeaking: false }))
      }
    } else {
      console.error('Speech synthesis not available')
    }
  }, [state.isListening])

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const message: ConversationMessage = {
      id: `msg_${++messageIdRef.current}`,
      role,
      content,
      timestamp: new Date(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))

    return message
  }, [])

  // New function to send request to OpenRouter API
  const sendToOpenRouter = useCallback(async (userMessage: string): Promise<string> => {
    const makeRequest = async (retryCount = 0): Promise<string> => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
        if (!apiKey) {
          throw new Error("API_KEY_MISSING: OpenRouter API key is not configured. Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file.")
        }

        console.log("Making OpenRouter API request...")
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are Jarvis, a helpful AI assistant. Keep your responses concise and to the point, under 50 words when possible. Be direct and helpful."
              },
              {
                role: "user",
                content: userMessage
              }
            ],
            max_tokens: 100,
            temperature: 0.7,
          }),
        })

        console.log(`OpenRouter API response status: ${response.status}`)

        if (!response.ok) {
          if (response.status === 429 && retryCount < 3) {
            const waitTime = Math.pow(2, retryCount) * 5000
            console.warn(`Rate limit exceeded on OpenRouter, waiting ${waitTime/1000} seconds before retry ${retryCount + 1}/3...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            return makeRequest(retryCount + 1)
          }

          let errorDetails = ""
          try {
            const errorData = await response.json()
            errorDetails = errorData.error || ""
          } catch (e) {}

          if (response.status === 401) {
            throw new Error(`API_KEY_INVALID: OpenRouter API key is invalid or missing. Details: ${errorDetails}`)
          } else if (response.status === 403) {
            throw new Error(`API_ACCESS_FORBIDDEN: OpenRouter API access forbidden. Details: ${errorDetails}`)
          } else if (response.status >= 500) {
            throw new Error(`SERVER_ERROR: OpenRouter server error (${response.status}). Details: ${errorDetails}`)
          } else {
            throw new Error(`API_ERROR_${response.status}: OpenRouter API error. Details: ${errorDetails}`)
          }
        }

        const data = await response.json()
        console.log("OpenRouter API response received successfully")
        if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
          return data.choices[0].message.content
        }
        return "I'm sorry, I couldn't generate a response from OpenRouter."
      } catch (error) {
        console.error("OpenRouter API request failed:", error)
        if (retryCount < 3 && error instanceof Error && error.message.includes('fetch')) {
          const waitTime = Math.pow(2, retryCount) * 2000
          console.warn(`Network error on OpenRouter, retrying in ${waitTime/1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return makeRequest(retryCount + 1)
        }
        throw error
      }
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true }))
      const aiResponse = await makeRequest()
      setState(prev => ({ ...prev, isProcessing: false }))
      return aiResponse
    } catch (error) {
      console.error("OpenRouter API error:", error)
      setState(prev => ({ ...prev, isProcessing: false }))

      if (error instanceof Error) {
        const errorMessage = error.message
        if (errorMessage.includes("API_KEY_MISSING")) {
          return "API Configuration Error: OpenRouter API key is missing. Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file."
        } else if (errorMessage.includes("API_KEY_INVALID")) {
          return "API Key Error: Your OpenRouter API key is invalid. Please check your key in .env.local."
        } else if (errorMessage.includes("API_ACCESS_FORBIDDEN")) {
          return "Access Forbidden: Check your OpenRouter account billing and permissions."
        } else if (errorMessage.includes("SERVER_ERROR")) {
          return "Server Error: OpenRouter is experiencing issues. Please try again later."
        } else if (errorMessage.includes("Rate limit")) {
          return "Rate Limited: The free tier has strict limits. Please wait a moment before trying again."
        } else if (errorMessage.includes("Network error")) {
          return "Network Error: Check your internet connection and try again."
        } else if (errorMessage.includes("fetch")) {
          return "Connection Error: Unable to reach OpenRouter API. Check your internet connection."
        }
      }

      return "System Error: Something went wrong with the OpenRouter AI service."
    }
  }, [state.messages])

  // New function to send request to Hugging Face Inference API as backup
  const sendToHuggingFace = useCallback(async (userMessage: string): Promise<string> => {
    const makeRequest = async (retryCount = 0): Promise<string> => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY
        if (!apiKey) {
          throw new Error("API_KEY_MISSING: Hugging Face API key is not configured. Please add NEXT_PUBLIC_HUGGINGFACE_API_KEY to your .env.local file.")
        }

        console.log("Making Hugging Face API request...")
        const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [
              {
                role: "system",
                content: "You are Jarvis, a helpful AI assistant. Keep your responses concise and to the point, under 50 words when possible. Be direct and helpful."
              },
              {
                role: "user",
                content: userMessage
              }
            ],
            parameters: {
              max_new_tokens: 100,
              temperature: 0.7,
            }
          }),
        })

        console.log(`Hugging Face API response status: ${response.status}`)

        if (!response.ok) {
          if (response.status === 429 && retryCount < 3) {
            const waitTime = Math.pow(2, retryCount) * 5000
            console.warn(`Rate limit exceeded on Hugging Face, waiting ${waitTime/1000} seconds before retry ${retryCount + 1}/3...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            return makeRequest(retryCount + 1)
          }

          let errorDetails = ""
          try {
            const errorData = await response.json()
            errorDetails = errorData.error || ""
          } catch (e) {}

          if (response.status === 401) {
            throw new Error(`API_KEY_INVALID: Hugging Face API key is invalid or missing. Details: ${errorDetails}`)
          } else if (response.status === 403) {
            throw new Error(`API_ACCESS_FORBIDDEN: Hugging Face API access forbidden. Details: ${errorDetails}`)
          } else if (response.status >= 500) {
            throw new Error(`SERVER_ERROR: Hugging Face server error (${response.status}). Details: ${errorDetails}`)
          } else {
            throw new Error(`API_ERROR_${response.status}: Hugging Face API error. Details: ${errorDetails}`)
          }
        }

        const data = await response.json()
        console.log("Hugging Face API response received successfully")
        // The response format may vary; adjust accordingly
        if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
          return data[0].generated_text
        }
        return "I'm sorry, I couldn't generate a response from Hugging Face."
      } catch (error) {
        console.error("Hugging Face API request failed:", error)
        if (retryCount < 3 && error instanceof Error && error.message.includes('fetch')) {
          const waitTime = Math.pow(2, retryCount) * 2000
          console.warn(`Network error on Hugging Face, retrying in ${waitTime/1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return makeRequest(retryCount + 1)
        }
        throw error
      }
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true }))
      const aiResponse = await makeRequest()
      setState(prev => ({ ...prev, isProcessing: false }))
      return aiResponse
    } catch (error) {
      console.error("Hugging Face API error:", error)
      setState(prev => ({ ...prev, isProcessing: false }))

      if (error instanceof Error) {
        const errorMessage = error.message
        if (errorMessage.includes("API_KEY_MISSING")) {
          return "API Configuration Error: Hugging Face API key is missing. Please add NEXT_PUBLIC_HUGGINGFACE_API_KEY to your .env.local file."
        } else if (errorMessage.includes("API_KEY_INVALID")) {
          return "API Key Error: Your Hugging Face API key is invalid. Please check your key in .env.local."
        } else if (errorMessage.includes("API_ACCESS_FORBIDDEN")) {
          return "Access Forbidden: Check your Hugging Face account billing and permissions."
        } else if (errorMessage.includes("SERVER_ERROR")) {
          return "Server Error: Hugging Face is experiencing issues. Please try again later."
        } else if (errorMessage.includes("Rate limit")) {
          return "Rate Limited: The free tier has strict limits. Please wait a moment before trying again."
        } else if (errorMessage.includes("Network error")) {
          return "Network Error: Check your internet connection and try again."
        } else if (errorMessage.includes("fetch")) {
          return "Connection Error: Unable to reach Hugging Face API. Check your internet connection."
        }
      }

      return "❌ System Error: Something went wrong with the Hugging Face AI service."
    }
  }, [state.messages])

  // Function to detect self-identification questions
  const isSelfIdentificationQuestion = useCallback((input: string): boolean => {
    const selfQuestions = [
      "who are you",
      "what are you",
      "tell me about yourself",
      "introduce yourself",
      "what is your name",
      "who is this",
      "what's your name",
      "who am i talking to",
      "what do you do",
      "what is jarvis",
      "who is jarvis"
    ]

    const lowerInput = input.toLowerCase().trim()
    return selfQuestions.some(question =>
      lowerInput.includes(question) ||
      lowerInput === question
    )
  }, [])

  // Modified processUserInput to try OpenRouter first, then fallback to Hugging Face, then fallback to local response
  const processUserInput = useCallback(async (input: string) => {
    addMessage("user", input)

    let aiResponse = ""

    // Check if this is a self-identification question
    if (isSelfIdentificationQuestion(input)) {
      aiResponse = "I am Jarvis, your AI assistant. I help with tasks, answer questions, and provide intelligent conversation."
    } else {
      try {
        aiResponse = await sendToOpenRouter(input)
        if (aiResponse.includes("⏱️ Rate Limited") || aiResponse.includes("🚫 Access Forbidden") || aiResponse.includes("🚫 API Key Error")) {
          console.warn("OpenRouter rate limit or access issue detected, falling back to Hugging Face")
          aiResponse = await sendToHuggingFace(input)
        }
      } catch (error) {
        console.warn("OpenRouter failed, falling back to Hugging Face", error)
        try {
          aiResponse = await sendToHuggingFace(input)
        } catch (hfError) {
          console.warn("Hugging Face failed, using local fallback", hfError)
          aiResponse = "Sorry, the AI service is currently unavailable. Please try again later."
        }
      }
    }

    addMessage("assistant", aiResponse)
    speak(aiResponse)

    return new Promise<string>((resolve) => {
      const checkSpeechComplete = () => {
        if (!state.isSpeaking) {
          resolve(aiResponse)
        } else {
          setTimeout(checkSpeechComplete, 100)
        }
      }
      setTimeout(checkSpeechComplete, 500)
    })
  }, [addMessage, sendToOpenRouter, sendToHuggingFace, speak, state.isSpeaking, isSelfIdentificationQuestion])



  const undoMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.slice(0, -1), // Remove the last message
    }))
  }, [])

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      currentTranscript: "",
    }))
    messageIdRef.current = 0
  }, [])

  const toggleVoiceMode = useCallback(() => {
    setState(prev => {
      const newVoiceModeEnabled = !prev.isVoiceModeEnabled

      // If enabling voice mode, start listening
      if (newVoiceModeEnabled && recognitionRef.current) {
        try {
          // Check if recognition is already running before starting
          if (!isListeningRef.current) {
            console.log('Starting recognition from toggleVoiceMode')
            recognitionRef.current.start()
          } else {
            console.log('Recognition already running, skipping start')
          }
        } catch (error) {
          console.warn("Failed to start recognition when enabling voice mode:", error)
        }
      }
      // If disabling voice mode, stop listening
      else if (!newVoiceModeEnabled && recognitionRef.current && isListeningRef.current) {
        console.log('Stopping recognition from toggleVoiceMode')
        recognitionRef.current.stop()
      }

      return {
        ...prev,
        isVoiceModeEnabled: newVoiceModeEnabled,
      }
    })
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    addMessage,
    processUserInput,
    undoMessage,
    clearConversation,
    toggleVoiceMode,
  }
}
