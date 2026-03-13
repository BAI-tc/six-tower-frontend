'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import SearchBar from './search-bar';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 检查用户登录状态
  const checkUserStatus = () => {
    const steamId = localStorage.getItem('steam_id');
    const username = localStorage.getItem('steam_username');
    const avatar = localStorage.getItem('steam_avatar');

    if (steamId) {
      setUser({
        steamId,
        username: username || 'Steam 用户',
        avatar: avatar || ''
      });
    } else {
      setUser(null);
    }
  };

  // 每次路由变化时检查用户状态
  useEffect(() => {
    checkUserStatus();
  }, [pathname]);

  useEffect(() => {
    // 监听 localStorage 变化（用于跨标签页同步）
    const handleStorageChange = (e) => {
      if (e.key === 'steam_id' || e.key === 'steam_username' || e.key === 'steam_avatar') {
        checkUserStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSteamLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('steam_id');
    localStorage.removeItem('steam_username');
    localStorage.removeItem('steam_avatar');
    localStorage.removeItem('steam_expires');
    setUser(null);
    router.push('/');
  };

  const navLinks = [
    { href: '/home', label: '首页' },
    { href: '/festival', label: '游戏节' },
    { href: '/discover', label: '发现' },
    { href: '/recommendations', label: '其他推荐' },
  ];

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');
  const isHomePage = pathname === '/home';
  const isLoginPage = pathname === '/login';

  return (
    <header className={`fixed top-0 left-0 right-0 h-20 z-50 transition-all ${isLoginPage || isHomePage
        ? 'bg-transparent border-none'
        : 'bg-[#1a0a2e]/95 backdrop-blur-sm border-b border-[#2d0a3e]'
      }`}>
      <div className='h-full px-4 xl:px-10 flex items-center justify-between relative'>

        {/* === 左侧组合：Logo + 导航栏 === */}
        <div className='flex items-center gap-8 z-10'>
          {/* Logo */}
          <Link
            href='/'
            className="font-bold text-3xl text-white hover:text-[#ff00ff] drop-shadow-md transition-colors"
          >
            SixTower
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive(link.href)
                    ? 'bg-[#ff00ff] text-black'
                    : isLoginPage || isHomePage
                      ? 'text-white hover:bg-black/20 text-shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-[40%] md:max-w-[400px] lg:max-w-[500px] z-10">
          <SearchBar placeholder='搜索游戏...' isLoginPage={isLoginPage} showHistory={true} />
        </div>

        {/* === 右侧：登录按钮与用户区域 === */}
        <div className='flex items-center gap-3 z-10'>
          {user ? (
            <div className='flex items-center gap-3'>
              {/* 用户头像下拉 */}
              <div className='relative group'>
                <button className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${isLoginPage ? 'hover:bg-black/10' : 'hover:bg-[#2d0a3e]'
                  }`}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className='w-8 h-8 rounded-full'
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isLoginPage ? 'bg-black/20 text-black' : 'bg-[#2d0a3e] text-white'
                      }`}>
                      {user.username?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* 下拉菜单 */}
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${isLoginPage ? 'bg-white border border-gray-200' : 'bg-[#1a0a2e] border border-[#2d0a3e]'
                  }`}>
                  <div className={`p-3 ${isLoginPage ? 'border-b border-gray-200' : 'border-b border-[#2d0a3e]'
                    }`}>
                    <p className={`font-medium text-sm truncate ${isLoginPage ? 'text-black' : 'text-white'
                      }`}>{user.username}</p>
                    <p className={`text-xs truncate ${isLoginPage ? 'text-gray-500' : 'text-slate-500'
                      }`}>Steam ID: {user.steamId}</p>
                  </div>
                  <div className='p-2'>
                    <Link
                      href='/profile'
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isLoginPage
                          ? 'text-black hover:bg-gray-100'
                          : 'text-slate-400 hover:text-white hover:bg-[#2d0a3e]'
                        }`}
                    >
                      个人资料
                    </Link>
                    <Link
                      href='/recommendations'
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isLoginPage
                          ? 'text-black hover:bg-gray-100'
                          : 'text-slate-400 hover:text-white hover:bg-[#2d0a3e]'
                        }`}
                    >
                      我的推荐
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${isLoginPage
                          ? 'text-red-500 hover:bg-gray-100'
                          : 'text-red-400 hover:text-red-300 hover:bg-[#2d0a3e]'
                        }`}
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSteamLogin}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all shadow-sm ${isLoginPage || isHomePage
                  ? 'bg-white/80 hover:bg-white/90 text-black border border-white/30 backdrop-blur-sm'
                  : 'bg-[#ff00ff] hover:bg-[#d900d9] text-black'
                }`}
            >
              <svg viewBox='0 0 24 24' className='w-5 h-5' fill='currentColor'>
                <path d='M11.979 0C5.678 0 .504 4.926.04 11.15l4.661 6.71c.873-1.241 2.272-2.172 3.837-2.514l2.923-5.364-3.899-3.345C9.444 4.559 10.68 4.279 11.979 4.279c3.166 0 5.735 2.57 5.735 5.735 0 3.166-2.57 5.735-5.735 5.735-3.166 0-5.735-2.57-5.735-5.735 0-.493.06-.971.17-1.428L.482 15.917C1.901 21.444 7.421 25.32 13.513 25.32c6.627 0 12-5.373 12-12s-5.373-12-12-12c-.913 0-1.799.102-2.644.294l2.65-1.614zM8.334 13.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7.5 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z' />
              </svg>
              登录
            </button>
          )}

          {/* 移动端菜单按钮 */}
          <button
            className='md:hidden p-2 text-slate-400 hover:text-white'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              {mobileMenuOpen ? (
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              ) : (
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className='md:hidden bg-[#1a0a2e] border-t border-[#2d0a3e] px-4 py-4'>
          <nav className='flex flex-col gap-2'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                    ? 'bg-[#ff00ff] text-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#2d0a3e]'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href='/profile'
                className='px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-[#2d0a3e] transition-colors'
                onClick={() => setMobileMenuOpen(false)}
              >
                个人资料
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
