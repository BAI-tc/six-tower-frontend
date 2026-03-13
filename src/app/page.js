'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Background from './_components/background';
import CustomImage from './_components/custom-image';
import LoadingScreen from './_components/loading-screen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const steamId = localStorage.getItem('steam_id');

    if (steamId) {
      // 已登录，跳转到首页
      router.push('/home');
    } else {
      // 未登录，跳转到登录页
      router.push('/login');
    }
  }, [router]);

  return <LoadingScreen />;
}
