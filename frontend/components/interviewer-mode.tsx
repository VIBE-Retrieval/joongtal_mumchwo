"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Save, CheckCircle2, ThumbsUp, ThumbsDown, Clock } from "lucide-react"
import { useApplicants } from "@/contexts/applicant-context"
import { useStudents } from "@/contexts/student-context"

type RiskLevel = "LOW" | "MEDIUM" | "HIGH"

interface LocalEvaluation {
  achievement: { answer: string; rating: number }
  adaptability: { answer: string; rating: number }
  relationship: { answer: string; rating: number }
}

const evaluationCategories = [
  {
    key: "achievement" as const,
    title: "성취도",
    subtitle: "스스로 해내는 사람인가?",
    question: "이전에 어려운 내용을 스스로 이해하거나 해결했던 경험을 설명해 주세요",
    checklist: [
      "문제를 끝까지 해결하려고 했는가",
      "스스로 학습하거나 시도한 흔적이 있는가",
      "결과보다 과정이 구체적인가",
    ],
    ratingCriteria: {
      1: "거의 없음 (포기, 의존)",
      3: "기본적인 노력 있음",
      5: "적극적 해결 경험 있음",
    },
  },
  {
    key: "adaptability" as const,
    title: "학습 적응도",
    subtitle: "어려워도 버티는 사람인가?",
    question: "이전에 이해하기 어려운 내용을 배울 때 어떻게 대처했는지 말씀해 주세요",
    checklist: [
      "어려움을 인정하는가",
      "포기하지 않고 계속 시도했는가",
      "다양한 방법으로 접근했는가 (검색, 질문 등)",
    ],
    ratingCriteria: {
      1: "포기하거나 회피",
      3: "기본적인 대응",
      5: "적극적 적응 전략 사용",
    },
  },
  {
    key: "relationship" as const,
    title: "인간관계",
    subtitle: "고립되지 않는 사람인가?",
    question: "팀이나 다른 사람과 함께 무언가를 했던 경험을 설명해 주세요",
    checklist: [
      "협력 경험이 있는가",
      "갈등 상황을 어떻게 처리했는가",
      "도움을 주거나 받은 경험이 있는가",
    ],
    ratingCriteria: {
      1: "협력 경험 거의 없음",
      3: "기본적인 협력",
      5: "적극적 상호작용",
    },
  },
]

interface RiskAnalysis {
  riskScore: number
  riskLevel: RiskLevel
  cluster: string
  clusterLabel: string
  explanation: string
}

