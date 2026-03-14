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
    const username = localStorage.getItem('steam_username');
    
    console.log('[Auth] Checking session at root...', { steamId, username });

    if (steamId) {
      console.log('[Auth] Session found, redirecting to /home');
      router.push('/home');
    } else {
      console.log('[Auth] No session found, redirecting to /login');
      router.push('/login');
    }
  }, [router]);

  return <LoadingScreen />;
}
