"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type UserRole = "student" | "interviewer" | "mentor"

const roleConfig: Record<UserRole, { icon: string; label: string; description: string }> = {
  student: {
    icon: "🎓",
    label: "학생",
    description: "상태 체크인 및 피드백"
  },
  interviewer: {
    icon: "📋",
    label: "면접관",
    description: "지원자 평가 및 분석"
  },
  mentor: {
    icon: "🧑‍🏫",
    label: "멘토",
    description: "학생 모니터링 및 개입"
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.")
      return
    }

    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다.")
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Store user in localStorage for demo
    const user = {
      id: `${selectedRole}-1`,
      name: selectedRole === "student" ? "김민수" : selectedRole === "interviewer" ? "박지훈" : "이서연",
      email,
      role: selectedRole
    }
    localStorage.setItem("auth-user", JSON.stringify(user))
    
    // Redirect to role-specific dashboard
    router.push(`/${selectedRole}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <span className="font-semibold text-lg">학생 인사이트</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              역할을 선택하고 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">역할 선택</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role]
                    const isSelected = selectedRole === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-center",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-2xl block mb-2">{config.icon}</span>
                        <span className={cn(
                          "text-sm font-medium block",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {config.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {roleConfig[selectedRole].description}
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">이메일</label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">비밀번호</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              {/* Demo Hint */}
              <p className="text-xs text-muted-foreground text-center">
                데모: 아무 이메일과 4자 이상 비밀번호로 로그인 가능
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
