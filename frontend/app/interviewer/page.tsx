"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InterviewerMode } from "@/components/interviewer-mode"

interface User {
  id: string
  name: string
  email: string
  role: string
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
      if (parsed.role !== "interviewer") {
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/interviewer" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">면접관 대시보드</h1>
                <p className="text-xs text-muted-foreground">후보자 평가 및 분석</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
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
