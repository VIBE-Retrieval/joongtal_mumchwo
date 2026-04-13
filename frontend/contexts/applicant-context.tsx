"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from "react"
import { type Student, type EducationLevel } from "./student-context"

export type ApplicantStatus = "PENDING_INTERVIEW" | "PASSED" | "FAILED" | "HOLD"

export interface ApplicantEvaluation {
  achievement: { answer: string; rating: number }
  adaptability: { answer: string; rating: number }
  relationship: { answer: string; rating: number }
}

export interface Applicant {
  id: string
  // Basic Info
  name: string
  birthDate: string
  phone: string
  email: string
  // Application Info
  appliedCourse: string
  educationLevel: EducationLevel
  major?: string
  targetJob?: string
  // Status
  status: ApplicantStatus
  registeredAt: Date
  registeredBy: string // mentor ID
  // Interview Evaluation (filled by interviewer)
  evaluation: ApplicantEvaluation
  interviewedAt?: Date
  interviewedBy?: string // interviewer ID
  interviewNotes?: string
  studentId?: string
}

interface ApplicantContextType {
  applicants: Applicant[]
  // Mentor actions
  registerApplicant: (
    data: Omit<Applicant, "id" | "status" | "registeredAt" | "evaluation">,
    studentId?: string
  ) => void
  // Interviewer actions
  getPendingApplicants: () => Applicant[]
  getApplicantById: (id: string) => Applicant | undefined
  updateEvaluation: (applicantId: string, evaluation: ApplicantEvaluation) => void
  updateInterviewResult: (applicantId: string, status: "PASSED" | "FAILED" | "HOLD", notes?: string) => void
  saveEvaluation: (applicantId: string) => void
  // For passed applicants - convert to student
  getPassedApplicants: () => Applicant[]
  convertToStudent: (applicantId: string, evaluation?: ApplicantEvaluation) => Student | null
}

const ApplicantContext = createContext<ApplicantContextType | null>(null)

