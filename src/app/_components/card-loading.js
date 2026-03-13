'use client';

import { useState, useEffect } from 'react';

export default function CardLoading({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Stage 0: Single card spinning (initial)
    // Stage 1: Cards fan out
    // Stage 2: Fade out and complete

    const timer1 = setTimeout(() => setStage(1), 1500);
    const timer2 = setTimeout(() => setStage(2), 3000);
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[#1a0a2e] z-[100] flex items-center justify-center overflow-hidden">
      <div className="relative w-32 h-40 perspective-1000">
        {/* Card 1 - Back */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${stage === 0
              ? 'rotate-y-0 opacity-100 z-30'
              : stage === 1
                ? '-translate-x-16 -translate-y-8 rotate-y-[-30deg] opacity-100 z-10'
                : 'translate-x-[-200px] opacity-0'
            }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: stage === 0 ? 'rotateY(0deg)' : stage === 1 ? 'translateX(-60px) translateY(-30px) rotateY(-30deg)' : 'translateX(-200px)',
          }}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#0f3460] shadow-2xl flex items-center justify-center">
            <div className="w-16 h-24 border-2 border-[#ff00ff] rounded-lg flex items-center justify-center">
              <span className="text-[#ff00ff] text-2xl font-bold">ST</span>
            </div>
          </div>
        </div>

        {/* Card 2 - Middle */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${stage === 0
              ? 'opacity-0 scale-50'
              : stage === 1
                ? 'opacity-100 scale-100 z-20'
                : 'translate-y-[-200px] opacity-0'
            }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: stage === 1 ? 'translateY(-30px) rotateY(0deg)' : stage === 2 ? 'translateY(-200px)' : 'scale(0.5)',
          }}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#0f3460] shadow-2xl flex items-center justify-center">
            <div className="w-16 h-24 border-2 border-[#ff00ff] rounded-lg flex items-center justify-center">
              <span className="text-[#ff00ff] text-2xl font-bold">ST</span>
            </div>
          </div>
        </div>

        {/* Card 3 - Front */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${stage === 0
              ? 'opacity-0 scale-50'
              : stage === 1
                ? 'translate-x-16 -translate-y-8 rotate-y-[30deg] opacity-100 z-30'
                : 'translate-x-[200px] opacity-0'
            }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: stage === 0 ? 'scale(0.5)' : stage === 1 ? 'translateX(60px) translateY(-30px) rotateY(30deg)' : 'translateX(200px)',
          }}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#0f3460] shadow-2xl flex items-center justify-center">
            <div className="w-16 h-24 border-2 border-[#ff00ff] rounded-lg flex items-center justify-center">
              <span className="text-[#ff00ff] text-2xl font-bold">ST</span>
            </div>
          </div>
        </div>

        {/* Center logo */}
        {stage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <div className="text-white text-3xl font-bold animate-pulse">SixTower</div>
          </div>
        )}
      </div>

      {/* Loading text */}
      {stage < 2 && (
        <div className="absolute bottom-20">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#ff00ff] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
