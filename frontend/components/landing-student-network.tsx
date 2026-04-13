"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

/** 3D 임베딩 산점용 포인트 (네트워크 엣지 없음) */
export type EmbeddingPoint = {
  id: string
  position: [number, number, number]
  clusterIndex: number
  clusterName: string
  color: string
  scale: number
}

/** 배경: 완전 검정보다 약간 올려 대비 확보 */
const BG = "#0e0d12"
const BG_FOG = 0x0e0d12

/** 군집별 색 — 또렷하되 네온은 피한 톤 */
const CLUSTER_PALETTE = [
  { name: "군집 A", color: "#e8927a" },
  { name: "군집 B", color: "#6ec985" },
  { name: "군집 C", color: "#b091e8" },
  { name: "군집 D", color: "#f0c14d" },
  { name: "군집 E", color: "#5eb8e5" },
] as const

function randn(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateEmbeddingCloud(): EmbeddingPoint[] {
  const specs: {
    center: [number, number, number]
    count: number
    sx: number
    sy: number
    sz: number
    clusterKey: number
  }[] = [
    { center: [-3.5, -1.05, 0.45], count: 36, sx: 0.42, sy: 0.36, sz: 0.31, clusterKey: 0 },
    { center: [2.95, -1.35, -0.55], count: 22, sx: 0.28, sy: 0.32, sz: 0.26, clusterKey: 1 },
    { center: [0.15, 2.55, 0.95], count: 14, sx: 0.18, sy: 0.2, sz: 0.17, clusterKey: 2 },
    { center: [-1.25, 1.35, -1.85], count: 40, sx: 0.38, sy: 0.34, sz: 0.4, clusterKey: 3 },
    { center: [3.2, 1.45, 1.35], count: 28, sx: 0.33, sy: 0.3, sz: 0.35, clusterKey: 4 },
  ]

  const points: EmbeddingPoint[] = []
  let globalIdx = 0

  for (const spec of specs) {
    const { center, count, sx, sy, sz, clusterKey } = spec
    const meta = CLUSTER_PALETTE[clusterKey % CLUSTER_PALETTE.length]
    for (let i = 0; i < count; i++) {
      const jitter = (Math.random() - 0.5) * 0.06
      const x = center[0] + randn() * sx + jitter
      const y = center[1] + randn() * sy + jitter
      const z = center[2] + randn() * sz + jitter
      const scale = 0.034 + Math.random() * 0.024 + (clusterKey === 2 ? 0.008 : 0)
      points.push({
        id: `S-${globalIdx + 1}`,
        position: [x, y, z],
        clusterIndex: clusterKey,
        clusterName: meta.name,
        color: meta.color,
        scale,
      })
      globalIdx++
    }
  }

  return points
}

type TooltipState = {
  id: string
  clusterName: string
  left: number
  top: number
} | null

function EmbeddingFog() {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2(BG_FOG, 0.026)
    return () => {
      scene.fog = null
    }
  }, [scene])
  return null
}

