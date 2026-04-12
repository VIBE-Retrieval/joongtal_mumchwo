"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClipboardList, TrendingDown, TrendingUp, Minus, Bell, Heart, Calendar, Check, Clock } from "lucide-react"
import { useMessages } from "@/contexts/message-context"
import { useMeetings, type TimeSlot } from "@/contexts/meeting-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// Mock survey data - in real app this would come from database
const surveyHistory = [
  { date: "2026-04-12", achievement: 4, adaptability: 3, relationship: 5 },
  { date: "2026-04-11", achievement: 3, adaptability: 3, relationship: 4 },
  { date: "2026-04-10", achievement: 4, adaptability: 4, relationship: 4 },
  { date: "2026-04-09", achievement: 3, adaptability: 2, relationship: 4 },
  { date: "2026-04-08", achievement: 4, adaptability: 3, relationship: 5 },
  { date: "2026-04-07", achievement: 5, adaptability: 4, relationship: 5 },
  { date: "2026-04-06", achievement: 4, adaptability: 4, relationship: 4 },
]

const todaySurveyCompleted = true // In real app, check if today's survey exists

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function getScoreLabel(score: number) {
  const labels = ["", "매우 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"]
  return labels[score] || ""
}

// Calculate averages from recent data
function calculateAverages(data: typeof surveyHistory) {
  if (data.length === 0) return { achievement: 0, adaptability: 0, relationship: 0 }
  const recent = data.slice(0, 7)
  return {
    achievement: recent.reduce((sum, d) => sum + d.achievement, 0) / recent.length,
    adaptability: recent.reduce((sum, d) => sum + d.adaptability, 0) / recent.length,
    relationship: recent.reduce((sum, d) => sum + d.relationship, 0) / recent.length,
  }
}

// Calculate trend (comparing recent 3 days vs previous 3 days)
function calculateTrend(data: typeof surveyHistory, key: keyof Omit<typeof surveyHistory[0], 'date'>) {
  if (data.length < 4) return 'stable'
  const recent = data.slice(0, 3).reduce((sum, d) => sum + d[key], 0) / 3
  const previous = data.slice(3, 6).reduce((sum, d) => sum + d[key], 0) / Math.min(3, data.slice(3, 6).length)
  const diff = recent - previous
  if (diff > 0.3) return 'up'
  if (diff < -0.3) return 'down'
  return 'stable'
}

function MetricDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            i < Math.round(value) ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-status-stable" />
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-risk-high" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

