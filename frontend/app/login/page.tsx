"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AuthProvider, useAuth, type UserRole } from "@/contexts/auth-context"
import { BarChart3, GraduationCap, ClipboardCheck, Users, AlertCircle } from "lucide-react"

const roleConfig: Record<UserRole, { icon: React.ReactNode; label: string; description: string }> = {
  student: {
    icon: <GraduationCap className="w-4 h-4" />,
    label: "학생",
    description: "상태 체크인 및 피드백",
  },
  interviewer: {
    icon: <ClipboardCheck className="w-4 h-4" />,
    label: "면접관",
    description: "지원자 평가 및 분석",
  },
  mentor: {
    icon: <Users className="w-4 h-4" />,
    label: "멘토",
    description: "학생 모니터링 및 개입",
  },
}

const roleDefaults: Record<UserRole, { email: string; birthDate: string }> = {
  student:     { email: "minjun.kim@demo.com", birthDate: "19980315" },
  interviewer: { email: "interviewer@test.com", birthDate: "19900615" },
  mentor:      { email: "mentor@test.com", birthDate: "19850320" },
}

function LoginPageInner() {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [email, setEmail]         = useState(roleDefaults["student"].email)
  const [birthDate, setBirthDate] = useState(roleDefaults["student"].birthDate)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !birthDate) {
      setError("이메일과 생년월일을 입력해주세요.")
      return
    }

    setIsLoading(true)
    const ok = await login(email, birthDate, selectedRole)
    setIsLoading(false)

    if (!ok) {
      setError("이메일과 생년월일을 입력해주세요.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Left: Brand Panel ─── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[480px] flex-col justify-between bg-primary px-12 py-16 relative overflow-hidden flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">학생 인사이트</span>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-[2rem] font-bold text-white leading-snug tracking-tight">
              학생 성장을<br />더 깊이 이해하다
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              AI 기반 위험도 분석으로 학생의 중도탈락을 예방하고,
              데이터 기반 개입으로 성공적인 과정 이수를 돕습니다.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: "📊", title: "실시간 모니터링", desc: "학생 상태를 즉각적으로 파악" },
              { icon: "🤖", title: "AI 위험도 분석",  desc: "선제적 개입으로 이탈 예방" },
              { icon: "🤝", title: "멘토링 연결",      desc: "맞춤형 지원 시스템 제공" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-xl leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">© 2026 중탈 멈춰 !</p>
      </div>

      {/* ─── Right: Form Area ─── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile-only top bar */}
        <div className="lg:hidden border-b border-border/50 px-6 h-14 flex items-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm text-foreground">학생 인사이트</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8 space-y-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">시작하기</h2>
              <p className="text-sm text-muted-foreground">역할을 선택하고 계정에 로그인하세요</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">역할</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const cfg = roleConfig[role]
                    const active = selectedRole === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role)
                          setEmail(roleDefaults[role].email)
                          setBirthDate(roleDefaults[role].birthDate)
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border hover:bg-muted/40"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {cfg.icon}
                        </div>
                        <span className={cn(
                          "text-xs font-medium leading-none",
                          active ? "text-primary" : "text-foreground"
                        )}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground pl-0.5">{roleConfig[selectedRole].description}</p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">이메일</label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-muted/40 border-border/60 focus-visible:border-primary focus-visible:bg-card transition-colors"
                />
              </div>

              {/* Birthdate */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">생년월일</label>
                <Input
                  type="password"
                  placeholder="8자리 입력 (예: 19900101)"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-10 bg-muted/40 border-border/60 focus-visible:border-primary focus-visible:bg-card transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full h-10 font-medium mt-1" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    로그인 중...
                  </span>
                ) : "로그인"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageInner />
    </AuthProvider>
  )
}
