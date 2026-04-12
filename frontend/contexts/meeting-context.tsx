"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react"

export type MeetingStatus = 
  | "pending_availability"  // Mentor requested, waiting for student availability
  | "availability_submitted" // Student submitted available slots
  | "confirmed"              // Mentor confirmed final slot
  | "cancelled"

export interface TimeSlot {
  date: string  // YYYY-MM-DD
  time: string  // HH:MM
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
  proposedSlots: TimeSlot[]    // Mentor's proposed time slots
  selectedSlots: TimeSlot[]    // Student's selected slots from proposed
  confirmedSlot: TimeSlot | null
  studentNotified: boolean
  mentorNotified: boolean
}

interface MeetingContextType {
  meetings: MeetingRequest[]
  // Mentor actions
  requestMeeting: (studentId: string, studentName: string, purpose: string, message: string, proposedSlots: TimeSlot[]) => void
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

// Generate upcoming dates for test data
function getUpcomingDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// Initial test data for student-2 (김서연)
const INITIAL_MEETINGS: MeetingRequest[] = [
  {
    id: "meeting-initial-1",
    studentId: "student-2",
    studentName: "김서연",
    mentorId: "mentor-1",
    mentorName: "김멘토",
    purpose: "학습 상담",
    message: "최근 학습 진도에 대해 이야기 나눠보고 싶어요. 시간 되실 때 확인해주세요!",
    status: "pending_availability",
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15분 전
    proposedSlots: [
      { date: getUpcomingDate(1), time: "14:00" },
      { date: getUpcomingDate(1), time: "16:00" },
      { date: getUpcomingDate(2), time: "10:00" },
      { date: getUpcomingDate(2), time: "15:00" },
    ],
    selectedSlots: [],
    confirmedSlot: null,
    studentNotified: false,
    mentorNotified: true
  }
]

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<MeetingRequest[]>(INITIAL_MEETINGS)

  // Mentor requests a meeting with proposed time slots
  const requestMeeting = useCallback((
    studentId: string, 
    studentName: string, 
    purpose: string, 
    message: string,
    proposedSlots: TimeSlot[]
  ) => {
    const newMeeting: MeetingRequest = {
      id: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      studentName,
      mentorId: "mentor-1",
      mentorName: "김멘토",
      purpose,
      message,
      status: "pending_availability",
      createdAt: new Date(),
      proposedSlots,
      selectedSlots: [],
      confirmedSlot: null,
      studentNotified: false,
      mentorNotified: true
    }
    setMeetings(prev => [newMeeting, ...prev])
  }, [])

  // Student selects from mentor's proposed time slots
  const selectSlots = useCallback((meetingId: string, slots: TimeSlot[]) => {
    setMeetings(prev => prev.map(m => 
      m.id === meetingId 
        ? { 
            ...m, 
            selectedSlots: slots, 
            status: "availability_submitted" as MeetingStatus,
            studentNotified: true,
            mentorNotified: false
          } 
        : m
    ))
  }, [])

  // Mentor confirms a final slot
  const confirmSlot = useCallback((meetingId: string, slot: TimeSlot) => {
    setMeetings(prev => prev.map(m => 
      m.id === meetingId 
        ? { 
            ...m, 
            confirmedSlot: slot, 
            status: "confirmed" as MeetingStatus,
            mentorNotified: true,
            studentNotified: false
          } 
        : m
    ))
  }, [])

  // Get all meetings for a mentor
  const getMeetingsAsMentor = useCallback(() => {
    return meetings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
    setMeetings(prev => prev.map(m => 
      m.id === meetingId ? { ...m, studentNotified: true } : m
    ))
  }, [])

  const markMentorNotified = useCallback((meetingId: string) => {
    setMeetings(prev => prev.map(m => 
      m.id === meetingId ? { ...m, mentorNotified: true } : m
    ))
  }, [])

  // Count unread notifications for student
  const getUnreadCountForStudent = useCallback((studentId: string) => {
    return meetings.filter(m => 
      m.studentId === studentId && !m.studentNotified
    ).length
  }, [meetings])

  // Count unread notifications for mentor
  const getUnreadCountForMentor = useCallback(() => {
    return meetings.filter(m => !m.mentorNotified).length
  }, [meetings])

  const value = useMemo(() => ({
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
    getUnreadCountForMentor
  }), [
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
    getUnreadCountForMentor
  ])

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeetings() {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error("useMeetings must be used within a MeetingProvider")
  }
  return context
}
