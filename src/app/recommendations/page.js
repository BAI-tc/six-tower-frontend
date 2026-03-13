'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Background from '../_components/background';
import CustomImage from '../_components/custom-image';
import { API_BASE, RAWG_API_URL, RAWG_API_KEY, getSteamCoverUrl } from '@/config';
import LoadingScreen from '@/app/_components/loading-screen';

const PAGE_SIZE = 20;

// ============ Enrichment Helper ============

async function enrichWithRAWG(games) {
  if (!games || games.length === 0) return games;
  
  try {
    const enrichedGames = await Promise.all(games.map(async (game) => {
      const appId = game.product_id || game.app_id || game.appid;
      const title = game.name || game.title;
      
      // 尝试在 RAWG 搜索该游戏
      try {
        const response = await fetch(
          `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}&page_size=1`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const rawgGame = data.results[0];
            return {
              ...game,
              rawg_id: rawgGame.id,
              background_image: rawgGame.background_image || game.background_image,
              rating: rawgGame.rating || game.rating,
              metacritic: rawgGame.metacritic || game.metacritic,
              genres: rawgGame.genres || game.genres || [],
              parent_platforms: rawgGame.parent_platforms || [],
            };
          }
        }
      } catch (e) { console.error(`Failed to enrich game ${title}:`, e); }
      return game;
    }));
    return enrichedGames;
  } catch (err) {
    console.error('Enrichment process failed:', err);
    return games;
  }
}

// ============ API Functions ============

