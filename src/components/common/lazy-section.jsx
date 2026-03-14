"use client";

import { useState, useEffect } from 'react';
import { useInViewOnce } from '@/hooks/useInView';
import { cn } from '@/utils/cn';

/**
 * LazySection - A section that loads content when it comes into view
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display
 * @param {Function} props.onInView - Callback when section comes into view (load data)
 * @param {boolean} props.hasData - Whether data is loaded
 * @param {string} props.loadingFallback - Optional custom loading content
 * @param {string} props.className - Additional classes
 */
export function LazySection({
  children,
  onInView,
  hasData,
  loadingFallback = null,
  className,
  skeleton = null
}) {
  const [ref, hasEntered] = useInViewOnce({ rootMargin: '200px' });
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Trigger data loading when section enters view
  useEffect(() => {
    if (hasEntered && !hasData && onInView) {
      setIsLoading(true);
      onInView();
    }
  }, [hasEntered, hasData, onInView]);

  // Show content after data loads
  useEffect(() => {
    if (hasData) {
      setIsLoading(false);
      // Small delay for smooth transition
      setTimeout(() => setShowContent(true), 100);
    }
  }, [hasData]);

  // Reset when重新进入视图（可选）
  useEffect(() => {
    if (hasEntered && !hasData && !isLoading && onInView) {
      onInView();
      setIsLoading(true);
    }
  }, [hasEntered]);

  return (
    <section ref={ref} className={cn("transition-all duration-700", className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="animate-pulse">
          {loadingFallback || skeleton || (
            <div className="h-64 bg-white/5 rounded-xl" />
          )}
        </div>
      )}

      {/* Content - with fade in animation */}
      <div
        className={cn(
          "transition-all duration-700 ease-out",
          showContent
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        )}
      >
        {hasData && children}
      </div>

      {/* Empty state - don't show anything until loaded */}
      {!hasData && !isLoading && !hasEntered && (
        <div className="h-4" /> // Placeholder to maintain scroll position
      )}
    </section>
  );
}

/**
 * AnimatedSection - Simple fade-in animation for any section
 */
export function AnimatedSection({
  children,
  className,
  delay = 0
}) {
  const [ref, hasEntered] = useInViewOnce({ rootMargin: '50px' });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn(
        "transition-all duration-700 ease-out",
        hasEntered
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-12"
      )}>
        {children}
      </div>
    </div>
  );
}
