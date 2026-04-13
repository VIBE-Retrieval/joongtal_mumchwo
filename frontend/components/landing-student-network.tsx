"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

/** 3D 임베딩 산점용 포인트 */
export type EmbeddingPoint = {
  id: string
  position: [number, number, number]
  clusterIndex: number
  clusterName: string
  color: string
  scale: number
}

const BG = "#0e0d12"
const BG_FOG = 0x0e0d12

const CLUSTER_PALETTE = [
  { name: "중탈 위험",  color: "#e8927a", desc: "즉각적 개입 권고" },
  { name: "합격",      color: "#6ec985", desc: "안정적 학습 진행 중" },
  { name: "보류",      color: "#b091e8", desc: "추가 검토 대기 중" },
  { name: "불합격",    color: "#f0c14d", desc: "재심의 필요" },
  { name: "안정 관찰", color: "#5eb8e5", desc: "경과 모니터링 중" },
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
    // 클러스터당 인원 대폭 증가 — 실제 학생 수 규모 반영
    { center: [-3.5, -1.05, 0.45],  count: 110, sx: 0.58, sy: 0.52, sz: 0.46, clusterKey: 0 }, // 중탈 위험
    { center: [2.95, -1.35, -0.55], count:  82, sx: 0.50, sy: 0.54, sz: 0.44, clusterKey: 1 }, // 합격
    { center: [0.15,  2.55,  0.95], count:  55, sx: 0.36, sy: 0.40, sz: 0.34, clusterKey: 2 }, // 보류
    { center: [-1.25, 1.35, -1.85], count: 130, sx: 0.55, sy: 0.50, sz: 0.58, clusterKey: 3 }, // 불합격
    { center: [3.2,   1.45,  1.35], count:  95, sx: 0.52, sy: 0.48, sz: 0.54, clusterKey: 4 }, // 안정 관찰
    // 위성 소클러스터 — 실제 데이터에서 자주 나타나는 경계 케이스들
    { center: [-2.8,  0.8,  -1.2],  count:  38, sx: 0.28, sy: 0.26, sz: 0.30, clusterKey: 0 }, // 중탈 위험 위성
    { center: [1.8,   2.2,   0.6],  count:  28, sx: 0.22, sy: 0.24, sz: 0.20, clusterKey: 1 }, // 합격 위성
    { center: [-0.4, -2.2,   1.0],  count:  32, sx: 0.24, sy: 0.22, sz: 0.26, clusterKey: 3 }, // 불합격 위성
    { center: [4.5,   0.2,  -0.8],  count:  22, sx: 0.20, sy: 0.22, sz: 0.18, clusterKey: 4 }, // 안정 관찰 위성
  ]

  const points: EmbeddingPoint[] = []
  let globalIdx = 0

  for (const spec of specs) {
    const { center, count, sx, sy, sz, clusterKey } = spec
    const meta = CLUSTER_PALETTE[clusterKey % CLUSTER_PALETTE.length]
    for (let i = 0; i < count; i++) {
      const jitter = (Math.random() - 0.5) * 0.04
      const x = center[0] + randn() * sx + jitter
      const y = center[1] + randn() * sy + jitter
      const z = center[2] + randn() * sz + jitter
      // 노드가 많아지므로 크기 약간 축소, 중요 클러스터는 조금 더 크게
      const base = clusterKey === 0 ? 0.038 : clusterKey === 3 ? 0.036 : 0.032
      const scale = base + Math.random() * 0.018
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
  color: string
  desc: string
  left: number
  top: number
} | null

function EmbeddingFog() {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2(BG_FOG, 0.022)
    return () => {
      scene.fog = null
    }
  }, [scene])
  return null
}

