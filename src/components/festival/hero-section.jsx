"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Gamepad2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/utils/cn"

export function FestivalHeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[60vh] overflow-hidden bg-[#1a0a2e] rounded-3xl mb-16 border border-white/5">
      {/* 背景水印图案 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-6xl md:text-8xl font-bold text-white"
            style={{
              left: `${(i % 4) * 25}%`,
              top: `${Math.floor(i / 4) * 33}%`,
              transform: `rotate(${Math.random() * 20 - 10}deg)`,
            }}
          >
            2026
          </span>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧内容 */}
          <div
            className={cn(
              "space-y-6 transition-all duration-1000",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            )}
          >
            {/* 徽章 - 像素风格 */}
            <div className="inline-block">
              <div className="relative bg-[#fbbf24] px-6 py-4 rounded-lg shadow-lg border-4 border-black/20">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-black/20 rounded-sm" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-black/20 rounded-sm" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black/20 rounded-sm" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black/20 rounded-sm" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-black/70 tracking-widest uppercase">游戏盛典</p>
                  <p className="text-5xl md:text-6xl font-black text-black">2026</p>
                  <p className="text-sm font-bold text-black/70">年度盛典</p>
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              全球游戏节正式启动！
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
              汇聚全球顶级游戏厂商，展示最新游戏大作与独立精品。这是一场玩家的狂欢盛宴！
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/festival"
                className="bg-[#ff00ff] text-black hover:bg-[#d900d9] px-8 py-3 rounded-full font-bold flex items-center transition-all group"
              >
                进入分会场
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

          {/* 右侧装饰 - 动态游戏手柄 */}
          <div
            className={cn(
              "relative transition-all duration-1000 delay-300",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            )}
          >
            <div className="relative aspect-square max-w-md mx-auto flex items-center justify-center">
              {/* 背景光效 */}
              <div className="absolute inset-0 bg-[#ff00ff]/20 rounded-full blur-3xl animate-pulse" />
              
              {/* 动态手柄图标 */}
              <div className="relative z-10">
                <div className="relative">
                  <Gamepad2 
                    className="w-40 h-40 md:w-56 md:h-56 text-white/90 animate-bounce" 
                    style={{ animationDuration: "3s" }} 
                  />
                  {/* 装饰元素 */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-[#fbbf24] rounded-full animate-ping opacity-75" style={{ animationDuration: "2s" }} />
                  <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#dc2626] rounded-full animate-ping opacity-75" style={{ animationDuration: "2.5s" }} />
                  <div className="absolute top-1/2 -right-10 w-6 h-6 bg-[#3b82f6] rounded-full animate-ping opacity-75" style={{ animationDuration: "1.8s" }} />
                  
                  {/* 漂浮的小方块 - 增加科技感 */}
                  <div className="absolute -top-12 left-1/2 w-4 h-4 bg-white/20 rotate-45 animate-pulse" />
                  <div className="absolute bottom-10 -right-12 w-3 h-3 bg-white/30 rotate-12 animate-pulse delay-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰锯齿 */}
      <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
        <div 
          className="flex w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div 
              key={i} 
              className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-[#0d0221]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
