"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from "react"

export type MeetingStatus =
  | "pending_availability" // Mentor requested, waiting for student availability
  | "availability_submitted" // Student submitted available slots
  | "confirmed" // Mentor confirmed final slot
  | "cancelled"

export interface TimeSlot {
  date: string // YYYY-MM-DD
  time: string // HH:MM
}

export interface MeetingRequest {
  id: string
  studentId: string
  studentName: string
  mentorId: string
  mentorName: string
  purpose: string
  message: string
  status: MeetingStatus
  createdAt: Date
  proposedSlots: TimeSlot[] // Mentor's proposed time slots
  selectedSlots: TimeSlot[] // Student's selected slots from proposed
  confirmedSlot: TimeSlot | null
  studentNotified: boolean
  mentorNotified: boolean
}

interface MeetingContextType {
  meetings: MeetingRequest[]
  // Mentor actions
  requestMeeting: (
    studentId: string,
    studentName: string,
    purpose: string,
    message: string,
    proposedSlots: TimeSlot[]
  ) => void
  confirmSlot: (meetingId: string, slot: TimeSlot) => void
  getMeetingsAsMentor: () => MeetingRequest[]
  getPendingConfirmationsForMentor: () => MeetingRequest[]
  // Student actions
  selectSlots: (meetingId: string, slots: TimeSlot[]) => void
  getMeetingsForStudent: (studentId: string) => MeetingRequest[]
  getPendingRequestsForStudent: (studentId: string) => MeetingRequest[]
  getConfirmedMeetingsForStudent: (studentId: string) => MeetingRequest[]
  // Shared actions
  markStudentNotified: (meetingId: string) => void
  markMentorNotified: (meetingId: string) => void
  getUnreadCountForStudent: (studentId: string) => number
  getUnreadCountForMentor: () => number
}

const MeetingContext = createContext<MeetingContextType | null>(null)

