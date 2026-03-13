'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingScreen from '@/app/_components/loading-screen';

export default function SteamCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const steamId = searchParams.get('steamId');
    const username = searchParams.get('username');
    const avatar = searchParams.get('avatar');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setTimeout(() => {
        router.push('/login?error=' + error);
      }, 2000);
      return;
    }

    if (!steamId) {
      setStatus('error');
      setTimeout(() => {
        router.push('/login?error=no_steam_id');
      }, 2000);
      return;
    }

    // 保存用户信息到localStorage
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    localStorage.setItem('steam_id', steamId);
    localStorage.setItem('steam_username', username || 'Steam 用户');
    localStorage.setItem('steam_avatar', avatar || '');
    localStorage.setItem('steam_expires', expires.getTime());

    setStatus('success');

    // 跳转到首页，使用 window.location 强制刷新页面以更新 Header
    setTimeout(() => {
      window.location.href = '/home';
    }, 500);
  }, [searchParams, router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1a0a2e] pt-20'>
      <div className='text-center'>
        {status === 'processing' && (
          <div className="relative">
            <LoadingScreen />
            <div className="absolute inset-x-0 bottom-[35%] flex justify-center z-50">
              <p className='text-white text-xl font-mono tracking-widest animate-pulse'>正在同步 Steam 资料...</p>
            </div>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className='text-green-500 text-5xl mb-4'>✓</div>
            <p className='text-white text-xl'>登录成功！正在跳转...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className='text-red-500 text-5xl mb-4'>✗</div>
            <p className='text-white text-xl'>登录失败！正在跳转...</p>
          </>
        )}
      </div>
    </div>
  );
}
