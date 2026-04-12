"use client"

import { StudentProvider } from "@/contexts/student-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { MessageProvider } from "@/contexts/message-context"
import { MeetingProvider } from "@/contexts/meeting-context"
import { ApplicantProvider } from "@/contexts/applicant-context"

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ApplicantProvider>
      <StudentProvider>
        <NotificationProvider>
          <MessageProvider>
            <MeetingProvider>
              {children}
            </MeetingProvider>
          </MessageProvider>
        </NotificationProvider>
      </StudentProvider>
    </ApplicantProvider>
  )
}
