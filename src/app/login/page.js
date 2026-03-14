'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Background from '../_components/background';
import CustomImage from '../_components/custom-image';
import SearchBar from '../_components/search-bar';
import { ULTIM_API_BASE } from '@/config';

// 检测是否是愿望单链接
function isWishlistUrl(input) {
  const trimmed = input.trim();
  return /store\.steampowered\.com\/wishlist\/profiles\/(\d+)/.test(trimmed);
}

// 从URL中提取Steam ID
function extractSteamId(input) {
  const trimmed = input.trim();

  // 如果是纯数字，直接返回
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // 尝试匹配 Steam 愿望单链接 - 返回 null 表示不支持
  // https://store.steampowered.com/wishlist/profiles/xxx/
  const wishlistMatch = trimmed.match(/store\.steampowered\.com\/wishlist\/profiles\/(\d+)/);
  if (wishlistMatch) {
    return null;
  }

  // 尝试匹配 Steam 社区链接
  // https://steamcommunity.com/id/xxx/
  // https://steamcommunity.com/profiles/xxx/
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/);
  if (profileMatch) {
    return profileMatch[1];
  }

  const idMatch = trimmed.match(/steamcommunity\.com\/id\/([^\/]+)/);
  if (idMatch) {
    // 自定义ID需要通过API解析，这里返回null让后端处理
    return null;
  }

  // 如果不是URL，直接返回原值
  return trimmed;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // 如果已经登录，直接跳转到首页
  useEffect(() => {
    const existingId = localStorage.getItem('steam_id');
    if (existingId) {
      router.push('/home');
    }
  }, [router]);

  // 通过Steam ID直接登录（绕过OpenID）
  const handleDirectLogin = async () => {
    if (!steamId.trim()) {
      setError('请输入您的 Steam ID 或 Steam 个人主页链接');
      return;
    }

    setIsLoading(true);
    setError('');

    // 检测愿望单链接，不支持
    if (isWishlistUrl(steamId)) {
      setError('请输入有效的 Steam ID 或 Steam 个人主页链接');
      setIsLoading(false);
      return;
    }

    // 尝试提取Steam ID
    const extractedId = extractSteamId(steamId);

    if (!extractedId) {
      setError('请输入有效的 Steam ID 或 Steam 个人主页链接');
      setIsLoading(false);
      return;
    }

    try {
      // 调用后端API获取用户信息
      const response = await fetch(`${ULTIM_API_BASE}/steam/user/${extractedId}`);

      if (response.ok) {
        const userData = await response.json();

        // 保存用户信息到localStorage
        const expires = new Date();
        expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);

        localStorage.setItem('steam_id', userData.steam_id);
        localStorage.setItem('steam_username', userData.personaname);
        localStorage.setItem('steam_avatar', userData.avatarfull || '');
        localStorage.setItem('steam_expires', expires.getTime());

        // 登录成功后自动获取用户游戏库（异步，不阻塞跳转）
        fetch(`${ULTIM_API_BASE}/steam/games/${userData.steam_id}`)
          .then(res => {
            if (res.ok) {
              console.log('User game library synced to Redis');
            }
          })
          .catch(err => console.error('Failed to sync game library:', err));

        // 跳转到首页
        router.push('/home');
      } else {
        const errData = await response.json();
        setError(errData.detail || '获取 Steam 用户信息失败，请检查您的 Steam ID 或链接');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSteamLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const origin = window.location.origin;
      const response = await fetch(`${ULTIM_API_BASE}/steam/url?frontend_origin=${encodeURIComponent(origin)}`);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to get Steam login URL:', data);
        setError('获取 Steam 登录链接失败');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Steam login error:', error);
      setError('网络错误');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Background
        classes='h-[100vh]'
        gradientClass='home-gradient'
      >
        <picture>
          <source type='image/avif' srcSet='/cyberpunk-bg.webp' />
          <source type='image/webp' srcSet='/cyberpunk-bg.webp' />
          <CustomImage
            source='/cyberpunk-bg.webp'
            classes='object-[85%]'
            priority={true}
          />
        </picture>
      </Background>


      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='bg-black/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 max-w-md w-full mx-4'>
          <h1 className='text-4xl font-bold text-center mb-2 c-text-shadow'>
            欢迎来到 SixTower
          </h1>
          <p className='text-slate-400 text-center mb-8'>
            欢迎来到 SixTower 推荐系统，登录 Steam 获取个性化游戏推荐
          </p>

          {/* Steam ID输入框 */}
          <div className='mb-4'>
            <input
              type='text'
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDirectLogin()}
              placeholder='Steam ID 或 链接'
              className='w-full px-4 py-3 bg-[#0e141d] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#ff00ff]'
            />
          </div>

          <button
            onClick={handleDirectLogin}
            disabled={isLoading}
            className='w-full py-3 px-6 bg-[#ff00ff] hover:bg-[#d900d9] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mb-4'
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <div className='relative'>
                  <div className='w-5 h-5 border-2 border-black/20 rounded-full'></div>
                  <div className='absolute top-0 left-0 w-5 h-5 border-2 border-transparent border-t-black rounded-full animate-spin'></div>
                </div>
              </span>
            ) : (
              '使用 Steam ID 继续'
            )}
          </button>

          <div className='relative my-4'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-slate-600'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-black text-slate-500'>或者</span>
            </div>
          </div>

          <button
            onClick={handleSteamLogin}
            disabled={isLoading}
            className='w-full py-4 px-6 bg-[#1a0a2e] hover:bg-[#2d0a3e] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-3 border border-slate-600'
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <div className='relative'>
                  <div className='w-5 h-5 border-2 border-white/20 rounded-full'></div>
                  <div className='absolute top-0 left-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin'></div>
                </div>
              </span>
            ) : (
              <>
                <svg viewBox='0 0 24 24' className='w-8 h-8' fill='currentColor'>
                  <path d='M11.979 0C5.678 0 .504 4.926.04 11.15l4.661 6.71c.873-1.241 2.272-2.172 3.837-2.514l2.923-5.364-3.899-3.345C9.444 4.559 10.68 4.279 11.979 4.279c3.166 0 5.735 2.57 5.735 5.735 0 3.166-2.57 5.735-5.735 5.735-3.166 0-5.735-2.57-5.735-5.735 0-.493.06-.971.17-1.428L.482 15.917C1.901 21.444 7.421 25.32 13.513 25.32c6.627 0 12-5.373 12-12s-5.373-12-12-12c-.913 0-1.799.102-2.644.294l2.65-1.614zM8.334 13.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7.5 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z' />
                </svg>
                使用 Steam 账号登录
              </>
            )}
          </button>

          {error && (
            <p className='text-red-400 text-sm text-center mt-4'>{error}</p>
          )}

          <p className='text-xs text-slate-500 text-center mt-6'>
            支持 Steam ID 或 Steam 个人主页 URL
          </p>
        </div>
      </div>
    </>
  );
}
