import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbState } from '../../../shared/types'
import { useChatStore } from '../../stores/chatStore'

// State-driven color palettes (Cyan, Electric Blue, Violet accents)
export const STATE_PALETTES: Record<
  OrbState,
  { primary: [number, number, number]; secondary: [number, number, number]; accent: [number, number, number] }
> = {
  IDLE: {
    primary: [0.0, 0.83, 1.0],      // #00d4ff (Electric Cyan)
    secondary: [0.0, 0.4, 1.0],      // #0066ff (Deep Blue)
    accent: [0.55, 0.15, 0.95]      // #8c27f2 (Subtle Violet)
  },
  LISTENING: {
    primary: [0.0, 1.0, 0.8],       // #00ffcc (Cyan-Teal)
    secondary: [0.0, 0.7, 0.5],      // #00b380
    accent: [0.2, 0.9, 1.0]
  },
  THINKING: {
    primary: [0.6, 0.1, 1.0],       // #991aff (Vibrant Violet-Purple)
    secondary: [0.15, 0.4, 1.0],     // #2666ff (Synaptic Blue)
    accent: [0.0, 0.9, 1.0]         // Cyan spark
  },
  PLANNING: {
    primary: [0.95, 0.1, 0.75],     // Magenta/Purple neural excitation
    secondary: [0.4, 0.1, 0.95],
    accent: [0.0, 0.85, 1.0]
  },
  EXECUTING: {
    primary: [0.0, 1.0, 0.55],      // Neon Emerald
    secondary: [0.0, 0.8, 0.9],      // Electric Cyan
    accent: [0.2, 1.0, 0.8]
  },
  SEARCHING: {
    primary: [0.0, 0.9, 1.0],       // #00e6ff (Electric Cyan)
    secondary: [1.0, 0.7, 0.0],     // #ffb300 (Amber discovery)
    accent: [0.3, 0.5, 1.0]
  },
  ANALYZING: {
    primary: [0.7, 0.2, 1.0],       // Spectral Violet
    secondary: [0.0, 0.6, 1.0],     // Deep Sapphire
    accent: [0.0, 1.0, 0.8]         // Cyan spark
  },
  WAITING_PERMISSION: {
    primary: [1.0, 0.6, 0.0],       // Warning Amber
    secondary: [0.9, 0.2, 0.1],     // Coral red
    accent: [1.0, 0.85, 0.3]        // Yellow warning
  },
  VERIFYING: {
    primary: [0.0, 0.95, 0.8],      // Turquoise Mint
    secondary: [0.1, 0.5, 0.95],     // High-integrity blue
    accent: [0.3, 1.0, 0.5]         // Verification green
  },
  OFFLINE: {
    primary: [0.4, 0.5, 0.6],       // Steel Slate
    secondary: [0.2, 0.25, 0.35],   // Dark Iron
    accent: [0.6, 0.7, 0.8]         // Monochrome Ice
  },
  PHONE_CONNECTED: {
    primary: [0.1, 0.9, 0.4],       // Android Emerald
    secondary: [0.0, 0.6, 0.8],     // ADB Cyan
    accent: [0.4, 1.0, 0.7]
  },
  SCREEN_ANALYZING: {
    primary: [0.3, 0.4, 1.0],       // Optical Sapphire
    secondary: [0.8, 0.1, 0.9],     // Visual Violet
    accent: [0.0, 1.0, 1.0]         // Laser Cyan
  },
  MISSION_RUNNING: {
    primary: [0.0, 0.8, 1.0],       // Command Cyan
    secondary: [0.9, 0.1, 0.6],     // Mission Magenta
    accent: [0.1, 1.0, 0.5]         // Progress Emerald
  },
  CALLING: {
    primary: [0.0, 0.85, 1.0],
    secondary: [0.0, 0.5, 1.0],
    accent: [0.4, 0.9, 1.0]
  },
  MESSAGING: {
    primary: [0.1, 0.75, 1.0],
    secondary: [0.0, 0.45, 0.95],
    accent: [0.5, 0.85, 1.0]
  },
  RESEARCHING: {
    primary: [1.0, 0.65, 0.0],
    secondary: [0.8, 0.3, 0.0],
    accent: [0.0, 0.85, 1.0]
  },
  SCANNING: {
    primary: [0.0, 0.95, 1.0],
    secondary: [0.9, 0.1, 0.4],
    accent: [0.2, 0.8, 1.0]
  },
  ALERT: {
    primary: [1.0, 0.25, 0.0],
    secondary: [0.8, 0.0, 0.1],
    accent: [1.0, 0.6, 0.0]
  },
  SUCCESS: {
    primary: [0.0, 1.0, 0.45],
    secondary: [0.0, 0.75, 0.3],
    accent: [0.4, 1.0, 0.7]
  },
  ERROR: {
    primary: [1.0, 0.15, 0.25],
    secondary: [0.6, 0.0, 0.15],
    accent: [0.9, 0.4, 0.4]
  },
  BLOCKED: {
    primary: [1.0, 0.5, 0.0],
    secondary: [0.7, 0.2, 0.0],
    accent: [1.0, 0.7, 0.2]
  }
}

