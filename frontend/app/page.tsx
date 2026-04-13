import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"
import { LandingStudentNetworkLazy } from "@/components/landing-student-network-lazy"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero — 전체 뷰포트 (헤더가 overlay되므로 100dvh) */}
      <section
        id="landing-hero"
        className="relative min-h-screen flex items-center overflow-hidden box-border"
        aria-label="소개"
      >
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/main.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-10 bg-black/50" />

        {/* Content — left aligned */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-10 md:py-12">
          <div className="max-w-xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight text-balance drop-shadow-lg">
              놓치기 전에, 먼저 발견하세요
            </h1>
            <p className="text-lg text-white/80 leading-relaxed text-pretty drop-shadow">
              학생의 중탈 신호를 AI로 예측하고, 적시에 개입합니다
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="px-8">
                  시작하기
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <a href="#features">더 알아보기</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Features ──────────────────────────────── */}
      <section
        id="features"
        className="min-h-screen flex items-center bg-[#1e1e2e] px-6 py-20"
        aria-labelledby="features-heading"
      >
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <ScrollReveal direction="left">
            <div className="space-y-8">
              <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase">
                AI 위험 분석 엔진
              </span>
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-white leading-tight">
                위험 신호를 실시간으로<br />감지하고 분석합니다
              </h2>
              <p className="text-neutral-400 leading-relaxed">
                머신러닝 모델이 매일 학생의 상태를 분석해<br />
                중도탈락 위험을 조기에 발견합니다.
              </p>
              <ul className="space-y-5">
                {[
                  { icon: "📊", title: "AI 기반 위험 분석", desc: "4-7-1 신경망으로 위험도를 0~1 수치로 정밀 계산" },
                  { icon: "🔔", title: "실시간 알림",       desc: "위험 신호 감지 즉시 담당 멘토에게 자동 알림" },
                  { icon: "💬", title: "맞춤형 개입",       desc: "학생 유형별 최적화된 지원 전략 자동 제안" },
                  { icon: "📈", title: "트렌드 분석",       desc: "7일 단위 상태 변화를 시각화하여 추적" },
                ].map((f, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{f.title}</div>
                      <div className="text-neutral-400 text-sm mt-0.5">{f.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Right — mock dashboard */}
          <ScrollReveal direction="right" delay={150}>
            <div className="rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl shadow-primary/15">
              {/* browser chrome */}
              <div className="bg-neutral-900 px-4 py-3 flex items-center gap-2 border-b border-neutral-800">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-neutral-500 text-xs ml-3 select-none">학생 위험도 대시보드</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
                alt="AI 분석 대시보드"
                className="w-full object-cover"
              />
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ── Section 3: 유사도 네트워크 맵 ────────────────────── */}
      {/* 밝은 배경 — 다크 카드가 강조 요소로 돋보이도록 */}
      <section
        id="similarity-map"
        className="min-h-screen flex items-center bg-[#F7F3EF] px-6 py-20"
        aria-labelledby="similarity-heading"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal direction="left">
              <div className="space-y-6 lg:max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  AI 위험군 분석
                </p>
                <h2
                  id="similarity-heading"
                  className="text-3xl font-semibold leading-[1.2] tracking-tight text-neutral-900 text-balance md:text-4xl"
                >
                  비슷한 패턴에서<br />위험 신호를 읽습니다
                </h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-600 md:text-base">
                  {`AI가 수천 명의 학생 데이터에서 패턴을 학습해
과거에 중도탈락한 학생들과 유사한 상태의
재학생을 조기에 감지합니다.`}
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {["과거 데이터 기반 학습", "위험 패턴 자동 감지", "조기 개입 권고"].map((kw) => (
                    <li
                      key={kw}
                      className="rounded-full border border-neutral-300 bg-white/70 px-3 py-1 text-xs text-neutral-600"
                    >
                      {kw}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={90}>
              {/* 캔버스 자체가 어두운 배경 — 밝은 페이지 위 다크 카드 효과 */}
              <LandingStudentNetworkLazy />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Section 4: Roles ─────────────────────────────────── */}
      <section
        id="roles"
        className="min-h-screen flex items-center bg-white dark:bg-neutral-900 px-6 py-20"
        aria-labelledby="roles-heading"
      >
        <div className="max-w-6xl mx-auto w-full">

          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase mb-3">
                역할별 워크플로우
              </span>
              <h2 id="roles-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">
                모든 구성원을 위한<br />맞춤형 인터페이스
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {[
              {
                label: "학생",
                badge: "🎓",
                title: "매일 3분으로\n상태를 기록하세요",
                desc: "간단한 슬라이더 체크인으로 성취감·적응도·관계를 기록합니다. AI가 7일 트렌드를 분석해 격려 메시지를 전달합니다.",
                features: ["일일 상태 체크인", "7일 트렌드 그래프", "AI 격려 메시지"],
                img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
                delay: 0,
              },
              {
                label: "면접관",
                badge: "📋",
                title: "면접에서 위험을\n미리 파악하세요",
                desc: "구조화된 평가 항목으로 지원자의 중탈 가능성을 면접 단계에서 예측합니다. 실시간 위험 게이지와 유사 사례를 함께 제공합니다.",
                features: ["구조화 평가 카드", "실시간 위험 게이지", "유사 군집 매칭"],
                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
                delay: 100,
              },
              {
                label: "멘토",
                badge: "🧑‍🏫",
                title: "위험 학생을\n한눈에 파악하세요",
                desc: "네트워크 맵으로 담당 학생 전체를 모니터링합니다. AI가 개입 우선순위와 권장 조치를 자동으로 제안합니다.",
                features: ["학생 네트워크 맵", "AI 개입 제안", "즉시 상담 요청"],
                img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80",
                delay: 200,
              },
            ].map((role, i) => (
              <ScrollReveal key={i} delay={role.delay} direction="up" className="h-full">
                <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950 shadow-sm hover:shadow-lg transition-shadow duration-300">
                  {/* image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={role.img}
                      alt={role.label}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                      {role.badge} {role.label}
                    </span>
                  </div>
                  {/* content */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-snug whitespace-pre-line">
                      {role.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {role.desc}
                    </p>
                    <ul className="flex flex-col gap-2 pt-1">
                      {role.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ── Section 5: Stats + CTA + Footer ─────────────────── */}
      {/* 히어로/피처와 같은 다크 톤으로 마무리 — 페이지 수미상관 */}
      <section
        className="flex flex-col bg-[#13131f]"
        aria-labelledby="cta-heading"
      >
        {/* Stats — 카드 스타일 */}
        <ScrollReveal>
          <div className="max-w-5xl mx-auto w-full px-6 pt-24 pb-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { num: "94%",   label: "위험 감지 정확도",      accent: "#FFA500", sub: "검증된 AI 예측 모델" },
                { num: "3분",   label: "하루 평균 체크인 시간",  accent: "#6ec985", sub: "부담 없는 일일 루틴" },
                { num: "실시간", label: "멘토 알림 속도",        accent: "#5eb8e5", sub: "골든타임 내 개입 가능" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] px-8 py-8"
                >
                  {/* 좌측 액센트 바 */}
                  <div
                    className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                    style={{ background: s.accent }}
                  />
                  <div
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    style={{ color: s.accent }}
                  >
                    {s.num}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white/90">{s.label}</div>
                  <div className="mt-1 text-xs text-white/40">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* CTA — 중앙 글로우 카드 */}
        <div className="flex-1 flex items-center justify-center px-6 py-24">
          <ScrollReveal delay={100}>
            <div className="relative max-w-2xl mx-auto text-center">
              {/* 배경 글로우 */}
              <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-full w-3/4 rounded-full bg-[#FFA500]/10 blur-3xl" />

              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#FFA500] mb-6">
                지금 시작하세요
              </span>
              <h2
                id="cta-heading"
                className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight text-balance"
              >
                학생의 신호를<br />먼저 읽는 AI
              </h2>
              <p className="mt-5 text-[15px] text-white/50 leading-relaxed">
                중도탈락의 징후는 데이터 안에 있습니다.<br />
                AI가 먼저 발견하고, 여러분이 먼저 행동합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="px-10 bg-[#FFA500] text-white hover:bg-[#e69400] border-0 shadow-[0_0_24px_rgba(255,165,0,0.35)] hover:shadow-[0_0_32px_rgba(255,165,0,0.5)] transition-shadow"
                  >
                    무료로 시작하기
                  </Button>
                </Link>
                <Link href="/ai-test">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 border-white/20 text-white/80 hover:bg-white/[0.06] hover:text-white hover:border-white/40"
                  >
                    AI 테스트 해보기
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Footer */}
        <footer className="shrink-0 py-8 border-t border-white/[0.07] px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="로고" className="h-6 w-auto object-contain opacity-90" />
              <span className="font-semibold text-white/80 text-sm">중탈 멈춰 !</span>
            </div>
            <p className="text-xs text-white/30">AI 기반 학생 위험 관리 시스템</p>
          </div>
        </footer>
      </section>
    </div>
  )
}
