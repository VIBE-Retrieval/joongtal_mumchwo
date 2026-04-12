"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react"
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
  convertToStudent: (applicantId: string) => Student | null
}

const ApplicantContext = createContext<ApplicantContextType | null>(null)

// Initial sample data (applicants registered by mentor waiting for interview)
const initialApplicants: Applicant[] = [
  {
    id: "applicant-1",
    name: "김민준",
    birthDate: "1998-03-15",
    phone: "010-1234-5678",
    email: "minjun.kim@email.com",
    appliedCourse: "풀스택 개발자 과정",
    educationLevel: "대졸",
    major: "컴퓨터공학",
    targetJob: "백엔드 개발자",
    status: "PENDING_INTERVIEW",
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    registeredBy: "mentor-1",
    studentId: undefined,
    evaluation: {
      achievement: { answer: "", rating: 3 },
      adaptability: { answer: "", rating: 3 },
      relationship: { answer: "", rating: 3 },
    }
  },
  {
    id: "applicant-2",
    name: "이서연",
    birthDate: "2000-07-22",
    phone: "010-2345-6789",
    email: "seoyeon.lee@email.com",
    appliedCourse: "데이터 분석가 과정",
    educationLevel: "대졸",
    major: "통계학",
    targetJob: "데이터 분석가",
    status: "PENDING_INTERVIEW",
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    registeredBy: "mentor-1",
    studentId: undefined,
    evaluation: {
      achievement: { answer: "", rating: 3 },
      adaptability: { answer: "", rating: 3 },
      relationship: { answer: "", rating: 3 },
    }
  },
  {
    id: "applicant-3",
    name: "박지훈",
    birthDate: "1999-11-08",
    phone: "010-3456-7890",
    email: "jihun.park@email.com",
    appliedCourse: "UX/UI 디자이너 과정",
    educationLevel: "전문대졸",
    major: "시각디자인",
    targetJob: "UX 디자이너",
    status: "PENDING_INTERVIEW",
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    registeredBy: "mentor-1",
    studentId: undefined,
    evaluation: {
      achievement: { answer: "", rating: 3 },
      adaptability: { answer: "", rating: 3 },
      relationship: { answer: "", rating: 3 },
    }
  },
]

export function ApplicantProvider({ children }: { children: ReactNode }) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)

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
  }, [])

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

  // Convert passed applicant to student
  const convertToStudent = useCallback((applicantId: string): Student | null => {
    const applicant = applicants.find(a => a.id === applicantId && a.status === "PASSED")
    if (!applicant) return null

    // Calculate risk score from evaluation
    const avgRating = (
      applicant.evaluation.achievement.rating +
      applicant.evaluation.adaptability.rating +
      applicant.evaluation.relationship.rating
    ) / 3
    const riskScore = Math.round(Math.max(0, Math.min(100, (5 - avgRating) * 25)))
    const riskLevel = riskScore > 65 ? "high" : riskScore > 35 ? "medium" : "low"

    const today = new Date()
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

    const student: Student = {
      id: `student-from-${applicantId}`,
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
      trend: Array.from({ length: 14 }, () => Math.floor(Math.random() * 20) + 40),
      aiSummary: "신규 입과 학생입니다. 면접 평가 결과에 따른 초기 위험도가 설정되었습니다. 첫 2주간 적응 기간에 대한 모니터링을 권장합니다.",
      mentorNotes: `면접 합격 후 입과. 초기 평가: 성취도 ${applicant.evaluation.achievement.rating}/5, 적응력 ${applicant.evaluation.adaptability.rating}/5, 인간관계 ${applicant.evaluation.relationship.rating}/5`,
      interventions: [{
        date: dateStr,
        type: "note",
        summary: "면접 합격 후 입과 등록"
      }],
      enrollmentDate: dateStr,
      attendance: 100,
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
