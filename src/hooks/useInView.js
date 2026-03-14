"use client";

import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect when an element is in viewport
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isInView] - ref to attach to element, boolean indicating if in view
 */
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Once in view, keep it in view (optional: set to false to re-trigger)
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, isInView];
}

/**
 * Hook that triggers once when element first enters view
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, hasEntered] - ref to attach, boolean indicating if has entered
 */
export function useInViewOnce(options = {}) {
  const [hasEntered, setHasEntered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasEntered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasEntered, options.threshold, options.rootMargin]);

  return [ref, hasEntered];
}
