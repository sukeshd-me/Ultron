import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbState } from '../../../shared/types'
import { useChatStore } from '../../stores/chatStore'

// State color mappings
const STATE_COLORS: Record<OrbState, { primary: string; secondary: string; emissive: string }> = {
  IDLE: { primary: '#00d4ff', secondary: '#0055ff', emissive: '#00aaff' },
  LISTENING: { primary: '#00ffcc', secondary: '#00bb88', emissive: '#00ffaa' },
  THINKING: { primary: '#9d00ff', secondary: '#4d00ff', emissive: '#b347ff' },
  PLANNING: { primary: '#ff00bb', secondary: '#7700ff', emissive: '#ff55dd' },
  EXECUTING: { primary: '#00ff88', secondary: '#00aa55', emissive: '#55ffaa' },
  CALLING: { primary: '#00e5ff', secondary: '#0077ff', emissive: '#33ffff' },
  MESSAGING: { primary: '#33bbff', secondary: '#0055cc', emissive: '#66ccff' },
  RESEARCHING: { primary: '#ffaa00', secondary: '#ff5500', emissive: '#ffcc33' },
  SCANNING: { primary: '#00ffff', secondary: '#ff0055', emissive: '#00e5ff' },
  ALERT: { primary: '#ff3300', secondary: '#ff0000', emissive: '#ff6600' },
  SUCCESS: { primary: '#00ff66', secondary: '#00cc44', emissive: '#66ff99' },
  ERROR: { primary: '#ff1144', secondary: '#990022', emissive: '#ff3366' },
  BLOCKED: { primary: '#ff8800', secondary: '#663300', emissive: '#ffaa33' }
}

function CentralOrb({ state }: { state: OrbState }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const colors = STATE_COLORS[state] || STATE_COLORS.IDLE

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = Math.sin(t * 2.5) * 0.08 + 1.0

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2
      meshRef.current.scale.set(pulse, pulse, pulse)
    }

    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.8
      innerRef.current.rotation.z = Math.cos(t * 0.5) * 0.3
      const innerPulse = Math.cos(t * 3) * 0.05 + 0.85
      innerRef.current.scale.set(innerPulse, innerPulse, innerPulse)
    }
  })

  return (
    <group>
      {/* Outer Wireframe/Icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.emissive}
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner Emissive Core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.primary}
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  )
}

function OrbitalRings({ state }: { state: OrbState }) {
  const ring1 = useRef<THREE.Mesh>(null!)
  const ring2 = useRef<THREE.Mesh>(null!)
  const ring3 = useRef<THREE.Mesh>(null!)
  const colors = STATE_COLORS[state] || STATE_COLORS.IDLE

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speedMult = state === 'THINKING' || state === 'EXECUTING' ? 2.2 : 1.0

    if (ring1.current) {
      ring1.current.rotation.x = t * 0.5 * speedMult
      ring1.current.rotation.y = t * 0.7 * speedMult
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 0.6 * speedMult
      ring2.current.rotation.z = t * 0.4 * speedMult
    }
    if (ring3.current) {
      ring3.current.rotation.x = Math.sin(t * 0.5) * speedMult
      ring3.current.rotation.z = -t * 0.8 * speedMult
    }
  })

  return (
    <group>
      <mesh ref={ring1}>
        <torusGeometry args={[1.7, 0.018, 16, 100]} />
        <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.0, 0.015, 16, 100]} />
        <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[2.3, 0.012, 16, 100]} />
        <meshStandardMaterial color={colors.emissive} emissive={colors.emissive} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function ParticleField({ count = 200, state }: { count?: number; state: OrbState }) {
  const points = useRef<THREE.Points>(null!)
  const colors = STATE_COLORS[state] || STATE_COLORS.IDLE

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sca = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const radius = 2.5 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      sca[i] = Math.random() * 0.04 + 0.015
    }
    return [pos, sca]
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (points.current) {
      points.current.rotation.y = t * 0.08
      points.current.rotation.x = Math.sin(t * 0.05) * 0.1
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[scales, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={colors.primary}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function UltronCore() {
  const orbState = useChatStore((s) => s.orbState)

  return (
    <div className="core3d-container" style={{ width: '100%', height: '240px', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#0055ff" />

        <CentralOrb state={orbState} />
        <OrbitalRings state={orbState} />
        <ParticleField state={orbState} />
      </Canvas>
    </div>
  )
}