function calculateRiskAnalysis(evaluation: LocalEvaluation): RiskAnalysis {
  const avgRating = (
    evaluation.achievement.rating +
    evaluation.adaptability.rating +
    evaluation.relationship.rating
  ) / 3

  const riskScore = Math.round(Math.max(0, Math.min(100, (5 - avgRating) * 25)))

  let riskLevel: RiskLevel = "LOW"
  let cluster = "A"
  let clusterLabel = "우수 그룹"
  let explanation = "지원자는 전반적으로 높은 성취도와 적응력을 보이며, 원활한 인간관계 능력을 갖추고 있습니다. 부트캠프 과정에 잘 적응할 것으로 예상됩니다."

  if (riskScore > 60) {
    riskLevel = "HIGH"
    cluster = "C"
    clusterLabel = "집중 지원 필요"
    explanation = "지원자는 일부 영역에서 추가적인 지원이 필요할 수 있습니다. 입과 후 초기 적응 기간에 멘토링을 통한 밀착 관리를 권장합니다."
  } else if (riskScore > 35) {
    riskLevel = "MEDIUM"
    cluster = "B"
    clusterLabel = "일반 관리"
    explanation = "지원자는 평균적인 수준의 준비도를 보입니다. 정기적인 체크인과 필요 시 추가 지원을 통해 성공적인 과정 이수가 가능할 것입니다."
  }

  return { riskScore, riskLevel, cluster, clusterLabel, explanation }
}

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const rotation = (score / 100) * 180 - 90

  const levelColors: Record<RiskLevel, string> = {
    LOW: "text-risk-low",
    MEDIUM: "text-risk-medium",
    HIGH: "text-risk-high",
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-14 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted"
          />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 141.37} 141.37`}
            className={levelColors[level]}
          />
          <g transform={`rotate(${rotation}, 50, 50)`}>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx="50" cy="50" r="4" className="fill-foreground" />
          </g>
        </svg>
      </div>
      <div className="text-center">
        <span className={cn("text-xl font-semibold", levelColors[level])}>{score}</span>
        <span className="text-sm text-muted-foreground ml-1">/ 100</span>
      </div>
    </div>
  )
}

function EvaluationCard({
  category,
  value,
  onChange,
}: {
  category: typeof evaluationCategories[number]
  value: { answer: string; rating: number }
  onChange: (field: "answer" | "rating", val: string | number) => void
}) {
  return (
    <Card className="border border-border/60 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {category.key === "achievement" ? "1" : category.key === "adaptability" ? "2" : "3"}
          </span>
          {category.title}
        </CardTitle>
        <p className="text-xs text-primary/80 font-medium mt-0.5 ml-8">{category.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Question */}
        <div className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/50">
          <p className="text-xs text-foreground leading-relaxed">
            {category.question}
          </p>
        </div>

        {/* Checklist */}
        <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">체크 항목</p>
          <ul className="space-y-1">
            {category.checklist.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="text-primary/60 mt-0.5 text-[10px] font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Answer textarea */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            평가 의견
          </label>
          <Textarea
            value={value.answer}
            onChange={(e) => onChange("answer", e.target.value)}
            placeholder="지원자에 대한 평가 의견을 작성하세요..."
            className="resize-none h-18 text-xs"
          />
        </div>

        {/* Rating */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              평가 점수
            </label>
            <span className="text-sm font-bold text-primary tabular-nums">{value.rating}<span className="text-xs font-normal text-muted-foreground"> / 5</span></span>
          </div>
          <Slider
            value={[value.rating]}
            onValueChange={([v]) => onChange("rating", v)}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <div className={cn(
              "text-center p-2 rounded-lg transition-all border",
              value.rating === 1 ? "bg-risk-high/10 text-risk-high border-risk-high/20 font-semibold" : "text-muted-foreground border-border/30 bg-muted/20"
            )}>
              <div className="font-bold mb-0.5">1점</div>
              <div className="leading-tight">{category.ratingCriteria[1]}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-lg transition-all border",
              value.rating === 3 ? "bg-risk-medium/10 text-risk-medium border-risk-medium/20 font-semibold" : "text-muted-foreground border-border/30 bg-muted/20"
            )}>
              <div className="font-bold mb-0.5">3점</div>
              <div className="leading-tight">{category.ratingCriteria[3]}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-lg transition-all border",
              value.rating === 5 ? "bg-risk-low/10 text-risk-low border-risk-low/20 font-semibold" : "text-muted-foreground border-border/30 bg-muted/20"
            )}>
              <div className="font-bold mb-0.5">5점</div>
              <div className="leading-tight">{category.ratingCriteria[5]}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InterviewerMode() {
  const {
    applicants,
    updateEvaluation: ctxUpdateEvaluation,
    updateInterviewResult,
    saveEvaluation: ctxSaveEvaluation,
    convertToStudent,
  } = useApplicants()
  const { addStudent } = useStudents()

  // Local evaluation overrides keyed by applicant ID (tracks in-progress edits)
  const [localEvaluations, setLocalEvaluations] = useState<Record<string, LocalEvaluation>>({})
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Pending candidates derived from applicant context (reactive to new registrations)
  const candidates = useMemo(() => {
    return applicants
      .filter(a => (a.status === "PENDING_INTERVIEW" || a.status === "HOLD") && !decidedIds.has(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        birthDate: a.birthDate,
        appliedCourse: a.appliedCourse,
        studentId: a.studentId,
        evaluation: localEvaluations[a.id] ?? a.evaluation,
        isSaved: savedIds.has(a.id),
        status: a.status,
      }))
  }, [applicants, localEvaluations, savedIds, decidedIds])

  // Clamp currentIndex when candidates list shrinks
  const safeIndex = Math.min(currentIndex, Math.max(0, candidates.length - 1))
  const currentCandidate = candidates[safeIndex]

  const analysis = useMemo(
    () => currentCandidate ? calculateRiskAnalysis(currentCandidate.evaluation) : null,
    [currentCandidate]
  )

  const updateEvaluationLocal = useCallback((
    category: keyof LocalEvaluation,
    field: "answer" | "rating",
    value: string | number
  ) => {
    if (!currentCandidate) return
    const id = currentCandidate.id
    setLocalEvaluations(prev => {
      const current = prev[id] ?? currentCandidate.evaluation
      return {
        ...prev,
        [id]: {
          ...current,
          [category]: { ...current[category], [field]: value },
        },
      }
    })
    setSavedIds(prev => { const next = new Set(prev); next.delete(id); return next })
    setSaveStatus("idle")
    setSaveError("")
  }, [currentCandidate])

  const handleSave = useCallback(async () => {
    if (!currentCandidate) return
    const studentId = currentCandidate.studentId
    if (!studentId) {
      setSaveError("학생 DB 등록 후 면접 평가가 가능합니다.")
      return
    }

    setSaveStatus("saving")
    setSaveError("")
    setIsSaving(true)

    const ev = currentCandidate.evaluation
    const noteText = [ev.achievement.answer, ev.adaptability.answer, ev.relationship.answer]
      .filter(Boolean).join("\n") || null

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          achievement_score: ev.achievement.rating,
          achievement_problem_solving: ev.achievement.rating,
          achievement_self_learning: ev.achievement.rating,
          achievement_process_clarity: ev.achievement.rating,
          adaptation_score: ev.adaptability.rating,
          adaptation_accepts_difficulty: ev.adaptability.rating,
          adaptation_persistence: ev.adaptability.rating,
          adaptation_strategy_variety: ev.adaptability.rating,
          relationship_score: ev.relationship.rating,
          relationship_collaboration: ev.relationship.rating,
          relationship_conflict_handling: ev.relationship.rating,
          relationship_help_exchange: ev.relationship.rating,
          note: noteText,
        }),
      })
      const json = await res.json()
      if (json.code === 200) {
        const id = currentCandidate.id
        ctxUpdateEvaluation(id, currentCandidate.evaluation)
        ctxSaveEvaluation(id)
        setSavedIds(prev => new Set(prev).add(id))
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveError(json.message ?? "저장에 실패했습니다.")
        setSaveStatus("idle")
      }
    } catch {
      setSaveError("서버에 연결할 수 없습니다.")
      setSaveStatus("idle")
    } finally {
      setIsSaving(false)
    }
  }, [currentCandidate, ctxUpdateEvaluation, ctxSaveEvaluation])

  const handleDecision = useCallback(async (decision: "PASSED" | "FAILED" | "HOLD") => {
    if (!currentCandidate) return
    const id = currentCandidate.id

    // Sync local evaluation to context first
    ctxUpdateEvaluation(id, currentCandidate.evaluation)
    updateInterviewResult(id, decision)

    if (decision === "PASSED") {
      if (currentCandidate.studentId) {
        await handleSave()
      }
      const student = convertToStudent(id, currentCandidate.evaluation)
      if (student) addStudent(student)
    }

    setDecidedIds(prev => new Set(prev).add(id))
    // Navigate: stay at same index (next candidate slides in) or step back if at end
    setCurrentIndex(prev => Math.max(0, Math.min(prev, candidates.length - 2)))
    setSaveStatus("idle")
  }, [currentCandidate, candidates.length, ctxUpdateEvaluation, updateInterviewResult, convertToStudent, addStudent, handleSave])

  const goToPrevious = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1)
      setSaveStatus("idle")
      setSaveError("")
    }
  }

  const goToNext = () => {
    if (safeIndex < candidates.length - 1) {
      setCurrentIndex(safeIndex + 1)
      setSaveStatus("idle")
      setSaveError("")
    }
  }

  const riskLevelLabels: Record<RiskLevel, string> = {
    LOW: "낮음",
    MEDIUM: "보통",
    HIGH: "높음",
  }

  const clusters = [
    { id: "A", label: "우수 그룹" },
    { id: "B", label: "일반 관리" },
    { id: "C", label: "집중 지원 필요" },
  ]

  const completedCount = applicants.filter(
    a => a.status === "PASSED" || a.status === "FAILED"
  ).length

  // Empty state
  if (candidates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">대기 중인 지원자가 없습니다</p>
            <p className="text-xs text-muted-foreground">멘토가 신규 지원자를 등록하면 여기에 표시됩니다.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCandidate || !analysis) return null

  return (
    <div className="h-full flex flex-col">
      {/* TOP: Candidate Info + Navigation */}
      <div className="flex-shrink-0 border-b border-border/60 bg-card/60 backdrop-blur-sm px-6 py-3.5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            {/* Candidate Info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-primary">
                  {currentCandidate.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-foreground">{currentCandidate.name}</h2>
                  {currentCandidate.status === "HOLD" && (
                    <span className="text-[11px] bg-risk-medium/12 text-risk-medium border border-risk-medium/20 px-2 py-0.5 rounded-full font-medium">
                      보류
                    </span>
                  )}
                  {currentCandidate.isSaved && (
                    <span className="text-[11px] text-status-stable flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      저장됨
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>생년월일: {currentCandidate.birthDate}</span>
                  <span className="text-border">·</span>
                  <span>과정: {currentCandidate.appliedCourse}</span>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={safeIndex === 0}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                이전
              </Button>

              <div className="px-2.5 py-1 rounded-lg bg-muted/60 text-xs font-medium text-muted-foreground tabular-nums">
                {safeIndex + 1} / {candidates.length}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={safeIndex === candidates.length - 1}
                className="h-8 gap-1 text-xs"
              >
                다음
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={saveStatus === "saving" || isSaving}
                className="h-8 gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {saveStatus === "saving" ? "저장 중..." : saveStatus === "saved" ? "저장됨 ✓" : "임시 저장"}
              </Button>
            </div>
          </div>
          {saveError && (
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-1.5">{saveError}</p>
          )}
        </div>
      </div>

      {/* MIDDLE: Left (Evaluation) + Right (Analysis) */}
      <div className="flex-1 grid grid-cols-[1fr_360px] min-h-0 overflow-hidden">
        {/* LEFT: Evaluation Cards */}
        <div className="overflow-y-auto p-5 space-y-4">
          {evaluationCategories.map((category) => (
            <EvaluationCard
              key={category.key}
              category={category}
              value={currentCandidate.evaluation[category.key]}
              onChange={(field, val) => updateEvaluationLocal(category.key, field, val as string & number)}
            />
          ))}
        </div>

        {/* RIGHT: Real-Time Analysis */}
        <div className="border-l border-border/60 bg-muted/20 p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div className="pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">실시간 분석</p>
            </div>

            {/* Risk Score + Level combined */}
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">위험 점수</p>
                <RiskGauge score={analysis.riskScore} level={analysis.riskLevel} />
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">위험 수준</span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold",
                    analysis.riskLevel === "LOW" && "bg-risk-low/15 text-risk-low",
                    analysis.riskLevel === "MEDIUM" && "bg-risk-medium/15 text-risk-medium",
                    analysis.riskLevel === "HIGH" && "bg-risk-high/15 text-risk-high"
                  )}>
                    {riskLevelLabels[analysis.riskLevel]}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cluster */}
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">유사 지원자 유형</p>
                <div className="space-y-1.5">
                  {clusters.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150",
                        c.id === analysis.cluster
                          ? "bg-primary/8 border border-primary/25"
                          : "bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0",
                        c.id === analysis.cluster
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {c.id}
                      </div>
                      <span className={cn(
                        "text-xs flex-1",
                        c.id === analysis.cluster ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {c.label}
                      </span>
                      {c.id === analysis.cluster && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">일치</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">AI 분석 설명</p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {analysis.explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* BOTTOM: Actions */}
      <div className="flex-shrink-0 border-t border-border/60 bg-card/60 backdrop-blur-sm px-6 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              평가 완료{" "}
              <span className="font-semibold text-foreground tabular-nums">{completedCount}</span>
              <span className="text-muted-foreground/60"> / {applicants.length}명</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={saveStatus === "saving" || isSaving}
                className="h-8 gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {saveStatus === "saving" ? "저장 중..." : "임시 저장"}
              </Button>

              <div className="w-px h-5 bg-border" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision("HOLD")}
                className="h-8 gap-1.5 text-xs border-risk-medium/40 text-risk-medium hover:bg-risk-medium/8 hover:border-risk-medium/60"
              >
                <Clock className="w-3.5 h-3.5" />
                보류
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision("FAILED")}
                className="h-8 gap-1.5 text-xs border-risk-high/40 text-risk-high hover:bg-risk-high/8 hover:border-risk-high/60"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                불합격
              </Button>

              <Button
                size="sm"
                onClick={() => handleDecision("PASSED")}
                className="h-8 gap-1.5 text-xs bg-risk-low text-white hover:bg-risk-low/90"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                합격
              </Button>
            </div>
          </div>
          {saveError && (
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-1.5">{saveError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
