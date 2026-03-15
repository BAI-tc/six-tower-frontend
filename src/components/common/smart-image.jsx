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
    console.warn(`[SmartImage] Image failed to load: ${alt}`)
    setHasError(true)
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