function birthDateFromYyyymmdd(v: string): string {
  if (v.length === 8 && /^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`
  }
  return v
}

function mapStudentRowToApplicant(row: {
  student_id: string
  name: string
  email: string
  birth_date: string
  phone: string | null
  course_name: string | null
  created_at: string
  has_interview: boolean
  interview_status?: string | null
  education_level?: string | null
}): Applicant {
  return {
    id: row.student_id,
    name: row.name,
    email: row.email,
    birthDate: birthDateFromYyyymmdd(row.birth_date),
    phone: row.phone ?? "",
    appliedCourse: row.course_name ?? "",
    educationLevel: (row.education_level as EducationLevel) ?? "기타",
    major: undefined,
    targetJob: undefined,
    status: (row.interview_status as ApplicantStatus) ?? (row.has_interview ? "PASSED" : "PENDING_INTERVIEW"),
    registeredAt: new Date(row.created_at),
    registeredBy: "",
    studentId: row.student_id,
    evaluation: {
      achievement: { answer: "", rating: 3 },
      adaptability: { answer: "", rating: 3 },
      relationship: { answer: "", rating: 3 },
    },
  }
}

export function ApplicantProvider({ children }: { children: ReactNode }) {
  const [applicants, setApplicants] = useState<Applicant[]>([])

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    fetch(`${base}/students`)
      .then(res => res.json())
      .then(json => {
        if (json.code === 200 && Array.isArray(json.data?.students)) {
          setApplicants(json.data.students.map(mapStudentRowToApplicant))
        }
      })
      .catch(() => {})
  }, [])

  // Mentor: Register new applicant
  const registerApplicant = useCallback((
    data: Omit<Applicant, "id" | "status" | "registeredAt" | "evaluation">,
    studentId?: string
  ) => {
    const newApplicant: Applicant = {
      ...data,
      studentId,
      id: `applicant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "PENDING_INTERVIEW",
      registeredAt: new Date(),
      evaluation: {
        achievement: { answer: "", rating: 3 },
        adaptability: { answer: "", rating: 3 },
        relationship: { answer: "", rating: 3 },
      }
    }
    setApplicants(prev => [newApplicant, ...prev])
  }, [])

  // Interviewer: Get pending applicants
  const getPendingApplicants = useCallback(() => {
    return applicants.filter(a => a.status === "PENDING_INTERVIEW" || a.status === "HOLD")
  }, [applicants])

  // Get applicant by ID
  const getApplicantById = useCallback((id: string) => {
    return applicants.find(a => a.id === id)
  }, [applicants])

  // Interviewer: Update evaluation
  const updateEvaluation = useCallback((applicantId: string, evaluation: ApplicantEvaluation) => {
    setApplicants(prev => prev.map(a => 
      a.id === applicantId ? { ...a, evaluation } : a
    ))
  }, [])

  // Interviewer: Update interview result (PASSED/FAILED/HOLD)
  const updateInterviewResult = useCallback((applicantId: string, status: "PASSED" | "FAILED" | "HOLD", notes?: string) => {
    const studentId = applicants.find(a => a.id === applicantId)?.studentId
    setApplicants(prev => prev.map(a => 
      a.id === applicantId 
        ? { 
            ...a, 
            status, 
            interviewedAt: new Date(), 
            interviewedBy: "interviewer-1",
            interviewNotes: notes
          } 
        : a
    ))

    if (studentId) {
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base) {
        fetch(`${base}/students/${studentId}/interview-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }).catch(() => {})
      }
    }
  }, [applicants])

  // Interviewer: Save evaluation (mark as reviewed but keep pending)
  const saveEvaluation = useCallback((applicantId: string) => {
    setApplicants(prev => prev.map(a => 
      a.id === applicantId ? { ...a, interviewedAt: new Date(), interviewedBy: "interviewer-1" } : a
    ))
  }, [])

  // Get passed applicants
  const getPassedApplicants = useCallback(() => {
    return applicants.filter(a => a.status === "PASSED")
  }, [applicants])

  // Convert applicant to student
  const convertToStudent = useCallback((applicantId: string, evaluation?: ApplicantEvaluation): Student | null => {
    const applicant = applicants.find(a => a.id === applicantId)
    if (!applicant) return null
    const sourceEvaluation = evaluation ?? applicant.evaluation

    // Calculate risk score from evaluation
    const avgRating = (
      sourceEvaluation.achievement.rating +
      sourceEvaluation.adaptability.rating +
      sourceEvaluation.relationship.rating
    ) / 3
    const riskScore = Math.round(Math.max(0, Math.min(100, (5 - avgRating) * 25)))
    const riskLevel = riskScore > 65 ? "high" : riskScore > 35 ? "medium" : "low"

    const today = new Date()
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

    const student: Student = {
      id: applicant.studentId ?? `student-from-${applicantId}`,
      name: applicant.name,
      birthDate: applicant.birthDate,
      phone: applicant.phone,
      email: applicant.email,
      courseName: applicant.appliedCourse,
      targetJob: applicant.targetJob,
      currentWeek: 1,
      educationLevel: applicant.educationLevel,
      major: applicant.major,
      riskLevel,
      riskScore,
      recentChange: 0,
      trend: [],
      aiSummary: "신규 입과 학생입니다. 면접 평가 결과에 따른 초기 위험도가 설정되었습니다. 첫 2주간 적응 기간에 대한 모니터링을 권장합니다.",
      mentorNotes: `면접 합격 후 입과. 초기 평가: 성취도 ${sourceEvaluation.achievement.rating}/5, 적응력 ${sourceEvaluation.adaptability.rating}/5, 인간관계 ${sourceEvaluation.relationship.rating}/5`,
      interventions: [{
        date: dateStr,
        type: "note",
        summary: "면접 합격 후 입과 등록"
      }],
      enrollmentDate: dateStr,
      attendance: 0,
      assignmentsCompleted: 0,
      totalAssignments: 0,
      lastContact: "오늘",
      isCareNeeded: riskLevel === "high" || (riskLevel === "medium" && Math.random() > 0.5),
      isNewRiskToday: false
    }

    return student
  }, [applicants])

  const value = useMemo(() => ({
    applicants,
    registerApplicant,
    getPendingApplicants,
    getApplicantById,
    updateEvaluation,
    updateInterviewResult,
    saveEvaluation,
    getPassedApplicants,
    convertToStudent
  }), [
    applicants,
    registerApplicant,
    getPendingApplicants,
    getApplicantById,
    updateEvaluation,
    updateInterviewResult,
    saveEvaluation,
    getPassedApplicants,
    convertToStudent
  ])

  return (
    <ApplicantContext.Provider value={value}>
      {children}
    </ApplicantContext.Provider>
  )
}

export function useApplicants() {
  const context = useContext(ApplicantContext)
  if (!context) {
    throw new Error("useApplicants must be used within an ApplicantProvider")
  }
  return context
}
