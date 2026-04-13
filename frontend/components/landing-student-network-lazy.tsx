"use client"

import dynamic from "next/dynamic"

const LandingStudentNetwork = dynamic(() => import("@/components/landing-student-network"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(360px,62vw)] max-h-[420px] w-full items-center justify-center rounded-2xl border border-dashed border-[#e8e0d6] bg-[#f7f3ef]/80 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-[#1f1c18]/80 md:h-[400px] md:max-h-[440px]">
      인터랙티브 맵을 불러오는 중…
    </div>
  ),
})

export function LandingStudentNetworkLazy() {
  return <LandingStudentNetwork />
}
