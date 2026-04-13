"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { Line, OrbitControls } from "@react-three/drei"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

type RiskLevel = "low" | "medium" | "high"

export type StudentNodeDatum = {
  id: string
  position: [number, number, number]
  risk: RiskLevel
  changePct: number
  color: string
  scale: number
}

/** 브랜드 톤: 차분한 웜 그레이 → 액센트 #D97757 계열만 사용 */
const NODE_COLORS: Record<RiskLevel, string> = {
  low: "#9a938c",
  medium: "#b88a72",
  high: "#d97757",
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
}

function randomRisk(bias: RiskLevel): RiskLevel {
  const r = Math.random()
  if (bias === "low") {
    if (r < 0.78) return "low"
    if (r < 0.94) return "medium"
    return "high"
  }
  if (bias === "medium") {
    if (r < 0.38) return "low"
    if (r < 0.8) return "medium"
    return "high"
  }
  if (r < 0.22) return "low"
  if (r < 0.58) return "medium"
  return "high"
}

const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()

function dist(a: [number, number, number], b: [number, number, number]) {
  tmpA.set(...a)
  tmpB.set(...b)
  return tmpA.distanceTo(tmpB)
}

/** 20~35개, 3개의 정돈된 군집 */
function generateGraph(): {
  nodes: StudentNodeDatum[]
  hoverNeighborLines: [number, number][]
} {
  const clusters: { center: [number, number, number]; count: number; bias: RiskLevel }[] = [
    { center: [-1.65, 0.05, -0.35], count: 10, bias: "low" },
    { center: [1.75, -0.15, 0.25], count: 12, bias: "medium" },
    { center: [0.02, 1.35, 0.55], count: 10, bias: "high" },
  ]

  const nodes: StudentNodeDatum[] = []
  let idx = 0
  for (const cl of clusters) {
    for (let i = 0; i < cl.count; i++) {
      const t = (i / Math.max(cl.count, 1)) * Math.PI * 2
      const shell = 0.28 + Math.random() * 0.42
      const spread = 0.52
      const x = cl.center[0] + Math.cos(t) * shell * spread + (Math.random() - 0.5) * 0.22
      const y = cl.center[1] + Math.sin(t * 1.15) * shell * spread * 0.65 + (Math.random() - 0.5) * 0.2
      const z = cl.center[2] + Math.sin(t * 0.65) * shell * spread * 0.75 + (Math.random() - 0.5) * 0.22
      const risk = randomRisk(cl.bias)
      const changePct = Math.round((Math.random() * 28 - 8) * 10) / 10
      const scale = 0.052 + Math.random() * 0.028 + (risk === "high" ? 0.018 : risk === "medium" ? 0.008 : 0)
      nodes.push({
        id: `S-${idx + 1}`,
        position: [x, y, z],
        risk,
        changePct,
        color: NODE_COLORS[risk],
        scale,
      })
      idx++
    }
  }

  const seen = new Set<string>()
  const hoverNeighborLines: [number, number][] = []
  const maxPer = 2
  const maxDist = 1.02

  for (let i = 0; i < nodes.length; i++) {
    const near: { j: number; d: number }[] = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const d = dist(nodes[i].position, nodes[j].position)
      if (d < maxDist) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d)
    for (let k = 0; k < Math.min(maxPer, near.length); k++) {
      const j = near[k].j
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      const key = `${a}-${b}`
      if (!seen.has(key)) {
        seen.add(key)
        hoverNeighborLines.push([a, b])
      }
    }
  }

  return { nodes, hoverNeighborLines }
}

function linesFromHovered(
  hoveredIndex: number | null,
  allPairs: [number, number][]
): [number, number][] {
  if (hoveredIndex === null) return []
  return allPairs.filter(([a, b]) => a === hoveredIndex || b === hoveredIndex)
}

type TooltipState = {
  id: string
  riskLabel: string
  changePct: number
  left: number
  top: number
} | null

function HoverEdges({
  nodes,
  pairs,
  dark,
}: {
  nodes: StudentNodeDatum[]
  pairs: [number, number][]
  dark: boolean
}) {
  if (pairs.length === 0) return null
  const lineColor = dark ? "#e8a080" : "#c86b4e"
  return (
    <>
      {pairs.map(([a, b], i) => {
        const pa = nodes[a].position
        const pb = nodes[b].position
        return (
          <Line
            key={`he-${i}`}
            points={[pa, pb]}
            color={lineColor}
            opacity={dark ? 0.14 : 0.12}
            transparent
            lineWidth={1}
          />
        )
      })}
    </>
  )
}

function StudentSpheres({
  nodes,
  hoveredIndex,
  setHoveredIndex,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
}: {
  nodes: StudentNodeDatum[]
  hoveredIndex: number | null
  setHoveredIndex: (i: number | null) => void
  onPointerEnter: (node: StudentNodeDatum, index: number, clientX: number, clientY: number) => void
  onPointerMove: (clientX: number, clientY: number) => void
  onPointerLeave: () => void
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const isHover = hoveredIndex === index
        return (
          <mesh
            key={node.id}
            position={node.position}
            scale={node.scale * (isHover ? 1.06 : 1)}
            onPointerEnter={(e) => {
              e.stopPropagation()
              setHoveredIndex(index)
              onPointerEnter(node, index, e.clientX, e.clientY)
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
              color={node.color}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        )
      })}
    </>
  )
}

