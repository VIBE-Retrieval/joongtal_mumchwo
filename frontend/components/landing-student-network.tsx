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

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#5f8f5e",
  medium: "#c4873a",
  high: "#b8443c",
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
}

function randomRisk(bias: RiskLevel): RiskLevel {
  const r = Math.random()
  if (bias === "low") {
    if (r < 0.72) return "low"
    if (r < 0.93) return "medium"
    return "high"
  }
  if (bias === "medium") {
    if (r < 0.35) return "low"
    if (r < 0.78) return "medium"
    return "high"
  }
  if (r < 0.18) return "low"
  if (r < 0.55) return "medium"
  return "high"
}

function generateGraph(): { nodes: StudentNodeDatum[]; edges: [number, number][] } {
  const clusters: { center: [number, number, number]; count: number; bias: RiskLevel }[] = [
    { center: [-2.7, 0.15, -0.5], count: 18, bias: "low" },
    { center: [2.5, -0.35, 0.55], count: 20, bias: "medium" },
    { center: [0.05, 1.85, 1.1], count: 16, bias: "high" },
  ]

  const nodes: StudentNodeDatum[] = []
  let idx = 0
  for (const cl of clusters) {
    for (let i = 0; i < cl.count; i++) {
      const t = (i / cl.count) * Math.PI * 2
      const shell = 0.35 + Math.random() * 0.65
      const x = cl.center[0] + Math.cos(t) * shell * 0.85 + (Math.random() - 0.5) * 0.45
      const y = cl.center[1] + Math.sin(t * 1.3) * shell * 0.55 + (Math.random() - 0.5) * 0.5
      const z = cl.center[2] + Math.sin(t * 0.7) * shell * 0.7 + (Math.random() - 0.5) * 0.55
      const risk = randomRisk(cl.bias)
      const changePct = Math.round((Math.random() * 38 - 12) * 10) / 10
      const scale = 0.065 + Math.random() * 0.055 + (risk === "high" ? 0.028 : risk === "medium" ? 0.012 : 0)
      nodes.push({
        id: `S-${idx + 1}`,
        position: [x, y, z],
        risk,
        changePct,
        color: RISK_COLORS[risk],
        scale,
      })
      idx++
    }
  }

  const edges: [number, number][] = []
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      tmpA.set(...nodes[i].position)
      tmpB.set(...nodes[j].position)
      const d = tmpA.distanceTo(tmpB)
      if (d < 1.05) edges.push([i, j])
      else if (d < 1.85 && Math.random() < 0.06) edges.push([i, j])
    }
  }

  return { nodes, edges }
}

type TooltipState = {
  id: string
  riskLabel: string
  changePct: number
  left: number
  top: number
} | null

function NetworkEdges({
  nodes,
  edges,
  dark,
}: {
  nodes: StudentNodeDatum[]
  edges: [number, number][]
  dark: boolean
}) {
  const lineColor = dark ? "#7a7268" : "#9a8b7a"
  const opacity = dark ? 0.28 : 0.22
  return (
    <>
      {edges.map(([a, b], i) => {
        const pa = nodes[a].position
        const pb = nodes[b].position
        return (
          <Line
            key={`e-${i}`}
            points={[pa, pb]}
            color={lineColor}
            opacity={opacity}
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
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
}: {
  nodes: StudentNodeDatum[]
  onPointerEnter: (node: StudentNodeDatum, clientX: number, clientY: number) => void
  onPointerMove: (clientX: number, clientY: number) => void
  onPointerLeave: () => void
}) {
  return (
    <>
      {nodes.map((node) => (
        <mesh
          key={node.id}
          position={node.position}
          scale={node.scale}
          onPointerEnter={(e) => {
            e.stopPropagation()
            onPointerEnter(node, e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            e.stopPropagation()
            onPointerMove(e.clientX, e.clientY)
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            onPointerLeave()
          }}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={node.color}
            roughness={0.45}
            metalness={0.12}
            emissive={node.color}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </>
  )
}

function SceneBackground({ dark }: { dark: boolean }) {
  const { scene } = useThree()
  useEffect(() => {
    const fogColor = dark ? 0x1c1915 : 0xf0ebe5
    const density = dark ? 0.058 : 0.045
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
  const { nodes, edges } = useMemo(() => generateGraph(), [])

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
    (node: StudentNodeDatum, cx: number, cy: number) => {
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

  const bg = dark ? "#1c1915" : "#f0ebe5"

  return (
    <>
      <SceneBackground dark={dark} />
      <color attach="background" args={[bg]} />
      <ambientLight intensity={dark ? 0.32 : 0.42} />
      <directionalLight position={[6, 8, 5]} intensity={dark ? 0.75 : 0.85} />
      <directionalLight position={[-4, -2, -6]} intensity={dark ? 0.18 : 0.22} color="#fff5ef" />
      <NetworkEdges nodes={nodes} edges={edges} dark={dark} />
      <StudentSpheres
        nodes={nodes}
        onPointerEnter={handleEnter}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI - 0.12}
        autoRotate={autoRotate}
        autoRotateSpeed={0.35}
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
        left: Math.max(8, Math.min(tooltip.left + 12, (canvasShellRef.current?.clientWidth ?? 400) - 196)),
        top: Math.max(8, Math.min(tooltip.top + 12, (canvasShellRef.current?.clientHeight ?? 400) - 100)),
      }
    : { left: 0, top: 0 }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={canvasShellRef}
        className={`relative h-[min(520px,72vh)] w-full overflow-hidden rounded-xl border shadow-sm ${
          dark ? "border-neutral-700 bg-[#1c1915]" : "border-border bg-[#f0ebe5]"
        }`}
        role="img"
        aria-label="학생 유사도 기반 3D 네트워크 맵. 드래그로 회전, 스크롤로 확대할 수 있습니다."
      >
        <Canvas
          camera={{ position: [0, 0.35, 9.2], fov: 48, near: 0.1, far: 40 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 2]}
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
          className="pointer-events-none absolute z-10 max-w-[200px] rounded-lg border border-border/80 bg-card/95 px-3 py-2 text-left text-xs shadow-md backdrop-blur-sm dark:border-neutral-600 dark:bg-neutral-900/95"
          style={{ left: twPad.left, top: twPad.top }}
        >
          <div className="font-semibold text-foreground">학생 {tooltip.id}</div>
          <div className="mt-1 text-muted-foreground">
            위험도: <span className="text-foreground">{tooltip.riskLabel}</span>
          </div>
          <div className="text-muted-foreground">
            최근 변화:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {tooltip.changePct > 0 ? "+" : ""}
              {tooltip.changePct}%
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none mt-3 space-y-1.5 text-center text-[11px] text-muted-foreground">
        <p>드래그로 회전 · 스크롤로 확대 · 선은 유사도, 색은 위험도, 크기는 변화 강도를 나타냅니다</p>
      </div>
    </div>
  )
}
