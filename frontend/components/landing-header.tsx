"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const HEADER_H = 64

export function LandingHeader() {
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("landing-hero")
      if (!hero) return
      setPastHero(hero.getBoundingClientRect().bottom <= HEADER_H)
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-md",
        "transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        pastHero
          ? "bg-background/95 border-border shadow-sm"
          : "bg-white/10 border-white/20 dark:bg-black/20 dark:border-white/10 shadow-none"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="중탈 멈춰 로고"
            className="h-8 w-auto object-contain"
          />
          <span
            className={cn(
              "font-semibold text-base tracking-tight transition-colors duration-300 ease-out",
              pastHero
                ? "text-foreground"
                : "text-white drop-shadow-sm"
            )}
          >
            중탈 멈춰 !
          </span>
        </div>
        <Link href="/login">
          <Button
            variant={pastHero ? "default" : "ghost"}
            className={cn(
              "transition-[background-color,color,border-color,box-shadow] duration-300 ease-out",
              !pastHero &&
                "border border-white/40 bg-white/20 text-white shadow-none hover:bg-white/30 hover:text-white"
            )}
          >
            로그인
          </Button>
        </Link>
      </div>
    </header>
  )
}
