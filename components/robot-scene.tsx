+"use client"

import { useRef } from "react"
import { extend, useFrame } from "@react-three/fiber"
import type { Group } from "three"
import { Robot } from "./robot"
import { AnimationProvider } from "@/contexts/animation-context"

// Extend THREE with HTML elements for R3F
extend({ Div: "div" })







// Rotating Globe Component
function RotatingGlobe() {
  const globeRef = useRef<Group>(null)

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.elapsedTime * 0.2
      globeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={globeRef} position={[-8, 2, -6]}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#001122"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      {/* Grid lines on globe */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
          <torusGeometry args={[1.5, 0.01, 16, 100]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export function RobotScene({
  isListening = false,
  isThinking = false,
  isSpeaking = false
}: {
  isListening?: boolean
  isThinking?: boolean
  isSpeaking?: boolean
}) {
  const sceneRef = useRef<Group>(null)

  // Floating Soundwave Component
  function FloatingSoundwave({ isActive = false }: { isActive?: boolean }) {
    const soundwaveRef = useRef<Group>(null)

    useFrame((state) => {
      if (soundwaveRef.current && isActive) {
        soundwaveRef.current.children.forEach((ring, index) => {
          const material = (ring as any).material
          if (material) {
            material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.4
            ring.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2)
          }
        })
      }
    })

    if (!isActive) return null

    return (
      <group ref={soundwaveRef} position={[0, 1.5, 0]}>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} position={[0, 0, -0.1 * (i + 1)]}>
            <ringGeometry args={[0.3 + i * 0.2, 0.4 + i * 0.2, 32]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={0.3}
              side={2}
            />
          </mesh>
        ))}
      </group>
    )
  }

  return (
    <AnimationProvider>
      <group ref={sceneRef}>
        {/* Futuristic Neon Cyberpunk Background */}
        <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
          <planeGeometry args={[50, 30]} />
          <meshBasicMaterial
            color="#101820"
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Neon Grid Lines */}
        {Array.from({ length: 40 }, (_, i) => (
          <group key={i}>
            <mesh position={[-20 + i, 0, -4.9]}>
              <boxGeometry args={[0.05, 30, 0.01]} />
              <meshBasicMaterial color="#00ffff" opacity={0.35} transparent />
            </mesh>
            <mesh position={[0, -15 + i * 0.7, -4.9]}>
              <boxGeometry args={[50, 0.05, 0.01]} />
              <meshBasicMaterial color="#00ffff" opacity={0.35} transparent />
            </mesh>
          </group>
        ))}





        {/* Reflective Neon Floor */}
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial
            color="#001122"
            transparent
            opacity={0.9}
            metalness={1}
            roughness={0.1}
            emissive="#002233"
            emissiveIntensity={0.5}
          />
        </mesh>







        {/* Rotating Globe */}
        <RotatingGlobe />

        {/* Lighting */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Robot */}
        <Robot
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
        />

        {/* Floating Soundwave */}
        <FloatingSoundwave isActive={isSpeaking} />
      </group>
    </AnimationProvider>
  )
}
