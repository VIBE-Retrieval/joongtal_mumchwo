"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClipboardList, TrendingDown, TrendingUp, Minus, Bell, Heart, Calendar, Check, Clock, AlertTriangle } from "lucide-react"
import { useMessages } from "@/contexts/message-context"
import { useMeetings, type TimeSlot } from "@/contexts/meeting-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface SurveyRecord {
  date: string
  achievement: number
  adaptability: number
  relationship: number
}

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
function calculateAverages(data: SurveyRecord[]) {
  if (data.length === 0) return { achievement: 0, adaptability: 0, relationship: 0 }
  const recent = data.slice(0, 7)
  return {
    achievement: recent.reduce((sum, d) => sum + d.achievement, 0) / recent.length,
    adaptability: recent.reduce((sum, d) => sum + d.adaptability, 0) / recent.length,
    relationship: recent.reduce((sum, d) => sum + d.relationship, 0) / recent.length,
  }
}

// Calculate trend (comparing recent 3 days vs previous 3 days)
function calculateTrend(data: SurveyRecord[], key: keyof Omit<SurveyRecord, "date">) {
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
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-150",
            i < Math.round(value) ? "bg-primary scale-100" : "bg-muted/70 scale-90"
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

function TrendChart({ data }: { data: SurveyRecord[] }) {
  const recent7 = data.slice(0, 7).reverse()
  const xDenom = Math.max(1, recent7.length - 1)

  const getY = (value: number) => {
    // Scale 1-5 to 10-90 (inverted for SVG)
    return 90 - ((value - 1) / 4) * 80
  }

  const createPath = (key: keyof Omit<SurveyRecord, "date">) => {
    return recent7.map((d, i) => {
      const x = (i / xDenom) * 100
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
            stroke="var(--chart-1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Adaptability line */}
          <path
            d={createPath('adaptability')}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Relationship line */}
          <path
            d={createPath('relationship')}
            fill="none"
            stroke="var(--chart-3)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {recent7.map((d, i) => {
            const x = (i / xDenom) * 100
            return (
              <g key={i}>
                <circle cx={x} cy={getY(d.achievement)} r="2.5" fill="var(--chart-1)" />
                <circle cx={x} cy={getY(d.adaptability)} r="2.5" fill="var(--chart-2)" />
                <circle cx={x} cy={getY(d.relationship)} r="2.5" fill="var(--chart-3)" />
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
          <div className="w-3 h-0.5 rounded-full bg-[var(--chart-1)]" />
          <span className="text-muted-foreground">성취도</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full bg-[var(--chart-2)]" />
          <span className="text-muted-foreground">적응도</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full bg-[var(--chart-3)]" />
          <span className="text-muted-foreground">인간관계</span>
        </div>
      </div>
    </div>
  )
}

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
  const [surveyHistory, setSurveyHistory] = useState<SurveyRecord[]>([])
  const [todaySurveyCompleted, setTodaySurveyCompleted] = useState(false)
  const [emotionState, setEmotionState] = useState("蹂댄넻")
  const [emotionLabel, setEmotionLabel] = useState("?삉")
  const [isLoading, setIsLoading] = useState(true)
  const [studentId, setStudentId] = useState("")
  const [careMessage, setCareMessage] = useState<string | null>(null)
  const [careMessageRead, setCareMessageRead] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      const raw = localStorage.getItem("auth-user")
      const user = raw ? JSON.parse(raw) : null
      const sid = user?.id ?? ""
      return sid ? localStorage.getItem(`care-read-${sid}`) === "true" : false
    } catch {
      return false
    }
  })
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isInsightLoading, setIsInsightLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("auth-user")
    if (!storedUser) {
      setIsLoading(false)
      return
    }

    let user: { id?: string }
    try {
      user = JSON.parse(storedUser)
    } catch {
      setIsLoading(false)
      return
    }
    const sid = user.id ?? ""
    setStudentId(sid)
    const alreadyRead = localStorage.getItem(`care-read-${sid}`) === "true"
    setCareMessageRead(alreadyRead)

    if (!sid) {
      setIsLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${sid}/progress`)
      .then(res => res.json())
      .then(json => {
        if (json.code === 200 && json.data) {
          const d = new Date()
          const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          const raw = Array.isArray(json.data.history) ? json.data.history : []
          const mapped: SurveyRecord[] = raw.map((h: {
            survey_date: string
            achievement_score: number
            adaptation_score: number
            relationship_score: number
          }) => ({
            date: h.survey_date,
            achievement: h.achievement_score,
            adaptability: h.adaptation_score,
            relationship: h.relationship_score,
          }))
          setSurveyHistory(mapped)
          setTodaySurveyCompleted(mapped.some(r => r.date === today))
          setEmotionState(json.data.emotion_state)
          setEmotionLabel(json.data.emotion_label)
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
        Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${sid}/care-message`)
            .then(res => res.json())
            .catch(() => null),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${sid}/ai-insight`)
            .then(res => res.json())
            .catch(() => null),
        ])
          .then(([careJson, insightJson]) => {
            if (careJson?.code === 200 && careJson.data?.has_message === true && careJson.data?.message) {
              setCareMessage(careJson.data.message)
            } else {
              setCareMessage(null)
            }

            const insight = insightJson?.code === 200 ? insightJson.data?.insight : ""
            if (typeof insight === "string" && insight.trim()) {
              setAiInsight(insight)
            } else {
              setAiInsight(null)
            }
          })
          .finally(() => {
            setIsInsightLoading(false)
          })
      })
  }, [])
  
  const {
    getMessagesForStudent,
    fetchMessagesForStudent,
    getUnreadCountForStudent,
    markAsRead,
    markAllAsReadForStudent,
  } = useMessages()
  const { 
    getMeetingsForStudent, 
    getPendingRequestsForStudent, 
    getConfirmedMeetingsForStudent,
    selectSlots: submitSelectedSlots,
    markStudentNotified,
  } = useMeetings()
  
  const messages = getMessagesForStudent(studentId)
  const unreadCount = getUnreadCountForStudent(studentId)
  const latestMessage = messages[0]
  
  const pendingMeetingRequests = getPendingRequestsForStudent(studentId)
  const confirmedMeetings = getConfirmedMeetingsForStudent(studentId)
  const allMeetings = getMeetingsForStudent(studentId)
  
  // Availability selection modal
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false)
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    if (!studentId) return
    fetchMessagesForStudent(studentId)
  }, [studentId, fetchMessagesForStudent])
  
  const currentMeeting = currentMeetingId ? allMeetings.find(m => m.id === currentMeetingId) : null
  const isEmergencyMeeting = (meeting: { mentorName: string; purpose: string }) =>
    meeting.mentorName === "AI 湲닿툒 ?붿껌" || meeting.purpose.startsWith("[湲닿툒]")
  
  const handleOpenNotifications = () => {
    setNotificationOpen(true)
  }
  
  const handleMarkAllRead = () => {
    markAllAsReadForStudent(studentId)
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

  // Fallback-only local insight (used when API message is absent)
  const getInsight = () => {
    if (adaptabilityTrend === 'down') {
      return "理쒓렐 ?곸쓳?꾧? 媛먯냼?섍퀬 ?덉뒿?덈떎. ?대젮???먯씠 ?덈떎硫?硫섑넗?먭쾶 ?곷떞???붿껌??蹂댁꽭??"
    }
    if (achievementTrend === 'down') {
      return "理쒓렐 ?깆랬?꾧? ??븘吏怨??덉뼱?? ?숈뒿 紐⑺몴瑜??ㅼ떆 ?먭???蹂대뒗 嫄??대뼥源뚯슂?"
    }
    if (relationshipTrend === 'up') {
      return "?멸컙愿怨꾧? 醫뗭븘吏怨??덈꽕?? 醫뗭? ?먮쫫???좎???蹂댁꽭??"
    }
    if (achievementTrend === 'up' && adaptabilityTrend === 'up') {
      return "?꾨컲?곸쑝濡?醫뗭? ?곹깭瑜??좎??섍퀬 ?덉뼱?? ?섑븯怨??덉뒿?덈떎!"
    }
    return "袁몄???湲곕줉?섍퀬 ?덉뼱?? ?먭린 ?댄빐??泥リ구?뚯엯?덈떎."
  }
  const displayedInsight = aiInsight ?? getInsight()

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-6 py-8">
      {/* Header with Notification Bell */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">나의 대시보드</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="text-base leading-none" aria-hidden>{emotionLabel}</span>
              <span>{emotionState}</span>
            </p>
          )}
        </div>
        
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
              {careMessage && !careMessageRead && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-risk-high text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">?뚮┝</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={handleMarkAllRead}
                >
                  紐⑤몢 ?쎌쓬 泥섎━
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {careMessage && (
                <div className="p-3 border-b">
                  <div
                    className={cn(
                      "p-3 rounded-lg border transition-colors cursor-pointer",
                      careMessageRead ? "bg-muted/30" : "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => {
                      setCareMessageRead(true)
                      try {
                        const raw = localStorage.getItem("auth-user")
                        const user = raw ? JSON.parse(raw) : null
                        if (user?.id) localStorage.setItem(`care-read-${user.id}`, "true")
                      } catch {}
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">AI 耳??硫붿떆吏</p>
                        <p className="text-xs text-muted-foreground">{careMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                        硫섑넗媛 誘명똿???붿껌?덉뒿?덈떎
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        紐⑹쟻: {meeting.purpose}
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
                        誘명똿 ?쇱젙???뺤젙?섏뿀?듬땲??
                      </p>
                      <p className="text-xs text-foreground mt-0.5">
                        {meeting.confirmedSlot?.date} {meeting.confirmedSlot?.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        紐⑹쟻: {meeting.purpose}
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
                        {msg.mentorName === "AI" ? "AI가 메시지를 보냈습니다" : `${msg.mentorName}가 메시지를 보냈습니다`}
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
              
              {!careMessage && messages.length === 0 && pendingMeetingRequests.length === 0 && confirmedMeetings.filter(m => !m.studentNotified).length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  ?꾩쭅 ?뚮┝???놁뒿?덈떎
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Recent Mentor Message Card */}
      {latestMessage && (
        <Card className={cn(
          "border overflow-hidden transition-all",
          !latestMessage.isRead
            ? "border-primary/30 bg-primary/[0.03]"
            : "border-border/60 bg-card"
        )}>
          <CardContent className="py-4 px-5">
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                !latestMessage.isRead ? "bg-primary/15" : "bg-muted"
              )}>
                <Heart className={cn(
                  "w-4 h-4",
                  !latestMessage.isRead ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-foreground">{latestMessage.mentorName === "AI" ? "AI 메시지" : `${latestMessage.mentorName} 메시지`}</span>
                  {!latestMessage.isRead && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-md tracking-wide">NEW</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatMessageTime(latestMessage.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {latestMessage.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access - Survey Button */}
      <Card className={cn(
        "border transition-all",
        todaySurveyCompleted
          ? "border-status-stable/30 bg-status-stable/[0.03]"
          : "border-primary/30 bg-primary/[0.03]"
      )}>
        <CardContent className="py-5 px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                todaySurveyCompleted ? "bg-status-stable/15" : "bg-primary/12"
              )}>
                <ClipboardList className={cn(
                  "w-5 h-5",
                  todaySurveyCompleted ? "text-status-stable" : "text-primary"
                )} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">오늘의 설문</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todaySurveyCompleted ? "오늘 설문을 완료했습니다" : "아직 오늘 설문을 작성하지 않았습니다"}
                </p>
              </div>
            </div>
            {todaySurveyCompleted ? (
              <Button size="sm" disabled variant="outline" className="gap-1.5 text-xs h-8 text-status-stable border-status-stable/30">
                <Check className="w-3.5 h-3.5" />
                완료됨
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5 text-xs h-8">
                <Link href="/student/survey">
                  <ClipboardList className="w-3.5 h-3.5" />
                  ?ㅻЦ ?섎윭媛湲?
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ??? Summary Section ??? */}
      <Card className="border border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">理쒓렐 ?됯퇏</CardTitle>
              <CardDescription className="text-xs mt-0.5">理쒓렐 7?쇨컙???됯퇏 ?먯닔</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="space-y-2.5">
                  <div className="h-3.5 bg-muted rounded animate-pulse w-16" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-24" />
                  <div className="h-3 bg-muted rounded animate-pulse w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 divide-x divide-border/50">
              {/* Achievement */}
              <div className="space-y-3 pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">성취도</span>
                  <TrendIcon trend={achievementTrend} />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-semibold text-foreground tabular-nums">{averages.achievement.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground"> / 5</span>
                </div>
                <MetricDots value={averages.achievement} />
              </div>

              {/* Adaptability */}
              <div className="space-y-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">적응도</span>
                  <TrendIcon trend={adaptabilityTrend} />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-semibold text-foreground tabular-nums">{averages.adaptability.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground"> / 5</span>
                </div>
                <MetricDots value={averages.adaptability} />
              </div>

              {/* Relationship */}
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">인간관계</span>
                  <TrendIcon trend={relationshipTrend} />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-semibold text-foreground tabular-nums">{averages.relationship.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground"> / 5</span>
                </div>
                <MetricDots value={averages.relationship} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Visualization */}
      <Card className="border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">理쒓렐 7??異붿씠</CardTitle>
          <CardDescription className="text-xs">지난 일주일간 변화 그래프</CardDescription>
        </CardHeader>
        <CardContent className="pl-8 pt-2">
          {isLoading ? (
            <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
          ) : surveyHistory.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">?꾩쭅 ?ㅻЦ ?곗씠?곌? ?놁뒿?덈떎</p>
            </div>
          ) : (
            <TrendChart data={surveyHistory} />
          )}
        </CardContent>
      </Card>

      {/* Survey History Table */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">?ㅻЦ 湲곕줉</CardTitle>
          <CardDescription className="text-xs">怨쇨굅 ?ㅻЦ ?묐떟 ?댁뿭</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
            </div>
          ) : surveyHistory.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">?꾩쭅 ?ㅻЦ ?곗씠?곌? ?놁뒿?덈떎</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">?좎쭨</th>
                      <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">성취도</th>
                      <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">적응도</th>
                      <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">인간관계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHistory.map((record, index) => (
                      <tr key={record.date} className={cn(
                        "border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20",
                        index === 0 && "bg-primary/[0.03]"
                      )}>
                        <td className="py-2.5 px-3 text-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{formatFullDate(record.date)}</span>
                            {index === 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded">?ㅻ뒛</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-sm font-semibold text-foreground">{record.achievement}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                              {getScoreLabel(record.achievement)}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-sm font-semibold text-foreground">{record.adaptability}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                              {getScoreLabel(record.adaptability)}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-sm font-semibold text-foreground">{record.relationship}</span>
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                              {getScoreLabel(record.relationship)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {surveyHistory.length > 5 && (
                <div className="mt-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    {showAllHistory ? "?묎린" : `??蹂닿린 (${surveyHistory.length - 5}媛?`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Insight Card */}
      <Card className="border border-primary/20 bg-primary/[0.02]">
        <CardContent className="py-4 px-5">
          <div className="flex gap-3.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
              <span className="text-base leading-none">?뮕</span>
            </div>
            <div className="space-y-1 pt-0.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI ?몄궗?댄듃</p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {isInsightLoading ? "遺꾩꽍 以?.." : displayedInsight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Meeting Card */}
      {confirmedMeetings.length > 0 && (
        <Card className="border border-status-stable/30 bg-status-stable/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-status-stable" />
              ?덉젙??誘명똿
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {confirmedMeetings.map(meeting => (
              <div key={meeting.id} className="flex items-center justify-between p-3 bg-card/60 rounded-lg border border-border/40">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {meeting.confirmedSlot?.date} {meeting.confirmedSlot?.time}
                  </p>
                  <p className="text-xs text-muted-foreground">紐⑹쟻: {meeting.purpose}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-status-stable" />
                  <span className="text-xs text-status-stable font-medium">?뺤젙</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Meeting Request Card */}
      {pendingMeetingRequests.length > 0 && (
        <Card className="border border-primary/30 bg-primary/[0.03] animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              誘명똿 ?붿껌
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-md">NEW</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {pendingMeetingRequests.map(meeting => (
              <div
                key={meeting.id}
                className={cn(
                  "p-3.5 rounded-lg border space-y-2.5",
                  isEmergencyMeeting(meeting)
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-card/60 border-border/40"
                )}
              >
                <div className="space-y-0.5">
                  {isEmergencyMeeting(meeting) ? (
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      ?좑툘 湲닿툒 誘명똿 ?붿껌
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {meeting.mentorName} 硫섑넗媛 誘명똿???붿껌?덉뒿?덈떎
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">紐⑹쟻: {meeting.purpose}</p>
                  {meeting.message && (
                    <p className="text-xs text-foreground/80 mt-2 p-2.5 bg-muted/30 rounded-lg border border-border/30">
                      {meeting.message}
                    </p>
                  )}
                </div>
                {meeting.proposedSlots.length > 0 ? (
                  <Button
                    size="sm"
                    className="w-full h-8 gap-1.5 text-xs"
                    onClick={() => handleOpenAvailabilityModal(meeting.id)}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    媛?ν븳 ?쒓컙 ?좏깮?섍린
                  </Button>
                ) : isEmergencyMeeting(meeting) ? (
                  <p className="text-xs text-red-700 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    硫섑넗媛 怨?吏곸젒 ?곕씫?쒕┫ ?덉젙?낅땲??
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    ?쒖븞???쒓컙???놁뒿?덈떎.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Availability Selection Modal */}
      <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>誘명똿 ?쒓컙 ?좏깮</DialogTitle>
            <DialogDescription>
              {currentMeeting && (
                <>
                  {isEmergencyMeeting(currentMeeting) ? (
                    <span className="font-medium text-red-700">?좑툘 湲닿툒 誘명똿 ?붿껌</span>
                  ) : (
                    <span className="font-medium text-foreground">{currentMeeting.mentorName}</span>
                  )}{" "}
                  {isEmergencyMeeting(currentMeeting)
                    ? "嫄댁엯?덈떎. ?꾨옒 ?덈궡瑜??뺤씤?댁＜?몄슂."
                    : "硫섑넗媛 ?쒖븞???쒓컙 以?媛?ν븳 ?쒓컙???좏깮?댁＜?몄슂."}
                  <br />
                  <span className="text-xs">紐⑹쟻: {currentMeeting.purpose}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentMeeting && currentMeeting.proposedSlots.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">?щ윭 媛??좏깮 媛?ν빀?덈떎</p>
                {currentMeeting.proposedSlots
                  .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                  .map((slot, idx) => {
                    const isSelected = selectedSlots.some(s => s.date === slot.date && s.time === slot.time)
                    const slotDate = new Date(slot.date)
                    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
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
              <p className={cn(
                "text-center py-4",
                currentMeeting && isEmergencyMeeting(currentMeeting)
                  ? "text-red-700"
                  : "text-muted-foreground"
              )}>
                {currentMeeting && isEmergencyMeeting(currentMeeting)
                  ? "硫섑넗媛 怨?吏곸젒 ?곕씫?쒕┫ ?덉젙?낅땲??"
                  : "?쒖븞???쒓컙???놁뒿?덈떎."}
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedSlots.length}媛??좏깮??
            </div>
            <Button variant="outline" onClick={() => setAvailabilityModalOpen(false)}>
              痍⑥냼
            </Button>
            <Button onClick={handleSubmitAvailability} disabled={selectedSlots.length === 0}>
              ?꾨즺
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

