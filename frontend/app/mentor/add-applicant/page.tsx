"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, UserPlus, Save } from "lucide-react"
import { type EducationLevel } from "@/contexts/student-context"
import { useToast } from "@/hooks/use-toast"

const COURSE_OPTIONS = [
  "풀스택 개발자 과정",
  "백엔드 개발자 과정",
  "프론트엔드 개발자 과정",
  "데이터 분석가 과정",
  "AI 엔지니어 과정",
  "UX/UI 디자이너 과정",
  "데이터 엔지니어 과정",
  "DevOps 엔지니어 과정"
]

const EDUCATION_LEVELS: EducationLevel[] = ["고졸", "전문대졸", "대졸", "석사", "기타"]

const TARGET_JOBS = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "데이터 분석가",
  "AI 엔지니어",
  "UX/UI 디자이너",
  "데이터 엔지니어",
  "DevOps 엔지니어"
]

export default function AddApplicantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [appliedCourse, setAppliedCourse] = useState("")
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">("")
  const [major, setMajor] = useState("")
  const [targetJob, setTargetJob] = useState("")

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
    } catch {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  const isFormValid = name && birthDate && phone && email && appliedCourse && educationLevel

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsSaving(true)
    setError("")

    const birthDateFormatted = birthDate.replace(/-/g, "")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          birth_date: birthDateFormatted,
        }),
      })

      const json = await res.json()

      if (json.code === 201) {
        toast({
          title: "학생 등록 완료",
          description: `${name} 학생이 등록되었습니다.`,
        })
        router.push("/mentor")
      } else {
        setError(json.message ?? "등록에 실패했습니다. 다시 시도해 주세요.")
      }
    } catch {
      setError("서버에 연결할 수 없습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push("/mentor")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/mentor">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                돌아가기
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">신규 지원자 등록</h1>
                <p className="text-xs text-muted-foreground">면접 대기자 목록에 추가됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle>지원자 정보</CardTitle>
              <CardDescription>
                신규 지원자의 기본 정보를 입력하세요. 등록 후 면접관이 평가를 진행합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">생년월일 <span className="text-destructive">*</span></Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 <span className="text-destructive">*</span></Label>
                    <Input
                      id="phone"
                      placeholder="010-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Course Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2">지원 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appliedCourse">지원 과정 <span className="text-destructive">*</span></Label>
                    <Select value={appliedCourse} onValueChange={setAppliedCourse}>
                      <SelectTrigger id="appliedCourse">
                        <SelectValue placeholder="과정을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_OPTIONS.map(course => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetJob">목표 직무</Label>
                    <Select value={targetJob} onValueChange={setTargetJob}>
                      <SelectTrigger id="targetJob">
                        <SelectValue placeholder="선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_JOBS.map(job => (
                          <SelectItem key={job} value={job}>{job}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Education Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2">학력 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">학력 <span className="text-destructive">*</span></Label>
                    <Select value={educationLevel} onValueChange={(v) => setEducationLevel(v as EducationLevel)}>
                      <SelectTrigger id="educationLevel">
                        <SelectValue placeholder="학력을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">전공</Label>
                    <Input
                      id="major"
                      placeholder="전공명 (선택사항)"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isFormValid || isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}