function TrendChart({ data }: { data: typeof surveyHistory }) {
  const recent7 = data.slice(0, 7).reverse()
  
  const getY = (value: number) => {
    // Scale 1-5 to 10-90 (inverted for SVG)
    return 90 - ((value - 1) / 4) * 80
  }

  const createPath = (key: keyof Omit<typeof surveyHistory[0], 'date'>) => {
    return recent7.map((d, i) => {
      const x = (i / (recent7.length - 1)) * 100
      const y = getY(d[key])
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  return (
    <div className="space-y-4">
      <div className="h-40 w-full relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map(v => (
            <line 
              key={v} 
              x1="0" 
              y1={getY(v)} 
              x2="100" 
              y2={getY(v)} 
              stroke="currentColor" 
              strokeOpacity="0.08" 
              strokeWidth="0.5" 
            />
          ))}
          
          {/* Achievement line */}
          <path
            d={createPath('achievement')}
            fill="none"
            stroke="oklch(0.60 0.10 250)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Adaptability line */}
          <path
            d={createPath('adaptability')}
            fill="none"
            stroke="oklch(0.70 0.08 180)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Relationship line */}
          <path
            d={createPath('relationship')}
            fill="none"
            stroke="oklch(0.65 0.12 45)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {recent7.map((d, i) => {
            const x = (i / (recent7.length - 1)) * 100
            return (
              <g key={i}>
                <circle cx={x} cy={getY(d.achievement)} r="2.5" fill="oklch(0.60 0.10 250)" />
                <circle cx={x} cy={getY(d.adaptability)} r="2.5" fill="oklch(0.70 0.08 180)" />
                <circle cx={x} cy={getY(d.relationship)} r="2.5" fill="oklch(0.65 0.12 45)" />
              </g>
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] text-muted-foreground -ml-6 py-2">
          <span>5</span>
          <span>3</span>
          <span>1</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground pl-1">
        {recent7.map((d, i) => (
          <span key={i}>{formatDate(d.date)}</span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(0.60 0.10 250)' }} />
          <span className="text-muted-foreground">성취도</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(0.70 0.08 180)' }} />
          <span className="text-muted-foreground">적응도</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(0.65 0.12 45)' }} />
          <span className="text-muted-foreground">인간관계</span>
        </div>
      </div>
    </div>
  )
}

// Mock student ID - in real app this would come from auth
const CURRENT_STUDENT_ID = "student-2" // 김서연

function formatMessageTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return "방금 전"
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

export function StudentMode() {
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  
  const { getMessagesForStudent, getUnreadCountForStudent, markAsRead, markAllAsReadForStudent } = useMessages()
  const { 
    getMeetingsForStudent, 
    getPendingRequestsForStudent, 
    getConfirmedMeetingsForStudent,
    selectSlots: submitSelectedSlots,
    markStudentNotified,
    getUnreadCountForStudent: getMeetingUnreadCount
  } = useMeetings()
  
  const messages = getMessagesForStudent(CURRENT_STUDENT_ID)
  const unreadCount = getUnreadCountForStudent(CURRENT_STUDENT_ID)
  const meetingUnreadCount = getMeetingUnreadCount(CURRENT_STUDENT_ID)
  const totalUnread = unreadCount + meetingUnreadCount
  const latestMessage = messages[0]
  
  const pendingMeetingRequests = getPendingRequestsForStudent(CURRENT_STUDENT_ID)
  const confirmedMeetings = getConfirmedMeetingsForStudent(CURRENT_STUDENT_ID)
  const allMeetings = getMeetingsForStudent(CURRENT_STUDENT_ID)
  
  // Availability selection modal
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false)
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  
  const currentMeeting = currentMeetingId ? allMeetings.find(m => m.id === currentMeetingId) : null
  
  const handleOpenNotifications = () => {
    setNotificationOpen(true)
  }
  
  const handleMarkAllRead = () => {
    markAllAsReadForStudent(CURRENT_STUDENT_ID)
  }
  
  const handleOpenAvailabilityModal = (meetingId: string) => {
    setCurrentMeetingId(meetingId)
    setSelectedSlots([])
    setAvailabilityModalOpen(true)
  }
  
  const toggleSlot = (date: string, time: string) => {
    const exists = selectedSlots.find(s => s.date === date && s.time === time)
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => !(s.date === date && s.time === time)))
    } else {
      setSelectedSlots(prev => [...prev, { date, time }])
    }
  }
  
  const handleSubmitAvailability = () => {
    if (currentMeetingId && selectedSlots.length > 0) {
      submitSelectedSlots(currentMeetingId, selectedSlots)
      markStudentNotified(currentMeetingId)
      setAvailabilityModalOpen(false)
      setCurrentMeetingId(null)
      setSelectedSlots([])
    }
  }
  
  const averages = calculateAverages(surveyHistory)
  const achievementTrend = calculateTrend(surveyHistory, 'achievement')
  const adaptabilityTrend = calculateTrend(surveyHistory, 'adaptability')
  const relationshipTrend = calculateTrend(surveyHistory, 'relationship')
  
  const displayedHistory = showAllHistory ? surveyHistory : surveyHistory.slice(0, 5)

  // Generate insight based on trends
  const getInsight = () => {
    if (adaptabilityTrend === 'down') {
      return "최근 적응도가 감소하고 있습니다. 어려운 점이 있다면 멘토에게 상담을 요청해 보세요."
    }
    if (achievementTrend === 'down') {
      return "최근 성취도가 낮아지고 있어요. 학습 목표를 다시 점검해 보는 건 어떨까요?"
    }
    if (relationshipTrend === 'up') {
      return "인간관계가 좋아지고 있네요! 좋은 흐름을 유지해 보세요."
    }
    if (achievementTrend === 'up' && adaptabilityTrend === 'up') {
      return "전반적으로 좋은 상태를 유지하고 있어요. 잘하고 있습니다!"
    }
    return "꾸준히 기록하고 있어요. 자기 이해의 첫걸���입니다."
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Header with Notification Bell */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">나의 대시보드</h1>
        
        {/* Notification Bell */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={handleOpenNotifications}
            >
              <Bell className="w-5 h-5" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-risk-high text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">알림</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={handleMarkAllRead}
                >
                  모두 읽음 처리
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Meeting requests */}
              {pendingMeetingRequests.map(meeting => (
                <div 
                  key={meeting.id}
                  className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors bg-primary/5"
                  onClick={() => {
                    setNotificationOpen(false)
                    handleOpenAvailabilityModal(meeting.id)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        멘토가 미팅을 요청했습니다
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        목적: {meeting.purpose}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(meeting.createdAt)}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  </div>
                </div>
              ))}
              
              {/* Confirmed meetings (new) */}
              {confirmedMeetings.filter(m => !m.studentNotified).map(meeting => (
                <div 
                  key={meeting.id}
                  className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors bg-risk-low/10"
                  onClick={() => markStudentNotified(meeting.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-risk-low/20">
                      <Check className="w-4 h-4 text-risk-low" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        미팅 일정이 확정되었습니다
                      </p>
                      <p className="text-xs text-foreground mt-0.5">
                        {meeting.confirmedSlot?.date} {meeting.confirmedSlot?.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        목적: {meeting.purpose}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-risk-low flex-shrink-0 mt-2" />
                  </div>
                </div>
              ))}
              
              {/* Encouragement messages */}
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={cn(
                    "p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                    !msg.isRead && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(msg.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      !msg.isRead ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Heart className={cn(
                        "w-4 h-4",
                        !msg.isRead ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !msg.isRead && "font-medium"
                      )}>
                        멘토가 격려 메시지를 보냈습니다
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(msg.timestamp)}
                      </p>
                    </div>
                    {!msg.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
              
              {messages.length === 0 && pendingMeetingRequests.length === 0 && confirmedMeetings.filter(m => !m.studentNotified).length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  아직 알림이 없습니다
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Recent Mentor Message Card */}
      {latestMessage && (
        <Card className={cn(
          "border-0 shadow-md overflow-hidden",
          !latestMessage.isRead 
            ? "bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-l-primary"
            : "bg-card/80"
        )}>
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                !latestMessage.isRead ? "bg-primary/20" : "bg-muted"
              )}>
                <Heart className={cn(
                  "w-5 h-5",
                  !latestMessage.isRead ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">멘토의 메시지</span>
                  {!latestMessage.isRead && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">NEW</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatMessageTime(latestMessage.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {latestMessage.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access - Survey Button */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">오늘의 설문</h2>
              <p className="text-sm text-muted-foreground">
                {todaySurveyCompleted 
                  ? "완료" 
                  : "미완료"
                }
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link href="/student/survey">
                <ClipboardList className="w-5 h-5" />
                설문 하러가기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">최근 평균</CardTitle>
          <CardDescription>최근 7일간의 평균 점수</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {/* Achievement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">성취도</span>
                <TrendIcon trend={achievementTrend} />
              </div>
              <MetricDots value={averages.achievement} />
              <span className="text-xs text-muted-foreground">
                평균 {averages.achievement.toFixed(1)}점
              </span>
            </div>
            
            {/* Adaptability */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">적응도</span>
                <TrendIcon trend={adaptabilityTrend} />
              </div>
              <MetricDots value={averages.adaptability} />
              <span className="text-xs text-muted-foreground">
                평균 {averages.adaptability.toFixed(1)}점
              </span>
            </div>
            
            {/* Relationship */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">인간관계</span>
                <TrendIcon trend={relationshipTrend} />
              </div>
              <MetricDots value={averages.relationship} />
              <span className="text-xs text-muted-foreground">
                평균 {averages.relationship.toFixed(1)}점
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Visualization */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">최근 7일 추이</CardTitle>
          <CardDescription>지난 일주일간의 변화 그래프</CardDescription>
        </CardHeader>
        <CardContent className="pl-8">
          <TrendChart data={surveyHistory} />
        </CardContent>
      </Card>

      {/* Survey History Table */}
      <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">설문 기록</CardTitle>
          <CardDescription>과거 설문 응답 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">날짜</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">성취도</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">적응도</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">인간관계</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((record, index) => (
                  <tr key={record.date} className={cn("border-b last:border-0", index === 0 && "bg-primary/5")}>
                    <td className="py-3 px-2 text-foreground">
                      {formatFullDate(record.date)}
                      {index === 0 && <span className="ml-2 text-xs text-primary font-medium">오늘</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{record.achievement}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({getScoreLabel(record.achievement)})
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{record.adaptability}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({getScoreLabel(record.adaptability)})
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{record.relationship}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({getScoreLabel(record.relationship)})
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {surveyHistory.length > 5 && (
            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? "접기" : `더 보기 (${surveyHistory.length - 5}개)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">AI 인사이트</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {getInsight()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Meeting Card */}
      {confirmedMeetings.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-risk-low/10 to-risk-low/5 border-l-4 border-l-risk-low">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5 text-risk-low" />
              예정된 미팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmedMeetings.map(meeting => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {meeting.confirmedSlot?.date} {meeting.confirmedSlot?.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      목적: {meeting.purpose}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-risk-low" />
                    <span className="text-xs text-risk-low font-medium">확정</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Meeting Request Card */}
      {pendingMeetingRequests.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-l-primary animate-in fade-in duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              미팅 요청
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">NEW</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMeetingRequests.map(meeting => (
                <div key={meeting.id} className="p-4 bg-background/50 rounded-lg space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {meeting.mentorName} 멘토가 미팅을 요청했습니다
                    </p>
                    <p className="text-xs text-muted-foreground">
                      목적: {meeting.purpose}
                    </p>
                    {meeting.message && (
                      <p className="text-sm text-foreground mt-2 p-2 bg-muted/30 rounded">
                        {meeting.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => handleOpenAvailabilityModal(meeting.id)}
                  >
                    <Calendar className="w-4 h-4" />
                    가능한 시간 선택하기
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Selection Modal */}
      <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>미팅 시간 선택</DialogTitle>
            <DialogDescription>
              {currentMeeting && (
                <>
                  <span className="font-medium text-foreground">{currentMeeting.mentorName}</span> 멘토가 제안한 시간 중 가능한 시간을 선택해주세요.
                  <br />
                  <span className="text-xs">목적: {currentMeeting.purpose}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentMeeting && currentMeeting.proposedSlots.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">여러 개 선택 가능합니다</p>
                {currentMeeting.proposedSlots
                  .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                  .map((slot, idx) => {
                    const isSelected = selectedSlots.some(s => s.date === slot.date && s.time === slot.time)
                    const slotDate = new Date(slot.date)
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
                    const label = `${slotDate.getMonth() + 1}/${slotDate.getDate()} (${dayNames[slotDate.getDay()]}) ${slot.time}`
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleSlot(slot.date, slot.time)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        )}
                      >
                        <Calendar className={cn("w-5 h-5", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                        <span className="text-sm font-medium">{label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    )
                  })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                제안된 시간이 없습니다.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedSlots.length}개 선택됨
            </div>
            <Button variant="outline" onClick={() => setAvailabilityModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitAvailability} disabled={selectedSlots.length === 0}>
              완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
