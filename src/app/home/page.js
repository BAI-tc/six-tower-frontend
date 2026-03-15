'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Background from '../_components/background';
import CustomImage from '../_components/custom-image';
import LoadingScreen from '../_components/loading-screen';
import { API_BASE, enrichGamesWithIGDB, getChineseName, igdb, IMAGE_API, IMAGE_SIZES } from '@/config';
import { WishlistButton } from '@/hooks/useWishlist';
// 导入推荐系统 API
import { fetchSceneInfo, fetchTrendingGames, fetchPopularGames } from '@/api/recommendations';
import { FestivalHeroSection } from '@/components/festival/hero-section';
// 六塔模型权重配置
import { WEIGHT_PRESETS, fetchWeightedRecommendationsWithWeights, deduplicateGames, MODULE_CONFIG } from '@/api/six-tower';
import { SmartImage } from '@/components/common/smart-image';
import { AnimatedSection } from '@/components/common/lazy-section';

// 核心类型翻译映射
const genreTranslationMap = {
  'Action': '动作',
  'Role-Playing': '角色扮演',
  'RPG': '角色扮演',
  'Strategy': '策略',
  'Adventure': '冒险',
  'Simulation': '模拟',
  'Sports': '体育',
  'Racing': '竞速',
  'Massively Multiplayer': '多人在线',
  'Shooter': '射击',
  'Puzzle': '益智',
  'Indie': '独立',
  'Platformer': '平台跳跃',
  'Fighting': '格斗',
  'Casual': '休闲',
  'Arcade': '街机',
  'Educational': '教育',
  'Card': '卡牌',
  'Family': '家庭',
  'Open World': '开放世界',
  'Survival': '生存',
  'Horror': '恐怖',
  'Sci-fi': '科幻',
  'Sandbox': '沙盒',
  'Co-op': '联机',
  'Singleplayer': '单人',
  'Multiplayer': '多人',
  'Fantasy': '奇幻',
  'First-Person': '第一人称',
  'Third-Person': '第三人称',
  'Historical': '历史',
  'Atmospheric': '氛围',
  'Space': '太空'
};

// ============ API Functions ============

// IGDB 热门游戏 (修复图片映射逻辑，优先使用 Steam CDN)
async function fetchIGDBTopRated(page = 1, limit = 18) {
  try {
    const results = await igdb.request('/games', `
      fields name, cover.image_id, artworks.image_id, screenshots.image_id, external_games.uid, external_games.category, summary, aggregated_rating, genres.name, first_release_date, platforms.slug;
      sort aggregated_rating desc;
      where aggregated_rating_count > 20 & aggregated_rating != null & cover.image_id != null;
      offset ${(page - 1) * limit};
      limit ${limit};
    `);

    const mapped = Array.isArray(results) ? results.map(game => {
      const steamAppId = game.external_games?.find(ext => ext.category === 1)?.uid;
      const landscapeId = game.artworks?.[0]?.image_id || game.screenshots?.[0]?.image_id || game.cover?.image_id;
      
      // 如果有 Steam ID，大背景优先使用 Steam Hero 图
      const background = steamAppId 
        ? `https://steamcdn-a.akamaihd.net/steam/apps/${steamAppId}/library_hero.jpg`
        : (landscapeId ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${landscapeId}.jpg` : null);

      return {
        ...game,
        steam_appid: steamAppId,
        background_image: background,
        cover_url: game.cover ? `${IMAGE_API}/${IMAGE_SIZES['c-big']}/${game.cover.image_id}.jpg` : null,
        rating: game.aggregated_rating,
        released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null
      };
    }) : [];

    return { games: mapped, nextPage: results.length === limit ? page + 1 : null };
  } catch (error) {
    console.error('Error fetching IGDB games:', error);
  }
  return { games: [], nextPage: null };
}

// 新品热卖 (IGDB 版 - 修复图片映射逻辑)
async function fetchIGDBNewReleases(limit = 18) {
  try {
    const results = await igdb.request('/games', `
      fields name, cover.image_id, artworks.image_id, screenshots.image_id, aggregated_rating, genres.name, first_release_date, platforms.slug;
      sort first_release_date desc;
      where first_release_date != null & first_release_date < ${Math.floor(Date.now() / 1000)} & cover.image_id != null;
      limit ${limit};
    `);

    return Array.isArray(results) ? results.map(game => {
      // 优先级：Artwork > Screenshot > Cover
      const landscapeId = game.artworks?.[0]?.image_id || game.screenshots?.[0]?.image_id || game.cover?.image_id;
      
      return {
        ...game,
        background_image: landscapeId ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${landscapeId}.jpg` : null,
        cover_url: game.cover ? `${IMAGE_API}/${IMAGE_SIZES['c-big']}/${game.cover.image_id}.jpg` : null,
        rating: game.aggregated_rating,
        released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null
      };
    }) : [];
  } catch (error) {
    console.error('Error fetching new releases:', error);
  }
  return [];
}

// ============ Components ============

// 平台图标映射
const platformConfig = {
  pc: { name: 'PC', icon: '💻', color: '#1a0a2e' },
  playstation: { name: 'PS', icon: '🎮', color: '#003087' },
  xbox: { name: 'Xbox', icon: '🎮', color: '#107C10' },
  nintendo: { name: 'Switch', icon: '🎮', color: '#e60012' },
  ios: { name: 'iOS', icon: '📱', color: '#000000' },
  android: { name: 'Android', icon: '📱', color: '#3DDC84' },
  linux: { name: 'Linux', icon: '🐧', color: '#FCC624' },
  mac: { name: 'Mac', icon: '🍎', color: '#000000' },
};

function getGamePlatforms(game) {
  const platforms = game.platforms || game.parent_platforms || [];
  const result = [];
  const seen = new Set();

  platforms.forEach(p => {
    const slug = (p.platform?.slug || p.slug || '').toLowerCase();
    let key = 'pc';
    if (slug.includes('playstation')) key = 'playstation';
    else if (slug.includes('xbox')) key = 'xbox';
    else if (slug.includes('nintendo') || slug.includes('switch')) key = 'nintendo';
    else if (slug.includes('ios') || slug.includes('apple')) key = 'ios';
    else if (slug.includes('android')) key = 'android';
    else if (slug.includes('linux')) key = 'linux';
    else if (slug.includes('mac')) key = 'mac';

    if (!seen.has(key)) {
      seen.add(key);
      result.push(platformConfig[key] || { name: 'PC', icon: '💻' });
    }
  });

  return result.slice(0, 4);
}