/** 노드 간 연결선 — Baltimore 스타일 dense web */
function ConnectionLines({
  points,
  hoveredIndex,
}: {
  points: EmbeddingPoint[]
  hoveredIndex: number | null
}) {
  const linesRef = useRef<THREE.LineSegments>(null)
  const hoveredRef = useRef(hoveredIndex)
  useEffect(() => {
    hoveredRef.current = hoveredIndex
  }, [hoveredIndex])

  const { geometry, material } = useMemo(() => {
    // 거리 임계값 크게 높여 클러스터 간 연결도 생성 → dense web
    const MAX_DIST = 4.2
    const MAX_PER_NODE = 12
    const cnt = new Array(points.length).fill(0)

    const allPairs: { i: number; j: number; dist: number }[] = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const pi = points[i].position
        const pj = points[j].position
        const dx = pi[0] - pj[0]
        const dy = pi[1] - pj[1]
        const dz = pi[2] - pj[2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (d < MAX_DIST) allPairs.push({ i, j, dist: d })
      }
    }
    allPairs.sort((a, b) => a.dist - b.dist)

    const pairs: [number, number][] = []
    for (const { i, j } of allPairs) {
      if (cnt[i] < MAX_PER_NODE && cnt[j] < MAX_PER_NODE) {
        pairs.push([i, j])
        cnt[i]++
        cnt[j]++
      }
    }

    // 거리에 따라 opacity를 달리하는 vertex color 활용
    const positions = new Float32Array(pairs.length * 6)
    const colors = new Float32Array(pairs.length * 6) // rgb per vertex
    for (let k = 0; k < pairs.length; k++) {
      const [i, j] = pairs[k]
      const pi = points[i].position
      const pj = points[j].position
      positions[k * 6 + 0] = pi[0]; positions[k * 6 + 1] = pi[1]; positions[k * 6 + 2] = pi[2]
      positions[k * 6 + 3] = pj[0]; positions[k * 6 + 4] = pj[1]; positions[k * 6 + 5] = pj[2]

      // 짧은 선일수록 밝게 (가까운 연결 = 강한 관계)
      const dx = pi[0] - pj[0], dy = pi[1] - pj[1], dz = pi[2] - pj[2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const bright = Math.max(0.18, 0.55 - d * 0.09) // 0.18 ~ 0.55
      // 노드 색 혼합 (시작점 색, 끝점 색)
      const ci = new THREE.Color(points[i].color)
      const cj = new THREE.Color(points[j].color)
      colors[k * 6 + 0] = ci.r * bright; colors[k * 6 + 1] = ci.g * bright; colors[k * 6 + 2] = ci.b * bright
      colors[k * 6 + 3] = cj.r * bright; colors[k * 6 + 4] = cj.g * bright; colors[k * 6 + 5] = cj.b * bright
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return { geometry: geo, material: mat }
  }, [points])

  useFrame((state) => {
    if (!linesRef.current) return
    const t = state.clock.elapsedTime
    const mat = linesRef.current.material as THREE.LineBasicMaterial
    const isHovered = hoveredRef.current !== null
    // vertex color 기반이라 opacity는 전체 밝기 조절용
    mat.opacity = isHovered
      ? 0.75 + 0.1 * Math.sin(t * 2.0)
      : 0.52 + 0.08 * Math.sin(t * 0.38)
  })

  return (
    <lineSegments ref={linesRef} geometry={geometry} material={material} renderOrder={-2} />
  )
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
  const twinkleAmp = useMemo(() => points.map(() => 0.16 + Math.random() * 0.13), [points])

  // 미세 이동용 파라미터 (alive 느낌)
  const movPhases = useMemo(
    () => points.map(() => [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2] as [number, number, number]),
    [points]
  )
  const movFreqs = useMemo(() => points.map(() => 0.11 + Math.random() * 0.09), [points])

  const tmpWorld = useRef(new THREE.Vector3())

  useFrame((state) => {
    const cam = state.camera.position
    const t = state.clock.elapsedTime

    for (let i = 0; i < n; i++) {
      const grp = groupRefs.current[i]
      const core = coreMats.current[i]
      const glow = glowMats.current[i]
      if (!grp || !core) continue

      // 미세 이동 — p.position은 memoized 고정값이므로 안전하게 override 가능
      const bp = points[i].position
      const mf = movFreqs[i]
      const [mp0, mp1, mp2] = movPhases[i]
      grp.position.x = bp[0] + 0.015 * Math.sin(t * mf + mp0)
      grp.position.y = bp[1] + 0.015 * Math.cos(t * mf * 0.87 + mp1)
      grp.position.z = bp[2] + 0.010 * Math.sin(t * mf * 0.73 + mp2)

      grp.getWorldPosition(tmpWorld.current)
      const dist = tmpWorld.current.distanceTo(cam)
      const depthBright = THREE.MathUtils.clamp(1.55 - (dist - 6.2) * 0.082, 0.6, 1.6)
      const tw = 1 + twinkleAmp[i] * Math.sin(t * freqs[i] + phases[i])
      const hover = hoveredIndex === i
      const baseEmit = hover ? 1.5 : 0.82
      core.emissiveIntensity = baseEmit * depthBright * tw

      if (glow) {
        glow.opacity = THREE.MathUtils.clamp(
          0.25 + depthBright * 0.18 + tw * 0.1 + (hover ? 0.22 : 0),
          0.18,
          0.68
        )
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
                emissiveIntensity={0.82}
                roughness={0.22}
                metalness={0.15}
                toneMapped={false}
              />
            </mesh>
            {/* Glow halo — 더 크고 밝게 */}
            <mesh raycast={() => null} scale={2.2} renderOrder={-1}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshBasicMaterial
                ref={(m) => {
                  glowMats.current[index] = m
                }}
                color={p.color}
                transparent
                opacity={0.34}
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
      const meta = CLUSTER_PALETTE[p.clusterIndex % CLUSTER_PALETTE.length]
      setTooltip({ id: p.id, clusterName: p.clusterName, color: p.color, desc: meta.desc, left, top })
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
      <ambientLight intensity={0.32} color="#e8e2dc" />
      <directionalLight position={[6, 8, 5]} intensity={0.48} color="#fff5ee" />
      <directionalLight position={[-5, -3, -6]} intensity={0.18} color="#c4b8ad" />
      {/* 연결선 */}
      <ConnectionLines points={points} hoveredIndex={hoveredIndex} />
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
          luminanceThreshold={0.11}
          luminanceSmoothing={0.62}
          intensity={1.05}
          mipmapBlur
          radius={0.58}
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
        className="relative h-[min(380px,64vw)] w-full max-h-[460px] overflow-hidden rounded-2xl border border-neutral-700/50 bg-[#0e0d12] shadow-[0_32px_80px_-18px_rgba(0,0,0,0.75)] md:h-[440px] md:max-h-[500px]"
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
            toneMappingExposure: 1.22,
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
          className="pointer-events-none absolute z-10 w-[188px] rounded-lg border border-white/[0.14] bg-[#18171c]/96 px-3 py-2.5 text-left shadow-xl backdrop-blur-sm"
          style={{ left: twPad.left, top: twPad.top }}
        >
          {/* 상태 레이블 + 색상 인디케이터 */}
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tooltip.color, boxShadow: `0 0 5px ${tooltip.color}` }}
            />
            <span className="text-[12px] font-semibold text-white">{tooltip.clusterName}</span>
          </div>
          {/* 설명 */}
          <div className="mt-0.5 pl-3.5 text-[10px] leading-snug text-neutral-400">{tooltip.desc}</div>
          {/* 구분선 */}
          <div className="my-1.5 border-t border-white/[0.08]" />
          {/* 학생 ID */}
          <div className="text-[10px] text-neutral-500">
            학생 <span className="font-medium text-neutral-300">{tooltip.id}</span>
          </div>
        </div>
      )}

      <p className="pointer-events-none mt-2.5 text-center text-[10px] tracking-wide text-neutral-500">
        드래그 회전 · 스크롤 확대 · 가까운 점일수록 상태 유사도가 높습니다
      </p>
    </div>
  )
}