function SceneBackground({ dark }: { dark: boolean }) {
  const { scene } = useThree()
  useEffect(() => {
    const fogColor = dark ? 0x1f1c18 : 0xf7f3ef
    const density = dark ? 0.032 : 0.022
    scene.fog = new THREE.FogExp2(fogColor, density)
    return () => {
      scene.fog = null
    }
  }, [scene, dark])
  return null
}

function NetworkScene({
  setTooltip,
  clearTooltip,
  shellRef,
  dark,
}: {
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>
  clearTooltip: () => void
  shellRef: React.RefObject<HTMLDivElement | null>
  dark: boolean
}) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { nodes, hoverNeighborLines } = useMemo(() => generateGraph(), [])

  const activeEdgePairs = useMemo(
    () => linesFromHovered(hoveredIndex, hoverNeighborLines),
    [hoveredIndex, hoverNeighborLines]
  )

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
    (node: StudentNodeDatum, _index: number, cx: number, cy: number) => {
      const { left, top } = toLocal(cx, cy)
      setTooltip({
        id: node.id,
        riskLabel: RISK_LABEL[node.risk],
        changePct: node.changePct,
        left,
        top,
      })
    },
    [setTooltip, toLocal]
  )

  const handleMove = useCallback(
    (cx: number, cy: number) => {
      setTooltip((prev) => {
        if (!prev) return prev
        const { left, top } = toLocal(cx, cy)
        return { ...prev, left, top }
      })
    },
    [setTooltip, toLocal]
  )

  const handleLeave = useCallback(() => {
    clearTooltip()
  }, [clearTooltip])

  const bg = dark ? "#1f1c18" : "#f7f3ef"

  return (
    <>
      <SceneBackground dark={dark} />
      <color attach="background" args={[bg]} />
      <ambientLight intensity={dark ? 0.38 : 0.5} />
      <directionalLight position={[5, 6, 4]} intensity={dark ? 0.55 : 0.62} color="#fff8f4" />
      <directionalLight position={[-3, -2, -4]} intensity={dark ? 0.12 : 0.16} color="#e8ddd4" />
      <HoverEdges nodes={nodes} pairs={activeEdgePairs} dark={dark} />
      <StudentSpheres
        nodes={nodes}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        onPointerEnter={handleEnter}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5.2}
        maxDistance={14}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        autoRotate={autoRotate}
        autoRotateSpeed={0.08}
        onStart={() => setAutoRotate(false)}
      />
    </>
  )
}

function useHtmlDarkClass() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"))
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return dark
}

export default function LandingStudentNetwork() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasShellRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const dark = useHtmlDarkClass()

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
        left: Math.max(8, Math.min(tooltip.left + 10, (canvasShellRef.current?.clientWidth ?? 400) - 188)),
        top: Math.max(8, Math.min(tooltip.top + 10, (canvasShellRef.current?.clientHeight ?? 400) - 92)),
      }
    : { left: 0, top: 0 }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={canvasShellRef}
        className={`relative h-[min(360px,62vw)] w-full max-h-[420px] overflow-hidden rounded-2xl border md:h-[400px] md:max-h-[440px] ${
          dark ? "border-neutral-700/80 bg-[#1f1c18]" : "border-[#e8e0d6] bg-[#f7f3ef]"
        }`}
        role="img"
        aria-label="학생 유사도를 공간에 배치한 정제된 시각화. 드래그로 회전, 스크롤로 확대할 수 있습니다."
      >
        <Canvas
          className="!h-full !w-full"
          camera={{ position: [0, 0.15, 9.8], fov: 42, near: 0.1, far: 32 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
        >
          <NetworkScene
            setTooltip={setTooltip}
            clearTooltip={clearTooltip}
            shellRef={canvasShellRef}
            dark={dark}
          />
        </Canvas>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[188px] rounded-md border border-[#2d2d2d]/10 bg-[#fffcf9]/95 px-2.5 py-2 text-left text-[11px] text-[#2d2d2d] shadow-sm dark:border-white/10 dark:bg-[#2a2622]/95 dark:text-[#f5f0ea]"
          style={{ left: twPad.left, top: twPad.top }}
        >
          <div className="font-medium">학생 {tooltip.id}</div>
          <div className="mt-1 text-[#2d2d2d]/65 dark:text-[#f5f0ea]/65">
            위험도 <span className="text-[#2d2d2d] dark:text-[#f5f0ea]">{tooltip.riskLabel}</span>
          </div>
          <div className="text-[#2d2d2d]/65 dark:text-[#f5f0ea]/65">
            변화{" "}
            <span className="tabular-nums text-[#2d2d2d] dark:text-[#f5f0ea]">
              {tooltip.changePct > 0 ? "+" : ""}
              {tooltip.changePct}%
            </span>
          </div>
        </div>
      )}

      <p className="pointer-events-none mt-2.5 text-center text-[10px] tracking-wide text-neutral-500 dark:text-neutral-500">
        드래그 · 스크롤 — 포인트 위에서만 유사 연결 표시
      </p>
    </div>
  )
}
