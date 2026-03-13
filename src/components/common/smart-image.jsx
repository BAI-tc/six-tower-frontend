"use client"

import { useState, useEffect } from "react"
import { cn } from "@/utils/cn"

export function SmartImage({ 
  src, 
  alt, 
  gameid, 
  className, 
  priority = false,
  ...props 
}) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 更新 src 时重置状态
  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
    setIsLoading(true)
  }, [src])

  const handleError = () => {
    if (hasError) return // 防止无限循环

    // 如果 RAWG 图片加载失败，尝试使用 Steam Header
    if (currentSrc && currentSrc.includes('rawg.io') && gameid) {
      const steamHeader = `https://steamcdn-a.akamaihd.net/steam/apps/${gameid}/header.jpg`
      if (currentSrc !== steamHeader) {
        console.warn(`[SmartImage] RAWG image failed, falling back to Steam: ${gameid}`)
        setCurrentSrc(steamHeader)
        return
      }
    }

    // 如果 Steam Header 也失败或没有 gameid，使用占位图
    console.error(`[SmartImage] All image sources failed for: ${alt}`)
    setHasError(true)
    setCurrentSrc(`https://placehold.co/600x400/1a1a2e/ffffff?text=${encodeURIComponent(alt || 'Game')}`)
  }

  return (
    <div className={cn("relative overflow-hidden bg-neutral-900/50", className)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-neutral-800" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </div>
  )
}
