"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export interface LandingFeatureItem {
  icon: string
  title: string
  description: string
}

export function LandingFeatureCards({ features }: { features: LandingFeatureItem[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const count = features.length

  const onSelect = useCallback((carousel: CarouselApi | undefined) => {
    if (!carousel) return
    setCurrent(carousel.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api, onSelect])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {features.map((feature) => (
            <CarouselItem key={feature.title} className="pl-2 md:pl-4 basis-full">
              <div className="px-2 md:px-6 py-4">
                <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="flex flex-col items-center justify-center text-center gap-4 py-12 md:py-16 px-6 md:px-10 min-h-[280px] md:min-h-[320px]">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl" aria-hidden>
                        {feature.icon}
                      </span>
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className={cn(
            "size-9 md:size-10 -translate-y-1/2",
            "left-0 sm:left-1 md:-left-4 border-border/80 bg-background/90 shadow-sm"
          )}
        />
        <CarouselNext
          className={cn(
            "size-9 md:size-10 -translate-y-1/2",
            "right-0 sm:right-1 md:-right-4 border-border/80 bg-background/90 shadow-sm"
          )}
        />
      </Carousel>

      <div
        className="flex justify-center gap-2 mt-6"
        role="tablist"
        aria-label="핵심 기능 슬라이드"
      >
        {features.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={current === i}
            aria-label={`${i + 1}번째 기능`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              current === i
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => api?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
