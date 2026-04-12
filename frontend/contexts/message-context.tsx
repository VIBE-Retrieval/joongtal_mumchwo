"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react"

export interface EncouragementMessage {
  id: string
  studentId: string
  mentorId: string
  mentorName: string
  message: string
  timestamp: Date
  isRead: boolean
}

// Predefined encouragement messages
const ENCOURAGEMENT_TEMPLATES = [
  "최근 힘들 수 있지만 잘 하고 있어요. 계속 노력해봅시다!",
  "어려운 시기를 잘 이겨내고 있어요. 항상 응원합니다!",
  "꾸준히 성장하는 모습이 보여요. 조금만 더 힘내세요!",
  "지금 하고 있는 노력이 반드시 결실을 맺을 거예요.",
  "잘하고 있어요! 포기하지 말고 끝까지 가봐요.",
  "매일 조금씩 나아지고 있어요. 스스로를 믿으세요!",
  "어려움을 함께 극복해 나가요. 언제든 상담 요청하세요.",
  "성장하는 과정이에요. 지금 이 순간을 소중히 여기세요.",
]

interface MessageContextType {
  messages: EncouragementMessage[]
  getMessagesForStudent: (studentId: string) => EncouragementMessage[]
  getUnreadCountForStudent: (studentId: string) => number
  sendEncouragementMessage: (studentId: string, customMessage?: string) => void
  markAsRead: (messageId: string) => void
  markAllAsReadForStudent: (studentId: string) => void
}

const MessageContext = createContext<MessageContextType | null>(null)

// Initial test data for student-2 (김서연)
const INITIAL_MESSAGES: EncouragementMessage[] = [
  {
    id: "msg-initial-1",
    studentId: "student-2",
    mentorId: "mentor-1",
    mentorName: "김멘토",
    message: "최근 힘들 수 있지만 잘 하고 있어요. 계속 노력해봅시다!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
    isRead: false
  },
  {
    id: "msg-initial-2",
    studentId: "student-2",
    mentorId: "mentor-1",
    mentorName: "김멘토",
    message: "어려운 시기를 잘 이겨내고 있어요. 항상 응원합니다!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    isRead: true
  }
]

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<EncouragementMessage[]>(INITIAL_MESSAGES)

  const getMessagesForStudent = useCallback((studentId: string) => {
    return messages
      .filter(m => m.studentId === studentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [messages])

  const getUnreadCountForStudent = useCallback((studentId: string) => {
    return messages.filter(m => m.studentId === studentId && !m.isRead).length
  }, [messages])

  const sendEncouragementMessage = useCallback((studentId: string, customMessage?: string) => {
    const messageText = customMessage || ENCOURAGEMENT_TEMPLATES[Math.floor(Math.random() * ENCOURAGEMENT_TEMPLATES.length)]
    
    const newMessage: EncouragementMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      mentorId: "mentor-1",
      mentorName: "김멘토",
      message: messageText,
      timestamp: new Date(),
      isRead: false
    }

    setMessages(prev => [newMessage, ...prev])
  }, [])

  const markAsRead = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isRead: true } : m
    ))
  }, [])

  const markAllAsReadForStudent = useCallback((studentId: string) => {
    setMessages(prev => prev.map(m => 
      m.studentId === studentId ? { ...m, isRead: true } : m
    ))
  }, [])

  const value = useMemo(() => ({
    messages,
    getMessagesForStudent,
    getUnreadCountForStudent,
    sendEncouragementMessage,
    markAsRead,
    markAllAsReadForStudent
  }), [messages, getMessagesForStudent, getUnreadCountForStudent, sendEncouragementMessage, markAsRead, markAllAsReadForStudent])

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error("useMessages must be used within a MessageProvider")
  }
  return context
}
