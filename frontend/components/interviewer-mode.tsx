"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, Save, CheckCircle2, ThumbsUp, ThumbsDown, Clock } from "lucide-react"
import { useApplicants } from "@/contexts/applicant-context"
import { useStudents } from "@/contexts/student-context"

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

function ratingButtonClass(score: number) {
  if (score === 1) return "bg-risk-high/15 text-risk-high border-risk-high/30"
  if (score === 2) return "bg-risk-high/8 text-risk-high/70 border-risk-high/20"
  if (score === 3) return "bg-risk-medium/15 text-risk-medium border-risk-medium/30"
  if (score === 4) return "bg-risk-low/8 text-risk-low/70 border-risk-low/20"
  return "bg-risk-low/15 text-risk-low border-risk-low/30"
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
        <div className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/50">
          <p className="text-xs text-foreground leading-relaxed">{category.question}</p>
        </div>

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

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">평가 의견</label>
          <Textarea
            value={value.answer}
            onChange={(e) => onChange("answer", e.target.value)}
            placeholder="지원자에 대한 평가 의견을 작성하세요..."
            className="resize-none h-18 text-xs"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">평가 점수</label>
            <span className="text-sm font-bold text-primary tabular-nums">
              {value.rating}
              <span className="text-xs font-normal text-muted-foreground"> / 5</span>
            </span>
          </div>

          <div className="text-[10px] text-center text-muted-foreground">
            3점 기준: {category.ratingCriteria[3]}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((score) => {
              const selected = value.rating === score
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => onChange("rating", score)}
                  className={cn(
                    "h-9 rounded-md text-sm font-semibold border transition-colors",
                    selected
                      ? ratingButtonClass(score)
                      : "bg-muted/40 text-muted-foreground border border-border/30"
                  )}
                >
                  {score}
                </button>
              )
            })}
          </div>

          <div className="flex items-start justify-between gap-4 text-[10px] text-muted-foreground">
            <div className="max-w-[45%]">
              <span className="font-semibold text-foreground">1점 </span>
              {category.ratingCriteria[1]}
            </div>
            <div className="max-w-[45%] text-right">
              <span className="font-semibold text-foreground">5점 </span>
              {category.ratingCriteria[5]}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type Decision = "PASSED" | "FAILED" | "HOLD"
type ListTab = "pending" | "evaluated" | "hold"