function mapApiToMeetingRequest(m: {
  meeting_id: number
  student_id: string
  mentor_id: string
  mentor_name: string
  student_name: string
  purpose: string
  message: string
  status: string
  proposed_slots: TimeSlot[]
  selected_slots: TimeSlot[]
  confirmed_slot: TimeSlot | null
  student_notified: boolean
  mentor_notified: boolean
  created_at: string
}): MeetingRequest {
  return {
    id: String(m.meeting_id),
    studentId: m.student_id,
    studentName: m.student_name,
    mentorId: m.mentor_id,
    mentorName: m.mentor_name,
    purpose: m.purpose,
    message: m.message ?? "",
    status: m.status as MeetingStatus,
    createdAt: new Date(m.created_at),
    proposedSlots: Array.isArray(m.proposed_slots) ? m.proposed_slots : [],
    selectedSlots: Array.isArray(m.selected_slots) ? m.selected_slots : [],
    confirmedSlot: m.confirmed_slot && typeof m.confirmed_slot === "object" ? m.confirmed_slot : null,
    studentNotified: Boolean(m.student_notified),
    mentorNotified: Boolean(m.mentor_notified),
  }
}

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem("auth-user")
    if (!raw) return
    let user: { id?: string; role?: string }
    try {
      user = JSON.parse(raw)
    } catch {
      return
    }
    if (!user.id) return
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    const url =
      user.role === "student"
        ? `${base}/meetings/student/${user.id}`
        : user.role === "mentor"
          ? `${base}/meetings/mentor/${user.id}`
          : null
    if (!url) return
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.code === 200 && json.data?.meetings && Array.isArray(json.data.meetings)) {
          setMeetings(json.data.meetings.map(mapApiToMeetingRequest))
        }
      })
      .catch(() => {})
  }, [])

  // Mentor requests a meeting with proposed time slots
  const requestMeeting = useCallback(
    (studentId: string, studentName: string, purpose: string, message: string, proposedSlots: TimeSlot[]) => {
      let mentorId = "mentor-1"
      let mentorName = "김멘토"
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("auth-user")
        if (stored) {
          try {
            const u = JSON.parse(stored) as { id?: string; name?: string }
            if (u.id) mentorId = u.id
            if (u.name) mentorName = u.name
          } catch {
            /* ignore */
          }
        }
      }

      const tempId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newMeeting: MeetingRequest = {
        id: tempId,
        studentId,
        studentName,
        mentorId,
        mentorName,
        purpose,
        message,
        status: "pending_availability",
        createdAt: new Date(),
        proposedSlots,
        selectedSlots: [],
        confirmedSlot: null,
        studentNotified: false,
        mentorNotified: true,
      }
      setMeetings(prev => [newMeeting, ...prev])

      const base = process.env.NEXT_PUBLIC_API_URL
      if (!base) return
      fetch(`${base}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          mentor_id: mentorId,
          mentor_name: mentorName,
          student_name: studentName,
          purpose,
          message: message ?? "",
          proposed_slots: proposedSlots,
        }),
      })
        .then(res => res.json())
        .then(json => {
          if (json.code === 200 && json.data?.meeting_id != null) {
            const mid = String(json.data.meeting_id)
            setMeetings(prev => prev.map(m => (m.id === tempId ? { ...m, id: mid } : m)))
          }
        })
        .catch(() => {})
    },
    []
  )

  // Student selects from mentor's proposed time slots
  const selectSlots = useCallback((meetingId: string, slots: TimeSlot[]) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              selectedSlots: slots,
              status: "availability_submitted" as MeetingStatus,
              studentNotified: true,
              mentorNotified: false,
            }
          : m
      )
    )
    const numericId = Number.parseInt(meetingId, 10)
    if (Number.isNaN(numericId)) return
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    fetch(`${base}/meetings/${numericId}/slots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_slots: slots }),
    }).catch(() => {})
  }, [])

  // Mentor confirms a final slot
  const confirmSlot = useCallback((meetingId: string, slot: TimeSlot) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              confirmedSlot: slot,
              status: "confirmed" as MeetingStatus,
              mentorNotified: true,
              studentNotified: false,
            }
          : m
      )
    )
    const numericId = Number.parseInt(meetingId, 10)
    if (Number.isNaN(numericId)) return
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    fetch(`${base}/meetings/${numericId}/confirm`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_slot: slot }),
    }).catch(() => {})
  }, [])

  // Get all meetings for a mentor
  const getMeetingsAsMentor = useCallback(() => {
    return [...meetings].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [meetings])

  // Get meetings where student submitted availability and mentor needs to confirm
  const getPendingConfirmationsForMentor = useCallback(() => {
    return meetings.filter(m => m.status === "availability_submitted")
  }, [meetings])

  // Get all meetings for a student
  const getMeetingsForStudent = useCallback((studentId: string) => {
    return meetings
      .filter(m => m.studentId === studentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [meetings])

  // Get pending meeting requests for student (awaiting availability)
  const getPendingRequestsForStudent = useCallback((studentId: string) => {
    return meetings.filter(m => m.studentId === studentId && m.status === "pending_availability")
  }, [meetings])

  // Get confirmed meetings for student
  const getConfirmedMeetingsForStudent = useCallback((studentId: string) => {
    return meetings.filter(m => m.studentId === studentId && m.status === "confirmed")
  }, [meetings])

  // Mark notifications as read
  const markStudentNotified = useCallback((meetingId: string) => {
    setMeetings(prev => prev.map(m => (m.id === meetingId ? { ...m, studentNotified: true } : m)))
  }, [])

  const markMentorNotified = useCallback((meetingId: string) => {
    setMeetings(prev => prev.map(m => (m.id === meetingId ? { ...m, mentorNotified: true } : m)))
  }, [])

  // Count unread notifications for student
  const getUnreadCountForStudent = useCallback((studentId: string) => {
    return meetings.filter(m => m.studentId === studentId && !m.studentNotified).length
  }, [meetings])

  // Count unread notifications for mentor
  const getUnreadCountForMentor = useCallback(() => {
    return meetings.filter(m => !m.mentorNotified).length
  }, [meetings])

  const value = useMemo(
    () => ({
      meetings,
      requestMeeting,
      selectSlots,
      confirmSlot,
      getMeetingsAsMentor,
      getPendingConfirmationsForMentor,
      getMeetingsForStudent,
      getPendingRequestsForStudent,
      getConfirmedMeetingsForStudent,
      markStudentNotified,
      markMentorNotified,
      getUnreadCountForStudent,
      getUnreadCountForMentor,
    }),
    [
      meetings,
      requestMeeting,
      selectSlots,
      confirmSlot,
      getMeetingsAsMentor,
      getPendingConfirmationsForMentor,
      getMeetingsForStudent,
      getPendingRequestsForStudent,
      getConfirmedMeetingsForStudent,
      markStudentNotified,
      markMentorNotified,
      getUnreadCountForStudent,
      getUnreadCountForMentor,
    ]
  )

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}

export function useMeetings() {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error("useMeetings must be used within a MeetingProvider")
  }
  return context
}
