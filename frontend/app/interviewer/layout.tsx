"use client"

import { ApplicantProvider } from "@/contexts/applicant-context"
import { StudentProvider } from "@/contexts/student-context"

export default function InterviewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ApplicantProvider>
      <StudentProvider>
        {children}
      </StudentProvider>
    </ApplicantProvider>
  )
}
