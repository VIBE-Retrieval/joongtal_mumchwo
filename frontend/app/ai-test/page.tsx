"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarPlus,
  MessageCircle,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type SurveyRow = {
  id: number
  survey_date: string
  achievement_score: number
  adaptation_score: number
  relationship_score: number
}

type FeatureSnapshot = {
  achievement_mean_7d: number
  adaptation_mean_7d: number
  relationship_mean_7d: number
  total_delta_7d: number
}

type PipelineResult = {
  student_id: string
  survey_date: string
  risk_score: number
  risk_level: "LOW" | "MEDIUM" | "HIGH" | string
  risk_trend: "UP" | "STABLE" | "DOWN" | string
  feature_snapshot: FeatureSnapshot
  risk_reason: string
  risk_type: string
  action_type: "NONE" | "ENCOURAGE_MESSAGE" | "ALERT_MENTOR" | "REQUEST_MEETING" | "EMERGENCY" | string
  priority: "LOW" | "MEDIUM" | "HIGH" | string
  action_reason: string
  state_summary: string
  execution_detail: string | null
  execution_status: string
}

type Phase = "round1" | "feedback" | "round2" | "done"
type FeedbackChoice = "false_alarm" | "recovered" | "watch" | null

const DEFAULT_ACHIEVEMENT = [4, 3, 3, 2, 2, 1, 1]
const DEFAULT_ADAPTATION = [4, 4, 3, 3, 2, 2, 1]
const DEFAULT_RELATIONSHIP = [5, 4, 4, 3, 3, 2, 2]

function formatDateISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildDefaultRows(startOffset: number): SurveyRow[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + startOffset + i)
    return {
      id: i,
      survey_date: formatDateISO(date),
      achievement_score: DEFAULT_ACHIEVEMENT[i],
      adaptation_score: DEFAULT_ADAPTATION[i],
      relationship_score: DEFAULT_RELATIONSHIP[i],
    }
  })
}

function featureColorClass(value: number) {
  if (value <= 2) return "text-risk-high"
  if (value <= 3) return "text-risk-medium"
  return "text-risk-low"
}

function riskLevelClass(level: string) {
  if (level === "HIGH") return "bg-risk-high/15 text-risk-high border-risk-high/30"
  if (level === "MEDIUM") return "bg-risk-medium/15 text-risk-medium border-risk-medium/30"
  return "bg-risk-low/15 text-risk-low border-risk-low/30"
}

function priorityClass(priority: string) {
  if (priority === "HIGH") return "bg-risk-high/15 text-risk-high border-risk-high/30"
  if (priority === "MEDIUM") return "bg-risk-medium/15 text-risk-medium border-risk-medium/30"
  return "bg-risk-low/15 text-risk-low border-risk-low/30"
}

function actionClass(action: string) {
  if (action === "EMERGENCY") return "bg-red-500/15 text-red-600 border-red-500/30"
  if (action === "REQUEST_MEETING") return "bg-orange-500/15 text-orange-600 border-orange-500/30"
  if (action === "ALERT_MENTOR") return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30"
  if (action === "ENCOURAGE_MESSAGE") return "bg-primary/12 text-primary border-primary/30"
  return "bg-muted text-muted-foreground border-border"
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "UP") return <TrendingUp className="w-4 h-4 text-risk-high" />
  if (trend === "DOWN") return <TrendingDown className="w-4 h-4 text-risk-low" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

function executionClass(action: string) {
  if (action === "EMERGENCY") return "bg-red-500/15 text-red-600 border-red-500/30"
  if (action === "REQUEST_MEETING") return "bg-orange-500/15 text-orange-600 border-orange-500/30"
  if (action === "ALERT_MENTOR") return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30"
  if (action === "ENCOURAGE_MESSAGE" || action === "ENCOURAGE_MSG") {
    return "bg-primary/12 text-primary border-primary/30"
  }
  return "bg-muted text-muted-foreground border-border"
}

function ExecutionIcon({ action }: { action: string }) {
  if (action === "EMERGENCY") return <AlertTriangle className="w-4 h-4" />
  if (action === "REQUEST_MEETING") return <CalendarPlus className="w-4 h-4" />
  if (action === "ALERT_MENTOR") return <Bell className="w-4 h-4" />
  if (action === "ENCOURAGE_MESSAGE" || action === "ENCOURAGE_MSG") {
    return <MessageCircle className="w-4 h-4" />
  }
  return <Minus className="w-4 h-4" />
}

