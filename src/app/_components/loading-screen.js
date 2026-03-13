'use client';

import CustomImage from './custom-image';

export default function LoadingScreen() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#1a0a2e]">
        <div className="absolute inset-0">
          <picture>
            <source type="image/avif" srcSet="/cyberpunk-bg.webp" />
            <source type="image/webp" srcSet="/cyberpunk-bg.webp" />
            <CustomImage source="/cyberpunk-bg.webp" classes="object-cover w-full h-full opacity-50 blur-[3px] scale-105" priority={true} />
          </picture>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e]/30 via-[#1a0a2e]/80 to-[#1a0a2e] pointer-events-none" />
      </div>

      <div className="min-h-screen flex items-center justify-center">
        {/* 简洁单圈旋转 - 快速流畅 */}
        <div className="relative">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#ff00ff] rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-[#ff00ff] rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </>
  );
}
