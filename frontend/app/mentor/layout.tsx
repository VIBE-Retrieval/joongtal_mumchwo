"use client"

import { NotificationProvider } from "@/contexts/notification-context"
import { MessageProvider } from "@/contexts/message-context"
import { MeetingProvider } from "@/contexts/meeting-context"

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <MessageProvider>
        <MeetingProvider>
          {children}
        </MeetingProvider>
      </MessageProvider>
    </NotificationProvider>
  )
}