// Procedural Neural GLSL Shaders
const NeuralVertexShader = `
  uniform float uTime;
  uniform float uState;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;
  uniform vec3 uColorAccent;
  uniform float uPointSizeScale;
  uniform float uActivity;

  attribute float aSize;
  attribute float aPhase;
  attribute float aType; // 0.0: Nucleus, 1.0: Lobe Hemispheres, 2.0: Axonal Stream, 3.0: Cloud Halo
  attribute vec3 aColorBias;

  varying vec3 vColor;
  varying float vAlpha;

  // Pseudo-random noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vec3 pos = position;
    float t = uTime * (0.8 + uActivity * 0.7);

    // 1. Organic Brain & Neural Cloud Dynamics
    if (aType < 0.5) {
      // DENSE NUCLEUS: Subtle core pulse & internal fluid drift
      float corePulse = sin(t * 2.2 + aPhase) * 0.05;
      pos *= (1.0 + corePulse);
      pos.x += sin(t * 1.5 + pos.y * 3.0) * 0.02;
      pos.y += cos(t * 1.8 + pos.z * 3.0) * 0.02;
      pos.z += sin(t * 1.3 + pos.x * 3.0) * 0.02;
    } else if (aType < 1.5) {
      // HEMISPHERE LOBES: Synaptic breathing & cortical flow
      float lobeWave = sin(t * 2.0 + pos.y * 2.5 + aPhase) * (0.04 + uActivity * 0.05);
      pos.x += sin(pos.y * 3.0 + t) * 0.03;
      pos.y += cos(pos.x * 2.5 + t * 1.2) * 0.03;
      pos += normalize(pos) * lobeWave;
    } else if (aType < 2.5) {
      // AXONAL STREAM PATHWAYS: Traveling neural excitation waves
      float streamWave = sin(t * 4.0 - length(pos) * 3.5 + aPhase);
      pos += normalize(pos) * (streamWave * (0.06 + uActivity * 0.08));
    } else {
      // VOLUMETRIC SYNAPTO-CLOUD: Slow orbital drift
      float angle = t * 0.15 + aPhase;
      float ca = cos(angle * 0.5);
      float sa = sin(angle * 0.5);
      pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;
    }

    // 2. State-Specific Morphing Motions
    if (uState == 1.0) {
      // LISTENING: Subtle inward convergence toward core
      float attract = sin(t * 3.0) * 0.08 + 0.92;
      if (aType > 0.5) pos *= attract;
    } else if (uState == 2.0 || uState == 3.0) {
      // THINKING / PLANNING: Fast synaptic wave ripple propagating through lobes
      float ripple = sin(pos.y * 6.0 - t * 6.0 + aPhase) * 0.07;
      pos += normalize(pos) * ripple;
    } else if (uState == 4.0) {
      // EXECUTING: Rapid localized excitation pulses
      float pulse = step(0.7, sin(t * 8.0 - length(pos) * 6.0 + aPhase)) * 0.12;
      pos += normalize(pos) * pulse;
    } else if (uState == 11.0) {
      // ERROR: Controlled disturbance
      float jitter = hash(pos + t) * 0.06;
      pos += vec3(jitter);
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // 3. Volumetric Perspective Point Attenuation
    float pointDist = -mvPosition.z;
    float pointScale = (aSize * uPointSizeScale) * (360.0 / max(pointDist, 0.1));
    gl_PointSize = clamp(pointScale, 1.0, 32.0);

    gl_Position = projectionMatrix * mvPosition;

    // 4. Layered Color Mixing & Alpha
    vec3 mixedColor = mix(uColorPrimary, uColorSecondary, aColorBias.x);
    mixedColor = mix(mixedColor, uColorAccent, aColorBias.y * 0.6);

    // Core particles are intensely luminous; outer cloud is soft and atmospheric
    float depthFade = smoothstep(6.0, 1.0, pointDist);
    if (aType < 0.5) {
      vAlpha = (0.75 + sin(t * 2.5 + aPhase) * 0.2) * depthFade;
      vColor = mix(mixedColor, vec3(0.92, 0.98, 1.0), 0.55); // Brighter luminous core
    } else if (aType < 1.5) {
      vAlpha = (0.55 + sin(t * 3.0 + aPhase) * 0.15) * depthFade;
      vColor = mixedColor;
    } else if (aType < 2.5) {
      float pulseHighlight = max(0.0, sin(t * 5.0 - length(pos) * 3.0 + aPhase));
      vAlpha = (0.45 + pulseHighlight * 0.4) * depthFade;
      vColor = mix(mixedColor, uColorAccent, pulseHighlight);
    } else {
      vAlpha = 0.22 * depthFade;
      vColor = mix(uColorSecondary, uColorAccent, 0.4);
    }
  }
`

const NeuralFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circular radial falloff point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft organic gaussian glow profile
    float falloff = smoothstep(0.5, 0.05, dist);
    float innerGlow = smoothstep(0.3, 0.0, dist);
    float alpha = pow(falloff, 1.8) * vAlpha;

    vec3 finalColor = vColor + vec3(innerGlow * 0.35);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Starfield Shader for distant ambient space
const StarVertexShader = `
  uniform float uTime;
  attribute float aTwinkle;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Slow ambient twinkling
    vAlpha = 0.15 + sin(uTime * 0.8 + aTwinkle * 6.28) * 0.12;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp(1.2 * (250.0 / -mvPosition.z), 1.0, 3.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const StarFragmentShader = `
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    gl_FragColor = vec4(0.4, 0.8, 1.0, vAlpha);
  }
`

type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'

const QUALITY_COUNTS: Record<QualityLevel, number> = {
  LOW: 10000,
  MEDIUM: 20000,
  HIGH: 35000,
  ULTRA: 50000
}

function NeuralParticleSystem({ state, quality }: { state: OrbState; quality: QualityLevel }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const particleCount = QUALITY_COUNTS[quality] || QUALITY_COUNTS.HIGH
  const palette = STATE_PALETTES[state] || STATE_PALETTES.IDLE

  // Generate Organic Digital Brain & Neural Cloud Geometry
  const { positions, sizes, phases, types, colorBiases } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const sz = new Float32Array(particleCount)
    const ph = new Float32Array(particleCount)
    const ty = new Float32Array(particleCount)
    const cb = new Float32Array(particleCount * 3)

    const nucleusCount = Math.floor(particleCount * 0.32)
    const lobesCount = Math.floor(particleCount * 0.38)
    const pathwaysCount = Math.floor(particleCount * 0.20)
    const haloCount = particleCount - nucleusCount - lobesCount - pathwaysCount

    let idx = 0

    // 1. DENSE NUCLEUS: Overlapping, concentrated neural seed
    for (let i = 0; i < nucleusCount; i++, idx++) {
      const u = Math.random()
      const radius = 0.55 * Math.pow(u, 1.8) // High core concentration
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[idx * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[idx * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.95
      pos[idx * 3 + 2] = radius * Math.cos(phi)

      sz[idx] = 1.4 + Math.random() * 1.8
      ph[idx] = Math.random() * Math.PI * 2
      ty[idx] = 0.0 // Nucleus
      cb[idx * 3] = Math.random() * 0.3
      cb[idx * 3 + 1] = Math.random() * 0.2
      cb[idx * 3 + 2] = Math.random()
    }

    // 2. HEMISPHERE LOBES: Dual-lobe cortical structure
    for (let i = 0; i < lobesCount; i++, idx++) {
      const isLeft = Math.random() > 0.5
      const side = isLeft ? -1 : 1
      const u = Math.random()
      const rad = 0.5 + Math.pow(u, 0.9) * 0.85

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      // Cortical fold perturbation
      const fold = 1.0 + Math.sin(theta * 4.0) * Math.cos(phi * 3.0) * 0.15

      const x = (rad * Math.sin(phi) * Math.cos(theta) * fold * 0.75) + (side * 0.38)
      const y = rad * Math.sin(phi) * Math.sin(theta) * fold * 0.85
      const z = rad * Math.cos(phi) * fold * 0.9

      pos[idx * 3] = x
      pos[idx * 3 + 1] = y
      pos[idx * 3 + 2] = z

      sz[idx] = 1.1 + Math.random() * 1.5
      ph[idx] = Math.random() * Math.PI * 2
      ty[idx] = 1.0 // Lobe
      cb[idx * 3] = Math.random() * 0.7
      cb[idx * 3 + 1] = Math.random() * 0.5
      cb[idx * 3 + 2] = Math.random()
    }

    // 3. AXONAL STREAM PATHWAYS: Branching filaments & spiral neural highways
    for (let i = 0; i < pathwaysCount; i++, idx++) {
      const streamIdx = Math.floor(Math.random() * 12)
      const streamAngle = (streamIdx / 12) * Math.PI * 2
      const prog = Math.random()
      const dist = 0.4 + prog * 1.4

      // Curved spiral stream with jitter
      const spiralTheta = streamAngle + prog * 1.8
      const jitter = (Math.random() - 0.5) * 0.12

      pos[idx * 3] = Math.cos(spiralTheta) * dist * 0.9 + jitter
      pos[idx * 3 + 1] = (Math.sin(prog * Math.PI) * 0.6 - 0.2) + jitter
      pos[idx * 3 + 2] = Math.sin(spiralTheta) * dist * 0.9 + jitter

      sz[idx] = 1.3 + Math.random() * 1.7
      ph[idx] = Math.random() * Math.PI * 2
      ty[idx] = 2.0 // Axonal stream
      cb[idx * 3] = 0.3 + Math.random() * 0.7
      cb[idx * 3 + 1] = Math.random() * 0.8
      cb[idx * 3 + 2] = Math.random()
    }

    // 4. VOLUMETRIC SYNAPTO-CLOUD: Ambient neural dust
    for (let i = 0; i < haloCount; i++, idx++) {
      const radius = 1.3 + Math.random() * 1.1
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[idx * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[idx * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.8
      pos[idx * 3 + 2] = radius * Math.cos(phi)

      sz[idx] = 0.8 + Math.random() * 1.2
      ph[idx] = Math.random() * Math.PI * 2
      ty[idx] = 3.0 // Cloud halo
      cb[idx * 3] = Math.random()
      cb[idx * 3 + 1] = 0.5 + Math.random() * 0.5
      cb[idx * 3 + 2] = Math.random()
    }

    return {
      positions: pos,
      sizes: sz,
      phases: ph,
      types: ty,
      colorBiases: cb
    }
  }, [particleCount])

  // Uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uState: { value: 0 },
      uColorPrimary: { value: new THREE.Color(...palette.primary) },
      uColorSecondary: { value: new THREE.Color(...palette.secondary) },
      uColorAccent: { value: new THREE.Color(...palette.accent) },
      uPointSizeScale: { value: 1.0 },
      uActivity: { value: 0.0 }
    }),
    []
  )

  // Map state to numeric code
  const stateCode = useMemo(() => {
    switch (state) {
      case 'IDLE':
        return 0
      case 'LISTENING':
        return 1
      case 'THINKING':
        return 2
      case 'ANALYZING':
        return 2
      case 'PLANNING':
        return 3
      case 'EXECUTING':
        return 4
      case 'MISSION_RUNNING':
        return 4
      case 'CALLING':
        return 5
      case 'PHONE_CONNECTED':
        return 5
      case 'MESSAGING':
        return 6
      case 'RESEARCHING':
      case 'SEARCHING':
        return 7
      case 'SCANNING':
      case 'SCREEN_ANALYZING':
      case 'VERIFYING':
        return 8
      case 'ALERT':
      case 'WAITING_PERMISSION':
        return 9
      case 'SUCCESS':
        return 10
      case 'ERROR':
        return 11
      case 'OFFLINE':
      case 'BLOCKED':
        return 12
      default:
        return 0
    }
  }, [state])

  // Frame Loop
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()

    if (materialRef.current) {
      const u = materialRef.current.uniforms
      u.uTime.value = elapsed
      u.uState.value = stateCode

      // Smoothly interpolate colors to target palette
      const targetPri = new THREE.Color(...palette.primary)
      const targetSec = new THREE.Color(...palette.secondary)
      const targetAcc = new THREE.Color(...palette.accent)

      u.uColorPrimary.value.lerp(targetPri, 0.08)
      u.uColorSecondary.value.lerp(targetSec, 0.08)
      u.uColorAccent.value.lerp(targetAcc, 0.08)

      // Activity level target
      const targetActivity =
        state === 'THINKING' || state === 'PLANNING' || state === 'EXECUTING' ? 1.0 : state === 'LISTENING' ? 0.4 : 0.0
      u.uActivity.value += (targetActivity - u.uActivity.value) * 0.06

      // Scale points subtly based on quality
      u.uPointSizeScale.value = quality === 'ULTRA' ? 1.0 : quality === 'HIGH' ? 1.15 : 1.3
    }

    if (pointsRef.current) {
      // Very slow organic yaw rotation
      const rotSpeed = state === 'THINKING' || state === 'EXECUTING' ? 0.28 : 0.12
      pointsRef.current.rotation.y = elapsed * rotSpeed
      pointsRef.current.rotation.x = Math.sin(elapsed * 0.15) * 0.08
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aType"
          args={[types, 1]}
        />
        <bufferAttribute
          attach="attributes-aColorBias"
          args={[colorBiases, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={NeuralVertexShader}
        fragmentShader={NeuralFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Starfield() {
  const pointsRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const { positions, twinkles } = useMemo(() => {
    const count = 1200
    const pos = new Float32Array(count * 3)
    const tw = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const rad = 6.0 + Math.random() * 14.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[i * 3] = rad * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = rad * Math.cos(phi)

      tw[i] = Math.random()
    }

    return { positions: pos, twinkles: tw }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }
    }),
    []
  )

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aTwinkle" args={[twinkles, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={StarVertexShader}
        fragmentShader={StarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Adaptive Quality Controller
function QualityController({ onQualityChange }: { onQualityChange: (q: QualityLevel) => void }) {
  const frameTimes = useRef<number[]>([])
  const lastTime = useRef<number>(performance.now())

  useFrame(() => {
    const now = performance.now()
    const delta = now - lastTime.current
    lastTime.current = now

    frameTimes.current.push(delta)
    if (frameTimes.current.length > 90) {
      frameTimes.current.shift()
      const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
      const avgFps = 1000 / avgDelta

      if (avgFps < 35) {
        onQualityChange('LOW')
      } else if (avgFps < 48) {
        onQualityChange('MEDIUM')
      } else if (avgFps > 55) {
        onQualityChange('HIGH')
      }
    }
  })

  return null
}

interface UltronCoreProps {
  className?: string
  mode?: 'full' | 'compact' | string
}

export function UltronCore({ className = '', mode = 'full' }: UltronCoreProps) {
  const orbState = useChatStore((s) => s.orbState)
  const [quality, setQuality] = useState<QualityLevel>('HIGH')

  return (
    <div className={`ultron-neural-viewport ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 48, near: 0.1, far: 50 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: false
        }}
        dpr={[1, 1.5]}
      >
        <QualityController onQualityChange={setQuality} />
        <Starfield />
        <NeuralParticleSystem state={orbState} quality={quality} />
      </Canvas>
    </div>
  )
}