async function fetchUserLibrary(steamId) {
  try {
    const response = await fetch(`${API_BASE}/steam/games/${steamId}`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) { console.error('Error loading library:', err); }
  return [];
}

async function fetchRecentlyPlayed(steamId) {
  try {
    const response = await fetch(`${API_BASE}/steam/recent/${steamId}?count=10`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) { console.error('Error loading recent games:', err); }
  return [];
}

async function fetchPopularNotOwned(steamId, offset = 0, limit = PAGE_SIZE) {
  try {
    const response = await fetch(`${API_BASE}/recommendations/popular-not-owned/${steamId}?limit=${limit}&offset=${offset}`);
    if (response.ok) {
      const data = await response.json();
      return { games: data.games || [], total: data.total || 0, hasMore: data.has_more || false };
    }
  } catch (err) { console.error('Error loading popular not owned:', err); }
  return { games: [], total: 0, hasMore: false };
}

async function fetchSimilarToOwned(steamId, limit = 30) {
  try {
    const response = await fetch(`${API_BASE}/recommendations/similar-to-owned/${steamId}?topk=${limit}`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) { console.error('Error loading similar games:', err); }
  return [];
}

async function fetchByGenre(steamId, limit = 30) {
  try {
    const response = await fetch(`${API_BASE}/recommendations/by-genre/${steamId}?limit=${limit}`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) { console.error('Error loading genre games:', err); }
  return [];
}

// ============ Styled Components ============

// Steam 风格平台图标
function SteamPlatformIcons() {
  return (
    <div className="flex items-center gap-1 opacity-70">
      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1l.01 9.17-9.76.06V3.449zm9.75 9.182l.01 9.062L0 20.373v-7.682l9.75-.06zm1.167-10.728l13.083-1.903v10.728l-13.083.085V1.903zm13.083 20.08l-13.083-1.802v-7.57l13.083-.085v9.457z" /></svg>
      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M7 21q-.825 0-1.412-.587T5 19V5q0-.825.588-1.412T7 3h10q.825 0 1.413.588T20 5v14q0 .825-.587 1.413T17 21H7zm5-1.5q.625 0 1.063-.438T13.5 18q0-.625-.438-1.062T12 16.5q-.625 0-1.062.438T10.5 18q0 .625.438 1.063T12 19.5z" /></svg>
      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" /></svg>
    </div>
  );
}


// Steam 景观卡片 (16:9)
function SteamLandscapeCard({ game, size = 'small' }) {
  const appId = game.product_id || game.app_id || game.appid;
  const title = game.name || game.title || `Game ${appId}`;
  const coverUrl = game.background_image || game.cover_url || getSteamCoverUrl(appId, 'header');

  return (
    <Link href={`/games/${appId}`} className="group relative block aspect-[16/9] w-full bg-[#0e141d] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-white/20">
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* 渐变遮罩层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

      {/* 顶部标签：Metacritic */}
      {game.metacritic && (
        <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-black/20 shadow-lg">
          {game.metacritic}
        </div>
      )}

      {/* 底部信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SteamPlatformIcons />
          {game.genres && game.genres.length > 0 && (
            <span className="text-[10px] text-slate-400 truncate max-w-[60%]">
              {game.genres.slice(0, 2).map(g => g.name).join(' · ')}
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#beee11] transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}

// Steam 特色网格单元 (2大 + 3小)
function SteamFeatureGrid({ games }) {
  if (!games || games.length === 0) return null;
  const displayGames = games.slice(0, 5);

  return (
    <div className="flex flex-col gap-4 min-w-full">
      {/* 第一行: 2个大的 */}
      <div className="grid grid-cols-2 gap-4">
        {displayGames.slice(0, 2).map((game, i) => (
          <SteamLandscapeCard key={game.id || i} game={game} size="large" />
        ))}
      </div>
      {/* 第二行: 3个小的 */}
      <div className="grid grid-cols-3 gap-4">
        {displayGames.slice(2, 5).map((game, i) => (
          <SteamLandscapeCard key={game.id || i} game={game} />
        ))}
      </div>
    </div>
  );
}

// 轮播模块组件 (支持多页切换)
function SteamCarouselModule({ title, games }) {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);
  
  if (!games || games.length === 0) return null;
  
  // 按 5 个一组分块
  const chunks = [];
  for (let i = 0; i < games.length; i += 5) {
    if (games.slice(i, i + 5).length === 5) {
      chunks.push(games.slice(i, i + 5));
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -scrollRef.current.offsetWidth : scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const p = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setPage(p);
    }
  };

  return (
    <div className="mb-20 group/module">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-7 bg-[#beee11] rounded-full shadow-[0_0_10px_#beee11]"></span>
          {title}
        </h2>
        <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded bg-white/10 flex items-center justify-center hover:bg-[#beee11] hover:text-black transition-all text-white disabled:opacity-30"
              disabled={page === 0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded bg-white/10 flex items-center justify-center hover:bg-[#beee11] hover:text-black transition-all text-white disabled:opacity-30"
              disabled={page >= chunks.length - 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
         <div 
           ref={scrollRef}
           onScroll={handleScroll}
           className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth p-1"
           style={{ scrollbarWidth: 'none' }}
         >
           {chunks.map((chunk, i) => (
             <div key={i} className="min-w-full snap-start px-2">
                <SteamFeatureGrid games={chunk} />
             </div>
           ))}
         </div>
         
         {/* 进度指示器 */}
         <div className="flex justify-center mt-6 gap-2">
           {chunks.map((_, i) => (
             <div 
               key={i} 
               className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'bg-[#beee11] w-8' : 'bg-white/20 w-2'}`}
             />
           ))}
         </div>
      </div>
    </div>
  );
}

// ============ Main Page ============

export default function RecommendationsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 各模块数据
  const [userLibrary, setUserLibrary] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [popularNotOwned, setPopularNotOwned] = useState([]);
  const [similarGames, setSimilarGames] = useState([]);
  const [genreGames, setGenreGames] = useState([]);

  useEffect(() => {
    const steamId = localStorage.getItem('steam_id');
    const username = localStorage.getItem('steam_username');
    const avatar = localStorage.getItem('steam_avatar');

    if (!steamId) {
      window.location.href = '/login';
      return;
    }

    setUser({ steamId, username: username || 'Steam 用户', avatar: avatar || '' });
    loadAllData(steamId);
  }, []);

  const loadAllData = async (steamId) => {
    setIsLoading(true);
    const [library, recent, popular, similar, genre] = await Promise.all([
      fetchUserLibrary(steamId),
      fetchRecentlyPlayed(steamId),
      fetchPopularNotOwned(steamId, 0, 15),
      fetchSimilarToOwned(steamId, 15),
      fetchByGenre(steamId, 15)
    ]);

    // 并行执行 RAWG 数据补全
    const [enrichedPopular, enrichedSimilar, enrichedGenre] = await Promise.all([
      enrichWithRAWG(popular.games || []),
      enrichWithRAWG(similar || []),
      enrichWithRAWG(genre || [])
    ]);

    setUserLibrary(library || []);
    setRecentlyPlayed(recent || []);
    setPopularNotOwned(enrichedPopular);
    setSimilarGames(enrichedSimilar);
    setGenreGames(enrichedGenre);
    setIsLoading(false);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <div className="fixed inset-0 -z-20 bg-[#0a0514]">
        <div className="absolute inset-0">
          <picture>
            <source type="image/avif" srcSet="/cyberpunk-bg.webp" />
            <source type="image/webp" srcSet="/cyberpunk-bg.webp" />
            <CustomImage source="/cyberpunk-bg.webp" classes="object-cover w-full h-full opacity-30 blur-[2px] scale-105" priority={true} />
          </picture>
          {/* 核心背景融合过渡层 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0514]/60 to-[#0a0514]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0514] via-transparent to-[#0a0514] opacity-40" />
        </div>
      </div>

      <main className="min-h-screen pt-24 pb-20 px-4 xl:px-40">
        <div className="container mx-auto">
          {/* 用户概览区域 */}
          {user && (
            <div className="flex items-center gap-6 mb-16 bg-[#1a0a2e]/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
              {user.avatar && (
                <div className="relative">
                   <img src={user.avatar} alt={user.username} className="w-20 h-20 rounded-full border-2 border-[#beee11] p-1 shadow-[0_0_20px_#beee1155]" />
                   <div className="absolute -bottom-1 -right-1 bg-[#beee11] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">ONLINE</div>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">欢迎回来, <span className="text-[#beee11]">{user.username}</span></h1>
                <p className="text-slate-400 text-sm tracking-wide">为您准备了基于 30.85% Recall 精准算法推送的 终极游戏地图</p>
              </div>
            </div>
          )}

          {/* 1. 相似游戏推荐 */}
          <SteamCarouselModule 
            title="与您的游戏库相似" 
            games={similarGames} 
          />

          {/* 2. 您可能喜欢的热门游戏 */}
          <SteamCarouselModule 
            title="您可能喜欢的热门游戏" 
            games={popularNotOwned} 
          />

          {/* 3. 基于类型的个性化推荐 */}
          <SteamCarouselModule 
            title="基于您的游戏类型偏好" 
            games={genreGames} 
          />

          {/* 4. 最近玩过 (备用/底端展示) */}
          {recentlyPlayed.length > 0 && (
            <div className="mt-20">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-bold text-white tracking-widest">最近玩过</h2>
                <div className="h-[1px] flex-grow bg-white/10" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {recentlyPlayed.slice(0, 5).map(game => (
                  <SteamLandscapeCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* 空状态处理 */}
          {popularNotOwned.length === 0 && similarGames.length === 0 && (
            <div className="text-center py-20 bg-black/40 rounded-3xl border border-dashed border-white/10">
              <p className="text-slate-400 text-lg">暂无精准推荐，请确保您的 Steam 库已同步</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
