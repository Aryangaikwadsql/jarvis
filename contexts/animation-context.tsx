"use client"

import { createContext, useContext, useRef, ReactNode } from "react"
import type { AnimationAction, AnimationMixer } from "three"

interface AnimationContextType {
  playAnimation: (animationName: string, duration?: number) => void
  setMixer: (mixer: AnimationMixer) => void
  setActions: (actions: { [key: string]: AnimationAction }) => void
}

const AnimationContext = createContext<AnimationContextType | null>(null)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const mixerRef = useRef<AnimationMixer | null>(null)
  const actionsRef = useRef<{ [key: string]: AnimationAction }>({})

  const playAnimation = (animationName: string, duration = 2000) => {
    if (!mixerRef.current || !actionsRef.current) return

    const action = actionsRef.current[animationName]
    if (!action) {
      console.warn(`Animation "${animationName}" not found`)
      return
    }

    // Simple play without transition for now
    action.reset().play()

    // Stop after duration if not idle
    if (animationName !== "idle" && duration > 0) {
      setTimeout(() => {
        action.stop()
        const idleAction = actionsRef.current.idle
        if (idleAction) idleAction.play()
      }, duration)
    }
  }

  const setMixer = (mixer: AnimationMixer) => {
    mixerRef.current = mixer
  }

  const setActions = (actions: { [key: string]: AnimationAction }) => {
    actionsRef.current = actions
  }

  return (
    <AnimationContext.Provider value={{ playAnimation, setMixer, setActions }}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error("useAnimation must be used within AnimationProvider")
  }
  return context
}
