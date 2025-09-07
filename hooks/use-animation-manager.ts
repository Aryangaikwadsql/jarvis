"use client"

import { useCallback, useState, useMemo } from "react"

export interface AnimationCommand {
  command: string
  timestamp: string
}

export interface AnimationManagerState {
  currentAnimation: string
  isTransitioning: boolean
  commandHistory: AnimationCommand[]
}

export function useAnimationManager() {
  const [state, setState] = useState<AnimationManagerState>({
    currentAnimation: "idle",
    isTransitioning: false,
    commandHistory: [],
  })

  const executeAnimation = useCallback((command: string) => {
    const timestamp = new Date().toLocaleTimeString()

    // Add to command history
    setState((prev) => ({
      ...prev,
      commandHistory: [...prev.commandHistory.slice(-9), { command, timestamp }],
      currentAnimation: command,
      isTransitioning: true,
    }))

    // Execute animation via global function
    if ((window as any).playRobotAnimation) {
      ;(window as any).playRobotAnimation(command, getAnimationDuration(command))
    }

    // Reset transitioning state after animation
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isTransitioning: false,
      }))
    }, 500)
  }, [])

  const getAnimationDuration = (command: string): number => {
    const durations: { [key: string]: number } = {
      wave: 3000,
      walk: 4000,
      nod: 2000,
      dance: 5000,
      idle: 0,
    }
    return durations[command] || 3000
  }

  return useMemo(() => ({
    ...state,
    executeAnimation,
  }), [state, executeAnimation])
}