// Netflix风格大卡片 (横向滚动) - 与 Discover 页面样式一致
function NetflixCard({ game }) {
  const appId = game.steam_appid || game.product_id || game.id || game.appid;
  const name = game.title || game.name || game.app_name || `Game ${appId}`;

  // 竖版卡片强制优先使用 Steam CDN 600x900 封面
  const displayCoverUrl = (appId && String(appId).length < 10)
    ? `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`
    : (game.cover_url || game.background_image);

  const rating = game.metacritic || game.rating || game.score || game.aggregated_rating;
  const released = game.released || game.first_release_date;
  const genres = (game.genres || []).slice(0, 2).map(g => {
    const name = g.name || g;
    return genreTranslationMap[name] || name;
  });
  const platforms = getGamePlatforms(game);

  const year = released ? new Date(released).getFullYear() : null;

  // 平台名称简化显示
  const platformNames = platforms.slice(0, 3).map(p => {
    const name = p.name?.toLowerCase() || '';
    if (name.includes('playstation')) return 'PS';
    if (name.includes('xbox')) return 'Xbox';
    if (name.includes('nintendo') || name.includes('switch')) return 'Switch';
    if (name.includes('pc')) return 'PC';
    if (name.includes('mac')) return 'Mac';
    if (name.includes('linux')) return 'Linux';
    if (name.includes('ios') || name.includes('apple')) return 'iOS';
    if (name.includes('android')) return 'Android';
    return name.slice(0, 4);
  });

  return (
    <Link href={`/games/${appId}`} className="block group relative">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0e141d] transition-all duration-300">
        <SmartImage
          src={displayCoverUrl}
          alt={name}
          gameid={appId}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          loading="lazy"
        />

        {/* 渐变遮罩层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

        {/* 评分 - 左上角 */}
        {rating && (
          <div className="absolute top-2 left-2 bg-[#ff00ff] text-black text-xs font-bold px-2 py-0.5 rounded z-10">
            {Math.round(rating)}
          </div>
        )}

        {/* 愿望单按钮 - 右上角，始终显示 */}
        <div className="absolute top-2 right-2 z-30">
          <WishlistButton game={{ ...game, id: appId, name }} />
        </div>

        {/* 平台标签 - 右上角，愿望单左边 */}
        {platformNames.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1 z-10" style={{ marginLeft: rating ? '36px' : '0' }}>
            {platformNames.map((p, idx) => (
              <span key={idx} className="text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* 底部信息栏 - 悬浮时上滑显示 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          <h3 className="text-white text-sm font-bold line-clamp-1 mb-1">{getChineseName(name)}</h3>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {genres.map((g, idx) => (
                <span key={idx} className="text-[10px] bg-[#ff00ff]/20 text-[#ff00ff] px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}
          {year && (
            <p className="text-slate-400 text-[10px]">{year}</p>
          )}
        </div>
      </div>
      {/* 卡片下方标题 */}
      <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ff00ff] transition-colors mt-2 text-center">{getChineseName(name)}</h3>
    </Link>
  );
}

// Featured 大横版卡片 - 强制使用 Steam CDN Hero
function FeaturedCard({ game, reason }) {
  const appId = game.steam_appid || game.product_id || game.id;
  const name = game.title || game.name;
  const displayCoverUrl = (appId && String(appId).length < 10)
    ? `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_hero.jpg`
    : (game.background_image || game.cover_url);
  const rating = game.metacritic || game.rating;

  return (
    <Link href={`/games/${appId}`} className="block group flex-shrink-0 w-[320px] transition-transform duration-300 hover:scale-[1.02]">
      <div className="relative w-[320px] aspect-[16/9] rounded-xl overflow-hidden bg-[#0e141d] shadow-xl">
        <SmartImage
          src={displayCoverUrl}
          alt={name}
          gameid={appId}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        <div className="absolute bottom-4 left-4 right-4 z-20">
          <h3 className="text-white text-xl font-bold line-clamp-1 drop-shadow-lg group-hover:text-[#ff00ff] transition-colors">{getChineseName(name)}</h3>
        </div>

        {/* 推荐理由 */}
        {reason && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#ff00ff]/90 text-black text-xs font-bold px-2 py-1 rounded">
              {reason}
            </span>
          </div>
        )}

        {/* 评分 */}
        {rating && (
          <div className="absolute top-3 right-3 bg-[#ff00ff] text-black text-sm font-bold px-2 py-1 rounded shadow-lg">
            {Math.round(rating)}
          </div>
        )}

        {/* 标题 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ff00ff] transition-colors">{name}</h3>
        </div>
      </div>
    </Link>
  );
}

// Epic风格大屏轮播 - 简单版本，移除动画效果
function EpicCarousel({ games }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameDetails, setGameDetails] = useState({});
  const intervalRef = useRef(null);

  // Fetch game details (Chinese names and descriptions)
  useEffect(() => {
    const fetchDetails = async () => {
      const details = {};
      const pool = games.slice(0, 10);
      await Promise.all(pool.map(async (game) => {
        const appId = game.steam_appid || game.id || game.product_id;
        try {
          // 优先通过后端获取中文详情
          const res = await fetch(`${API_BASE}/games/${appId}`, { cache: 'no-store' });
          if (res.ok) {
            const result = await res.json();
            if (result.code === 200 && result.data) {
              const g = result.data;
              details[appId] = {
                name: g.app_name || g.name || g.title,
                description: g.description || (g.short_description || g.description || "").replace(/<[^>]*>?/gm, '').substring(0, 180) + '...',
              };
            }
          }
        } catch (e) { /* ignore */ }
      }));
      setGameDetails(prev => ({ ...prev, ...details }));
    };
    if (games.length > 0) fetchDetails();
  }, [games.length]);

  // 自动轮播
  useEffect(() => {
    if (games.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % games.length);
      }, 6000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [games.length]);

  // 点击导航点切换
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!games || games.length === 0) return null;

  const currentGame = games[currentIndex];
  const appId = currentGame.steam_appid || currentGame.id;
  const name = currentGame.name || currentGame.title;
  const coverUrl = currentGame.background_image;
  const rating = currentGame.metacritic || currentGame.rating;
  const genres = currentGame.genres?.slice(0, 3).map(g => {
    const name = g.name || g;
    return genreTranslationMap[name] || name;
  }) || [];
  const detail = gameDetails[appId];

  return (
    <div className="relative w-full aspect-[21/10] max-h-[600px] rounded-2xl overflow-hidden bg-[#0e141d] mb-10 group">
      {/* 轮播图片集合 */}
      {games.map((game, idx) => (
        <div
          key={game.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* 实时构造 Steam CDN Hero 图作为最高优先级背景 */}
          <SmartImage
            src={(game.steam_appid || game.id || game.appid) && String(game.steam_appid || game.id || game.appid).length < 10
              ? `https://steamcdn-a.akamaihd.net/steam/apps/${game.steam_appid || game.id || game.appid}/library_hero.jpg`
              : game.background_image
            }
            alt={game.name || game.title}
            gameid={game.id}
            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${idx === currentIndex ? 'scale-105' : 'scale-100'
              }`}
          />
        </div>
      ))}

      {/* 固定的渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a2e] via-transparent to-transparent z-10" />

      {/* 左上角标签 */}
      <div className="absolute top-4 left-4 z-20">
        <span className="bg-[#ff00ff] text-black text-sm font-bold px-4 py-1.5 rounded">现已推出</span>
      </div>

      {/* 评分 */}
      {rating && (
        <div className="absolute top-4 right-4 z-20">
          <span className="bg-[#ff00ff] text-black text-lg font-bold px-3 py-1.5 rounded">{Math.round(rating)}</span>
        </div>
      )}

      {/* 左右侧内容 (随动画切换) */}
      <div className="absolute inset-0 flex items-center z-20 overflow-hidden">
        {games.map((game, idx) => {
          const isActive = idx === currentIndex;
          const gGenres = game.genres || [];
          const appId = game.steam_appid || game.id || game.product_id;
          const gDetail = gameDetails[appId] || gameDetails[game.id];

          // 确保描述有中文 fallback
          const displayDesc = gDetail?.description || (isActive ? `探索 ${getChineseName(game.name || game.title)} 的独特魅力，直面未知的挑战。` : "");

          return (
            <div
              key={`content-${game.id}`}
              className={`absolute left-0 p-8 md:p-16 max-w-2xl flex flex-col justify-center h-full transition-all duration-700 ease-out transform ${isActive ? 'translate-x-0 opacity-100 delay-300' : '-translate-x-12 opacity-0'
                }`}
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 line-clamp-2 drop-shadow-2xl leading-tight">{getChineseName(detail?.name || name)}</h2>
              {gGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {gGenres.slice(0, 3).map((g, i) => (
                    <span key={i} className="text-xs text-white/90 bg-[#ff00ff]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#ff00ff]/30">
                      {genreTranslationMap[g.name || g] || g.name || g}
                    </span>
                  ))}
                </div>
              )}
              <p className={`text-slate-300 text-sm mb-6 line-clamp-3 max-w-lg transition-all duration-700 delay-500 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                {displayDesc}
              </p>
              <div className={`flex items-center gap-6 transition-all duration-700 delay-700 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Link
                  href={`/games/${appId}`}
                  className="bg-[#ff00ff] text-black px-8 py-3 rounded-full font-bold hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#ff00ff]/20"
                >
                  查看详情
                </Link>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest leading-none">获取渠道</span>
                  <span className="text-xs text-[#beee11] font-bold">Steam 内获取</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 导航箭头 - 始终显示 */}
      <button onClick={() => goToSlide((currentIndex - 1 + games.length) % games.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-30">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onClick={() => goToSlide((currentIndex + 1) % games.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-30">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* 底部导航点 - 始终显示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {games.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/30 w-2 hover:bg-white/50'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// ========== 场景网格卡片组件 (清理样式，更符合整体风格) ==========
function SceneGridCard({ game, isLarge = false, sceneType = 'standard' }) {
  if (!game) return (
    <div className="w-full h-full rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#ff00ff] animate-spin opacity-20"></div>
    </div>
  );

  const appId = game.steam_appid || game.product_id || game.id || game.appid;
  const name = game.title || game.name || game.app_name;
  
  // 场景网格图源重定向：大格用 Hero 横图，小格用 600x900 竖图
  const displayCoverUrl = (appId && String(appId).length < 10)
    ? `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/${isLarge ? 'library_hero.jpg' : 'library_600x900.jpg'}`
    : (game.background_image || game.cover_url);

  const matchScore = game.match_reason || game.similarity_score;
  const genreList = game.genres?.slice(0, 2).map(g => g.name || g) || [game.preferred_genre || 'Universal'];
  const genres = genreList.map(g => genreTranslationMap[g] || g).join(' / ');

  const percentage = typeof matchScore === 'number'
    ? (matchScore > 1 ? Math.round(matchScore) : Math.round(matchScore * 100))
    : (parseInt(matchScore) || (82 + (parseInt(appId) % 15)));

  return (
    <Link href={`/games/${appId}`} className="group relative block w-full h-full overflow-hidden rounded-xl bg-[#0e141d] shadow-lg border border-white/5 hover:border-[#ff00ff]/30 transition-all duration-500">
      <SmartImage
        src={displayCoverUrl}
        alt={name}
        gameid={appId}
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 flex justify-between items-end transition-transform duration-500 transform ${isLarge ? 'translate-y-0' : 'translate-y-1 group-hover:translate-y-0'}`}>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className={`${isLarge ? 'text-2xl md:text-3xl' : 'text-base'} text-white font-bold leading-tight truncate drop-shadow-lg mb-1 group-hover:text-[#ff00ff] transition-colors`}>
            {getChineseName(name)}
          </h3>
          <p className={`${isLarge ? 'text-sm' : 'text-[10px]'} text-white/50 font-medium tracking-wide truncate`}>
            {genres}
          </p>
        </div>
        <div className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold opacity-90 transition-all duration-300 text-white group-hover:text-[#ff00ff]`}>
          {game.metacritic || game.aggregated_rating || (game.rating ? Math.round(game.rating * 20) : percentage)}
        </div>
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#ff00ff]/5" />
    </Link>
  );
}

// ========== 场景轮播内容组件 ==========
// ========== 场景轮播内容组件 (对接主标题样式) ==========
function SceneCarouselSection({ scenes, activeIndex, setActiveIndex }) {
  if (!scenes || scenes.length === 0) return null;

  const currentScene = scenes[activeIndex];
  const games = currentScene.games?.slice(0, 6) || [];

  if (games.length === 0) return null;

  return (
    <section className="mb-20 px-1">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {currentScene.title}
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium max-w-xl">
            {currentScene.subtitle}
          </p>
        </div>

        {/* 导航标签 - 清爽 pill 风格 */}
        <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
          {scenes.map((scene, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${idx === activeIndex
                ? 'bg-[#ff00ff] text-black shadow-lg'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              {scene.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6格栅格布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-none lg:grid-rows-3 gap-4 aspect-none lg:aspect-[24/10] min-h-[600px] lg:min-h-0">
        <div className="col-span-1 row-span-1 h-[200px] lg:h-auto"><SceneGridCard game={games[0]} sceneType={currentScene.type} /></div>
        <div className="col-span-1 row-span-1 h-[200px] lg:h-auto"><SceneGridCard game={games[1]} sceneType={currentScene.type} /></div>
        <div className="col-span-1 row-span-1 h-[200px] lg:h-auto"><SceneGridCard game={games[2]} sceneType={currentScene.type} /></div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-2 h-[300px] lg:h-auto"><SceneGridCard game={games[3]} isLarge={true} sceneType={currentScene.type} /></div>
        <div className="col-span-1 row-span-1 h-[200px] lg:h-auto"><SceneGridCard game={games[4]} sceneType={currentScene.type} /></div>
        <div className="col-span-1 row-span-1 h-[200px] lg:h-auto"><SceneGridCard game={games[5]} sceneType={currentScene.type} /></div>
      </div>
    </section>
  );
}


// Section 标题组件
function SectionHeader({ title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link} className="text-sm text-[#ff00ff] hover:text-white transition-colors flex items-center gap-1">
          查看全部
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// 横向滚动容器
function HorizontalScroll({ children }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {/* 滚动按钮 - 左 */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-0 bottom-4 w-12 z-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 滚动内容 */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* 滚动按钮 - 右 */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-0 bottom-4 w-12 z-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// Ubisoft风格横向滚动 - 简单版本，修复hover冲突
function UbisoftCarousel({ games }) {
  const scrollRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerView = 6;
  const cardWidth = 180;
  const gap = 16;
  const totalPages = Math.max(1, Math.ceil(games.length / itemsPerView));

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = (cardWidth + gap) * itemsPerView;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const pageWidth = (cardWidth + gap) * itemsPerView;
      const page = Math.round(scrollLeft / pageWidth);
      setCurrentPage(Math.min(page, totalPages - 1));
    }
  };

  if (!games.length) return null;

  return (
    <div className="relative">
      {/* 滚动内容 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide scroll-smooth px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {games.map((game) => (
          <div key={game.id} className="flex-shrink-0" style={{ width: cardWidth }}>
            <NetflixCard game={game} />
          </div>
        ))}
      </div>

      {/* 滚动按钮 - 左 */}
      {currentPage > 0 && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 滚动按钮 - 右 */}
      {currentPage < totalPages - 1 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 底部导航点 */}
      {totalPages > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                scrollRef.current?.scrollTo({ left: index * (cardWidth + gap) * itemsPerView, behavior: 'smooth' });
                setCurrentPage(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentPage ? 'bg-white w-6' : 'bg-white/30 w-2 hover:bg-white/50'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ====== SixTower 专属推荐 Banner ======
function SixTowerBanner() {
  return (
    <div className="mb-14 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 shrink-0">
      {/* 悟空 Banner - 链接到游戏详情页 */}
      <Link href="/games/2358720" className="relative h-[200px] rounded-[24px] bg-gradient-to-br from-[#1a1a1a] via-[#2d1212] to-black hover:scale-[1.01] transition-all duration-500 group block shadow-2xl border border-white/5">
        {/* Banner左侧文字 */}
        <div className="relative z-20 h-full flex flex-col justify-center pl-8 md:pl-12 w-3/5">
          <h2 className="text-3xl font-black text-white tracking-widest drop-shadow-md mb-2">黑神话：悟空</h2>
          <p className="text-xl text-white font-bold drop-shadow-md mb-2 pt-2">直面天命</p>
          <div className="absolute bottom-6 left-8 md:left-12 opacity-90 flex items-center gap-2">
            <span className="text-xl font-black text-white italic tracking-tighter opacity-80 uppercase">GAME<span className="text-[#ff00ff]">SCIENCE</span></span>
          </div>
        </div>

        {/* 右侧立体配图 - 模拟角色出框感 */}
        <div className="absolute right-14 -top+80 bottom-4 w-[40%] sm:w-[35%] pointer-events-none z-30 transition-transform duration-500 group-hover:scale-[1.03] origin-bottom flex items-end">
          <img src="/wukong-segmented.png" alt="Wukong" className="w-auto h-[150%] object-contain object-bottom drop-shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-transform scale-[1.5]" />
        </div>
      </Link>

      {/* 钟馗 Banner */}
      <Link href="https://gamesci.cn/zhongkui/" target="_blank" rel="noopener noreferrer" className="relative h-[200px] rounded-[24px] bg-gradient-to-br from-[#1a1a1a] via-[#121212] to-black hover:scale-[1.01] transition-all duration-500 group block shadow-2xl border border-white/5 mt-8 lg:mt-0">
        <div className="relative z-20 h-full flex flex-col justify-center pl-8 md:pl-12 w-3/5">
          <h2 className="text-3xl font-black text-white tracking-widest drop-shadow-md mb-2">黑神话：钟馗</h2>
          <p className="text-xl text-white font-bold drop-shadow-md mb-2 pt-2">诡道求生</p>
          <div className="absolute bottom-6 left-8 md:left-12 opacity-90 flex items-center gap-2">
            <span className="text-xl font-black text-white italic tracking-tighter opacity-80 uppercase">GAME<span className="text-[#ff00ff]">SCIENCE</span></span>
          </div>
        </div>

        <div className="absolute right-8 -top-10 bottom-4 w-[40%] sm:w-[45%] pointer-events-none z-30 transition-transform duration-500 group-hover:scale-[1.03] origin-bottom flex items-end">
          {/* 使用一张具有神话色彩的图替代钟馗 */}
          <img src="/downloaded-image.jpg" alt="Zhongkui" className="w-auto h-[150%] object-contain object-bottom transition-transform opacity-60 group-hover:opacity-100 translate-y-16 scale-[1.1]" />
        </div>
      </Link>
    </div>
  );
}

// Steam/Generic 风格个性化模块 (模仿图片中的干净排版)
function PersonalizedSteamSection({ games, title, reason, type = 'standard' }) {
  if (!games || !games.length) return null;

  const gridClass = type === 'large'
    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";

  return (
    <section className="mb-14 px-1">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <span className="text-sm text-[#ff00ff] font-medium opacity-80">{reason}</span>
      </div>

      <div className={gridClass}>
        {games.slice(0, type === 'large' ? 2 : 4).map((game, idx) => {
          const appId = game.steam_appid || game.product_id || game.id || game.appid;
          const name = game.title || game.name || game.app_name;
          
          // 如果是横版展示模式且有 appId，优先使用 Steam CDN 图片
          // 强制为横版大方块使用 Steam CDN Library Hero
          let displayCoverUrl = game.background_image || game.cover_url;
          if (type === 'large' && appId && String(appId).length < 10) {
            displayCoverUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_hero.jpg`;
          }
          
          const rating = game.metacritic || game.rating;

          return (
            <Link key={`${appId}-${idx}`} href={`/games/${appId}`} className="group block">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#1a1f2e] mb-3 shadow-lg border border-white/5 group-hover:border-[#ff00ff]/30 transition-all">
                <SmartImage
                  src={displayCoverUrl}
                  alt={name}
                  gameid={appId}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* 愿望单按钮 - 悬浮显示 */}
                <div className="absolute top-3 left-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <WishlistButton game={{ ...game, id: appId, name }} />
                </div>

                {/* 评分标签 */}
                {rating && (
                  <div className="absolute top-3 right-3 bg-[#ff00ff] text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(rating)}
                  </div>
                )}

                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="px-1">
                <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ff00ff] transition-colors">{name}</h3>

              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// 紧凑型分类展示 (不重复样式，更加节制)


// 紧凑型分类展示 (不重复样式，更加节制)
function GenreCompactShowcase({ genreSpotlight }) {
  const genres = Object.entries(genreSpotlight).slice(0, 3);

  return (
    <section className="mt-16 mb-24">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">探索热门类型</h2>
        <div className="h-[1px] flex-grow bg-white/10"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {genres.map(([genre, games]) => (
          <div key={genre} className="bg-[#1a1f2e]/40 rounded-3xl p-6 border border-white/5 backdrop-blur-sm hover:bg-[#1a1f2e]/60 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#ff00ff] rounded-full drop-shadow-[0_0_5px_#ff00ff]"></span>
                {genre}
              </h3>
              <Link href={`/discover?genres=${genre.toLowerCase()}`} className="text-[10px] font-bold text-white/40 hover:text-[#ff00ff] transition-colors uppercase tracking-widest border border-white/10 px-2 py-1 rounded">
                查看全部
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {games.slice(0, 4).map((game, idx) => {
                const appId = game.steam_appid || game.product_id || game.id || game.appid;
                const gameName = game.name || game.title || game.app_name;
                
                // 强制使用 Steam 竖版封面
                const displayCoverUrl = (appId && String(appId).length < 10)
                  ? `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`
                  : (game.cover_url || game.background_image);
                
                return (
                  <Link
                    key={`${appId}-${idx}`}
                    href={`/games/${appId}`}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden group/thumb bg-black shadow-md border border-white/5 hover:border-[#ff00ff]/30 transition-all"
                  >
                    <SmartImage src={displayCoverUrl} alt={gameName} gameid={appId} className="w-full h-full object-cover grayscale-[0.2] group-hover/thumb:grayscale-0 transition-all duration-700 group-hover/thumb:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-2.5">
                      <h3 className="text-white font-bold text-xs line-clamp-1 group-hover/thumb:text-[#ff00ff] transition-colors">{getChineseName(gameName)}</h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 专业页脚组件
function Footer() {
  const categories = [
    {
      title: '商店',
      links: ['浏览游戏', '新品热卖', '热门排行', '个性化推荐'],
    },
    {
      title: '社区',
      links: ['讨论区', '动态', '创意工坊', '市场'],
    },
    {
      title: '支持',
      links: ['帮助中心', '安全与隐私', '账号状态', '联系我们'],
    },
    {
      title: 'SixTower',
      links: ['关于我们', '原创游戏', '加入我们', '媒体资料'],
    },
  ];

  return (
    <footer className="mt-20 py-16 border-t border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">{cat.title}</h4>
            <ul className="space-y-4">
              {cat.links.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-slate-500 hover:text-[#ff00ff] text-sm transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-white tracking-tighter">SIX<span className="text-[#ff00ff]">TOWER</span></span>
          <p className="text-slate-600 text-[10px] max-w-xs leading-relaxed">
            © 2026 SixTower. All rights reserved. All trademarks are the property of their respective owners in the US and other countries.
          </p>
        </div>

        <div className="flex gap-4">
          {['Twitter', 'Discord', 'YouTube', '哔哩哔哩'].map(social => (
            <Link key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#ff00ff] transition-all">
              <span className="sr-only">{social}</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect width="24" height="24" rx="4" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ============ Main Page ============

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 公开数据
  const [topRatedGames, setTopRatedGames] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  // 推荐系统数据
  const [forYouRecommendations, setForYouRecommendations] = useState([]);
  const [trendingGames, setTrendingGames] = useState([]);
  const [genreSpotlight, setGenreSpotlight] = useState({});
  const [similarGames, setSimilarGames] = useState([]);
  const [popularNotOwned, setPopularNotOwned] = useState([]);
  const [recentGames, setRecentGames] = useState([]);  // 从 Steam API 获取
  const [genreGames, setGenreGames] = useState([]);

  // 场景列表
  const [scenes, setScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [sceneInfo, setSceneInfo] = useState(null);

  // 防止 hydration 不匹配
  const [mounted, setMounted] = useState(false);

  // 加载数据
  useEffect(() => {
    setMounted(true);
    const steamId = localStorage.getItem('steam_id');
    const username = localStorage.getItem('steam_username');
    const avatar = localStorage.getItem('steam_avatar');

    if (!steamId) {
      // 未登录用户也加载场景推荐数据（使用公开数据）
      loadPublicDataWithScenes();
      return;
    }

    setUser({ steamId, username: username || 'Steam 用户', avatar: avatar || '' });
    loadAllData(steamId);
  }, []);

  // 场景自动切换
  useEffect(() => {
    if (scenes.length > 1) {
      const timer = setInterval(() => {
        setActiveSceneIndex(prev => (prev + 1) % scenes.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [scenes.length]);

  // 未登录用户加载公开数据 + 默认场景
  const loadPublicDataWithScenes = async () => {
    setIsLoading(true);

    // 未登录用户使用 IGDB API
    let [topRated, newReleasesData, trending] = await Promise.all([
      fetchIGDBTopRated(1, 18),
      fetchIGDBNewReleases(18),
      fetchTrendingGames(10, 'week')
    ]);

    // 类型专题 - 使用非六塔 API（添加去重防止跨类型重复）
    // 每个类型获取15个游戏，确保去重后仍有4个
    const genres = ['动作', '角色扮演', '策略', '冒险', '模拟'];
    const genrePromises = genres.map(g => fetchPopularGames(15, g));
    const genreResults = await Promise.all(genrePromises);
    // 为趋势推荐、分类专题、高分、新品统一补全图片
    const allPublicGames = [
      ...(topRated.games || []),
      ...(newReleasesData || []),
      ...(trending.games || []),
      ...genreResults.flatMap(r => r.games || [])
    ];

    if (allPublicGames.length > 0) {
      const enrichedPublic = await enrichGamesWithIGDB(allPublicGames);
      const publicMap = new Map(enrichedPublic.map(g => [String(g.appid || g.id || g.product_id), g]));
      const applyPublic = games => games.map(g => publicMap.get(String(g.appid || g.id || g.product_id)) || g);

      topRated.games = applyPublic(topRated.games || []);
      newReleasesData = applyPublic(newReleasesData || []);
      trending.games = applyPublic(trending.games || []);
      genreResults.forEach(r => {
        if (r.games) r.games = applyPublic(r.games);
      });
    }

    const genreObj = {};
    const usedGenreGameIds = new Set(); // 跨类型去重
    genres.forEach((g, i) => {
      if (genreResults[i]?.games?.length > 0) {
        // 只添加不在其他类型中出现的游戏
        const uniqueGames = (genreResults[i].games || []).filter(game => {
          const gameId = game.appid || game.id || game.product_id;
          if (usedGenreGameIds.has(String(gameId))) return false;
          usedGenreGameIds.add(String(gameId));
          return true;
        }).slice(0, 4); // 每个类型最多4个
        if (uniqueGames.length > 0) {
          genreObj[g] = uniqueGames;
        }
      }
    });

    // 优先设置核心模块并关闭加载动画
    setTopRatedGames(topRated.games || []);
    setNewReleases(newReleasesData || []);
    setTrendingGames(trending.games || []);
    setGenreSpotlight(genreObj);
    setIsLoading(false);
    console.log('[Home] Guest core modules loaded, loading screen dismissed');

    // 加载默认场景 - 使用非六塔 API (后台异步处理)
    (async () => {
      try {
        const [tribeRes, quantumRes, resurrectionRes, chronosRes, cultRes] = await Promise.all([
          fetch(`${API_BASE}/recommendations/scene?user_id=0&scene_id=3&topk=${MODULE_CONFIG.tribe.topk}&offset=${MODULE_CONFIG.tribe.offset}`).then(r => r.json()).catch(() => ({ recommendations: [] })),
          fetch(`${API_BASE}/recommendations/scene?user_id=0&scene_id=7&topk=${MODULE_CONFIG.quantum.topk}&offset=${MODULE_CONFIG.quantum.offset}`).then(r => r.json()).catch(() => ({ recommendations: [] })),
          fetch(`${API_BASE}/recommendations/scene?user_id=0&scene_id=8&topk=${MODULE_CONFIG.resurrection.topk}&offset=${MODULE_CONFIG.resurrection.offset}`).then(r => r.json()).catch(() => ({ recommendations: [] })),
          fetch(`${API_BASE}/recommendations/scene?user_id=0&scene_id=9&topk=${MODULE_CONFIG.chronos.topk}&offset=${MODULE_CONFIG.chronos.offset}`).then(r => r.json()).catch(() => ({ recommendations: [] })),
          fetch(`${API_BASE}/recommendations/scene?user_id=0&scene_id=10&topk=${MODULE_CONFIG.cult.topk}&offset=${MODULE_CONFIG.cult.offset}`).then(r => r.json()).catch(() => ({ recommendations: [] }))
        ]);

        // 使用 enrichGamesWithIGDB 获取 IGDB 高清图片
        const allBackendGames = [
          ...(tribeRes.recommendations || []),
          ...(quantumRes.recommendations || []),
          ...(resurrectionRes.recommendations || []),
          ...(chronosRes.recommendations || []),
          ...(cultRes.recommendations || [])
        ];

        if (allBackendGames.length > 0) {
          const enrichedGames = await enrichGamesWithIGDB(allBackendGames);
          const enrichedMap = new Map(enrichedGames.map(g => [String(g.appid || g.id || g.product_id), g]));
          const applyEnriched = (games) => games.map(g => enrichedMap.get(String(g.appid || g.id || g.product_id)) || g);

          tribeRes.recommendations = applyEnriched(tribeRes.recommendations || []);
          quantumRes.recommendations = applyEnriched(quantumRes.recommendations || []);
          resurrectionRes.recommendations = applyEnriched(resurrectionRes.recommendations || []);
          chronosRes.recommendations = applyEnriched(chronosRes.recommendations || []);
          cultRes.recommendations = applyEnriched(cultRes.recommendations || []);
        }

        const sceneList = [
          { id: 1, label: '热门趋势', title: '热门趋势', subtitle: '全服玩家都在玩的游戏', games: trending.games || [] },
          { id: 2, label: '高分游戏', title: '高分游戏', subtitle: '媒体和玩家评分最高的游戏', games: topRated.games || [] },
          { id: 3, label: '社区精选', title: '社区精选', subtitle: '游戏社区最喜爱的游戏', games: tribeRes.recommendations || [] },
          { id: 7, label: '冷门佳作', title: '冷门佳作', subtitle: '被低估的精品游戏', games: quantumRes.recommendations || [], type: 'quantum' },
          { id: 8, label: '新品上架', title: '新品上架', subtitle: '最新发布的游戏', games: resurrectionRes.recommendations || [], type: 'resurrection' },
          { id: 9, label: '快玩游戏', title: '快玩游戏', subtitle: '适合短时间游玩的游戏', games: chronosRes.recommendations || [], type: 'chronos' },
          { id: 10, label: '经典游戏', title: '经典游戏', subtitle: '核心玩家心中的神作', games: cultRes.recommendations || [], type: 'cult' }
        ].filter(s => s.games && s.games.length >= 1);

        setScenes(sceneList);
        console.log('[Home] Guest background scenes loaded');
      } catch (error) {
        console.error('Error loading default background scenes:', error);
      }
    })();
  };

  // 登录用户数据加载 (双阶段流式加载优化)
  const loadAllData = async (steamId) => {
    setIsLoading(true);
    const startTime = Date.now();
    const usedGameIds = new Set();

    try {
      console.log('[Home] Phase 1: Fetching core fold-1 modules...');

      // 第一阶段：仅获取首屏核心模块 (高分、新品、趋势、最近玩过)
      const [
        topRatedResult, newReleasesResult, sceneInfoData, trendingResult, recentResult
      ] = await Promise.all([
        fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.highRated.topk, WEIGHT_PRESETS.highRated, MODULE_CONFIG.highRated.offset),
        fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.newReleases.topk, WEIGHT_PRESETS.newReleases, MODULE_CONFIG.newReleases.offset),
        fetchSceneInfo(steamId).catch(() => null),
        fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.trending.topk, WEIGHT_PRESETS.trending, MODULE_CONFIG.trending.offset),
        fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.recentPlayed.topk, WEIGHT_PRESETS.recentPlayed, MODULE_CONFIG.recentPlayed.offset)
      ]);

      console.log(`[Home] Phase 1 data received in ${Date.now() - startTime}ms`);

      // 1. 处理核心模块去重
      const topRatedGames = deduplicateGames(topRatedResult.recommendations || [], usedGameIds, 18);
      const newReleasesGames = deduplicateGames(newReleasesResult.recommendations || [], usedGameIds, 18);
      const trendingGames = deduplicateGames(trendingResult.recommendations || [], usedGameIds, 10);
      const recentGames = deduplicateGames(recentResult.recommendations || [], usedGameIds, 5);

      // 2. 核心模块图片获取并立即显示
      // 包含最近玩过的游戏，确保画质一致
      const coreGames = [...topRatedGames, ...newReleasesGames, ...trendingGames, ...recentGames];
      const enrichedCore = await enrichGamesWithIGDB(coreGames);
      const coreMap = new Map(enrichedCore.map(g => [String(g.appid || g.id || g.product_id), g]));
      const applyCore = games => games.map(g => coreMap.get(String(g.appid || g.id || g.product_id)) || g);

      setTopRatedGames(applyCore(topRatedGames));
      setNewReleases(applyCore(newReleasesGames));
      setTrendingGames(applyCore(trendingGames));
      setRecentGames(applyCore(recentGames));
      setSceneInfo(sceneInfoData);

      // 延迟加载次屏数据，确保首页基本块加载完毕再关闭 Loading
      setIsLoading(false);
      console.log(`[Home] Initial UI revealed in ${Date.now() - startTime}ms. Continuing background fetch...`);

      // 第三阶段：次要模块与场景屏（后台挂起运行，不阻塞主屏）
      (async () => {
        try {
          const p2Start = Date.now();
          const [
            popularNotOwnedResult, similarResult, genreResult,
            guessYouLikeResult, genreHotResult, tribeResult, quantumResult, resurrectionResult, chronosResult, cultResult
          ] = await Promise.all([
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.popularNotOwned.topk, WEIGHT_PRESETS.popularNotOwned, MODULE_CONFIG.popularNotOwned.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.similar.topk, WEIGHT_PRESETS.similar, MODULE_CONFIG.similar.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.byGenre.topk, WEIGHT_PRESETS.byGenre, MODULE_CONFIG.byGenre.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.guessYouLike.topk, WEIGHT_PRESETS.guessYouLike, MODULE_CONFIG.guessYouLike.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.genreHot.topk, WEIGHT_PRESETS.genreHot, MODULE_CONFIG.genreHot.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.tribe.topk, WEIGHT_PRESETS.tribe, MODULE_CONFIG.tribe.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.quantum.topk, WEIGHT_PRESETS.quantum, MODULE_CONFIG.quantum.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.resurrection.topk, WEIGHT_PRESETS.resurrection, MODULE_CONFIG.resurrection.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.chronos.topk, WEIGHT_PRESETS.chronos, MODULE_CONFIG.chronos.offset),
            fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.cult.topk, WEIGHT_PRESETS.cult, MODULE_CONFIG.cult.offset)
          ]);

          console.log(`[Home] Phase 2 background fetches done in ${Date.now() - p2Start}ms`);

          const getModuleGamesWithState = (rawList, limit) => {
            const deduped = deduplicateGames(rawList || [], usedGameIds, limit);
            return deduped.length >= limit / 2 ? deduped : (rawList || []).slice(0, limit);
          };

          const popularNotOwnedGames = getModuleGamesWithState(popularNotOwnedResult.recommendations, 20);
          const similarGames = getModuleGamesWithState(similarResult.recommendations, 30);
          const genreGames = getModuleGamesWithState(genreResult.recommendations, 60);

          const guessYouLikeGames = getModuleGamesWithState(guessYouLikeResult.recommendations, 20);
          const genreHotGames = getModuleGamesWithState(genreHotResult.recommendations, 12);
          const tribeGames = getModuleGamesWithState(tribeResult.recommendations, 12);
          const quantumGames = getModuleGamesWithState(quantumResult.recommendations, 12);
          const resurrectionGames = getModuleGamesWithState(resurrectionResult.recommendations, 12);
          const chronosGames = getModuleGamesWithState(chronosResult.recommendations, 12);
          const cultGames = getModuleGamesWithState(cultResult.recommendations, 12);

          const allP2Games = [
            ...popularNotOwnedGames, ...similarGames, ...genreGames,
            ...guessYouLikeGames, ...genreHotGames, ...tribeGames,
            ...quantumGames, ...resurrectionGames, ...chronosGames, ...cultGames
          ];

          const enrichedAll = await enrichGamesWithIGDB(allP2Games);
          const allMap = new Map(enrichedAll.map(g => [String(g.appid || g.id || g.product_id), g]));
          const applyAll = games => games.map(g => allMap.get(String(g.appid || g.id || g.product_id)) || g);

          setPopularNotOwned(applyAll(popularNotOwnedGames));
          setSimilarGames(applyAll(similarGames));

          // 类型专题生成逻辑 (保留用户的去重逻辑)
          const enrichedGenre = applyAll(genreGames);
          if (enrichedGenre.length > 0) {
            const grouped = {};
            const usedGenreGameIds = new Set();
            enrichedGenre.forEach(game => {
              const gameId = game.appid || game.id || game.product_id;
              if (usedGenreGameIds.has(String(gameId))) return;
              const genreList = game.genres?.map(g => g.name || g) || [];
              let primaryGenre = genreTranslationMap[genreList[0] || game.preferred_genre || 'Indie'] || (genreList[0] || game.preferred_genre || 'Indie');
              if (!grouped[primaryGenre]) grouped[primaryGenre] = [];
              if (grouped[primaryGenre].length < 4) {
                grouped[primaryGenre].push(game);
                usedGenreGameIds.add(String(gameId));
              }
            });
            setGenreSpotlight(grouped);
          }

          // 场景数据更新
          const sceneList = [
            { id: 1, label: '猜你喜欢', title: '猜你喜欢', subtitle: '基于推荐算法为您量身定制', games: applyAll(guessYouLikeGames), isSixTower: true },
            { id: 2, label: '类型热门', title: '类型热门', subtitle: sceneInfoData?.galaxy_info?.dna ? `${sceneInfoData.galaxy_info.dna}类型爱好者都在玩` : '深度匹配您的游玩品味', games: applyAll(genreHotGames), isSixTower: true },
            { id: 3, label: '同好玩家', title: '同好玩家', subtitle: `与您品味相近的玩家也喜欢这些`, games: applyAll(tribeGames), isSixTower: true },
            { id: 7, label: '跨界尝试', title: '可能会喜欢', subtitle: '跳出舒适区，发现更多可能', games: applyAll(quantumGames), type: 'quantum', isSixTower: true },
            { id: 8, label: '库中寻宝', title: '怀旧重温', subtitle: '发现您库中游戏的好伙伴', games: applyAll(resurrectionGames), type: 'resurrection', isSixTower: true },
            { id: 9, label: '随玩随停', title: '时间匹配', subtitle: '根据您的游玩时长习惯推荐', games: applyAll(chronosGames), type: 'chronos', isSixTower: true },
            { id: 10, label: '骨灰精选', title: '核心精选', subtitle: '只有真正热爱游戏的人才知道', games: applyAll(cultGames), type: 'cult', isSixTower: true }
          ].filter(s => s.games && s.games.length >= 1);

          setScenes(sceneList);

          if (typeof window !== 'undefined' && usedGameIds.size > 0) {
            sessionStorage.setItem('homepage_shown_ids', JSON.stringify(Array.from(usedGameIds)));
          }
          console.log(`[Home] All background content loaded in ${Date.now() - startTime}ms`);
        } catch (p2Error) {
          console.error('[Home] Phase 2 error:', p2Error);
        }
      })();

    } catch (error) {
      console.error('Error loading home data:', error);
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Full Page Background with Gradient */}
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

      {/* Hero Banner */}
      <div className="relative pt-24 pb-4">

        <div className="px-4 xl:px-40">
          <div className="container mx-auto">
            {mounted && user ? (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  欢迎回来，{user.username}
                </h1>
                <p className="text-lg text-slate-300 mb-6">
                  发现你的下一款挚爱游戏
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  发现游戏
                </h1>
                <p className="text-lg text-slate-300 mb-6">
                  探索数千款游戏，寻找你的下一次冒险
                </p>
              </>
            )}
            <div className="flex gap-4">
              {mounted && user ? (
                <Link href="/recommendations" className="px-6 py-3 bg-[#ff00ff] text-black font-bold rounded-lg hover:bg-[#4ba3d6] transition-colors">
                  查看推荐
                </Link>
              ) : (
                <Link href="/login" className="px-6 py-3 bg-[#ff00ff] text-black font-bold rounded-lg hover:bg-[#4ba3d6] transition-colors">
                  通过 Steam 登录
                </Link>
              )}
              <Link href="/discover" className="px-6 py-3 bg-[#1a0a2e]/80 text-white font-bold rounded-lg hover:bg-[#2d0a3e] transition-colors border border-[#2d0a3e]">
                浏览全部
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-screen pb-16 px-4 xl:px-40 pt-12">
        <div className="container mx-auto relative z-10">

          {/* ========== 公开模块 ========== */}

          {/* 1. Top Rated Games - 大屏轮播 (公开) */}
          <section className="mb-14">
            <SectionHeader
              title="高分游戏"
              subtitle="社区最受欢迎的游戏排行"
              link="/discover"
            />
            <EpicCarousel games={topRatedGames.slice(0, 10)} />
          </section>

          {/* 2. New & Trending - Netflix轮播 (公开) */}
          <section className="mb-14">
            <SectionHeader
              title="新品与热门"
              subtitle="最新发布和热门游戏"
              link="/discover?ordering=-released"
            />
            <UbisoftCarousel games={newReleases.slice(0, 20)} />
          </section>

          {/* 3. 游戏节特别入口 (带动态手柄) - 提前到新品热门之后 */}
          <FestivalHeroSection />

          {/* 4. 专属主站推荐：SixTower - 提前到新品热门之后 */}
          <section className="mb-16">
            <SectionHeader
              title="SixTower 精选"
              subtitle="顶级精品游戏推荐"
            />
            <SixTowerBanner />
          </section>

          {/* 3. Trending Now (Module 3) */}
          {(trendingGames.length > 0) && (
            <div className="mb-14">
              <SectionHeader
                title="热门趋势"
                subtitle="本周热门游戏"
                link="/discover?ordering=-added"
              />
              <UbisoftCarousel games={trendingGames} />
            </div>
          )}

          {/* 4. 相似游戏 */}
          {mounted && user && (
            <AnimatedSection>
              {similarGames.length > 0 && (
                <>
                  <PersonalizedSteamSection
                    games={similarGames.slice(0, 4)}
                    title="和您拥有的游戏相似"
                    reason={`基于 ${recentGames[0]?.name || '您的游戏库'}`}
                    type="large"
                  />
                  {similarGames.length > 4 && (
                    <PersonalizedSteamSection
                      games={similarGames.slice(4, 12)}
                      title="更多类似游戏"
                      reason="基于您游戏历史的个性化推荐"
                      type="standard"
                    />
                  )}
                </>
              )}
            </AnimatedSection>
          )}


          {/* ========== 登录用户个性化模块 ========== */}

          {/* ========== 个性化场景轮播（登录/未登录都可显示）========== */}
          <AnimatedSection>
            <div id="personalized-scenes" className="scroll-mt-24">
              {scenes.length > 0 && (
                <SceneCarouselSection
                  scenes={scenes}
                  activeIndex={activeSceneIndex}
                  setActiveIndex={setActiveSceneIndex}
                />
              )}
            </div>
          </AnimatedSection>

          {/* 6. Popular Games You Might Like (替换 For You) */}
          {mounted && user && (
            <AnimatedSection>
              {popularNotOwned.length > 0 && (
                <div className="mb-14">
                  <SectionHeader
                    title="您可能会喜欢的游戏"
                    subtitle="您尚未拥有的热门游戏"
                    link="/recommendations"
                  />
                  <UbisoftCarousel games={popularNotOwned} />
                </div>
              )}
            </AnimatedSection>
          )}


          {/* 8. Based on Your Genre Preferences (替换 Explore Genres) */}
          <AnimatedSection>
            {Object.keys(genreSpotlight).length > 0 && (
              <GenreCompactShowcase genreSpotlight={genreSpotlight} />
            )}
          </AnimatedSection>

          {/* 9. 专业页脚 (补充) */}
          <Footer />

          {/* 未登录提示 */}
          {mounted && !user && Object.keys(genreSpotlight).length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="inline-block bg-[#1a0a2e] rounded-xl border border-[#2d0a3e] p-8 max-w-md">
                <h3 className="text-2xl font-bold text-white mb-3">登录获取个性化推荐</h3>
                <p className="text-slate-400 mb-6">连接您的 Steam 账号获取基于您游戏库的个性化推荐</p>
                <Link href="/login" className="inline-block px-6 py-3 bg-[#ff00ff] text-black font-bold rounded-lg hover:bg-[#d900d9] transition-colors">
                  使用 Steam 登录
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
