"use client"

import dynamic from "next/dynamic"

const LandingStudentNetwork = dynamic(() => import("@/components/landing-student-network"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(360px,62vw)] max-h-[420px] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-600 bg-[#0e0d12]/95 text-xs text-neutral-400 md:h-[400px] md:max-h-[440px]">
      인터랙티브 맵을 불러오는 중…
    </div>
  ),
})

export function LandingStudentNetworkLazy() {
  return <LandingStudentNetwork />
}
