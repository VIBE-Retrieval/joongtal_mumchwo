"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ChevronLeft, ChevronRight, MessageCircle, Calendar, FileText } from "lucide-react"

type RiskLevel = "low" | "medium" | "high"

interface Student {
  id: string
  name: string
  course: string
  riskLevel: RiskLevel
  riskScore: number
  recentChange: number
  trend: number[]
  aiExplanation: string
}

const generateStudents = (): Student[] => {
  const names = [
    "강예진", "권도현", "김민수", "류미나", "박지훈",
    "신지원", "오현우", "윤성호", "이서연", "임수빈",
    "장태양", "정다은", "조민재", "최준혁", "한소희",
    "강민지", "고은서", "김태현", "남주원", "문지수",
    "배수현", "서예준", "안하은", "유진우", "이도윤"
  ].sort((a, b) => a.localeCompare(b, 'ko'))
  
  const courses = ["컴퓨터공학", "데이터과학", "공학", "경영학", "디자인"]
  
  return names.map((name, i) => {
    const riskScore = Math.floor(Math.random() * 100)
    const riskLevel: RiskLevel = riskScore > 65 ? "high" : riskScore > 35 ? "medium" : "low"
    
    return {
      id: `student-${i}`,
      name,
      course: courses[Math.floor(Math.random() * courses.length)],
      riskLevel,
      riskScore,
      recentChange: Math.random() * 30 - 15,
      trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 40) + 30),
      aiExplanation: riskLevel === "high" 
        ? "지난 2주간 참여도가 크게 감소했습니다. 연속 3회 세션을 불참했습니다."
        : riskLevel === "medium"
          ? "참여도에 보통 수준의 변동이 있습니다. 확인 대화를 고려해 보세요."
          : "일관된 참여도와 긍정적인 궤적을 보이고 있습니다."
    }
  })
}

function MiniTrendChart({ data, riskLevel }: { data: number[]; riskLevel: RiskLevel }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 80 - 10
    return `${x},${y}`
  }).join(" ")

  const colorClass = riskLevel === "high" 
    ? "text-risk-high" 
    : riskLevel === "medium" 
      ? "text-risk-medium" 
      : "text-risk-low"

  return (
    <div className="h-10 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={colorClass}
        />
      </svg>
    </div>
  )
}

