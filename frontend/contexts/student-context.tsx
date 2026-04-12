"use client"

import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from "react"

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

const generateStudents = (): Student[] => {
  const names = [
    "강민수", "고아름", "김서연", "김태현", "남주원",
    "류미나", "박지훈", "배수현", "서예준", "신지원",
    "안하은", "오현우", "유진우", "윤성호", "이도윤",
    "이서연", "이현", "임수빈", "장태양", "정다은",
    "정마남", "조민재", "최준혁", "한소희", "홍길동"
  ].sort((a, b) => a.localeCompare(b, 'ko'))
  
  const courseNames = ["백엔드 개발", "프론트엔드 개발", "AI/ML 엔지니어링", "풀스택 개발", "데이터 엔지니어링"]
  const targetJobs = ["백엔드 개발자", "프론트엔드 개발자", "AI 엔지니어", "풀스택 개발자", "데이터 엔지니어", "DevOps 엔지니어", undefined]
  const educationLevels: EducationLevel[] = ["고졸", "전문대졸", "대졸", "석사", "기타"]
  const majors = ["컴퓨터공학", "소프트웨어공학", "정보통신", "전자공학", "경영학", "디자인", "수학", undefined]
  const interventionTypes: ("message" | "meeting" | "note")[] = ["message", "meeting", "note"]
  
  return names.map((name, i) => {
    const riskScore = Math.floor(Math.random() * 100)
    const riskLevel: RiskLevel = riskScore > 65 ? "high" : riskScore > 35 ? "medium" : "low"
    const isCareNeeded = riskLevel === "high" || (riskLevel === "medium" && Math.random() > 0.5)
    const isNewRiskToday = riskLevel === "high" && Math.random() > 0.85
    const educationLevel = educationLevels[Math.floor(Math.random() * educationLevels.length)]
    const hasMajor = educationLevel !== "고졸" && Math.random() > 0.3
    
    const birthYear = 1990 + Math.floor(Math.random() * 10)
    const birthMonth = Math.floor(Math.random() * 12) + 1
    const birthDay = Math.floor(Math.random() * 28) + 1
    
    return {
      id: `student-${i}`,
      // Basic Info
      name,
      birthDate: `${birthYear}년 ${birthMonth}월 ${birthDay}일`,
      phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `${name.replace(/\s/g, '').toLowerCase()}${i + 1}@email.com`,
      // Learning Info
      courseName: courseNames[Math.floor(Math.random() * courseNames.length)],
      targetJob: targetJobs[Math.floor(Math.random() * targetJobs.length)],
      currentWeek: Math.floor(Math.random() * 12) + 1,
      // Education Background
      educationLevel,
      major: hasMajor ? majors[Math.floor(Math.random() * (majors.length - 1))] : undefined,
      // Core Status
      riskLevel,
      riskScore,
      recentChange: Math.random() * 30 - 15,
      trend: Array.from({ length: 14 }, () => Math.floor(Math.random() * 40) + 30),
      aiSummary: riskLevel === "high" 
        ? "지난 2주간 출석률이 급격히 감소했으며, 과제 제출도 3회 연속 미제출 상태입니다. 최근 수업 참여도가 크게 낮아졌고, 온라인 학습 시스템 접속 빈도도 현저히 줄었습니다. 즉각적인 개입이 필요한 상황으로 판단됩니다."
        : riskLevel === "medium"
          ? "참여도에 약간의 변동이 관찰됩니다. 과제 제출은 대체로 양호하나, 수업 집중도가 이전에 비해 다소 떨어진 모습입니다. 정기적인 확인 대화를 권장합니다."
          : "일관된 참여도와 긍정적인 학습 태도를 유지하고 있습니다. 과제 완수율과 출석률 모두 우수하며, 동료 수강생들과의 협업에도 적극적입니다.",
      mentorNotes: riskLevel === "high" 
        ? "개인적인 어려움이 있는 것 같음. 다음 미팅에서 상담 연계 논의 필요."
        : "현재 특이사항 없음.",
      interventions: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => ({
        date: `2024년 ${Math.floor(Math.random() * 3) + 1}월 ${Math.floor(Math.random() * 28) + 1}일`,
        type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
        summary: ["격려 메시지 전송", "1:1 상담 진행", "학습 계획 점검", "진로 상담"][Math.floor(Math.random() * 4)]
      })),
      // Additional tracking
      enrollmentDate: `2024년 ${Math.floor(Math.random() * 3) + 1}월 ${Math.floor(Math.random() * 28) + 1}일`,
      attendance: Math.floor(Math.random() * 30) + 70,
      assignmentsCompleted: Math.floor(Math.random() * 5) + 5,
      totalAssignments: 10,
      lastContact: `${Math.floor(Math.random() * 14) + 1}일 전`,
      isCareNeeded,
      isNewRiskToday
    }
  })
}

interface StudentContextType {
  students: Student[]
  careNeededStudents: Student[]
  newRiskStudents: Student[]
  totalStudents: number
  careNeededCount: number
  newRiskCount: number
  addStudent: (student: Student) => void
  completeCare: (studentId: string) => void
  getStudentById: (studentId: string) => Student | undefined
}

const StudentContext = createContext<StudentContextType | null>(null)

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => generateStudents())

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

  const completeCare = useCallback((studentId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id !== studentId) return student
      
      // Update student state
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
