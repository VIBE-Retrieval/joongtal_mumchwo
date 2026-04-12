"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, AlertTriangle, Bell, CheckCircle, User, X, ChevronRight } from "lucide-react"
import { useStudents, type Student } from "@/contexts/student-context"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

function CareNeededCard({ student, onComplete }: { student: Student; onComplete: () => void }) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleComplete = () => {
    setIsCompleting(true)
    
    setTimeout(() => {
      onComplete()
      setIsCompleted(true)
    }, 300)
  }

  if (isCompleted) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-risk-low/10 border border-risk-low/30 animate-in fade-in duration-300">
        <div className="w-10 h-10 rounded-full bg-risk-low/20 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-risk-low" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{student.name}</p>
          <p className="text-sm text-risk-low">케어 완료</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 transition-all duration-300",
      isCompleting && "opacity-50 scale-95"
    )}>
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{student.name}</p>
        <p className="text-sm text-muted-foreground">{student.courseName}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-medium",
          student.riskLevel === "high" 
            ? "bg-risk-high/15 text-risk-high"
            : "bg-risk-medium/15 text-risk-medium"
        )}>
          위험도 {student.riskScore}
        </div>
        <Button 
          size="sm" 
          variant="outline"
          className="gap-1.5 text-risk-low border-risk-low/30 hover:bg-risk-low/10 hover:text-risk-low"
          onClick={handleComplete}
          disabled={isCompleting}
        >
          <CheckCircle className="w-4 h-4" />
          케어 완료
        </Button>
      </div>
    </div>
  )
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      markAllAsRead()
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "방금 전"
    if (diffMins < 60) return `${diffMins}분 전`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${Math.floor(diffHours / 24)}일 전`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        className={cn(
          "relative p-2 rounded-lg transition-all",
          isOpen ? "bg-muted" : "hover:bg-muted"
        )}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-risk-high text-white text-xs font-bold flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">알림</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  모두 읽음
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors cursor-pointer hover:bg-muted/50",
                      !notification.isRead && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        notification.type === "new-high-risk" ? "bg-risk-high/15" : "bg-risk-medium/15"
                      )}>
                        <AlertTriangle className={cn(
                          "w-4 h-4",
                          notification.type === "new-high-risk" ? "text-risk-high" : "text-risk-medium"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">알림이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertBanner() {
  const { newRiskCount } = useStudents()
  const { isBannerDismissed, dismissBanner } = useNotifications()
  const router = useRouter()

  if (isBannerDismissed || newRiskCount === 0) return null

  return (
    <div className="bg-risk-high/10 border-b border-risk-high/20 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-risk-high/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-risk-high" />
            </div>
            <p className="text-sm font-medium text-foreground">
              오늘 새로 위험군에 진입한 학생이 <span className="text-risk-high font-bold">{newRiskCount}명</span> 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5 text-risk-high border-risk-high/30 hover:bg-risk-high/10 hover:text-risk-high"
              onClick={() => router.push("/mentor/students?filter=new-risk")}
            >
              바로 보기
              <ChevronRight className="w-4 h-4" />
            </Button>
            <button 
              onClick={dismissBanner}
              className="p-1.5 rounded-lg hover:bg-risk-high/15 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MentorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCareList, setShowCareList] = useState(false)
  
  const { 
    totalStudents, 
    careNeededCount, 
    newRiskCount,
    careNeededStudents,
    completeCare
  } = useStudents()

  useEffect(() => {
    const storedUser = localStorage.getItem("auth-user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    
    try {
      const parsed = JSON.parse(storedUser)
      if (parsed.role !== "mentor") {
        router.push(`/${parsed.role}`)
        return
      }
      setUser(parsed)
    } catch {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("auth-user")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Alert Banner */}
      <AlertBanner />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/mentor" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">멘토 대시보드</h1>
                <p className="text-xs text-muted-foreground">학생 모니터링 및 개입</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Students Card - Clickable */}
            <Link href="/mentor/students">
              <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group h-full">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-4xl font-bold text-foreground mb-2">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">전체 학생</p>
                </CardContent>
              </Card>
            </Link>

            {/* Needs Care Card - Clickable to expand list */}
            <Card 
              className={cn(
                "border-2 hover:shadow-lg transition-all cursor-pointer group h-full",
                showCareList ? "border-risk-medium/50 shadow-lg" : "hover:border-risk-medium/50"
              )}
              onClick={() => setShowCareList(!showCareList)}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-risk-medium/10 flex items-center justify-center mb-4 transition-colors",
                  showCareList ? "bg-risk-medium/20" : "group-hover:bg-risk-medium/20"
                )}>
                  <AlertTriangle className="w-7 h-7 text-risk-medium" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">{careNeededCount}</p>
                <p className="text-sm text-muted-foreground">케어 필요 학생</p>
              </CardContent>
            </Card>

            {/* New Risk Today Card - Clickable with NEW badge */}
            <Link href="/mentor/students?filter=new-risk">
              <Card className={cn(
                "border-2 hover:shadow-lg transition-all cursor-pointer group h-full relative overflow-hidden",
                newRiskCount > 0 ? "border-risk-high/50 shadow-md" : "hover:border-risk-high/50"
              )}>
                {/* NEW Badge */}
                {newRiskCount > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-high opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-risk-high" />
                    </span>
                    <span className="text-xs font-bold text-risk-high uppercase tracking-wider">NEW</span>
                  </div>
                )}
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                    newRiskCount > 0 
                      ? "bg-risk-high/15 group-hover:bg-risk-high/25" 
                      : "bg-risk-high/10 group-hover:bg-risk-high/20"
                  )}>
                    <Bell className={cn(
                      "w-7 h-7 text-risk-high",
                      newRiskCount > 0 && "animate-pulse"
                    )} />
                  </div>
                  <p className={cn(
                    "text-4xl font-bold mb-2 transition-colors",
                    newRiskCount > 0 ? "text-risk-high" : "text-foreground"
                  )}>
                    {newRiskCount}
                  </p>
                  <p className="text-sm text-muted-foreground">오늘 새로운 위험도 학생</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Care Needed Students List */}
          {showCareList && (
            <Card className="border-2 border-risk-medium/30 animate-in slide-in-from-top-4 duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-risk-medium/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-risk-medium" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">케어 필요 학생</h2>
                      <p className="text-sm text-muted-foreground">아래 학생들에게 상담 또는 지원이 필요합니다</p>
                    </div>
                  </div>
                  <Link href="/mentor/students?filter=care">
                    <Button variant="outline" size="sm">
                      전체 보기
                    </Button>
                  </Link>
                </div>

                {careNeededStudents.length > 0 ? (
                  <div className="space-y-3">
                    {careNeededStudents.map(student => (
                      <CareNeededCard 
                        key={student.id} 
                        student={student}
                        onComplete={() => completeCare(student.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-risk-low/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-risk-low" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">모든 케어가 완료되었습니다</p>
                    <p className="text-sm text-muted-foreground">현재 추가 지원이 필요한 학생이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
