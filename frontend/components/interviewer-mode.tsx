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
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
            {category.key === "achievement" ? "1" : category.key === "adaptability" ? "2" : "3"}
          </span>
          {category.title}
        </CardTitle>
        <p className="text-sm text-primary font-medium mt-1">{category.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3 border-l-2 border-primary">
          <p className="text-sm text-foreground leading-relaxed">
            {category.question}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            평가 의견
          </label>
          <Textarea
            value={value.answer}
            onChange={(e) => onChange("answer", e.target.value)}
            placeholder="지원자에 대한 평가 의견을 작성하세요..."
            className="resize-none h-20 text-sm"
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">면접관 체크 항목</p>
          <ul className="space-y-1.5">
            {category.checklist.map((item, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              평가 점수
            </label>
            <span className="text-sm font-semibold text-primary">{value.rating} / 5</span>
          </div>
          <Slider
            value={[value.rating]}
            onValueChange={([v]) => onChange("rating", v)}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={cn(
              "text-center p-2 rounded-md transition-all",
              value.rating === 1 ? "bg-risk-high/15 text-risk-high font-medium" : "text-muted-foreground"
            )}>
              <div className="font-semibold mb-0.5">1점</div>
              <div>{category.ratingCriteria[1]}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-md transition-all",
              value.rating === 3 ? "bg-risk-medium/15 text-risk-medium font-medium" : "text-muted-foreground"
            )}>
              <div className="font-semibold mb-0.5">3점</div>
              <div>{category.ratingCriteria[3]}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-md transition-all",
              value.rating === 5 ? "bg-risk-low/15 text-risk-low font-medium" : "text-muted-foreground"
            )}>
              <div className="font-semibold mb-0.5">5점</div>
              <div>{category.ratingCriteria[5]}</div>
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

  // Pending candidates derived from applicant context (reactive to new registrations)
  const candidates = useMemo(() => {
    return applicants
      .filter(a => (a.status === "PENDING_INTERVIEW" || a.status === "HOLD") && !decidedIds.has(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        birthDate: a.birthDate,
        appliedCourse: a.appliedCourse,
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
  }, [currentCandidate])

  const handleSave = useCallback(() => {
    if (!currentCandidate) return
    setSaveStatus("saving")
    const id = currentCandidate.id
    const evaluation = currentCandidate.evaluation
    ctxUpdateEvaluation(id, evaluation)
    ctxSaveEvaluation(id)
    setTimeout(() => {
      setSavedIds(prev => new Set(prev).add(id))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 400)
  }, [currentCandidate, ctxUpdateEvaluation, ctxSaveEvaluation])

  const handleDecision = useCallback((decision: "PASSED" | "FAILED" | "HOLD") => {
    if (!currentCandidate) return
    const id = currentCandidate.id

    // Sync local evaluation to context first
    ctxUpdateEvaluation(id, currentCandidate.evaluation)
    updateInterviewResult(id, decision)

    if (decision === "PASSED") {
      const student = convertToStudent(id)
      if (student) addStudent(student)
    }

    setDecidedIds(prev => new Set(prev).add(id))
    // Navigate: stay at same index (next candidate slides in) or step back if at end
    setCurrentIndex(prev => Math.max(0, Math.min(prev, candidates.length - 2)))
    setSaveStatus("idle")
  }, [currentCandidate, candidates.length, ctxUpdateEvaluation, updateInterviewResult, convertToStudent, addStudent])

  const goToPrevious = () => {
    if (safeIndex > 0) { setCurrentIndex(safeIndex - 1); setSaveStatus("idle") }
  }

  const goToNext = () => {
    if (safeIndex < candidates.length - 1) { setCurrentIndex(safeIndex + 1); setSaveStatus("idle") }
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
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">대기 중인 지원자가 없습니다</p>
          <p className="text-sm text-muted-foreground">멘토가 신규 지원자를 등록하면 여기에 표시됩니다.</p>
        </div>
      </div>
    )
  }

  if (!currentCandidate || !analysis) return null

  return (
    <div className="h-full flex flex-col">
      {/* TOP: Candidate Info + Navigation */}
      <div className="flex-shrink-0 border-b bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {currentCandidate.name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{currentCandidate.name}</h2>
                {currentCandidate.status === "HOLD" && (
                  <span className="text-xs bg-risk-medium/15 text-risk-medium px-2 py-0.5 rounded-full font-medium">
                    보류
                  </span>
                )}
                {currentCandidate.isSaved && (
                  <span className="text-xs text-risk-low flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    저장됨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>생년월일: {currentCandidate.birthDate}</span>
                <span>•</span>
                <span>지원 과정: {currentCandidate.appliedCourse}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={safeIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              이전 지원자
            </Button>

            <div className="px-3 py-1 rounded-md bg-muted text-sm font-medium">
              {safeIndex + 1} / {candidates.length}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={safeIndex === candidates.length - 1}
              className="gap-1"
            >
              다음 지원자
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-border mx-2" />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saveStatus === "saving" ? "저장 중..." : saveStatus === "saved" ? "저장됨" : "임시 저장"}
            </Button>
          </div>
        </div>
      </div>

      {/* MIDDLE: Left (Evaluation) + Right (Analysis) */}
      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0 overflow-hidden">
        {/* LEFT: Evaluation Cards */}
        <div className="overflow-y-auto p-6 space-y-4">
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
        <div className="border-l bg-muted/30 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Risk Score */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  위험 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RiskGauge score={analysis.riskScore} level={analysis.riskLevel} />
              </CardContent>
            </Card>

            {/* Risk Level */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2">위험 수준</p>
                  <span
                    className={cn(
                      "inline-block px-4 py-2 rounded-full text-sm font-semibold",
                      analysis.riskLevel === "LOW" && "bg-risk-low/20 text-risk-low",
                      analysis.riskLevel === "MEDIUM" && "bg-risk-medium/20 text-risk-medium",
                      analysis.riskLevel === "HIGH" && "bg-risk-high/20 text-risk-high"
                    )}
                  >
                    {riskLevelLabels[analysis.riskLevel]}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Candidate Type */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  유사 지원자 유형
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clusters.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                        c.id === analysis.cluster
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                          c.id === analysis.cluster
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {c.id}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          c.id === analysis.cluster
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {c.label}
                      </span>
                      {c.id === analysis.cluster && (
                        <span className="ml-auto text-xs font-medium text-primary">일치</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI 분석 설명
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis.explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* BOTTOM: Actions */}
      <div className="flex-shrink-0 border-t bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            평가 완료:{" "}
            <span className="font-medium text-foreground">{completedCount}</span>{" "}
            / {applicants.length} 명
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saveStatus === "saving" ? "저장 중..." : "임시 저장"}
            </Button>

            <div className="w-px h-8 bg-border" />

            {/* Decision buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecision("HOLD")}
              className="gap-1.5 border-risk-medium/50 text-risk-medium hover:bg-risk-medium/10"
            >
              <Clock className="w-4 h-4" />
              보류
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecision("FAILED")}
              className="gap-1.5 border-risk-high/50 text-risk-high hover:bg-risk-high/10"
            >
              <ThumbsDown className="w-4 h-4" />
              불합격
            </Button>

            <Button
              size="sm"
              onClick={() => handleDecision("PASSED")}
              className="gap-1.5 bg-risk-low text-white hover:bg-risk-low/90"
            >
              <ThumbsUp className="w-4 h-4" />
              합격
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
