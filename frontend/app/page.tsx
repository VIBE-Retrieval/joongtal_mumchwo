import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LandingFeatureCards } from "@/components/landing-feature-cards"

const features = [
  {
    icon: "📊",
    title: "AI 기반 위험 분석",
    description: "머신러닝을 활용한 정교한 학생 이탈 예측 시스템"
  },
  {
    icon: "🔔",
    title: "실시간 알림",
    description: "위험 신호 감지 시 즉각적인 멘토 알림 제공"
  },
  {
    icon: "💬",
    title: "맞춤형 개입",
    description: "학생별 상황에 맞는 지원 전략 추천"
  },
  {
    icon: "📈",
    title: "트렌드 분석",
    description: "시간에 따른 학생 상태 변화 추적 및 시각화"
  }
]

const roles = [
  {
    role: "student",
    icon: "🎓",
    title: "학생",
    description: "자신의 상태를 기록하고 AI의 맞춤형 피드백을 받아보세요. 슬라이더를 통해 간편하게 오늘의 감정과 적응 상태를 표현할 수 있습니다.",
    features: ["일일 상태 체크인", "7일 트렌드 확인", "AI 격려 메시지"]
  },
  {
    role: "interviewer",
    icon: "📋",
    title: "면접관",
    description: "체계적인 면접 프로세스를 통해 지원자를 평가하세요. 실시간 위험도 분석과 유사 학생 군집 정보를 제공합니다.",
    features: ["구조화된 질문 카드", "실시간 위험 게이지", "유사 군집 매칭"]
  },
  {
    role: "mentor",
    icon: "🧑‍🏫",
    title: "멘토",
    description: "네트워크 맵을 통해 담당 학생들의 상태를 한눈에 파악하고 적시에 개입하세요. AI가 권장 조치를 제안합니다.",
    features: ["학생 네트워크 맵", "AI 인사이트", "즉시 개입 도구"]
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <span className="font-semibold text-lg">학생 인사이트</span>
          </div>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </header>

      {/* Hero — 첫 화면: 헤더 제외 나머지 뷰포트만 사용 (아래 섹션 노출 방지) */}
      <section
        className="min-h-[calc(100dvh-4rem)] flex flex-col justify-center px-6 py-10 md:py-12 box-border"
        aria-label="소개"
      >
        <div className="max-w-4xl mx-auto w-full text-center space-y-6">
          <h1 className="font-paperozi-hero text-4xl md:text-5xl text-foreground leading-tight text-balance">
            놓치기 전에, 먼저 발견하세요
          </h1>
          <p className="font-paperozi-subtitle text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            학생의 중탈 신호를 AI로 예측하고, 적시에 개입합니다
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
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
      </section>

      {/* Features */}
      <section
        id="features"
        className="min-h-screen flex flex-col justify-center px-6 py-12 md:py-16 bg-muted/30 border-t border-border/40 box-border"
        aria-labelledby="features-heading"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10 md:mb-12">
            <h2 id="features-heading" className="text-2xl font-semibold mb-3">
              핵심 기능
            </h2>
            <p className="text-muted-foreground">데이터 기반의 스마트한 학생 관리</p>
          </div>
          <LandingFeatureCards features={features} />
        </div>
      </section>

      {/* Roles */}
      <section
        id="roles"
        className="min-h-screen flex flex-col justify-center px-6 py-12 md:py-16 border-t border-border/40 box-border"
        aria-labelledby="roles-heading"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10 md:mb-12">
            <h2 id="roles-heading" className="text-2xl font-semibold mb-3">
              역할별 맞춤 인터페이스
            </h2>
            <p className="text-muted-foreground">각 역할에 최적화된 도구와 화면을 제공합니다</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <Card key={i} className="border-0 shadow-md bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-3xl">{role.icon}</span>
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Footer — 한 화면 단위 */}
      <section
        className="min-h-screen flex flex-col px-6 bg-gradient-to-br from-primary/5 to-transparent border-t border-border/40 box-border"
        aria-labelledby="cta-heading"
      >
        <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-16 min-h-0">
          <div className="max-w-2xl mx-auto w-full text-center space-y-6">
            <h2 id="cta-heading" className="text-2xl font-semibold">
              지금 바로 시작하세요
            </h2>
            <p className="text-muted-foreground">학생의 성공을 위한 첫 걸음을 내딛으세요</p>
            <Link href="/login">
              <Button size="lg" className="px-10">
                로그인
              </Button>
            </Link>
          </div>
        </div>
        <footer className="shrink-0 py-8 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground px-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>학생 인사이트</span>
            </div>
            <p>AI 기반 학생 위험 관리 시스템</p>
          </div>
        </footer>
      </section>
    </div>
  )
}
