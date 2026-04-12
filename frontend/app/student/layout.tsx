"use client"

import { MessageProvider } from "@/contexts/message-context"
import { MeetingProvider } from "@/contexts/meeting-context"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MessageProvider>
      <MeetingProvider>
        {children}
      </MeetingProvider>
    </MessageProvider>
  )
}
