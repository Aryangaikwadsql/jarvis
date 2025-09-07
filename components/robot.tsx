"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF, useAnimations } from "@react-three/drei"
import type { Group, AnimationAction, AnimationMixer, Mesh } from "three"
import { useAnimation } from "@/contexts/animation-context"

// Preload the model
useGLTF.preload("/robot.glb")

interface AnimationState {
  current: string
  previous: string | null
  isTransitioning: boolean
}

function PlaceholderRobot({
  currentAnimation,
  isListening = false,
  isThinking = false,
  isSpeaking = false
}: {
  currentAnimation: string
  isListening?: boolean
  isThinking?: boolean
  isSpeaking?: boolean
}) {
  const robotRef = useRef<Group>(null)
  const eyeGlowRef = useRef<Mesh>(null)
  const chestGlowRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (robotRef.current) {
      const time = state.clock.elapsedTime

      // Enhanced idle breathing animation
      const breathingScale = 1 + Math.sin(time * 2) * 0.008
      robotRef.current.scale.setScalar(breathingScale)

      // Base idle animation - gentle floating and rotation
      const baseY = Math.sin(time * 2) * 0.05
      const baseRotY = Math.sin(time * 0.3) * 0.15  // Enhanced base rotation to match main robot

      // Animation-specific behaviors
      let additionalY = 0
      let additionalRotY = 0

      // State-based modifications
      if (isListening) {
        additionalY += 0.1
        additionalRotY += Math.sin(time * 3) * 0.05
      } else if (isThinking) {
        additionalRotY += Math.sin(time * 4) * 0.03
      } else if (isSpeaking) {
        additionalY += Math.sin(time * 5) * 0.02
        additionalRotY += Math.sin(time * 4) * 0.04
      }

      robotRef.current.position.y = baseY + additionalY
      robotRef.current.rotation.y = baseRotY + additionalRotY


    }

    // Dynamic glow effects
    if (eyeGlowRef.current && chestGlowRef.current) {
      const glowIntensity = isSpeaking ? 1.8 : isListening ? 1.4 : isThinking ? 1.1 : 0.8
      const eyeMaterial = (eyeGlowRef.current as any).material
      const chestMaterial = (chestGlowRef.current as any).material

      if (eyeMaterial && chestMaterial) {
        eyeMaterial.emissiveIntensity = glowIntensity
        chestMaterial.emissiveIntensity = glowIntensity
      }
    }
  })

  return (
    <group ref={robotRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Enhanced Eyes with Dynamic Glow */}
      <mesh ref={eyeGlowRef} position={[-0.2, 2.6, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={eyeGlowRef} position={[0.2, 2.6, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[1.2, 1.5, 0.8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Enhanced Chest Core with Dynamic Glow */}
      <mesh ref={chestGlowRef} position={[0, 1.8, 0.41]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        <meshStandardMaterial
          color="#ff4081"
          emissive="#ff4081"
          emissiveIntensity={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Holographic Particles Around Robot */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 16) * Math.PI * 2) * 1.8,
            Math.sin((i / 16) * Math.PI * 2) * 0.6 + Math.sin(Date.now() * 0.001 + i) * 0.2,
            Math.sin((i / 16) * Math.PI * 4) * 0.4
          ]}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff4081" : "#9c27b0"}
            transparent
            opacity={0.6}
            emissive={i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff4081" : "#9c27b0"}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Robot({
  onAnimationChange,
  isListening = false,
  isThinking = false,
  isSpeaking = false
}: {
  onAnimationChange?: (animation: string) => void
  isListening?: boolean
  isThinking?: boolean
  isSpeaking?: boolean
}) {
  const [modelError, setModelError] = useState(false)
  const [animationState, setAnimationState] = useState<AnimationState>({
    current: "idle",
    previous: null,
    isTransitioning: false,
  })

  const { playAnimation } = useAnimation()

  const gltf = useGLTF("/robot.glb")
  const scene = gltf.scene
  const animations = gltf.animations
  const animationHook = useAnimations(animations, scene)
  const actions = animationHook.actions || {}

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      // Start with idle animation
      const idleAction = actions.idle as AnimationAction
      if (idleAction) {
        idleAction.play()
        setAnimationState({
          current: "idle",
          previous: null,
          isTransitioning: false,
        })
      }
    }
  }, [actions])

  // Update animation mixer and reactive animations
  useFrame((state, delta) => {
    if (animationHook.mixer) {
      animationHook.mixer.update(delta)
    }

    // Reactive animations based on AI state
    if (scene) {
      const time = state.clock.elapsedTime

      // Base transformations with enhanced rotation
      let positionY = -0.9  // Updated base position
      let rotationY = Math.sin(time * 0.3) * 0.15  // Slower, more noticeable base rotation
      let scale = 1

      if (isListening) {
        // Lean forward and glow eyes - minimal upward movement
        positionY = -0.85  // Minimal upward from base
        rotationY += Math.sin(time * 2) * 0.1
        scale = 1.02  // Subtle scale increase
      } else if (isThinking) {
        // Subtle mechanical movement - minimal upward movement
        positionY = -0.9 + Math.sin(time * 4) * 0.005  // Very minimal upward
        rotationY += Math.sin(time * 3) * 0.05
        scale = 1.01  // Very subtle scale
      } else if (isSpeaking) {
        // Dynamic speaking gestures - minimal upward movement
        positionY = -0.9 + Math.sin(time * 6) * 0.008  // Very minimal upward
        rotationY += Math.sin(time * 5) * 0.08
        scale = 1.03  // Moderate scale for emphasis
      }

      scene.position.y = positionY
      scene.rotation.y = rotationY
      scene.scale.setScalar(scale)
    }
  })

  if (modelError || !scene) {
    return (
      <PlaceholderRobot
        currentAnimation={animationState.current}
        isListening={isListening}
        isThinking={isThinking}
        isSpeaking={isSpeaking}
      />
    )
  }

  return <primitive object={scene} scale={1} position={[0, -0.9, 0]} rotation={[0, 0, 0]} castShadow receiveShadow />
}
