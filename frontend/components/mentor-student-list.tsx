"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ChevronLeft, ChevronRight, MessageCircle, Calendar, FileText, User, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, X } from "lucide-react"
import { useStudents, getKoreanInitial, KOREAN_INITIALS, type Student, type RiskLevel } from "@/contexts/student-context"
import { useMessages } from "@/contexts/message-context"
import { useMeetings, type TimeSlot } from "@/contexts/meeting-context"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

function TrendChart({ data, riskLevel }: { data: number[]; riskLevel: RiskLevel }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const denom = data.length > 1 ? data.length - 1 : 1
  const points = data.map((v, i) => {
    const x = (i / denom) * 100
    const y = 100 - ((v - min) / range) * 70 - 15
    return `${x},${y}`
  }).join(" ")

  const colorClass = riskLevel === "high" 
    ? "text-risk-high" 
    : riskLevel === "medium" 
      ? "text-risk-medium" 
      : "text-risk-low"

  return (
    <div className="h-24 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${riskLevel}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        ))}
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${riskLevel})`}
          className={colorClass}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={colorClass}
        />
        {/* Data points */}
        {data.map((v, i) => {
          const x = (i / denom) * 100
          const y = 100 - ((v - min) / range) * 70 - 15
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill="currentColor"
              className={colorClass}
            />
          )
        })}
      </svg>
    </div>
  )
}

function StudentRecord({ student, onCompleteCare, onSendMessage, onRequestMeeting }: { student: Student; onCompleteCare?: () => void; onSendMessage?: () => void; onRequestMeeting?: () => void }) {
  const riskColors: Record<RiskLevel, { bg: string; text: string; label: string; border: string; icon: typeof CheckCircle }> = {
    low: { bg: "bg-risk-low/15", text: "text-risk-low", label: "낮음", border: "border-risk-low/30", icon: CheckCircle },
    medium: { bg: "bg-risk-medium/15", text: "text-risk-medium", label: "보통", border: "border-risk-medium/30", icon: Clock },
    high: { bg: "bg-risk-high/15", text: "text-risk-high", label: "높음", border: "border-risk-high/30", icon: AlertTriangle }
  }

  const riskStyle = riskColors[student.riskLevel]
  const RiskIcon = riskStyle.icon
  const changeDirection = student.recentChange > 0 ? "+" : ""
  const TrendIcon = student.recentChange > 5 ? TrendingUp : student.recentChange < -5 ? TrendingDown : Minus
  const changeColor = student.recentChange > 5 ? "text-risk-high" : student.recentChange < -5 ? "text-risk-low" : "text-muted-foreground"

  const interventionIcons: Record<string, typeof MessageCircle> = {
    message: MessageCircle,
    meeting: Calendar,
    note: FileText,
    "care-complete": CheckCircle
  }

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
      <Card className={cn("border-2 shadow-lg flex-1 flex flex-col overflow-hidden", riskStyle.border)}>
        <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Header Section */}
          <div className="flex items-start gap-6 mb-6 pb-6 border-b border-border/50 flex-shrink-0">
            {/* Profile Photo */}
            <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 border-2 border-border/30">
              <User className="w-16 h-16 text-muted-foreground/50" />
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-foreground">{student.name}</h2>
                    {student.isNewRiskToday && (
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-risk-high/20 text-risk-high flex items-center gap-1.5 animate-in fade-in duration-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-high opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-high" />
                        </span>
                        NEW
                      </span>
                    )}
                    {student.isCareNeeded && !student.isNewRiskToday && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-risk-high/15 text-risk-high">
                        케어 필요
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground mt-1">{student.courseName} · {student.currentWeek}주차</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  riskStyle.bg
                )}>
                  <RiskIcon className={cn("w-5 h-5", riskStyle.text)} />
                  <span className={cn("font-semibold", riskStyle.text)}>
                    위험도 {riskStyle.label}
                  </span>
                  <span className={cn("text-2xl font-bold ml-2", riskStyle.text)}>
                    {student.riskScore}
                  </span>
                </div>
              </div>
              
              {/* Basic Info Grid - Bootcamp style */}
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">생년월일</span>
                  <span className="font-medium text-foreground">{student.birthDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">연락처</span>
                  <span className="font-medium text-foreground">{student.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">이메일</span>
                  <span className="font-medium text-foreground truncate block">{student.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">등록일</span>
                  <span className="font-medium text-foreground">{student.enrollmentDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto mb-4">
            {/* Left Column - Learning Info & Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">학습 정보</h3>
              
              {/* Learning Info */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">과정명</span>
                  <span className="text-sm font-semibold">{student.courseName}</span>
                </div>
                {student.targetJob && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">목표 직무</span>
                    <span className="text-sm font-medium">{student.targetJob}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">현재 주차</span>
                  <span className="text-sm font-semibold">{student.currentWeek}주차 / 12주</span>
                </div>
              </div>

              {/* Education Background */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">학력</span>
                  <span className="text-sm font-medium">{student.educationLevel}</span>
                </div>
                {student.major && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">전공</span>
                    <span className="text-sm font-medium">{student.major}</span>
                  </div>
                )}
              </div>

              {/* Progress Stats */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">출석률</span>
                  <span className="text-lg font-semibold">{student.attendance}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      student.attendance > 80 ? "bg-risk-low" : student.attendance > 60 ? "bg-risk-medium" : "bg-risk-high"
                    )}
                    style={{ width: `${student.attendance}%` }}
                  />
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">과제 완료</span>
                  <span className="text-lg font-semibold">{student.assignmentsCompleted}/{student.totalAssignments}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(student.assignmentsCompleted / student.totalAssignments) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">마지막 연락</span>
                  <span className="text-sm font-medium">{student.lastContact}</span>
                </div>
              </div>
            </div>

            {/* Center Column - Trend & AI Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">트렌드 분석</h3>
              
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">14일 참여도 추이</span>
                  <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{changeDirection}{student.recentChange.toFixed(1)}%</span>
                  </div>
                </div>
                <TrendChart data={student.trend} riskLevel={student.riskLevel} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>14일 전</span>
                  <span>오늘</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  AI 분석 요약
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {student.aiSummary}
                </p>
              </div>
            </div>

            {/* Right Column - Notes & History */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">멘토 기록</h3>
              
              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">멘토 메모</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {student.mentorNotes}
                </p>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">상담 이력</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {student.interventions.map((intervention, idx) => {
                    const Icon = interventionIcons[intervention.type] || FileText
                    const isCareComplete = intervention.type === "care-complete"
                    return (
                      <div key={idx} className={cn(
                        "flex items-start gap-3 text-sm",
                        isCareComplete && "bg-risk-low/10 -mx-2 px-2 py-2 rounded-lg"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          isCareComplete ? "bg-risk-low/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            isCareComplete ? "text-risk-low" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium",
                            isCareComplete ? "text-risk-low" : "text-foreground"
                          )}>{intervention.summary}</p>
                          <p className="text-xs text-muted-foreground">{intervention.date}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50 flex-shrink-0">
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={onSendMessage}
            >
              <MessageCircle className="w-5 h-5" />
              격려 메시지 보내기
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={onRequestMeeting}
            >
              <Calendar className="w-5 h-5" />
              미팅 일정 잡기
            </Button>

            {student.isCareNeeded && onCompleteCare ? (
              <Button 
                size="lg" 
                className="gap-2 bg-risk-low hover:bg-risk-low/90 text-white"
                onClick={onCompleteCare}
              >
                <CheckCircle className="w-5 h-5" />
                케어 완료
              </Button>
            ) : (
              <Button size="lg" className="gap-2">
                개입 계획 수립
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function MentorStudentList() {
  const { students, completeCare } = useStudents()
  const { sendEncouragementMessage } = useMessages()
  const { requestMeeting, getPendingConfirmationsForMentor, confirmSlot, markMentorNotified } = useMeetings()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeInitial, setActiveInitial] = useState<string | null>(null)
  
  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  
  // Preset encouragement messages
  const PRESET_MESSAGES = [
    "최근 힘들 수 있지만 잘 하고 있어요. 계속 노력해봅시다!",
    "조금만 더 힘내면 충분히 따라갈 수 있어요!",
    "지금 방향이 맞습니다. 계속 해봅시다!",
    "필요하면 언제든 도움 요청해주세요!"
  ]
  
  // Meeting modal state
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [meetingMessage, setMeetingMessage] = useState("")
  const [proposedSlots, setProposedSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  
  // Availability confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const pendingConfirmations = getPendingConfirmationsForMentor()

  // Group students by Korean initial
  const studentsByInitial = useMemo(() => {
    const groups: Map<string, Student[]> = new Map()
    students.forEach(student => {
      const initial = getKoreanInitial(student.name[0])
      if (!groups.has(initial)) {
        groups.set(initial, [])
      }
      groups.get(initial)!.push(student)
    })
    return groups
  }, [students])

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    return students.filter(s => 
      s.name.includes(searchQuery) || 
      s.email.includes(searchQuery) ||
      s.courseName.includes(searchQuery)
    )
  }, [students, searchQuery])

  // Current student
  const currentStudent = filteredStudents[currentIndex]

  // Navigate to previous/next student
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredStudents.length - 1))
    setActiveInitial(null)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < filteredStudents.length - 1 ? prev + 1 : 0))
    setActiveInitial(null)
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentIndex(0)
    setActiveInitial(null)
  }

  // Handle care complete
  const handleCompleteCare = () => {
    if (currentStudent) {
      completeCare(currentStudent.id)
    }
  }

  // Handle open message modal
  const handleOpenMessageModal = () => {
    setCustomMessage("")
    setMessageModalOpen(true)
  }

  // Handle send custom message
  const handleSendCustomMessage = () => {
    if (currentStudent && customMessage.trim()) {
      sendEncouragementMessage(currentStudent.id, customMessage.trim())
      setMessageModalOpen(false)
      setCustomMessage("")
      toast({
        title: "격려 메시지 전송 완료",
        description: `${currentStudent.name} 학생에게 메시지를 보냈습니다.`,
      })
    }
  }

  // Handle send preset message (instantly)
  const handleSendPresetMessage = (message: string) => {
    if (currentStudent) {
      sendEncouragementMessage(currentStudent.id, message)
      setMessageModalOpen(false)
      toast({
        title: "격려 메시지 전송 완료",
        description: `${currentStudent.name} 학생에게 메시지를 보냈습니다.`,
      })
    }
  }

  // Handle meeting request
  const handleOpenMeetingModal = () => {
    setMeetingPurpose("")
    setMeetingMessage("")
    setProposedSlots([])
    setSelectedDate(undefined)
    setSelectedTime("")
    setMeetingModalOpen(true)
  }

  const handleAddSlot = () => {
    if (selectedDate && selectedTime) {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const exists = proposedSlots.find(s => s.date === dateStr && s.time === selectedTime)
      if (!exists) {
        setProposedSlots(prev => [...prev, { date: dateStr, time: selectedTime }])
      }
      setSelectedTime("")
    }
  }

  const handleRemoveSlot = (date: string, time: string) => {
    setProposedSlots(prev => prev.filter(s => !(s.date === date && s.time === time)))
  }

  const handleSendMeetingRequest = () => {
    if (currentStudent && meetingPurpose.trim() && proposedSlots.length > 0) {
      requestMeeting(
        currentStudent.id, 
        currentStudent.name, 
        meetingPurpose, 
        meetingMessage,
        proposedSlots
      )
      setMeetingModalOpen(false)
      toast({
        title: "미팅 요청 전송 완료",
        description: `${currentStudent.name} 학생에게 ${proposedSlots.length}개의 시간 옵션과 함께 미팅 요청을 보냈습니다.`,
      })
    }
  }

  // Handle confirming a meeting slot
  const handleConfirmSlot = (meetingId: string, slot: TimeSlot) => {
    confirmSlot(meetingId, slot)
    markMentorNotified(meetingId)
    setConfirmModalOpen(false)
    toast({
      title: "미팅 일정 확정",
      description: `${slot.date} ${slot.time}에 미팅이 확정되었습니다.`,
    })
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Search Bar - Fixed at top */}
      <div className="flex-shrink-0 p-6 border-b bg-card/50">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="수강생 이름, 이메일, 과정명 검색"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 h-14 text-lg bg-background rounded-2xl border-2 shadow-sm"
          />
        </div>
      </div>

      {/* Main Content Area - Uses CSS Grid for complete isolation */}
      <div className="flex-1 grid grid-cols-[14rem_1fr] min-h-0 overflow-hidden">
        {/* Left Sidebar - ONLY this area scrolls vertically */}
        <aside className="relative border-r bg-card/30">
          <div 
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarGutter: 'stable' }}
          >
            <div className="py-4">
            {KOREAN_INITIALS.filter(initial => studentsByInitial.has(initial)).map(initial => {
              const studentsInGroup = studentsByInitial.get(initial) || []
              
              return (
                <div key={initial} className="mb-2">
                  {/* Consonant Header */}
                  <div className="px-4 py-2 text-sm font-bold text-muted-foreground sticky top-0 bg-card/90 backdrop-blur-sm z-10">
                    {initial}
                  </div>
                  {/* Student Names */}
                  <div className="space-y-0.5">
                    {studentsInGroup.map(student => {
                      const studentIndex = filteredStudents.findIndex(s => s.id === student.id)
                      const isSelected = currentStudent?.id === student.id
                      const isFiltered = studentIndex === -1
                      
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            if (!isFiltered && studentIndex >= 0) {
                              setCurrentIndex(studentIndex)
                              setActiveInitial(initial)
                            }
                          }}
                          disabled={isFiltered}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm transition-all flex items-center gap-2",
                            isFiltered 
                              ? "opacity-30 cursor-not-allowed text-muted-foreground"
                              : "hover:bg-muted cursor-pointer",
                            isSelected && !isFiltered && "bg-primary text-primary-foreground hover:bg-primary font-medium"
                          )}
                        >
                          <span className="flex-1">{student.name}</span>
                          {student.isNewRiskToday && !isSelected ? (
                            <span className="text-[10px] font-bold text-risk-high bg-risk-high/15 px-1.5 py-0.5 rounded">NEW</span>
                          ) : student.isCareNeeded && !isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-risk-high flex-shrink-0" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </aside>

        {/* Right Side - Student Record - NEVER scrolls, completely fixed */}
        <div 
          className="relative flex flex-col"
          style={{ height: '100%', overflow: 'hidden' }}
        >
          {filteredStudents.length > 0 ? (
            <>
              {/* Navigation Arrows - Absolutely positioned */}
              <div className="absolute inset-y-0 left-4 flex items-center z-10 pointer-events-none">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-2 pointer-events-auto"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              </div>
              
              <div className="absolute inset-y-0 right-4 flex items-center z-10 pointer-events-none">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-2 pointer-events-auto"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </div>

              {/* Student Record - Centered, no scroll */}
              <div 
                className="flex-1 flex items-center justify-center px-20 py-6"
                style={{ overflow: 'hidden' }}
              >
                {currentStudent && <StudentRecord student={currentStudent} onCompleteCare={handleCompleteCare} onSendMessage={handleOpenMessageModal} onRequestMeeting={handleOpenMeetingModal} />}
              </div>

              {/* Page Indicator - Fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t bg-card/30 flex items-center justify-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {filteredStudents.length} 명
                </span>
                <div className="flex gap-1">
                  {filteredStudents.slice(
                    Math.max(0, currentIndex - 3),
                    Math.min(filteredStudents.length, currentIndex + 4)
                  ).map((s, idx) => {
                    const actualIndex = Math.max(0, currentIndex - 3) + idx
                    return (
                      <button
                        key={s.id}
                        onClick={() => setCurrentIndex(actualIndex)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          actualIndex === currentIndex 
                            ? "bg-primary w-6" 
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-lg">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Encouragement Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>격려 메시지 보내기</DialogTitle>
            <DialogDescription>
              {currentStudent?.name} 학생에게 격려 메시지를 보냅니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Custom message input */}
            <div className="space-y-2">
              <Label htmlFor="custom-message">직접 작성하기</Label>
              <Textarea
                id="custom-message"
                placeholder="학생에게 보낼 메시지를 작성하세요"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="resize-none h-24"
              />
              <Button 
                onClick={handleSendCustomMessage} 
                disabled={!customMessage.trim()}
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                보내기
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">또는 빠른 전송</span>
              </div>
            </div>

            {/* Preset messages */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">자주 쓰는 메시지</Label>
              <div className="space-y-2">
                {PRESET_MESSAGES.map((message, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPresetMessage(message)}
                    className="w-full text-left p-3 text-sm rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Request Modal */}
      <Dialog open={meetingModalOpen} onOpenChange={setMeetingModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>미팅 일정 요청</DialogTitle>
            <DialogDescription>
              {currentStudent?.name} 학생에게 미팅 일정을 요청합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="purpose">미팅 목적</Label>
              <Input
                id="purpose"
                placeholder="예: 학습 상담, 진로 상담, 1:1 체크인..."
                value={meetingPurpose}
                onChange={(e) => setMeetingPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">메시지 (선택)</Label>
              <Textarea
                id="message"
                placeholder="학생에게 전달할 메시지를 입력하세요..."
                value={meetingMessage}
                onChange={(e) => setMeetingMessage(e.target.value)}
                className="resize-none h-16"
              />
            </div>
            
            {/* Calendar and Time Selector */}
            <div className="space-y-3">
              <Label>날짜 및 시간 선택</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Calendar */}
                <div className="border rounded-lg p-2">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md"
                  />
                </div>
                
                {/* Time Input */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="time-input">시간</Label>
                    <div className="flex gap-2">
                      <Input
                        id="time-input"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        onClick={handleAddSlot}
                        disabled={!selectedDate || !selectedTime}
                        size="sm"
                      >
                        추가
                      </Button>
                    </div>
                    {selectedDate && (
                      <p className="text-xs text-muted-foreground">
                        선택된 날짜: {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                      </p>
                    )}
                  </div>

                  {/* Selected Slots */}
                  <div className="space-y-2">
                    <Label>선택된 시간 ({proposedSlots.length}개)</Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {proposedSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">아직 선택된 시간이 없습니다</p>
                      ) : (
                        proposedSlots
                          .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                          .map((slot, idx) => {
                            const slotDate = new Date(slot.date)
                            const label = slotDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
                            return (
                              <div 
                                key={idx}
                                className="flex items-center justify-between px-3 py-2 bg-primary/10 rounded-md"
                              >
                                <span className="text-sm flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  {label} {slot.time}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(slot.date, slot.time)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                {proposedSlots.length === 0 && "시간을 선택해주세요"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMeetingModalOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={handleSendMeetingRequest} 
                  disabled={!meetingPurpose.trim() || proposedSlots.length === 0}
                >
                  요청 보내기
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>미팅 일정 확정</DialogTitle>
            <DialogDescription>
              학생이 제출한 가능한 시간 중 하나를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-80 overflow-y-auto">
            {pendingConfirmations.map(meeting => (
              <div key={meeting.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{meeting.studentName}</span>
                  <span className="text-xs text-muted-foreground">{meeting.purpose}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">학생이 선택한 시간:</p>
                  {meeting.selectedSlots.map((slot, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleConfirmSlot(meeting.id, slot)}
                    >
                      <Calendar className="w-4 h-4" />
                      {slot.date} {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {pendingConfirmations.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                확인 대기 중인 미팅이 없습니다.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating notification for pending confirmations */}
      {pendingConfirmations.length > 0 && !confirmModalOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => setConfirmModalOpen(true)}
            className="gap-2 shadow-lg"
          >
            <Calendar className="w-4 h-4" />
            미팅 응답 확인 ({pendingConfirmations.length})
          </Button>
        </div>
      )}
    </div>
  )
}
