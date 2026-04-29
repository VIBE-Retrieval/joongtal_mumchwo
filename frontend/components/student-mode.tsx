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

const TREND_COLORS = {
  achievement:  '#D97757', // 오렌지 — 브랜드 메인
  adaptability: '#5AAEE0', // 블루 — 명확한 대비
  relationship: '#6DC98A', // 그린 — 세 번째 확실한 구분
} as const

function TrendChart({ data }: { data: SurveyRecord[] }) {
  // `data` is kept newest-first for cards/tables. Chart should render left->right old->new.
  const recent7 = data.slice(0, 7).reverse()
  const xDenom = Math.max(1, recent7.length - 1)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Y축: 실제 데이터 범위 기반, 패딩 축소 → 변화가 확실히 보이게
  const allVals = recent7.flatMap(d => [d.achievement, d.adaptability, d.relationship])
  const dataMin = Math.min(...allVals)
  const dataMax = Math.max(...allVals)
  // 범위가 너무 좁으면(0.5 미만) 최소 1.0 보장 → 그래프가 절대 눕지 않도록
  const spread = Math.max(1.0, dataMax - dataMin)
  const pad = spread * 0.18
  const yMin = Math.max(1, dataMin - pad)
  const yMax = Math.min(5, dataMax + pad)

  // SVG 상하 여백을 6~94로 넉넉히 써서 수직 해상도 극대화
  const getY = (value: number) => 94 - ((value - yMin) / (yMax - yMin)) * 88

  // 큐빅 베지어 스무딩
  const createSmoothPath = (key: keyof typeof TREND_COLORS) => {
    if (recent7.length < 2) return `M 0 ${getY(recent7[0][key])}`
    const pts = recent7.map((d, i) => ({ x: (i / xDenom) * 100, y: getY(d[key]) }))
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const t = 0.38
      const cpx1 = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t
      const cpy1 = pts[i - 1].y
      const cpx2 = pts[i].x - (pts[i].x - pts[i - 1].x) * t
      const cpy2 = pts[i].y
      d += ` C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${pts[i].x} ${pts[i].y}`
    }
    return d
  }

  const keys = ['achievement', 'adaptability', 'relationship'] as const

  return (
    <div className="space-y-3">
      {/* SVG 그래프 */}
      <div className="h-64 w-full relative">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* 포인트 glow 필터 */}
            <filter id="tc-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="tc-glow-hover" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* 반짝임 애니메이션 */}
            <style>{`
              @keyframes tc-sparkle {
                0%,100%{ opacity:1; }
                50%{ opacity:0.55; }
              }
              .tc-dot-0{ animation: tc-sparkle 2.4s ease-in-out infinite; }
              .tc-dot-1{ animation: tc-sparkle 2.4s ease-in-out infinite 0.5s; }
              .tc-dot-2{ animation: tc-sparkle 2.4s ease-in-out infinite 1.0s; }
            `}</style>
          </defs>

          {/* 그리드 — 점선 (상/중/하 3줄) */}
          {[yMax, (yMin + yMax) / 2, yMin].map((v, i) => (
            <line key={i}
              x1="0" y1={getY(v)} x2="100" y2={getY(v)}
              stroke="currentColor" strokeOpacity="0.08"
              strokeWidth="0.35" strokeDasharray="2.5 2"
            />
          ))}

          {/* hover 수직선 */}
          {hoveredIdx !== null && (
            <line
              x1={(hoveredIdx / xDenom) * 100} y1="8"
              x2={(hoveredIdx / xDenom) * 100} y2="92"
              stroke="#D97757" strokeOpacity="0.25"
              strokeWidth="0.5" strokeDasharray="2 1.5"
            />
          )}

          {/* 라인 */}
          {keys.map((key, ki) => (
            <path key={key}
              d={createSmoothPath(key)}
              fill="none"
              stroke={TREND_COLORS[key]}
              strokeWidth={hoveredIdx !== null ? '1.6' : '1.9'}
              strokeLinecap="round" strokeLinejoin="round"
              opacity={0.92}
            />
          ))}

          {/* 데이터 포인트 */}
          {recent7.map((d, i) => {
            const x = (i / xDenom) * 100
            const isHov = hoveredIdx === i
            return (
              <g key={i}>
                {keys.map((key, ki) => {
                  const cy = getY(d[key])
                  const col = TREND_COLORS[key]
                  return (
                    <g key={key}>
                      {/* 외곽 halo */}
                      <circle cx={x} cy={cy} r={isHov ? 5 : 3.8}
                        fill={col} opacity={isHov ? 0.22 : 0.13}
                      />
                      {/* 핵심 dot — 반짝임 */}
                      <circle cx={x} cy={cy} r={isHov ? 2.8 : 2.0}
                        fill={col}
                        filter={isHov ? 'url(#tc-glow-hover)' : 'url(#tc-glow)'}
                        className={`tc-dot-${ki}`}
                      />
                    </g>
                  )
                })}
                {/* hover 히트영역 */}
                <rect
                  x={x - 6} y="5" width="12" height="90"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'crosshair' }}
                />
              </g>
            )
          })}
        </svg>

        {/* Y축 레이블 */}
        <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] text-muted-foreground -ml-5 py-2 pointer-events-none">
          <span>{yMax.toFixed(1)}</span>
          <span>{((yMin + yMax) / 2).toFixed(1)}</span>
          <span>{yMin.toFixed(1)}</span>
        </div>

        {/* hover 툴팁 */}
        {hoveredIdx !== null && (() => {
          const d = recent7[hoveredIdx]
          const x = (hoveredIdx / xDenom) * 100
          const isRight = hoveredIdx >= recent7.length * 0.7
          return (
            <div
              className="pointer-events-none absolute z-20 top-1 rounded-lg border border-border/60 bg-background/95 px-2.5 py-2 text-xs shadow-lg backdrop-blur-sm"
              style={{ left: isRight ? 'auto' : `calc(${x}% + 8px)`, right: isRight ? `calc(${100 - x}% + 8px)` : 'auto' }}
            >
              <div className="font-semibold text-foreground mb-1.5">{formatDate(d.date)}</div>
              <div className="space-y-1">
                {keys.map(key => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: TREND_COLORS[key] }} />
                    <span className="text-muted-foreground">
                      {key === 'achievement' ? '성취도' : key === 'adaptability' ? '적응도' : '인간관계'}
                    </span>
                    <span className="ml-auto font-medium tabular-nums" style={{ color: TREND_COLORS[key] }}>
                      {d[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* X축 레이블 */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {recent7.map((d, i) => (
          <span key={i}>{formatDate(d.date)}</span>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-5 text-xs">
        {keys.map(key => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded-full" style={{ background: TREND_COLORS[key] }} />
            <span className="text-muted-foreground">
              {key === 'achievement' ? '성취도' : key === 'adaptability' ? '적응도' : '인간관계'}
            </span>
          </div>
        ))}
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
  const [emotionState, setEmotionState] = useState("보통")
  const [emotionLabel, setEmotionLabel] = useState("😐")
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
          const sorted = [...mapped].sort((a, b) => b.date.localeCompare(a.date))
          setSurveyHistory(sorted)
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
    meeting.mentorName === "AI 긴급 요청" || meeting.purpose.startsWith("[긴급]")
  
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
      return "적응도가 낮아지고 있습니다. 힘든 시간이 있더라도 멘토에게 언제든 연락해 주세요!"
    }
    if (achievementTrend === 'down') {
      return "성취도가 떨어지고 있어요. 새로운 목표를 다시 세워보는 건 어떨까요?"
    }
    if (relationshipTrend === 'up') {
      return "인간관계가 좋아지고 있네요. 그 에너지를 잘 활용해 주세요!"
    }
    if (achievementTrend === 'up' && adaptabilityTrend === 'up') {
      return "전반적으로 좋은 상태를 유지하고 있어요. 잘하고 있습니다!"
    }
    return "꾸준히 기록하고 있어요. 자기 이해의 첫걸음입니다."
  }
  const displayedInsight = aiInsight ?? getInsight()

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-6 py-8">
      {/* Inline guide banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5 flex-shrink-0">💡</span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">사용 안내</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            매일 설문에 참여하면 AI가 학습 상태를 분석합니다. 7일치 데이터가 쌓이면 위험도 점수와 AI 인사이트가 자동으로 생성되며, 멘토가 필요 시 메시지나 미팅 요청을 보낼 수 있습니다.
          </p>
        </div>
      </div>

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
                        <p className="text-xs font-medium text-foreground mb-1">AI 케어 메시지</p>
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
                  새로운 알림이 없습니다
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
                  설문 참여하기
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
              <CardTitle className="text-sm font-semibold text-foreground">학습 현황</CardTitle>
              <CardDescription className="text-xs mt-0.5">최근 7일간 설문 평균 — 각 항목은 1~5점 척도입니다. 화살표는 이전 3일 대비 최근 3일의 변화 방향을 나타냅니다.</CardDescription>
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
      <Card className="border border-[#D97757]/25 shadow-sm shadow-[#D97757]/8">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">주간 변화 추이</CardTitle>
          <CardDescription className="text-xs">지난 7일간 성취도 · 적응도 · 인간관계 점수의 흐름입니다. 점수가 지속적으로 하락하면 AI가 위험 신호로 감지합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pl-8 pt-2">
          {isLoading ? (
            <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
          ) : surveyHistory.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">아직 설문 데이터가 없습니다</p>
            </div>
          ) : (
            <TrendChart data={surveyHistory} />
          )}
        </CardContent>
      </Card>

      {/* Survey History Table */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">설문 기록</CardTitle>
          <CardDescription className="text-xs">날짜별 설문 응답 내역입니다. 매일 꾸준히 기록할수록 AI 분석 정확도가 높아집니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
            </div>
          ) : surveyHistory.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">아직 설문 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">날짜</th>
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
                            {record.date === new Date().toISOString().slice(0, 10) && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded">오늘</span>
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
                    {showAllHistory ? "접기" : `더 보기 (${surveyHistory.length - 5}개)`}
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
              <span className="text-base leading-none">💡</span>
            </div>
            <div className="space-y-1 pt-0.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI 인사이트</p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {isInsightLoading ? "불러오는 중..." : displayedInsight}
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
              확정된 미팅
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {confirmedMeetings.map(meeting => (
              <div key={meeting.id} className="flex items-center justify-between p-3 bg-card/60 rounded-lg border border-border/40">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {meeting.confirmedSlot?.date} {meeting.confirmedSlot?.time}
                  </p>
                  <p className="text-xs text-muted-foreground">목적: {meeting.purpose}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-status-stable" />
                  <span className="text-xs text-status-stable font-medium">확정</span>
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
              미팅 요청
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
                      ⚠️ 긴급 미팅 요청
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {meeting.mentorName} 멘토가 미팅을 요청했습니다
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">목적: {meeting.purpose}</p>
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
                    가능한 시간 선택하기
                  </Button>
                ) : isEmergencyMeeting(meeting) ? (
                  <p className="text-xs text-red-700 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    멘토가 곧 직접 연락드릴 예정입니다.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    제안된 시간이 없습니다.
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
            <DialogTitle>미팅 시간 선택</DialogTitle>
            <DialogDescription>
              {currentMeeting && (
                <>
                  {isEmergencyMeeting(currentMeeting) ? (
                    <span className="font-medium text-red-700">⚠️ 긴급 미팅 요청</span>
                  ) : (
                    <span className="font-medium text-foreground">{currentMeeting.mentorName}</span>
                  )}{" "}
                  {isEmergencyMeeting(currentMeeting)
                    ? "알림이 왔습니다. 아래 내용을 확인해주세요."
                    : "멘토가 제안한 시간 중 가능한 시간을 선택해주세요."}
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
                  ? "멘토가 곧 직접 연락드릴 예정입니다."
                  : "제안된 시간이 없습니다."}
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {`${selectedSlots.length}개 선택됨`}
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

