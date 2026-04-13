"use client"

import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from "react"

export type RiskLevel = "low" | "medium" | "high"
export type EducationLevel = "고졸" | "전문대졸" | "대졸" | "석사" | "기타"

export interface InterventionRecord {
  date: string
  type: "message" | "meeting" | "note" | "care-complete"
  summary: string
}

export interface Student {
  id: string
  // Basic Info
  name: string
  birthDate: string
  phone: string
  email: string
  // Learning Info
  courseName: string // e.g. 백엔드, 프론트엔드, AI
  targetJob?: string // optional
  currentWeek: number
  // Education Background (flexible)
  educationLevel: EducationLevel
  major?: string // optional, only show if exists
  // Core Status
  riskLevel: RiskLevel
  riskScore: number
  recentChange: number
  trend: number[]
  aiSummary: string
  mentorNotes: string
  interventions: InterventionRecord[]
  // Additional tracking
  enrollmentDate: string
  attendance: number
  assignmentsCompleted: number
  totalAssignments: number
  lastContact: string
  isCareNeeded: boolean
  isNewRiskToday: boolean
}

// Korean initial consonant extraction
export const getKoreanInitial = (char: string): string => {
  const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]
  const code = char.charCodeAt(0) - 0xAC00
  if (code < 0 || code > 11171) return char
  return initials[Math.floor(code / 588)]
}

// Standard Korean initial consonants for navigation
export const KOREAN_INITIALS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]

function mapRiskLevel(level: string): RiskLevel {
  if (level === "HIGH") return "high"
  if (level === "MEDIUM") return "medium"
  return "low"
}

function mapToStudent(item: {
  student_id: string
  student_name: string
  birth_date: string
  created_at?: string
  phone: string | null
  email: string
  course_name: string | null
  risk_score: number
  risk_level: string
  risk_trend: string
  recommended_action: string
  risk_history?: number[]
  education_level?: string | null
}): Student {
  const riskLevel = mapRiskLevel(item.risk_level)
  const riskScore = Math.round(item.risk_score * 100)
  return {
    id: item.student_id,
    name: item.student_name,
    birthDate: (() => {
      const v = item.birth_date ?? ""
      return v.length === 8 && /^\d{8}$/.test(v)
        ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`
        : v
    })(),
    phone: item.phone ?? "",
    email: item.email ?? "",
    courseName: item.course_name ?? "",
    targetJob: undefined,
    currentWeek: 1,
    educationLevel: (item.education_level as EducationLevel) ?? "기타",
    major: undefined,
    riskLevel,
    riskScore,
    recentChange: 0,
    trend: item.risk_history?.length ? item.risk_history : [riskScore],
    aiSummary: item.recommended_action,
    mentorNotes: "",
    interventions: [],
    enrollmentDate: item.created_at ?? "",
    attendance: 0,
    assignmentsCompleted: 0,
    totalAssignments: 0,
    lastContact: "",
    isCareNeeded: riskLevel === "high" || riskLevel === "medium",
    isNewRiskToday: item.risk_level === "HIGH" && item.risk_trend === "UP",
  }
}

interface StudentContextType {
  students: Student[]
  careNeededStudents: Student[]
  newRiskStudents: Student[]
  totalStudents: number
  careNeededCount: number
  newRiskCount: number
  addStudent: (student: Student) => void
  removeStudent: (studentId: string) => Promise<boolean>
  completeCare: (studentId: string) => void
  getStudentById: (studentId: string) => Student | undefined
}

const StudentContext = createContext<StudentContextType | null>(null)

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/mentor/students/risks`)
      .then(res => res.json())
      .then(json => {
        if (json.code === 200 && Array.isArray(json.data?.items)) {
          setStudents(json.data.items.map(mapToStudent))
        }
      })
      .catch(() => {})
  }, [])

  const careNeededStudents = useMemo(() => 
    students.filter(s => s.isCareNeeded), 
    [students]
  )

  const newRiskStudents = useMemo(() => 
    students.filter(s => s.isNewRiskToday), 
    [students]
  )

  const addStudent = useCallback((student: Student) => {
    setStudents(prev => [student, ...prev])
  }, [])

  const removeStudent = useCallback(async (studentId: string): Promise<boolean> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}`, {
      method: "DELETE",
    })
    const json = await res.json().catch(() => ({}))
    if (json.code === 200) {
      setStudents(prev => prev.filter(s => s.id !== studentId))
      return true
    }
    return false
  }, [])

  const completeCare = useCallback((studentId: string) => {
    // Call API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        mentor_feedback: "케어 완료",
        action_effective: 1,
      }),
    }).catch(() => {})

    // Update UI state immediately (optimistic update)
    setStudents(prev => prev.map(student => {
      if (student.id !== studentId) return student

      const newRiskScore = Math.max(30, student.riskScore - 20)
      const newRiskLevel: RiskLevel = newRiskScore > 65 ? "high" : newRiskScore > 35 ? "medium" : "low"

      const today = new Date()
      const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

      return {
        ...student,
        isCareNeeded: false,
        isNewRiskToday: false,
        riskLevel: newRiskLevel,
        riskScore: newRiskScore,
        lastContact: "오늘",
        aiSummary: newRiskLevel === "medium"
          ? "최근 멘토 상담을 통해 상황이 개선되고 있습니다. 지속적인 모니터링을 권장합니다."
          : "멘토 케어가 완료되었습니다. 수강생의 참여도가 안정적으로 유지되고 있습니다.",
        interventions: [
          {
            date: dateStr,
            type: "care-complete" as const,
            summary: "케어 완료 - 상담 및 지원 제공"
          },
          ...student.interventions
        ]
      }
    }))
  }, [])

  const getStudentById = useCallback((studentId: string) => {
    return students.find(s => s.id === studentId)
  }, [students])

  const value: StudentContextType = {
    students,
    careNeededStudents,
    newRiskStudents,
    totalStudents: students.length,
    careNeededCount: careNeededStudents.length,
    newRiskCount: newRiskStudents.length,
    addStudent,
    removeStudent,
    completeCare,
    getStudentById
  }

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudents() {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error("useStudents must be used within a StudentProvider")
  }
  return context
}