function StudentCard({ 
  student, 
  isSelected,
  onSelect 
}: { 
  student: Student
  isSelected: boolean
  onSelect: () => void
}) {
  const riskColors: Record<RiskLevel, { bg: string; text: string; label: string; border: string }> = {
    low: { bg: "bg-risk-low/15", text: "text-risk-low", label: "낮음", border: "border-risk-low/30" },
    medium: { bg: "bg-risk-medium/15", text: "text-risk-medium", label: "보통", border: "border-risk-medium/30" },
    high: { bg: "bg-risk-high/15", text: "text-risk-high", label: "높음", border: "border-risk-high/30" }
  }

  const riskStyle = riskColors[student.riskLevel]
  const changeDirection = student.recentChange > 0 ? "+" : ""
  const changeColor = student.recentChange > 5 ? "text-risk-high" : student.recentChange < -5 ? "text-risk-low" : "text-muted-foreground"

  return (
    <Card
      className={cn(
        "w-64 flex-shrink-0 border transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:border-border",
        isSelected
          ? "ring-2 ring-primary ring-offset-1 shadow-md border-primary/40"
          : cn("border-border/60", riskStyle.border)
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold truncate">{student.name}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{student.course}</p>
          </div>
          <span className={cn(
            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0",
            riskStyle.bg, riskStyle.text
          )}>
            {riskStyle.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {/* Trend */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">7일 추이</span>
            <span className={cn("text-[11px] font-semibold tabular-nums", changeColor)}>
              {changeDirection}{student.recentChange.toFixed(1)}%
            </span>
          </div>
          <MiniTrendChart data={student.trend} riskLevel={student.riskLevel} />
        </div>

        {/* AI Summary */}
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/30">
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {student.aiExplanation}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1.5 pt-0.5">
          <Button variant="outline" size="sm" className="flex-1 text-[11px] h-7 gap-1 border-border/60 hover:border-border">
            <MessageCircle className="w-3 h-3" />
            메시지
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-[11px] h-7 gap-1 border-border/60 hover:border-border">
            <Calendar className="w-3 h-3" />
            미팅
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border/60 hover:border-border">
            <FileText className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryStats({ students }: { students: Student[] }) {
  const highRiskCount = students.filter(s => s.riskLevel === "high").length
  const mediumRiskCount = students.filter(s => s.riskLevel === "medium").length

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">전체</span>
        <span className="font-semibold text-foreground tabular-nums">{students.length}명</span>
      </div>
      <div className="w-px h-3.5 bg-border" />
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-risk-high flex-shrink-0" />
        <span className="text-muted-foreground">위험</span>
        <span className="font-semibold text-risk-high tabular-nums">{highRiskCount}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-risk-medium flex-shrink-0" />
        <span className="text-muted-foreground">주의</span>
        <span className="font-semibold text-risk-medium tabular-nums">{mediumRiskCount}</span>
      </div>
    </div>
  )
}

export function MentorMode() {
  const students = useMemo(() => generateStudents(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  // Scroll to student card
  const scrollToStudent = (studentId: string) => {
    setSelectedId(studentId)
    const cardElement = cardRefs.current.get(studentId)
    if (cardElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardLeft = cardElement.offsetLeft
      const containerWidth = container.clientWidth
      const cardWidth = cardElement.clientWidth
      
      // Center the card in view
      const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2)
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth"
      })
    }
  }

  // Handle search - auto focus on first match
  useEffect(() => {
    if (searchQuery.trim() && filteredStudents.length > 0) {
      scrollToStudent(filteredStudents[0].id)
    }
  }, [searchQuery, filteredStudents])

  // Scroll controls
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // Group students by first character (for index navigation)
  const groupedByInitial = useMemo(() => {
    const groups: Map<string, Student[]> = new Map()
    students.forEach(student => {
      const initial = student.name[0]
      if (!groups.has(initial)) {
        groups.set(initial, [])
      }
      groups.get(initial)!.push(student)
    })
    return groups
  }, [students])

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Student Index */}
      <aside className="w-52 flex-shrink-0 border-r border-border/60 bg-card/40 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">학생 목록</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from(groupedByInitial.entries()).map(([initial, groupStudents]) => (
            <div key={initial}>
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/20 sticky top-0 border-b border-border/20">
                {initial}
              </div>
              {groupStudents.map(student => {
                const riskDot = student.riskLevel === "high"
                  ? "bg-risk-high"
                  : student.riskLevel === "medium"
                    ? "bg-risk-medium"
                    : "bg-risk-low"

                return (
                  <button
                    key={student.id}
                    onClick={() => scrollToStudent(student.id)}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-muted/40 transition-colors",
                      selectedId === student.id && "bg-primary/8 text-primary font-semibold"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", riskDot)} />
                    <span className="truncate">{student.name}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Search & Stats */}
        <div className="px-5 py-3 border-b border-border/50 bg-card/30 flex items-center justify-between gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="학생 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-background/80 text-sm border-border/60"
            />
          </div>
          <SummaryStats students={students} />
        </div>

        {/* Horizontal Scrolling Cards */}
        <div className="flex-1 flex flex-col p-4 min-h-0">
          <div className="relative flex-1">
            {/* Scroll Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-card/95 backdrop-blur-sm border-border/60 hover:bg-card"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-card/95 backdrop-blur-sm border-border/60 hover:bg-card"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Cards Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-3.5 overflow-x-auto px-10 py-1.5 h-full items-start scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(student.id, el)
                  }}
                >
                  <StudentCard
                    student={student}
                    isSelected={selectedId === student.id}
                    onSelect={() => setSelectedId(student.id)}
                  />
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground py-16 w-full">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">검색 결과가 없습니다</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">다른 이름으로 검색해 보세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