function GlowingTwinklingParticles({
  points,
  hoveredIndex,
  setHoveredIndex,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
}: {
  points: EmbeddingPoint[]
  hoveredIndex: number | null
  setHoveredIndex: (i: number | null) => void
  onPointerEnter: (p: EmbeddingPoint, index: number, clientX: number, clientY: number) => void
  onPointerMove: (clientX: number, clientY: number) => void
  onPointerLeave: () => void
}) {
  const n = points.length
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const coreMats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const glowMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])

  if (groupRefs.current.length !== n) {
    groupRefs.current = Array.from({ length: n }, () => null)
    coreMats.current = Array.from({ length: n }, () => null)
    glowMats.current = Array.from({ length: n }, () => null)
  }

  const phases = useMemo(() => points.map(() => Math.random() * Math.PI * 2), [points])
  const freqs = useMemo(() => points.map(() => 0.85 + Math.random() * 0.55), [points])
  const twinkleAmp = useMemo(() => points.map(() => 0.11 + Math.random() * 0.1), [points])

  const tmpWorld = useRef(new THREE.Vector3())

  useFrame((state) => {
    const cam = state.camera.position
    const t = state.clock.elapsedTime

    for (let i = 0; i < n; i++) {
      const grp = groupRefs.current[i]
      const core = coreMats.current[i]
      const glow = glowMats.current[i]
      if (!grp || !core) continue

      grp.getWorldPosition(tmpWorld.current)
      const dist = tmpWorld.current.distanceTo(cam)
      const depthBright = THREE.MathUtils.clamp(1.52 - (dist - 6.2) * 0.085, 0.58, 1.55)
      const tw = 1 + twinkleAmp[i] * Math.sin(t * freqs[i] + phases[i])
      const hover = hoveredIndex === i
      const baseEmit = hover ? 1.05 : 0.52
      core.emissiveIntensity = baseEmit * depthBright * tw

      if (glow) {
        glow.opacity = THREE.MathUtils.clamp(0.18 + depthBright * 0.14 + tw * 0.08 + (hover ? 0.12 : 0), 0.12, 0.52)
      }
    }
  })

  return (
    <>
      {points.map((p, index) => {
        const hover = hoveredIndex === index
        const s = p.scale * (hover ? 1.42 : 1)
        return (
          <group
            key={p.id}
            ref={(r) => {
              groupRefs.current[index] = r
            }}
            position={p.position}
            scale={s}
          >
            <mesh
              onPointerEnter={(e) => {
                e.stopPropagation()
                setHoveredIndex(index)
                onPointerEnter(p, index, e.clientX, e.clientY)
              }}
              onPointerMove={(e) => {
                e.stopPropagation()
                onPointerMove(e.clientX, e.clientY)
              }}
              onPointerLeave={(e) => {
                e.stopPropagation()
                setHoveredIndex(null)
                onPointerLeave()
              }}
            >
              <sphereGeometry args={[1, 20, 20]} />
              <meshStandardMaterial
                ref={(m) => {
                  coreMats.current[index] = m
                }}
                color={p.color}
                emissive={p.color}
                emissiveIntensity={0.55}
                roughness={0.35}
                metalness={0.12}
                toneMapped={false}
              />
            </mesh>
            <mesh raycast={() => null} scale={1.72} renderOrder={-1}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshBasicMaterial
                ref={(m) => {
                  glowMats.current[index] = m
                }}
                color={p.color}
                transparent
                opacity={0.28}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function EmbeddingScene({
  setTooltip,
  clearTooltip,
  shellRef,
}: {
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>
  clearTooltip: () => void
  shellRef: React.RefObject<HTMLDivElement | null>
}) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const points = useMemo(() => generateEmbeddingCloud(), [])

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const el = shellRef.current
      if (!el) return { left: 0, top: 0 }
      const r = el.getBoundingClientRect()
      return { left: clientX - r.left, top: clientY - r.top }
    },
    [shellRef]
  )

  const handleEnter = useCallback(
    (p: EmbeddingPoint, _i: number, cx: number, cy: number) => {
      const { left, top } = toLocal(cx, cy)
      setTooltip({ id: p.id, clusterName: p.clusterName, left, top })
    },
    [setTooltip, toLocal]
  )

  const handleMove = useCallback(
    (cx: number, cy: number) => {
      setTooltip((prev) => {
        if (!prev) return prev
        return { ...prev, ...toLocal(cx, cy) }
      })
    },
    [setTooltip, toLocal]
  )

  const handleLeave = useCallback(() => clearTooltip(), [clearTooltip])

  return (
    <>
      <EmbeddingFog />
      <color attach="background" args={[BG]} />
      <ambientLight intensity={0.55} color="#e8e2dc" />
      <directionalLight position={[6, 8, 5]} intensity={0.65} color="#fff5ee" />
      <directionalLight position={[-5, -3, -6]} intensity={0.22} color="#c4b8ad" />
      <GlowingTwinklingParticles
        points={points}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        onPointerEnter={handleEnter}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.09}
        minDistance={6.2}
        maxDistance={15.5}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI - 0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.045}
        rotateSpeed={0.65}
        zoomSpeed={0.55}
        onStart={() => setAutoRotate(false)}
      />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          luminanceThreshold={0.18}
          luminanceSmoothing={0.55}
          intensity={0.62}
          mipmapBlur
          radius={0.42}
        />
      </EffectComposer>
    </>
  )
}

export default function LandingStudentNetwork() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasShellRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  useEffect(() => {
    const el = canvasShellRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => e.preventDefault()
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const clearTooltip = useCallback(() => setTooltip(null), [])

  const twPad = tooltip
    ? {
        left: Math.max(10, Math.min(tooltip.left + 12, (canvasShellRef.current?.clientWidth ?? 400) - 172)),
        top: Math.max(10, Math.min(tooltip.top + 12, (canvasShellRef.current?.clientHeight ?? 400) - 78)),
      }
    : { left: 0, top: 0 }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={canvasShellRef}
        className="relative h-[min(360px,62vw)] w-full max-h-[420px] overflow-hidden rounded-2xl border border-neutral-700/90 bg-[#0e0d12] shadow-[0_28px_70px_-18px_rgba(0,0,0,0.55)] md:h-[400px] md:max-h-[440px]"
        role="img"
        aria-label="유사도 기반 3D 임베딩 산점도. 드래그로 회전, 스크롤로 확대할 수 있습니다."
      >
        <Canvas
          className="!h-full !w-full"
          camera={{ position: [0.2, 0.35, 10.2], fov: 40, near: 0.1, far: 48 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <EmbeddingScene
            setTooltip={setTooltip}
            clearTooltip={clearTooltip}
            shellRef={canvasShellRef}
          />
        </Canvas>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[168px] rounded-md border border-white/18 bg-[#1a1816]/95 px-2.5 py-2 text-left text-[11px] text-neutral-100 shadow-lg backdrop-blur-sm"
          style={{ left: twPad.left, top: twPad.top }}
        >
          <div className="text-[10px] uppercase tracking-wider text-primary/90">{tooltip.clusterName}</div>
          <div className="mt-1 font-medium text-white">학생 {tooltip.id}</div>
        </div>
      )}

      <p className="pointer-events-none mt-2.5 text-center text-[10px] tracking-wide text-neutral-500 dark:text-neutral-500">
        드래그 회전 · 스크롤 확대 · 가까운 점일수록 상태 유사도가 높습니다
      </p>
    </div>
  )
}