export function InterviewerMode() {
  const {
    applicants,
    updateEvaluation: ctxUpdateEvaluation,
    updateInterviewResult,
    saveEvaluation: ctxSaveEvaluation,
    convertToStudent,
  } = useApplicants()
  const { addStudent } = useStudents()

  const [view, setView] = useState<"list" | "form">("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ListTab>("pending")

  const [localEvaluations, setLocalEvaluations] = useState<Record<string, LocalEvaluation>>({})
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set())
  const [mlResults, setMlResults] = useState<Record<string, { score: number; level: string }>>({})
  const [visibleResults, setVisibleResults] = useState<Set<string>>(new Set())
  const [pendingListDecision, setPendingListDecision] = useState<{ id: string; decision: Decision } | null>(null)

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

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

  const selectedCandidate = useMemo(
    () => candidates.find(candidate => candidate.id === selectedId) ?? null,
    [candidates, selectedId]
  )

  const pendingCandidates = useMemo(
    () => candidates.filter(c => c.status !== "HOLD" && !c.isSaved),
    [candidates]
  )

  const evaluatedCandidates = useMemo(
    () => candidates.filter(c => c.status !== "HOLD" && c.isSaved),
    [candidates]
  )

  const holdCandidates = useMemo(
    () => candidates.filter(c => c.status === "HOLD"),
    [candidates]
  )

  const listCandidates = useMemo(() => {
    if (activeTab === "pending") return pendingCandidates
    if (activeTab === "evaluated") return evaluatedCandidates
    return holdCandidates
  }, [activeTab, pendingCandidates, evaluatedCandidates, holdCandidates])

  const openForm = useCallback((id: string) => {
    setSelectedId(id)
    setView("form")
    setSaveStatus("idle")
    setSaveError("")
  }, [])

  const goToList = useCallback(() => {
    setView("list")
    setSaveStatus("idle")
    setSaveError("")
  }, [])

  const updateEvaluationLocal = useCallback((
    category: keyof LocalEvaluation,
    field: "answer" | "rating",
    value: string | number
  ) => {
    if (!selectedCandidate) return
    const id = selectedCandidate.id
    setLocalEvaluations(prev => {
      const current = prev[id] ?? selectedCandidate.evaluation
      return {
        ...prev,
        [id]: {
          ...current,
          [category]: { ...current[category], [field]: value },
        },
      }
    })
    setSavedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setSaveStatus("idle")
    setSaveError("")
  }, [selectedCandidate])

  const handleSave = useCallback(async () => {
    if (!selectedCandidate) return
    const studentId = selectedCandidate.studentId
    if (!studentId) {
      setSaveError("학생 DB 등록 후 면접 평가가 가능합니다.")
      return
    }

    setSaveStatus("saving")
    setSaveError("")
    setIsSaving(true)

    const ev = selectedCandidate.evaluation
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
        const id = selectedCandidate.id
        ctxUpdateEvaluation(id, selectedCandidate.evaluation)
        ctxSaveEvaluation(id)
        setSavedIds(prev => new Set(prev).add(id))

        const score = json?.data?.dropout_risk_score
        const level = json?.data?.dropout_risk_level
        if (typeof score === "number" && typeof level === "string") {
          setMlResults(prev => ({
            ...prev,
            [id]: { score, level },
          }))
          setVisibleResults(prev => new Set(prev).add(id))
        }

        setSaveStatus("saved")
        setView("list")
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
  }, [selectedCandidate, ctxUpdateEvaluation, ctxSaveEvaluation])

  const handleDecision = useCallback(async (decision: Decision) => {
    if (!selectedCandidate) return
    const id = selectedCandidate.id

    ctxUpdateEvaluation(id, selectedCandidate.evaluation)
    updateInterviewResult(id, decision)

    if (selectedCandidate.studentId) {
      await handleSave()
    }

    if (decision === "PASSED") {
      const student = convertToStudent(id, selectedCandidate.evaluation)
      if (student) addStudent(student)
    }

    if (decision !== "HOLD") {
      setDecidedIds(prev => new Set(prev).add(id))
    }
    setView("list")
    setSaveStatus("idle")
  }, [selectedCandidate, ctxUpdateEvaluation, updateInterviewResult, handleSave, convertToStudent, addStudent])

  useEffect(() => {
    if (!pendingListDecision) return
    if (!selectedCandidate) return
    if (selectedCandidate.id !== pendingListDecision.id) return

    const { decision } = pendingListDecision
    setPendingListDecision(null)
    void handleDecision(decision)
  }, [pendingListDecision, selectedCandidate, handleDecision])

  const completedCount = evaluatedCandidates.length
  const totalCandidatesCount =
    pendingCandidates.length + evaluatedCandidates.length + holdCandidates.length

  const toggleResultVisible = useCallback((id: string) => {
    setVisibleResults(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDecisionFromList = useCallback((id: string, decision: Decision) => {
    setSelectedId(id)
    setPendingListDecision({ id, decision })
  }, [])

  const getRiskLevelClass = (level: string) => {
    if (level === "HIGH") return "text-risk-high"
    if (level === "MEDIUM") return "text-risk-medium"
    return "text-risk-low"
  }

  const getStatusBadge = (status: string) => {
    if (status === "HOLD") {
      return <span className="text-[11px] bg-risk-medium/12 text-risk-medium border border-risk-medium/20 px-2 py-0.5 rounded-full font-medium">보류</span>
    }
    return <span className="text-[11px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-medium">면접 대기</span>
  }

  if (view === "list") {
    return (
      <div className="h-full overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveTab("pending")}
          >
            면접 대기
            <span className="ml-1.5 text-[11px]">{pendingCandidates.length}</span>
          </Button>
          <Button
            variant={activeTab === "evaluated" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveTab("evaluated")}
          >
            평가 완료
            <span className="ml-1.5 text-[11px]">{evaluatedCandidates.length}</span>
          </Button>
          <Button
            variant={activeTab === "hold" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveTab("hold")}
          >
            보류
            <span className="ml-1.5 text-[11px]">{holdCandidates.length}</span>
          </Button>
        </div>

        {listCandidates.length === 0 ? (
          <div className="h-[360px] flex items-center justify-center p-8">
            <div className="text-center space-y-3 max-w-xs">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">표시할 지원자가 없습니다</p>
                <p className="text-xs text-muted-foreground">현재 탭에 해당하는 지원자가 없습니다.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {listCandidates.map(candidate => {
              const result = mlResults[candidate.id]
              const isResultVisible = visibleResults.has(candidate.id)
              return (
                <Card
                  key={candidate.id}
                  className="border border-border/60 hover:border-border transition-colors cursor-pointer"
                  onClick={() => openForm(candidate.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                          {getStatusBadge(candidate.status)}
                          {candidate.isSaved && (
                            <span className="text-[11px] bg-status-stable/10 text-status-stable border border-status-stable/20 px-2 py-0.5 rounded-full font-medium">
                              면접 완료
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span>생년월일: {candidate.birthDate}</span>
                          <span className="text-border">•</span>
                          <span>지원 과정: {candidate.appliedCourse}</span>
                        </div>
                      </div>

                      {candidate.isSaved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleResultVisible(candidate.id)
                          }}
                        >
                          결과 확인
                        </Button>
                      )}
                    </div>

                    {candidate.isSaved && isResultVisible && result && (
                      <div className="mt-3 border-t border-border/60 pt-3 space-y-3">
                        <div className="text-xs">
                          <p className="text-muted-foreground">ML 예측 결과</p>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="font-medium text-foreground">점수: {(result.score * 100).toFixed(1)}</span>
                            <span className={cn("font-semibold", getRiskLevelClass(result.level))}>위험도: {result.level}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDecisionFromList(candidate.id, "HOLD")
                            }}
                            className="h-8 gap-1.5 text-xs border-risk-medium/40 text-risk-medium hover:bg-risk-medium/8 hover:border-risk-medium/60"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            보류
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDecisionFromList(candidate.id, "FAILED")
                            }}
                            className="h-8 gap-1.5 text-xs border-risk-high/40 text-risk-high hover:bg-risk-high/8 hover:border-risk-high/60"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            불합격
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDecisionFromList(candidate.id, "PASSED")
                            }}
                            className="h-8 gap-1.5 text-xs bg-risk-low text-white hover:bg-risk-low/90"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            합격
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (!selectedCandidate) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-sm text-muted-foreground">선택된 지원자를 찾을 수 없습니다.</p>
          <Button variant="outline" size="sm" onClick={goToList}>목록으로</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-shrink-0 border-b border-border/60 bg-card/60 backdrop-blur-sm px-5 py-3.5">
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={goToList}>
          <ChevronLeft className="w-3.5 h-3.5" />
          목록으로
        </Button>

        <div className="mt-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">{selectedCandidate.name}</h2>
            {getStatusBadge(selectedCandidate.status)}
            {selectedCandidate.isSaved && (
              <span className="text-[11px] bg-status-stable/10 text-status-stable border border-status-stable/20 px-2 py-0.5 rounded-full font-medium">
                면접 완료
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span>생년월일: {selectedCandidate.birthDate}</span>
            <span className="text-border">•</span>
            <span>지원 과정: {selectedCandidate.appliedCourse}</span>
          </div>
        </div>

        {saveError && (
          <p className="mt-2 text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-1.5">
            {saveError}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
        {evaluationCategories.map((category) => (
          <EvaluationCard
            key={category.key}
            category={category}
            value={selectedCandidate.evaluation[category.key]}
            onChange={(field, val) => updateEvaluationLocal(category.key, field, val)}
          />
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-border/60 bg-card/70 backdrop-blur-sm px-5 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {totalCandidatesCount > 0 && (
            <div className="text-xs text-muted-foreground">
              평가 완료 <span className="font-semibold text-foreground tabular-nums">{completedCount}</span>
              <span className="text-muted-foreground/60"> / {totalCandidatesCount}명</span>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={saveStatus === "saving" || isSaving}
            className="h-8 gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saveStatus === "saving" ? "저장 중..." : saveStatus === "saved" ? "저장됨" : "저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
