"use client"

import { ChevronRight, Play } from "lucide-react"
import Link from "next/link"
import { cn } from "@/utils/cn"
import { useEffect, useRef, useState } from "react"
import { SmartImage } from "@/components/common/smart-image"
import { getChineseName } from "@/config"

// ============================================
// 1. 倾斜画廊卡片 - 水平滚动用
// ============================================
export function TiltedGalleryCard({ gameid, image, alt, title, category, className }) {
  const displayTitle = title || alt
  return (
    <Link
      href={`/games/${gameid}`}
      className={cn(
        "relative w-52 h-64 flex-shrink-0 rounded-2xl overflow-hidden block",
        "hover:scale-105 cursor-pointer group transition-all duration-300 shadow-xl border border-white/5",
        className
      )}
    >
      <SmartImage src={image} alt={displayTitle} gameid={gameid} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      
      {/* 信息标签 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        {category && (
          <span className="text-[10px] text-[#fbbf24] font-bold uppercase tracking-wider">
            {category}
          </span>
        )}
        <h4 className="text-white font-bold text-sm truncate">{getChineseName(displayTitle)}</h4>
      </div>
    </Link>
  )
}

// ============================================
// 1.5 单行自动滚动
// ============================================
function ScrollRow({ games, speed = 50, direction = "left", className }) {
  const scrollRef = useRef(null)
  const animationRef = useRef()
  const lastTimeRef = useRef(0)
  const scrollPositionRef = useRef(0)
  const isPausedRef = useRef(false)
  const initializedRef = useRef(false)

  const duplicatedGames = [...games, ...games, ...games]
  const singleSetWidth = (208 + 24) * games.length

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    if (!initializedRef.current && direction === "right") {
      scrollPositionRef.current = singleSetWidth
      scrollContainer.scrollLeft = singleSetWidth
      initializedRef.current = true
    }

    const animate = (currentTime) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      if (!isPausedRef.current) {
        const delta = (speed * deltaTime) / 1000

        if (direction === "left") {
          scrollPositionRef.current += delta
          if (scrollPositionRef.current >= singleSetWidth) {
            scrollPositionRef.current -= singleSetWidth
          }
        } else {
          scrollPositionRef.current -= delta
          if (scrollPositionRef.current <= 0) {
            scrollPositionRef.current += singleSetWidth
          }
        }

        scrollContainer.scrollLeft = scrollPositionRef.current
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [games.length, speed, direction, singleSetWidth])

  const handleMouseEnter = () => {
    isPausedRef.current = true
  }

  const handleMouseLeave = () => {
    isPausedRef.current = false
  }

  return (
    <div
      ref={scrollRef}
      className={cn("flex gap-6 overflow-x-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {duplicatedGames.map((game, index) => (
        <TiltedGalleryCard
          key={`${game.alt || game.title}-${index}`}
          {...game}
        />
      ))}
    </div>
  )
}

// ============================================
// 1.6 双行自动滚动画廊
// ============================================
export function AutoScrollGallery({ games, speed = 50, className }) {
  const midPoint = Math.ceil(games.length / 2)
  const topRowGames = games.slice(0, midPoint)
  const bottomRowGames = games.slice(midPoint)

  return (
    <div className={cn("flex flex-col gap-6 py-4", className)}>
      <ScrollRow games={topRowGames.length > 0 ? topRowGames : games} speed={speed} direction="left" />
      <ScrollRow games={bottomRowGames.length > 0 ? bottomRowGames : games} speed={speed} direction="right" />
    </div>
  )
}

// ============================================
// 2. 游戏发布卡片
// ============================================
export function GameReleaseCard({
  gameid,
  image,
  logo,
  title,
  releaseDate,
  platform,
  buttonText = "了解更多",
  className,
}) {
  return (
    <Link
      href={`/games/${gameid}`}
      className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all block group",
        "border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800",
        className
      )}
    >
      <div className="flex">
        <div className="w-40 md:w-56 h-44 flex-shrink-0 overflow-hidden rounded-lg m-3">
          <SmartImage src={image} alt={title} gameid={gameid} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="flex flex-col justify-center px-4 py-3">
          {logo ? (
            <img src={logo} alt={title} className="h-12 object-contain mb-2" />
          ) : (
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2 group-hover:text-[#ff00ff] transition-colors">{getChineseName(title)}</h3>
          )}
          <p className="text-neutral-700 dark:text-neutral-300 font-semibold">{releaseDate}</p>
          <p className="text-neutral-500 text-xs mt-1">可游玩平台</p>
          <span className="inline-block mt-1 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded-full w-fit">
            {platform}
          </span>
        </div>
      </div>
      <div className="w-full py-3 bg-neutral-900 text-white font-semibold hover:bg-[#ff00ff] transition-colors flex items-center justify-center gap-2 text-sm">
        {buttonText}
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  )
}

// ============================================
// 3. 深色游戏卡片
// ============================================
export function DarkGameCard({
  gameid,
  image,
  title,
  description,
  featured = false,
  className,
}) {
  return (
    <Link
      href={`/games/${gameid}`}
      className={cn(
        "bg-neutral-800 rounded-2xl overflow-hidden block transition-all",
        "hover:bg-neutral-700 cursor-pointer group shadow-xl",
        featured && "md:col-span-2 md:row-span-2",
        className
      )}
    >
      <div className={cn("overflow-hidden", featured ? "h-64" : "h-40")}>
        <SmartImage
          src={image}
          alt={title}
          gameid={gameid}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#ff00ff] transition-colors">{getChineseName(title)}</h3>
        <p className="text-neutral-300 text-sm leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}

// ============================================
// 4. 新闻卡片
// ============================================
export function NewsCard({ image, date, title, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all",
        "hover:-translate-y-1 cursor-pointer group",
        className
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.3) 2px,
              rgba(255,255,255,0.3) 4px
            )`,
          }}
        />
      </div>
      <div className="p-4">
        <p className="text-amber-700 dark:text-amber-500 font-semibold text-sm">{date}</p>
        <h3 className="text-neutral-800 dark:text-neutral-100 font-bold mt-2 leading-snug">{title}</h3>
      </div>
    </div>
  )
}

// ============================================
// 5. 四角装饰卡片
// ============================================
export function CornerDecorCard({
  image,
  title,
  description,
  buttonText = "了解更多",
  cornerColor = "bg-red-600",
  className,
}) {
  return (
    <div
      className={cn(
        "relative bg-white dark:bg-neutral-900 rounded-3xl border-4 border-red-600 p-8",
        "shadow-lg",
        className
      )}
    >
      <div className={cn("absolute top-3 left-3 w-3 h-3 rounded-full", cornerColor)} />
      <div className={cn("absolute top-3 right-3 w-3 h-3 rounded-full", cornerColor)} />
      <div className={cn("absolute bottom-3 left-3 w-3 h-3 rounded-full", cornerColor)} />
      <div className={cn("absolute bottom-3 right-3 w-3 h-3 rounded-full", cornerColor)} />

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-4">{title}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{description}</p>
          <button className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors inline-flex items-center gap-2">
            {buttonText}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {image && (
          <div className="flex-shrink-0">
            <img src={image} alt={title} className="w-40 h-40 object-contain" />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// 6. 锯齿边框促销卡片
// ============================================
export function JaggedPromoCard({
  gameid,
  image,
  title,
  description,
  className,
}) {
  return (
    <Link href={`/games/${gameid}`} className={cn("relative block group", className)}>
      <div
        className="absolute inset-0 bg-[#ff00ff]/20 group-hover:bg-[#ff00ff]/40 transition-colors"
        style={{
          clipPath: `polygon(
            0% 5%, 5% 0%, 10% 5%, 15% 0%, 20% 5%, 25% 0%, 30% 5%, 35% 0%, 40% 5%, 45% 0%, 50% 5%, 55% 0%, 60% 5%, 65% 0%, 70% 5%, 75% 0%, 80% 5%, 85% 0%, 90% 5%, 95% 0%, 100% 5%,
            100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0% 95%
          )`,
        }}
      />
      <div className="relative bg-neutral-900 border border-white/5 m-3 rounded-xl p-6 text-center transition-transform group-hover:scale-[1.02]">
        <SmartImage src={image} alt={title} gameid={gameid} className="w-32 h-32 mx-auto object-contain mb-4 group-hover:scale-110 transition-transform bg-transparent" />
        <h3 className="text-white font-black text-xl mb-2 group-hover:text-[#ff00ff] transition-colors">{getChineseName(title)}</h3>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
    </Link>
  )
}

// ============================================
// 7. 深色圆角特色卡片
// ============================================
export function DarkFeatureCard({
  image,
  title,
  description,
  buttonText = "查看更多",
  buttonVariant = "yellow",
  className,
}) {
  return (
    <div
      className={cn(
        "bg-neutral-800/90 rounded-3xl p-8 text-center",
        "backdrop-blur-sm",
        className
      )}
    >
      {image && (
        <img src={image} alt={title} className="w-24 h-24 mx-auto object-contain mb-4" />
      )}
      <p className="text-white/90 mb-6 leading-relaxed">{description}</p>
      <button
        className={cn(
          "px-6 py-2.5 font-semibold rounded-full transition-colors inline-flex items-center gap-2",
          buttonVariant === "yellow"
            ? "bg-yellow-400 text-neutral-900 hover:bg-yellow-300"
            : "bg-white text-neutral-900 hover:bg-neutral-100"
        )}
      >
        {buttonText}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================
// 8. 视频/预告片卡片
// ============================================
export function VideoCard({ gameid, thumbnail, title, duration, className }) {
  return (
    <Link
      href={`/games/${gameid}`}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer group block shadow-2xl",
        className
      )}
    >
      <SmartImage
        src={thumbnail}
        alt={title}
        gameid={gameid}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
          <Play className="w-6 h-6 text-[#1a0a2e] ml-1" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-white font-bold text-xl mb-1 group-hover:text-[#ff00ff] transition-colors">{getChineseName(title)}</h3>
        {duration && <p className="text-[#fbbf24] font-bold text-sm tracking-wider uppercase">{duration}</p>}
      </div>
    </Link>
  )
}

// ============================================
// 9. 紧凑游戏卡片
// ============================================
export function CompactGameCard({ image, title, platform, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all",
        "hover:-translate-y-0.5 cursor-pointer group",
        className
      )}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm truncate">{title}</h4>
        {platform && (
          <p className="text-neutral-500 text-xs mt-1">{platform}</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// 10. 横幅游戏卡片
// ============================================
export function BannerGameCard({
  gameid,
  image,
  logo,
  title,
  subtitle,
  buttonText = "立即查看",
  variant = "dark",
  className,
}) {
  return (
    <Link
      href={`/games/${gameid}`}
      className={cn(
        "relative rounded-3xl overflow-hidden h-72 cursor-pointer group block shadow-2xl transition-all",
        className
      )}
    >
      <SmartImage
        src={image}
        alt={title}
        gameid={gameid}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
      />
      <div
        className={cn(
          "absolute inset-0",
          variant === "dark"
            ? "bg-gradient-to-r from-black/95 via-black/40 to-transparent"
            : "bg-gradient-to-r from-[#1a0a2e]/95 via-purple-900/60 to-transparent"
        )}
      />
      <div className="absolute inset-0 flex flex-col justify-center p-10">
        {logo ? (
          <img src={logo} alt={title} className="h-16 object-contain w-fit mb-4" />
        ) : (
          <h3 className="text-white font-black text-3xl mb-2 group-hover:text-[#ff00ff] transition-colors">{getChineseName(title)}</h3>
        )}
        {subtitle && <p className="text-white/80 mb-8 max-w-md leading-relaxed">{subtitle}</p>}
        <div className="px-8 py-3 bg-[#ff00ff] text-black font-black rounded-full hover:bg-white transition-all w-fit inline-flex items-center gap-2 text-sm shadow-xl">
          {buttonText}
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
