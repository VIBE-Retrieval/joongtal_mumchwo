"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, Check } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

const scaleOptions = [
  { value: 1, label: "매우 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
]

function SurveyQuestion({
  question,
  description,
  value,
  onChange,
}: {
  question: string
  description: string
  value: number | null
  onChange: (value: number) => void
}) {
  return (
    <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base font-medium">{question}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          {scaleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium",
                value === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/50 text-foreground"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">{option.value}</span>
                <span className="text-xs text-muted-foreground">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SurveyPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  
  const [achievement, setAchievement] = useState<number | null>(null)
  const [adaptability, setAdaptability] = useState<number | null>(null)
  const [relationship, setRelationship] = useState<number | null>(null)

  const isComplete = achievement !== null && adaptability !== null && relationship !== null

  useEffect(() => {
    const storedUser = localStorage.getItem("auth-user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    
    try {
      const parsed = JSON.parse(storedUser)
      if (parsed.role !== "student") {
        router.push(`/${parsed.role}`)
        return
      }
      setUser(parsed)
    } catch {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  const handleSubmit = async () => {
    if (!isComplete || !user) return

    setIsSubmitting(true)

    const today = new Date()
    const surveyDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surveys/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.id,
          survey_date: surveyDate,
          achievement_score: achievement,
          adaptation_score: adaptability,
          relationship_score: relationship,
        }),
      })

      const json = await res.json()

      if (json.code === 200) {
        setIsSubmitted(true)
        setTimeout(() => router.push("/student"), 1500)
      } else {
        setError(json.message ?? "제출에 실패했습니다. 다시 시도해 주세요.")
      }
    } catch {
      setError("서버에 연결할 수 없습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  if (!user) return null

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-sm text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-full bg-status-stable/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-status-stable" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">설문 완료!</h2>
            <p className="text-sm text-muted-foreground">
              오늘의 설문이 저장되었습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const today = new Date()
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/student">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">오늘의 설문</h1>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6 p-6">
          {/* Introduction */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-xl font-semibold text-foreground">오늘 하루는 어땠나요?</h2>
            <p className="text-sm text-muted-foreground">
              각 질문에 대해 가장 적합한 답변을 선택해 주세요
            </p>
          </div>

          {/* Question 1 - Achievement */}
          <SurveyQuestion
            question="성취도"
            description="오늘 학습 목표를 달성했다고 느끼시나요?"
            value={achievement}
            onChange={setAchievement}
          />

          {/* Question 2 - Adaptability */}
          <SurveyQuestion
            question="학습 적응도"
            description="오늘 학습 환경에 잘 적응했다고 느끼시나요?"
            value={adaptability}
            onChange={setAdaptability}
          />

          {/* Question 3 - Relationship */}
          <SurveyQuestion
            question="인간관계"
            description="오늘 동료들과의 관계가 원활했나요?"
            value={relationship}
            onChange={setRelationship}
          />

          {/* Progress & Submit */}
          <Card className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="py-6">
              <div className="space-y-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    achievement !== null ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    adaptability !== null ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    relationship !== null ? "bg-primary" : "bg-muted"
                  )} />
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  {isComplete 
                    ? "모든 질문에 응답했습니다" 
                    : `${[achievement, adaptability, relationship].filter(v => v !== null).length}/3 완료`
                  }
                </p>
                
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!isComplete || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "저장 중..." : "설문 제출하기"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
