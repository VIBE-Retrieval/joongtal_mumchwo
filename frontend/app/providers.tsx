"use client"

import { ReactNode } from "react"
import { ApplicantProvider } from "@/contexts/applicant-context"
import { StudentProvider } from "@/contexts/student-context"

export function GlobalProviders({ children }: { children: ReactNode }) {
  return (
    <ApplicantProvider>
      <StudentProvider>
        {children}
      </StudentProvider>
    </ApplicantProvider>
  )
}
