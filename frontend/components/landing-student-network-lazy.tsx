"use client"

import dynamic from "next/dynamic"

const LandingStudentNetwork = dynamic(() => import("@/components/landing-student-network"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(520px,72vh)] w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-muted/40 text-sm text-muted-foreground dark:border-neutral-700">
      인터랙티브 맵을 불러오는 중…
    </div>
  ),
})

export function LandingStudentNetworkLazy() {
  return <LandingStudentNetwork />
}