function executionFallbackText(action: string) {
  if (action === "ALERT_MENTOR") return "멘토 대시보드 알림에 등록되었습니다."
  if (action === "REQUEST_MEETING") {
    return "AI가 자동으로 미팅 요청을 생성했습니다. 멘토가 일정을 확정합니다."
  }
  if (action === "EMERGENCY") {
    return "긴급 미팅 요청이 생성되고 멘토에게 긴급 알림이 전송되었습니다."
  }
  if (action === "NONE") return "현재 상태가 안정적입니다. 별도 개입이 필요하지 않습니다."
  return "실행 결과가 기록되었습니다."
}

function ScoreSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1">
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={1}
        max={5}
        step={1}
      />
      <div className="text-xs text-muted-foreground text-center">{value}</div>
    </div>
  )
}

function SurveyInputTable({
  rows,
  onUpdate,
}: {
  rows: SurveyRow[]
  onUpdate: (id: number, patch: Partial<SurveyRow>) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-2 font-medium">Date</th>
            <th className="text-left py-2 px-2 font-medium">Achievement</th>
            <th className="text-left py-2 px-2 font-medium">Adaptation</th>
            <th className="text-left py-2 pl-2 font-medium">Relationship</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="py-3 pr-2 min-w-40">
                <Input
                  type="date"
                  value={row.survey_date}
                  onChange={(e) => onUpdate(row.id, { survey_date: e.target.value })}
                />
              </td>
              <td className="py-3 px-2 min-w-40">
                <ScoreSlider value={row.achievement_score} onChange={(v) => onUpdate(row.id, { achievement_score: v })} />
              </td>
              <td className="py-3 px-2 min-w-40">
                <ScoreSlider value={row.adaptation_score} onChange={(v) => onUpdate(row.id, { adaptation_score: v })} />
              </td>
              <td className="py-3 pl-2 min-w-40">
                <ScoreSlider value={row.relationship_score} onChange={(v) => onUpdate(row.id, { relationship_score: v })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PipelineCards({
  roundLabel,
  result,
  submittedRows,
}: {
  roundLabel: string
  result: PipelineResult
  submittedRows: SurveyRow[]
}) {
  const riskScorePct = Math.max(0, Math.min(100, result.risk_score * 100))

  return (
    <div className="grid gap-4 animate-in fade-in duration-500">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 1: 설문 입력</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2">날짜</th>
                <th className="text-left py-2 px-2">성취도</th>
                <th className="text-left py-2 px-2">적응도</th>
                <th className="text-left py-2 pl-2">인간관계</th>
              </tr>
            </thead>
            <tbody>
              {submittedRows.map(row => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">{row.survey_date}</td>
                  <td className="py-2 px-2">{row.achievement_score}</td>
                  <td className="py-2 px-2">{row.adaptation_score}</td>
                  <td className="py-2 pl-2">{row.relationship_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 2: Feature Extraction</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">achievement_mean_7d</p>
            <p className={cn("text-lg font-semibold", featureColorClass(result.feature_snapshot.achievement_mean_7d))}>
              {result.feature_snapshot.achievement_mean_7d}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">adaptation_mean_7d</p>
            <p className={cn("text-lg font-semibold", featureColorClass(result.feature_snapshot.adaptation_mean_7d))}>
              {result.feature_snapshot.adaptation_mean_7d}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">relationship_mean_7d</p>
            <p className={cn("text-lg font-semibold", featureColorClass(result.feature_snapshot.relationship_mean_7d))}>
              {result.feature_snapshot.relationship_mean_7d}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">total_delta_7d</p>
            <p className={cn("text-lg font-semibold", featureColorClass(result.feature_snapshot.total_delta_7d))}>
              {result.feature_snapshot.total_delta_7d}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 3: Process ML 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>risk_score</span>
              <span className="font-medium">{result.risk_score}</span>
            </div>
            <Progress value={riskScorePct} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={riskLevelClass(result.risk_level)}>
              {result.risk_level}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <TrendIcon trend={result.risk_trend} />
              {result.risk_trend}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 4: LLM 해석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">state_summary</p>
            <p className="text-sm leading-relaxed">{result.state_summary}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">risk_reason</p>
            <p className="text-sm leading-relaxed">{result.risk_reason}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">risk_type</p>
            <Badge variant="outline">{result.risk_type}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 5: Agent 판단</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={actionClass(result.action_type)}>
              {result.action_type}
            </Badge>
            <Badge variant="outline" className={priorityClass(result.priority)}>
              {result.priority}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">action_reason</p>
            <p className="text-sm leading-relaxed">{result.action_reason}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{roundLabel} - STEP 6: 실행 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="outline" className={cn("gap-1", executionClass(result.action_type))}>
            <ExecutionIcon action={result.action_type} />
            {result.execution_status}
          </Badge>

          {result.execution_detail ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">발송된 격려 메시지</p>
              <div className="bg-primary/[0.06] border-l-4 border-primary p-4 rounded-lg text-sm leading-relaxed text-foreground">
                {result.execution_detail}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{executionFallbackText(result.action_type)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AITestPage() {
  const [studentId, setStudentId] = useState("")
  const [currentPhase, setCurrentPhase] = useState<Phase>("round1")

  const [round1Rows, setRound1Rows] = useState<SurveyRow[]>(() => buildDefaultRows(-13))
  const [round2Rows, setRound2Rows] = useState<SurveyRow[]>(() => buildDefaultRows(-6))

  const [round1SubmittedRows, setRound1SubmittedRows] = useState<SurveyRow[]>([])
  const [round2SubmittedRows, setRound2SubmittedRows] = useState<SurveyRow[]>([])

  const [round1Result, setRound1Result] = useState<PipelineResult | null>(null)
  const [round2Result, setRound2Result] = useState<PipelineResult | null>(null)

  const [feedbackChoice, setFeedbackChoice] = useState<FeedbackChoice>(null)
  const [recoveryDaysInput, setRecoveryDaysInput] = useState("")

  const [isRunning, setIsRunning] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; round: 1 | 2 } | null>(null)
  const [error, setError] = useState("")

  const apiBase = process.env.NEXT_PUBLIC_API_URL
  const trimmedStudentId = studentId.trim()
  const parsedRecoveryDays = Number.parseInt(recoveryDaysInput, 10)
  const isRecoveryValid = Number.isFinite(parsedRecoveryDays) && parsedRecoveryDays >= 1 && parsedRecoveryDays <= 30

  const canRunRound1 = useMemo(
    () => currentPhase === "round1" && trimmedStudentId.length > 0 && !isRunning,
    [currentPhase, trimmedStudentId, isRunning]
  )

  const canRunRound2 = useMemo(
    () => currentPhase === "round2" && trimmedStudentId.length > 0 && !isRunning,
    [currentPhase, trimmedStudentId, isRunning]
  )

  const canSubmitFeedback = useMemo(() => {
    if (currentPhase !== "feedback" || isSubmittingFeedback || !feedbackChoice) return false
    if (feedbackChoice === "recovered") return isRecoveryValid
    return true
  }, [currentPhase, isSubmittingFeedback, feedbackChoice, isRecoveryValid])

  const updateRows = (
    setter: (updater: (prev: SurveyRow[]) => SurveyRow[]) => void,
    id: number,
    patch: Partial<SurveyRow>
  ) => {
    setter(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }

  const runRound = async (round: 1 | 2) => {
    if (!apiBase) {
      setError("API 호출 실패 - 서버가 실행 중인지 확인하세요")
      return
    }

    const rows = round === 1 ? round1Rows : round2Rows

    setIsRunning(true)
    setError("")
    setProgress({ current: 0, total: 7, round })

    const sortedRows = [...rows].sort((a, b) => a.survey_date.localeCompare(b.survey_date))

    try {
      let finalData: PipelineResult | null = null

      for (let i = 0; i < sortedRows.length; i += 1) {
        const row = sortedRows[i]
        setProgress({ current: i + 1, total: sortedRows.length, round })

        const res = await fetch(`${apiBase}/surveys/daily`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: trimmedStudentId,
            survey_date: row.survey_date,
            achievement_score: row.achievement_score,
            adaptation_score: row.adaptation_score,
            relationship_score: row.relationship_score,
          }),
        })

        const json = await res.json().catch(() => null)
        if (!res.ok || !json || json.code !== 200 || !json.data) {
          throw new Error("request failed")
        }
        finalData = json.data as PipelineResult
      }

      if (round === 1) {
        setRound1SubmittedRows(sortedRows)
        setRound1Result(finalData)
        setCurrentPhase("feedback")
      } else {
        setRound2SubmittedRows(sortedRows)
        setRound2Result(finalData)
        setCurrentPhase("done")
      }
    } catch {
      setError("API 호출 실패 - 서버가 실행 중인지 확인하세요")
    } finally {
      setIsRunning(false)
      setProgress(null)
    }
  }

  const submitFeedback = async () => {
    if (!canSubmitFeedback || !apiBase) {
      if (!apiBase) setError("API 호출 실패 - 서버가 실행 중인지 확인하세요")
      return
    }

    const isFalseAlarm = feedbackChoice === "false_alarm"
    const recoveryDays = feedbackChoice === "recovered" ? parsedRecoveryDays : null

    setIsSubmittingFeedback(true)
    setError("")

    try {
      const res = await fetch(`${apiBase}/consultings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: trimmedStudentId,
          is_false_alarm: isFalseAlarm,
          recovery_days: recoveryDays,
          mentor_feedback: null,
          action_effective: null,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json || json.code !== 200) {
        throw new Error("feedback failed")
      }

      setCurrentPhase("round2")
    } catch {
      setError("API 호출 실패 - 서버가 실행 중인지 확인하세요")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">AI Pipeline Test</h1>
              <p className="text-xs text-muted-foreground">{"Round1 -> Feedback -> Round2"}</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">Landing</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Inline guide banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">💡</span>
          <div className="space-y-1">
            <p className="text-sm font-medium">AI 파이프라인 테스트 안내</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              실제 AI 파이프라인을 직접 실행해볼 수 있는 페이지입니다.
              <span className="text-foreground font-medium"> ① 데모 계정 선택 →</span> 아래 목록에서 student_id 클릭
              <span className="text-foreground font-medium"> → ② 1라운드 실행</span> (7일치 설문 데이터 전송 → ML 위험도 산출 → LLM 해석 → Agent 행동 결정)
              <span className="text-foreground font-medium"> → ③ 케어 피드백</span> 입력 (오탐·회복·관찰 중 선택)
              <span className="text-foreground font-medium"> → ④ 2라운드 실행</span>으로 피드백 반영 전후 결과를 비교합니다.
            </p>
          </div>
        </div>

        {/* Demo user reference table */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>데모 계정 목록</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">student_id</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">이름</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">이메일</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">생년월일</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">연락처</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">과정</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">학력</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">면접</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "STU_DEMO_001", name: "김민준", email: "minjun.kim@demo.com",   birth: "19980315", phone: "010-1111-2222", course: "AI 개발자 양성 과정", edu: "대학교 졸업", status: "PASSED" },
                    { id: "STU_DEMO_002", name: "이서연", email: "seoyeon.lee@demo.com",  birth: "20010822", phone: "010-2222-3333", course: "AI 개발자 양성 과정", edu: "대학교 재학", status: "PASSED" },
                    { id: "STU_DEMO_003", name: "박도현", email: "dohyun.park@demo.com",  birth: "19990507", phone: "010-3333-4444", course: "AI 개발자 양성 과정", edu: "대학교 졸업", status: "PASSED" },
                    { id: "STU_DEMO_004", name: "최유진", email: "yujin.choi@demo.com",   birth: "20000214", phone: "010-4444-5555", course: "AI 개발자 양성 과정", edu: "대학교 재학", status: "PASSED" },
                    { id: "STU_DEMO_005", name: "정우성", email: "woosung.jung@demo.com", birth: "19971129", phone: "010-5555-6666", course: "AI 개발자 양성 과정", edu: "대학원 졸업", status: "PASSED" },
                  ].map((u, i) => (
                    <tr key={u.id} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => setStudentId(u.id)}
                          className="font-mono text-xs text-primary hover:underline focus:outline-none"
                          title="클릭해서 입력"
                        >
                          {u.id}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{u.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{u.birth}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.phone}</td>
                      <td className="px-4 py-2.5">{u.course}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.edu}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-risk-low/15 text-risk-low border border-risk-low/30">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2 text-xs text-muted-foreground border-t">student_id를 클릭하면 아래 입력란에 자동으로 채워집니다.</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>공통 입력</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">위 데모 계정 목록에서 student_id를 클릭하거나 직접 입력하세요. 1·2라운드에 동일하게 사용됩니다.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">student_id</label>
              <Input
                placeholder="STU-XXXXXXXX"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>STEP A: 1라운드 - 7일 설문 입력 & 실행</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">7일치 성취도·적응도·관계도 점수를 입력하고 실행하면 하루씩 순차 전송됩니다. 슬라이더로 값을 조정해 다양한 위험 시나리오를 테스트해보세요.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <SurveyInputTable
              rows={round1Rows}
              onUpdate={(id, patch) => updateRows(setRound1Rows, id, patch)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => runRound(1)} disabled={!canRunRound1}>
                {isRunning && progress?.round === 1 ? "1라운드 실행 중..." : "1라운드 실행"}
              </Button>
              {progress?.round === 1 && (
                <span className="text-sm text-muted-foreground">
                  {progress.current} / {progress.total} 처리 중...
                </span>
              )}
            </div>

            {round1Result && (
              <Button variant="outline" onClick={() => setCurrentPhase("feedback")}>
                다음: 케어 피드백 입력
              </Button>
            )}
          </CardContent>
        </Card>

        {round1Result && (
          <PipelineCards
            roundLabel="1라운드"
            result={round1Result}
            submittedRows={round1SubmittedRows}
          />
        )}

        <Card className={cn("border shadow-sm", currentPhase === "round1" && "opacity-60")}>
          <CardHeader>
            <CardTitle>STEP B: 케어 피드백 입력</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">1라운드 결과를 보고 실제 개입 여부를 선택합니다. 이 피드백이 ML 모델 재학습 데이터로 활용되어 2라운드 결과에 반영됩니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {round1Result ? (
              <>
                <div className="rounded-lg border p-3 text-sm flex flex-wrap items-center gap-3">
                  <span>action_type: <strong>{round1Result.action_type}</strong></span>
                  <span>risk_level: <strong>{round1Result.risk_level}</strong></span>
                  <span>risk_score: <strong>{(round1Result.risk_score * 100).toFixed(1)}%</strong></span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={feedbackChoice === "false_alarm"}
                      onChange={() => setFeedbackChoice("false_alarm")}
                    />
                    오탐이었음 - 이 학생의 자연스러운 패턴
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={feedbackChoice === "recovered"}
                      onChange={() => setFeedbackChoice("recovered")}
                    />
                    개입 후 회복됨
                  </label>
                  {feedbackChoice === "recovered" && (
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="회복일수 (1-30)"
                      value={recoveryDaysInput}
                      onChange={(e) => setRecoveryDaysInput(e.target.value)}
                      className="max-w-56"
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={feedbackChoice === "watch"}
                      onChange={() => setFeedbackChoice("watch")}
                    />
                    지속 관찰 필요
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={submitFeedback} disabled={!canSubmitFeedback}>
                    {isSubmittingFeedback ? "피드백 제출 중..." : "피드백 제출"}
                  </Button>
                  {(currentPhase === "round2" || currentPhase === "done") && (
                    <Button variant="outline" onClick={() => setCurrentPhase("round2")}>
                      다음: 2라운드 실행
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">1라운드 실행 후 피드백을 입력할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card className={cn("border shadow-sm", currentPhase === "round1" || currentPhase === "feedback" ? "opacity-60" : "opacity-100")}>
          <CardHeader>
            <CardTitle>STEP C: 2라운드 - 7일 설문 입력 & 실행</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">피드백이 반영된 두 번째 분석입니다. 1라운드와 다른 점수를 입력해 위험도 변화를 확인하거나, 동일한 값으로 실행해 피드백 전후 결과를 비교해보세요.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <SurveyInputTable
              rows={round2Rows}
              onUpdate={(id, patch) => updateRows(setRound2Rows, id, patch)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => runRound(2)} disabled={!canRunRound2}>
                {isRunning && progress?.round === 2 ? "2라운드 실행 중..." : "2라운드 실행"}
              </Button>
              {progress?.round === 2 && (
                <span className="text-sm text-muted-foreground">
                  {progress.current} / {progress.total} 처리 중...
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {round2Result && (
          <PipelineCards
            roundLabel="2라운드"
            result={round2Result}
            submittedRows={round2SubmittedRows}
          />
        )}

        {round2Result && round1Result && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>1라운드 vs 2라운드 비교</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">항목</th>
                    <th className="text-left py-2 px-2">1라운드</th>
                    <th className="text-left py-2 pl-2">2라운드</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-2">risk_score</td>
                    <td className="py-2 px-2">{(round1Result.risk_score * 100).toFixed(1)}%</td>
                    <td className="py-2 pl-2">{(round2Result.risk_score * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-2">risk_level</td>
                    <td className="py-2 px-2">{round1Result.risk_level}</td>
                    <td className="py-2 pl-2">{round2Result.risk_level}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-2">action_type</td>
                    <td className="py-2 px-2">{round1Result.action_type}</td>
                    <td className="py-2 pl-2">{round2Result.action_type}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2">priority</td>
                    <td className="py-2 px-2">{round1Result.priority}</td>
                    <td className="py-2 pl-2">{round2Result.priority}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  )
}
