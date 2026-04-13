"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from "react"

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

function mapActionTypeToNotificationType(
  actionType: string
): Notification["type"] {
  if (actionType === "ALERT_MENTOR" || actionType === "EMERGENCY") return "new-high-risk"
  if (actionType === "REQUEST_MEETING") return "risk-increase"
  return "care-needed"
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/mentor/alerts`)
      .then(res => res.json())
      .then(json => {
        if (json.code === 200 && Array.isArray(json.data?.alerts)) {
          const mapped: Notification[] = json.data.alerts.map(
            (a: {
              intervention_id: number
              student_id: string
              student_name: string
              action_type: string
              llm_summary: string
              date: string
            }) => ({
              id: String(a.intervention_id),
              studentId: a.student_id,
              studentName: a.student_name,
              message: `[${a.student_name}] ${a.llm_summary}`,
              type: mapActionTypeToNotificationType(a.action_type),
              timestamp: new Date(a.date),
              isRead: false,
            })
          )
          setNotifications(mapped)
        }
      })
      .catch(() => {})
  }, [])

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    fetch(`${base}/mentor/alerts/${id}/read`, { method: "PATCH" }).catch(() => {})
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    fetch(`${base}/mentor/alerts/read-all`, { method: "POST" }).catch(() => {})
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
