"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InterviewerMode } from "@/components/interviewer-mode"
import { ClipboardCheck } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

function getInitials(name: string) {
  return name.length > 0 ? name.charAt(0) : "?"
}

export default function InterviewerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo + Title */}
          <Link href="/interviewer" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <ClipboardCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">면접관 대시보드</span>
              <span className="hidden sm:block text-border">·</span>
              <span className="hidden sm:block text-xs text-muted-foreground">후보자 평가 및 분석</span>
            </div>
          </Link>

          {/* User + Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{getInitials(user.name)}</span>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
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

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <InterviewerMode />
      </main>
    </div>
  )
}
