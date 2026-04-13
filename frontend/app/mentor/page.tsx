"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Users, AlertTriangle, Bell, CheckCircle, User, X, ChevronRight, UserPlus, TrendingUp } from "lucide-react"
import { useStudents, type Student } from "@/contexts/student-context"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

function getInitials(name: string) {
  return name.length > 0 ? name.charAt(0) : "?"
}

function CareNeededCard({
  student,
  onComplete,
}: {
  student: Student
  onComplete: (feedback: { isFalseAlarm: boolean; recoveryDays: number | null }) => void
}) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [resultType, setResultType] = useState<"false_alarm" | "recovered" | "observe">("observe")
  const [recoveryDaysInput, setRecoveryDaysInput] = useState("")

  const parsedRecoveryDays = Number.parseInt(recoveryDaysInput, 10)
  const isRecoveryInputValid = Number.isFinite(parsedRecoveryDays) && parsedRecoveryDays >= 1 && parsedRecoveryDays <= 30

  const handleSubmitFeedback = () => {
    if (isCompleting) return
    const recoveryDays =
      resultType === "recovered" && Number.isFinite(parsedRecoveryDays)
        ? Math.min(30, Math.max(1, parsedRecoveryDays))
        : null

    setIsCompleting(true)
    setIsDialogOpen(false)
    setTimeout(() => {
      onComplete({
        isFalseAlarm: resultType === "false_alarm",
        recoveryDays,
      })
      setIsCompleted(true)
      setIsCompleting(false)
    }, 300)
  }

  if (isCompleted) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-risk-low/8 border border-risk-low/20 animate-in fade-in duration-300">
        <div className="w-8 h-8 rounded-full bg-risk-low/15 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-risk-low" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{student.name}</p>
          <p className="text-xs text-risk-low">케어 완료</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 transition-all duration-200 hover:border-border hover:shadow-sm",
      isCompleting && "opacity-50 scale-[0.98]"
    )}>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
        <p className="text-xs text-muted-foreground truncate">{student.courseName}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn(
          "px-2 py-0.5 rounded-md text-xs font-medium",
          student.riskLevel === "high"
            ? "bg-risk-high/12 text-risk-high"
            : "bg-risk-medium/12 text-risk-medium"
        )}>
          {student.riskScore}점
        </span>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!isCompleting) setIsDialogOpen(open)
          }}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 text-risk-low border-risk-low/30 hover:bg-risk-low/8 hover:text-risk-low hover:border-risk-low/50"
            onClick={() => setIsDialogOpen(true)}
            disabled={isCompleting}
          >
            <CheckCircle className="w-3 h-3" />
            완료
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>케어 결과 기록</DialogTitle>
              <DialogDescription>개입 결과를 선택하면 케어 완료로 처리됩니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Label className="text-sm font-medium">이 개입이 실제로 필요했나요?</Label>
              <RadioGroup value={resultType} onValueChange={(v) => setResultType(v as "false_alarm" | "recovered" | "observe")}>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <RadioGroupItem value="false_alarm" id={`false-alarm-${student.id}`} className="mt-0.5" />
                  <Label htmlFor={`false-alarm-${student.id}`} className="font-normal">오탐이었음 - 이 학생의 자연스러운 패턴</Label>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <RadioGroupItem value="recovered" id={`recovered-${student.id}`} className="mt-0.5" />
                  <Label htmlFor={`recovered-${student.id}`} className="font-normal">개입 후 회복됨</Label>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <RadioGroupItem value="observe" id={`observe-${student.id}`} className="mt-0.5" />
                  <Label htmlFor={`observe-${student.id}`} className="font-normal">지속 관찰 필요 (개선 없음)</Label>
                </div>
              </RadioGroup>
              {resultType === "recovered" && (
                <div className="space-y-2">
                  <Label htmlFor={`recovery-days-${student.id}`}>회복까지 며칠 걸렸나요?</Label>
                  <Input
                    id={`recovery-days-${student.id}`}
                    type="number"
                    min={1}
                    max={30}
                    value={recoveryDaysInput}
                    onChange={(e) => setRecoveryDaysInput(e.target.value)}
                    placeholder="1~30"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCompleting}>
                취소
              </Button>
              <Button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={isCompleting || (resultType === "recovered" && !isRecoveryInputValid)}
              >
                {isCompleting ? "처리 중..." : "기록 완료"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

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
          "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
          isOpen ? "bg-muted" : "hover:bg-muted"
        )}
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-risk-high text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">알림</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {unreadCount > 0 ? (
              <div className="divide-y divide-border">
                {notifications.filter(n => !n.isRead).map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/4"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        notification.type === "new-high-risk" ? "bg-risk-high/12" : "bg-risk-medium/12"
                      )}>
                        <AlertTriangle className={cn(
                          "w-3.5 h-3.5",
                          notification.type === "new-high-risk" ? "text-risk-high" : "text-risk-medium"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{notification.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Bell className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">알림이 없습니다</p>
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
    <div className="bg-risk-high/8 border-b border-risk-high/15 animate-in slide-in-from-top duration-300">
      <div className="max-w-6xl mx-auto px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-risk-high/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-risk-high" />
            </div>
            <p className="text-sm text-foreground">
              오늘 새로 위험군에 진입한 학생이{" "}
              <span className="text-risk-high font-semibold">{newRiskCount}명</span> 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs text-risk-high hover:bg-risk-high/10 hover:text-risk-high gap-1"
              onClick={() => router.push("/mentor/students?filter=new-risk")}
            >
              바로 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <button
              onClick={dismissBanner}
              className="w-6 h-6 rounded-md hover:bg-risk-high/15 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
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
    completeCare,
    refetchStudents,
  } = useStudents()

  useEffect(() => {
    refetchStudents()
  }, [refetchStudents])

  useEffect(() => {
    const storedUser = localStorage.getItem("auth-user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    try {
      const parsed = JSON.parse(storedUser)
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Alert Banner */}
      <AlertBanner />

      {/* Header */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/mentor" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">멘토 대시보드</span>
              <span className="hidden sm:block text-border">·</span>
              <span className="hidden sm:block text-xs text-muted-foreground">학생 모니터링 및 개입</span>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/mentor/add-applicant">
              <Button size="sm" className="h-8 px-3 gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                신규 지원자
              </Button>
            </Link>
            <div className="w-px h-4 bg-border mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{getInitials(user.name)}</span>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Page title */}
          <div>
            <h1 className="text-lg font-semibold text-foreground">개요</h1>
            <p className="text-sm text-muted-foreground mt-0.5">학생 현황을 한눈에 확인하세요</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Students */}
            <Link href="/mentor/students">
              <Card className="group border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground mt-1">전체 학생</p>
                </CardContent>
              </Card>
            </Link>

            {/* Care Needed */}
            <Card
              className={cn(
                "border cursor-pointer transition-all duration-200 h-full",
                showCareList
                  ? "border-risk-medium/40 shadow-md bg-risk-medium/[0.02]"
                  : "border-border/60 hover:border-risk-medium/40 hover:shadow-md"
              )}
              onClick={() => setShowCareList(!showCareList)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    showCareList ? "bg-risk-medium/15" : "bg-risk-medium/10 group-hover:bg-risk-medium/15"
                  )}>
                    <AlertTriangle className="w-5 h-5 text-risk-medium" />
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-200",
                    showCareList ? "rotate-90 text-risk-medium" : "text-muted-foreground/50"
                  )} />
                </div>
                <p className={cn(
                  "text-3xl font-bold tabular-nums transition-colors",
                  careNeededCount > 0 ? "text-risk-medium" : "text-foreground"
                )}>
                  {careNeededCount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">케어 필요 학생</p>
              </CardContent>
            </Card>

            {/* New Risk Today */}
            <Link href="/mentor/students?filter=new-risk">
              <Card className={cn(
                "border cursor-pointer transition-all duration-200 h-full relative overflow-hidden group",
                newRiskCount > 0
                  ? "border-risk-high/40 shadow-sm hover:shadow-md"
                  : "border-border/60 hover:border-risk-high/30 hover:shadow-md"
              )}>
                {newRiskCount > 0 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-high opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-high" />
                    </span>
                    <span className="text-[10px] font-bold text-risk-high tracking-wide">NEW</span>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      newRiskCount > 0
                        ? "bg-risk-high/12 group-hover:bg-risk-high/20"
                        : "bg-risk-high/8 group-hover:bg-risk-high/15"
                    )}>
                      <TrendingUp className={cn(
                        "w-5 h-5 text-risk-high",
                        newRiskCount > 0 && "animate-pulse"
                      )} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-risk-high group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className={cn(
                    "text-3xl font-bold tabular-nums",
                    newRiskCount > 0 ? "text-risk-high" : "text-foreground"
                  )}>
                    {newRiskCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">오늘 새로운 위험도 학생</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Care Needed Expanded List */}
          {showCareList && (
            <Card className="border border-risk-medium/25 animate-in slide-in-from-top-3 duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-risk-medium/10 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-risk-medium" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">케어 필요 학생</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">아래 학생들에게 상담 또는 지원이 필요합니다</p>
                    </div>
                  </div>
                  <Link href="/mentor/students?filter=care">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                      전체 보기
                    </Button>
                  </Link>
                </div>

                {careNeededStudents.length > 0 ? (
                  <div className="space-y-2">
                    {careNeededStudents.map(student => (
                      <CareNeededCard
                        key={student.id}
                        student={student}
                        onComplete={(feedback) => completeCare(student.id, feedback)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-risk-low/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-risk-low" />
                    </div>
                    <p className="text-sm font-medium text-foreground">모든 케어가 완료되었습니다</p>
                    <p className="text-xs text-muted-foreground mt-1">현재 추가 지원이 필요한 학생이 없습니다</p>
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
