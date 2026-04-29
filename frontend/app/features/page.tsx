import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowLeft } from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0f0f1a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            메인으로
          </Link>
          <Link href="/ai-test">
            <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent text-xs">
              🧪 AI 파이프라인 직접 실행
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <ScrollReveal>
          <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase mb-4">
            핵심 기능 소개
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            중도탈락 방지를 위한<br />
            <span className="text-primary">3단계 AI 시스템</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto">
            면접 단계부터 수료까지 — 데이터 기반으로 위험을 감지하고,
            멘토가 정확한 타이밍에 개입합니다.
          </p>
        </ScrollReveal>
      </section>

      {/* Feature 1: 면접 ML */}
      <section className="bg-[#13131f] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-3xl">🎯</span>
              <div>
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">Feature 1</span>
                <h2 className="text-3xl font-bold mt-1">면접 단계 위험도 예측 ML</h2>
                <p className="text-white/50 mt-2 leading-relaxed">
                  입과 전에 이미 위험을 감지합니다. 면접 채점 즉시 중도탈락 가능성을 예측해 선제적으로 대응합니다.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Pipeline flow */}
          <ScrollReveal direction="up" delay={100}>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-stretch gap-0 w-fit mx-auto min-w-full md:min-w-0">
                {[
                  { num: "01", icon: "🗃️", title: "중탈 데이터 수집", desc: "과거 중도탈락자·수료자의\n면접 응답 이력" },
                  { num: "02", icon: "🤖", title: "ML 모델 학습",    desc: "RandomForest로\n0/1 레이블 패턴 학습" },
                  { num: "03", icon: "📝", title: "면접 채점",        desc: "성취도·적응도·인간관계\n3항목 구조화 평가" },
                  { num: "04", icon: "⚡", title: "위험도 예측",      desc: "dropout_risk_score\n0~1 즉시 산출" },
                  { num: "05", icon: "🎯", title: "입과 결정",        desc: "데이터 기반\n합격·보류·불합격" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center flex-1 min-w-[140px]">
                    <div className={`flex-1 rounded-2xl p-5 border ${
                      i === 2 || i === 3
                        ? "border-primary/40 bg-primary/[0.06]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}>
                      <div className="text-2xl mb-3">{step.icon}</div>
                      <div className="text-[10px] font-bold text-primary/60 tracking-widest mb-1">{step.num}</div>
                      <div className="text-sm font-semibold text-white mb-1.5 leading-snug">{step.title}</div>
                      <div className="text-[11px] text-white/40 leading-relaxed whitespace-pre-line">{step.desc}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="px-2 flex-shrink-0">
                        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Detail cards */}
          <ScrollReveal direction="up" delay={150}>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {[
                { icon: "📊", title: "3개 평가 지표", desc: "성취동기·사회적응력·대인관계를 1~5점으로 정량화하여 ML 입력값으로 사용합니다." },
                { icon: "🌲", title: "RandomForest 모델", desc: "과거 수료자·중도탈락자 데이터로 학습된 분류 모델이 면접 채점 즉시 위험도를 계산합니다." },
                { icon: "🔍", title: "유사 사례 매칭", desc: "현재 지원자와 유사한 패턴의 과거 사례를 참조해 면접관의 판단을 보조합니다." },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                  <span className="text-xl">{c.icon}</span>
                  <p className="text-sm font-semibold text-white">{c.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature 2: 과정 중 이상탐지 */}
      <section className="bg-[#0f0f1a] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-3xl">🔄</span>
              <div>
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">Feature 2</span>
                <h2 className="text-3xl font-bold mt-1">과정 중 이상탐지 & 자동 조치</h2>
                <p className="text-white/50 mt-2 leading-relaxed">
                  매일 쌓이는 설문 데이터를 AI가 분석해 위험 징후를 조기에 포착하고, 상황에 맞는 조치를 자동으로 결정합니다.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* 4-step pipeline */}
          <ScrollReveal direction="up" delay={100}>
            <div className="relative border border-white/[0.08] rounded-3xl p-8 bg-white/[0.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-primary bg-[#0f0f1a] border border-white/10 px-3 py-1 rounded-full">
                  ↻ 매일 자동 실행되는 파이프라인
                </span>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-stretch gap-0 min-w-[560px]">
                  {[
                    { icon: "📋", title: "일일 설문",    desc: "성취도·적응도\n인간관계 3항목 측정" },
                    { icon: "📊", title: "7일 누적",     desc: "평균·변화량\n4개 feature 생성" },
                    { icon: "🧠", title: "ML 위험 예측", desc: "risk_score·level\n·trend 계산" },
                    { icon: "🤔", title: "LLM 해석",     desc: "위험 원인 분석\n상태 요약 생성" },
                    { icon: "⚙️", title: "Agent 조치",   desc: "격려·알림·미팅\n액션 타입 자동 결정" },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex-1 border border-white/10 rounded-xl p-4 bg-white/[0.03]">
                        <div className="text-lg mb-2">{step.icon}</div>
                        <div className="text-xs font-semibold text-white mb-1 leading-tight">{step.title}</div>
                        <div className="text-[11px] text-white/40 leading-relaxed whitespace-pre-line">{step.desc}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="px-2 flex-shrink-0">
                          <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Action types */}
          <ScrollReveal direction="up" delay={150}>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Agent가 결정하는 조치 유형</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { level: "LOW",    icon: "💬", action: "ENCOURAGE_MESSAGE", title: "격려 메시지", desc: "위험도 낮음 — AI가 자동으로 학생에게 격려 메시지 전송", color: "border-green-500/30 bg-green-500/[0.05]", badge: "text-green-400" },
                { level: "MEDIUM", icon: "🔔", action: "ALERT_MENTOR",      title: "멘토 알림",  desc: "위험도 중간 — 멘토 대시보드에 알림 등록 및 모니터링 강화", color: "border-yellow-500/30 bg-yellow-500/[0.05]", badge: "text-yellow-400" },
                { level: "HIGH",   icon: "📅", action: "REQUEST_MEETING",   title: "미팅 요청",  desc: "위험도 높음 — AI가 자동으로 상담 미팅 일정 요청 생성", color: "border-orange-500/30 bg-orange-500/[0.05]", badge: "text-orange-400" },
                { level: "CRITICAL", icon: "🚨", action: "EMERGENCY",      title: "긴급 개입",  desc: "위험도 최고 — 긴급 미팅 + 멘토에게 즉시 알림 발송", color: "border-red-500/30 bg-red-500/[0.05]", badge: "text-red-400" },
              ].map((a) => (
                <div key={a.action} className={`rounded-xl border p-4 space-y-2 ${a.color}`}>
                  <span className="text-xl">{a.icon}</span>
                  <p className={`text-xs font-bold uppercase tracking-wider ${a.badge}`}>{a.level}</p>
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature 3: 피드백 반영 */}
      <section className="bg-[#13131f] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-3xl">📈</span>
              <div>
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">Feature 3</span>
                <h2 className="text-3xl font-bold mt-1">피드백 기반 모델 재학습</h2>
                <p className="text-white/50 mt-2 leading-relaxed">
                  멘토의 케어 결과가 AI 학습 데이터로 쌓입니다. 오탐이 줄고, 개입 타이밍이 점점 정확해집니다.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Feedback loop */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">피드백 루프</h3>
                <div className="space-y-3">
                  {[
                    { icon: "1️⃣", text: "AI가 위험 감지 → 멘토에게 개입 권고" },
                    { icon: "2️⃣", text: "멘토가 학생과 상담 후 결과 입력" },
                    { icon: "3️⃣", text: "오탐 / 회복 / 지속 관찰 중 선택" },
                    { icon: "4️⃣", text: "피드백이 ML 재학습 데이터로 저장" },
                    { icon: "5️⃣", text: "다음 분석부터 더 정확한 판단 반영" },
                  ].map((s) => (
                    <div key={s.icon} className="flex items-center gap-3 text-sm text-white/70">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback types */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">멘토 피드백 유형</h3>
                <div className="space-y-3">
                  {[
                    { icon: "✅", title: "오탐이었음",    desc: "이 학생의 자연스러운 패턴 — AI 민감도 조정에 반영", color: "text-green-400" },
                    { icon: "🔄", title: "개입 후 회복",  desc: "회복까지 걸린 일수 기록 — 회복 예측 모델 학습 데이터", color: "text-blue-400" },
                    { icon: "👀", title: "지속 관찰 필요", desc: "개선 없음 — 장기 위험군으로 분류하여 우선순위 상향", color: "text-yellow-400" },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-3">
                      <span className="text-lg">{f.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${f.color}`}>{f.title}</p>
                        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature 4: 멘토 케어 */}
      <section className="bg-[#0f0f1a] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="flex items-start gap-4 mb-8">
              <span className="text-3xl">🤝</span>
              <div>
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">Feature 4</span>
                <h2 className="text-3xl font-bold mt-1">멘토 케어 시스템</h2>
                <p className="text-white/50 mt-2 leading-relaxed">
                  AI가 위험을 감지하면 멘토가 정확한 타이밍에 개입합니다. 메시지부터 미팅까지 모든 케어 흐름을 한 곳에서 관리합니다.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: "📊", title: "학생 현황 대시보드", desc: "전체 학생의 위험도·상태를 한눈에 파악. 케어 필요 학생만 필터링해 우선순위 관리." },
                { icon: "💬", title: "격려 메시지 전송",   desc: "프리셋 또는 커스텀 메시지를 학생 앱에 즉시 전달. 학생이 읽으면 읽음 처리 자동 반영." },
                { icon: "📅", title: "미팅 일정 조율",     desc: "멘토가 가능한 시간 슬롯 제안 → 학생이 선택 → 멘토 확정. 양방향 일정 협의 시스템." },
                { icon: "⚠️", title: "케어 필요 알림",    desc: "AI가 위험도 MEDIUM 이상 감지 시 멘토 대시보드에 즉시 알림. 골든타임 내 개입 가능." },
                { icon: "✅", title: "케어 완료 처리",     desc: "개입 결과를 오탐·회복·관찰 중 선택해 기록. 케어 완료 시 ML 재학습 데이터로 반영." },
                { icon: "📈", title: "AI 인사이트 열람",  desc: "학생별 LLM 분석 요약, 위험도 추이 차트, 설문 이력을 상세 페이지에서 확인." },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors">
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-sm font-semibold text-white">{c.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#13131f] py-20 px-6 text-center">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">지금 바로 체험해보세요</h2>
            <p className="text-white/50 leading-relaxed">
              AI 파이프라인을 직접 실행하거나, 로그인해서 전체 시스템을 사용해보세요.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Link href="/ai-test">
                <Button size="lg" className="px-8 gap-2">
                  🧪 AI 파이프라인 테스트
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white">
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-6 px-6 text-center">
        <p className="text-white/20 text-xs">© 2026 중탈 멈춰 !</p>
      </footer>
    </div>
  )
}
