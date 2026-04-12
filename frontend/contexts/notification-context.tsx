"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react"

export interface Notification {
  id: string
  studentId: string
  studentName: string
  message: string
  type: "new-high-risk" | "risk-increase" | "care-needed"
  timestamp: Date
  isRead: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissBanner: () => void
  isBannerDismissed: boolean
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Generate initial notifications based on new high-risk students
const generateInitialNotifications = (): Notification[] => {
  const newRiskStudents = [
    { id: "student-2", name: "김서연" },
    { id: "student-15", name: "이서연" },
  ]
  
  return newRiskStudents.map((student, idx) => ({
    id: `notif-${idx}`,
    studentId: student.id,
    studentName: student.name,
    message: idx === 0 
      ? `${student.name} 학생이 오늘 신규 위험군으로 분류되었습니다`
      : `${student.name} 학생이 HIGH 상태로 전환되었습니다`,
    type: "new-high-risk" as const,
    timestamp: new Date(Date.now() - idx * 1000 * 60 * 30), // 30 minutes apart
    isRead: false
  }))
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => generateInitialNotifications())
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [])

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true)
  }, [])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissBanner,
    isBannerDismissed
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
