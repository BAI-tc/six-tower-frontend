'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

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
  'Family': '家庭'
};

import LoadingScreen from '@/app/_components/loading-screen';
import { RAWG_API_URL, RAWG_API_KEY, API_BASE } from '@/config';

// 通过 Go 后端代理获取 Steam 游戏详情（避免 CORS 问题）
async function fetchGameFromBackend(steamAppId) {
  try {
    const response = await fetch(`${API_BASE}/games/${steamAppId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const g = data.data;
        // 转换为详情页需要的格式
        return {
          name: g.app_name,
          background_image: g.header_image,
          description: g.description || g.short_description,
          description_raw: g.short_description || g.description,
          released: g.release_date,
          metacritic: g.metacritic_score,
          rating: g.metacritic_score ? g.metacritic_score / 20 : null,
          steam_app_id: parseInt(g.app_id),
          developers: g.developer ? [{ name: g.developer }] : [],
          publishers: g.publisher ? [{ name: g.publisher }] : [],
          genres: g.genres?.map(name => ({ name })) || [],
          website: g.website,
          price: g.price,
          _fromBackend: true
        };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching from backend:', error.message);
  }
  return null;
}

// 直接从 RAWG API 获取最详细的游戏数据
async function fetchGameFromRAWG(steamAppId) {
  try {
    // 先从后端获取基础信息
    const backendData = await fetchGameFromBackend(steamAppId);
    if (!backendData) return null;

    // 用游戏名称去 RAWG 搜索
    const searchUrl = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(backendData.name)}&page_size=1`;
    const searchResponse = await fetch(searchUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      if (searchResults.results && searchResults.results.length > 0) {
        const rawgId = searchResults.results[0].id;

        // 获取完整的游戏详情
        const detailUrl = `${RAWG_API_URL}/games/${rawgId}?key=${RAWG_API_KEY}`;
        const detailResponse = await fetch(detailUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000)
        });

        if (detailResponse.ok) {
          const gameData = await detailResponse.json();
          // 合并后端数据和RAWG数据
          return {
            ...gameData,
            steam_app_id: backendData.steam_app_id,
            _fromBackend: false
          };
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching from RAWG:', error.message);
  }
  return null;
}

// 直接通过 RAWG ID 获取游戏数据（用于不在后库中的游戏如黑神话悟空）
async function fetchGameByRAWGId(rawgId) {
  try {
    const detailUrl = `${RAWG_API_URL}/games/${rawgId}?key=${RAWG_API_KEY}`;
    const response = await fetch(detailUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const gameData = await response.json();
      console.log('✅ Got game from RAWG:', gameData.name);
      return {
        ...gameData,
        _fromRAWG: true
      };
    }
  } catch (error) {
    console.error('❌ Error fetching from RAWG by ID:', error.message);
  }
  return null;
}

// 从 Steam Store API 获取游戏信息（RAWG失败时的备选）
async function fetchFromSteamStore(steamAppId) {
  try {
    const steamStoreUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}`;
    const response = await fetch(steamStoreUrl, {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data[steamAppId]?.success && data[steamAppId].data) {
        const steamGame = data[steamAppId].data;
        return {
          name: steamGame.name,
          background_image: steamGame.header_image,
          description: steamGame.short_description || steamGame.about_the_game,
          description_raw: steamGame.short_description || steamGame.about_the_game,
          genres: steamGame.genres?.map(g => ({ name: g.description })) || [],
          released: steamGame.release_date?.date,
          metacritic: steamGame.metacritic?.score,
          rating: steamGame.metacritic ? steamGame.metacritic.score / 20 : null,
          website: steamGame.website,
          steam_app_id: parseInt(steamAppId, 10),
          developers: steamGame.developers?.map(d => ({ name: d })) || [],
          publishers: steamGame.publishers?.map(p => ({ name: p })) || [],
          price: steamGame.price_overview?.final / 100,
          pc_requirements: steamGame.pc_requirements,
          _fromSteam: true
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from Steam Store:', error);
  }
  return null;
}

async function fetchRAWGMovies(gameId) {
  try {
    const response = await fetch(
      `${RAWG_API_URL}/games/${gameId}/movies?key=${RAWG_API_KEY}&page_size=10`,
      { cache: 'no-store', signal: AbortSignal.timeout(10000) }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.results) {
        return data.results.map(m => ({
          id: m.id,
          name: m.name,
          preview: m.preview,
          data: m.data
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching RAWG movies:', error);
  }
  return [];
}

async function fetchRAWGScreenshots(gameId) {
  try {
    const response = await fetch(
      `${RAWG_API_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}&page_size=20`,
      { cache: 'no-store', signal: AbortSignal.timeout(10000) }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.results) {
        return data.results.map(s => ({
          id: s.id,
          image: s.image
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching RAWG screenshots:', error);
  }
  return [];
}

async function fetchSteamScreenshots(steamAppId) {
  try {
    const steamStoreUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}`;
    const response = await fetch(steamStoreUrl, { signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const data = await response.json();
      if (data[steamAppId]?.success && data[steamAppId].data) {
        const gameData = data[steamAppId].data;
        if (gameData.screenshots) {
          return gameData.screenshots.map((s, index) => ({
            id: `steam_${index}`,
            image: s.path_full,
            thumbnail: s.path_thumbnail
          }));
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Steam screenshots:', error);
  }
  return [];
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params?.id || params?.gameId;
  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const loadGame = async () => {
      console.log('--- Loading Game ID:', gameId, '---');
      setLoading(true);
      setGame(null);
      setScreenshots([]);
      setMovies([]);
      setActiveTab('summary');

      let gameData = null;
      const appIdStr = String(gameId).trim();

      // 首先确保使用正确的 appId 格式
      const numericAppId = parseInt(appIdStr, 10);

      // ===== 新增：处理 RAW G id 的情况 =====
      // RAW G id 通常较小（< 100000），Steam appid 通常较大（> 10000）
      // 如果传入的 id 看起来像 RAW G id，直接从 RAW G 获取
      if (!isNaN(numericAppId) && numericAppId > 0 && numericAppId < 100000) {
        console.log('🔄 Detected possible RAWG ID:', numericAppId, ', fetching directly from RAWG');
        try {
          gameData = await fetchGameByRAWGId(numericAppId);
          if (gameData) {
            console.log('✅ Got game from RAWG by ID:', gameData.name);
            // RAWG 返回的数据中通常包含 steam_appid 字段
            // 如果有，就用它来获取后端数据补充
            if (gameData.steam_appid) {
              const backendData = await fetchGameFromBackend(gameData.steam_appid);
              if (backendData) {
                gameData = { ...gameData, ...backendData };
                console.log('✅ Enhanced with backend data');
              }
            }
          }
        } catch (e) {
          console.log('⚠️ RAWG direct fetch failed:', e.message);
        }
      }

      // ===== 以下是原有的 Steam appid 处理逻辑 =====
      // 1. 首先从后端获取基础数据
      if (!gameData && !isNaN(numericAppId) && numericAppId > 0) {
        console.log('🔄 Fetching game from backend:', appIdStr);
        gameData = await fetchGameFromBackend(numericAppId);
        if (gameData) {
          console.log('✅ Got game from backend:', gameData.name);
        }
      }

      // 1.5 如果后端没有数据，尝试从 RAWG 搜索获取（支持黑神话悟空等新游戏）
      if (!gameData && !isNaN(numericAppId) && numericAppId > 0) {
        console.log('🔄 Backend no data, trying RAWG search for appId:', appIdStr);
        // 尝试通过 Steam ID 在 RAWG 中搜索
        try {
          const searchUrl = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&steam_appids=${appIdStr}&page_size=1`;
          const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
          if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            if (searchResults.results && searchResults.results.length > 0) {
              const rawgId = searchResults.results[0].id;
              gameData = await fetchGameByRAWGId(rawgId);
              if (gameData) {
                gameData.steam_app_id = numericAppId;
              }
            }
          }
        } catch (e) {
          console.log('⚠️ RAWG search failed');
        }

        // 如果 still 没有，尝试直接用 RAWG ID（如黑神话悟空 RAWG ID: 481913）
        // 常见游戏的 RAWG ID 映射
        const rawgIdMap = {
          '2692320': '481913', // Black Myth: Wukong
        };
        if (!gameData && rawgIdMap[appIdStr]) {
          console.log('🔄 Trying known RAWG ID:', rawgIdMap[appIdStr]);
          gameData = await fetchGameByRAWGId(rawgIdMap[appIdStr]);
          if (gameData) {
            gameData.steam_app_id = numericAppId;
          }
        }
      }

      // 2. 尝试从 RAWG 获取更丰富的数据（截图、标签等）
      if (gameData && !gameData._fromBackend) {
        // 已经是从RAWG获取的完整数据，不需要再请求
      } else if (gameData) {
        // 后端数据不足，尝试从RAWG补充
        try {
          const searchUrl = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameData.name)}&page_size=1`;
          const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
          if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            if (searchResults.results && searchResults.results.length > 0) {
              const rawgId = searchResults.results[0].id;
              const detailUrl = `${RAWG_API_URL}/games/${rawgId}?key=${RAWG_API_KEY}`;
              const detailResponse = await fetch(detailUrl, { cache: 'no-store' });
              if (detailResponse.ok) {
                const rawgData = await detailResponse.json();
                // 合并RAWG的额外数据
                gameData = { ...gameData, ...rawgData };
                console.log('✅ Enhanced with RAWG data:', gameData.name);
              }
            }
          }
        } catch (e) {
          console.log('⚠️ RAWG enhancement failed, using backend data only');
        }
      }

      // 3. 获取截图和视频（仅当有 gameData 时）
      if (gameData) {
        const steamAppId = gameData.steam_app_id || numericAppId;
        const finalSteamId = !isNaN(steamAppId) ? steamAppId : numericAppId;

        // 获取截图和视频
        const [steamScr, rawgScr, rawgMov] = await Promise.all([
          finalSteamId ? fetchSteamScreenshots(finalSteamId) : Promise.resolve([]),
          gameData.id ? fetchRAWGScreenshots(gameData.id) : Promise.resolve([]),
          gameData.id ? fetchRAWGMovies(gameData.id) : Promise.resolve([])
        ]);

        const allScreenshots = [...steamScr, ...rawgScr];
        const uniqueScreenshots = Array.from(new Map(allScreenshots.map(item => [item.image, item])).values());

        setScreenshots(uniqueScreenshots);
        setMovies(rawgMov);
        setGame(gameData);
      } else {
        console.log('❌ No game data found from any source');
      }

      // 确保无论成功失败都结束加载状态
      setLoading(false);
    };

    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  if (loading) return <LoadingScreen />;
  if (!game) return (
    <div className="min-h-screen bg-[#1a0a2e] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">未找到该游戏</h1>
        <Link href="/home" className="text-[#beee11] hover:underline">返回首页</Link>
      </div>
    </div>
  );

  // 优先使用 RAWG 的 background_image，绝对不使用糊的 Steam header
  const posterUrl = game.background_image || `https://placehold.co/600x900/1a1a2e/ffffff?text=${encodeURIComponent(game.name || 'Game')}`;

  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      {/* Hero Background */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        {game.background_image && (
          <>
            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover md:object-top dynamic-banner scale-110" />
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-[#1a0a2e]/60 via-[#1a0a2e]/20 to-transparent backdrop-blur-[60px] opacity-90"></div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#1a0a2e] via-[#1a0a2e]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-transparent to-[#1a0a2e] opacity-40"></div>
          </>
        )}
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-8 -mt-56 md:-mt-72 relative z-10 pb-20 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Left Column */}
          <div className="w-full lg:w-[320px] xl:w-[350px] flex-shrink-0 flex flex-col gap-6 items-center lg:items-start">
            <div className="w-[280px] lg:w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-white/10 aspect-[3/4] bg-[#0e141d] relative group">
              <img src={posterUrl} alt={game.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            </div>

            <div className="bg-[#1a0a2e]/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col gap-4 w-full">
              <a href={`https://store.steampowered.com/app/${game.steam_app_id || gameId}`} target="_blank" className="w-full py-4 bg-[#beee11] hover:bg-[#d4ff1a] text-black font-black rounded-2xl text-center transition-all click-feedback text-lg">STEAM 商店页</a>
              {game.website && <a href={game.website} target="_blank" className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-center border border-white/10 click-feedback">官方网站</a>}
            </div>

            <div className="bg-[#1a0a2e]/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 w-full flex flex-col gap-6">
              <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">发行日期</span><span className="text-white font-bold">{game.released || '未知'}</span></div>
              {game.developers?.length > 0 && <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">开发商</span><span className="text-[#beee11] font-bold">{game.developers[0].name}</span></div>}
              {game.playtime > 0 && <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">平均游玩时长</span><span className="text-white font-bold">{game.playtime} 小时</span></div>}

              {/* RAWG Tags moved here */}
              {game.tags?.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-3">热门标签</span>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.slice(0, 15).map(tag => (
                      <span
                        key={tag.id}
                        className="text-[12px] font-bold text-slate-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 hover:text-white transition-all cursor-default"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 text-white min-w-0 flex flex-col gap-8">
            {/* Header: Simplified Title & Score */}
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tighter leading-tight lg:leading-[1.1]">
                    {game.name}
                  </h1>

                  {/* Platforms & Genres Row */}
                  <div className="flex flex-col gap-3 mt-6">
                    {game.parent_platforms?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {game.parent_platforms?.map(p => (
                          <span key={p.platform.id} className="text-[11px] font-bold border border-white/10 text-slate-400 bg-white/5 px-3 py-1 rounded-md">
                            {p.platform.name === 'PC' ? 'PC' :
                              p.platform.name === 'PlayStation' ? 'PlayStation' :
                                p.platform.name === 'Xbox' ? 'Xbox' :
                                  p.platform.name === 'Apple Macintosh' ? 'Mac' :
                                    p.platform.name === 'Nintendo' ? 'Nintendo' : p.platform.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {game.genres?.map(genre => {
                        const displayName = genreTranslationMap[genre.name] || genre.name;
                        return (
                          <Link
                            href={`/search?name=${genre.name}`}
                            key={genre.id || genre.name}
                            className="text-[12px] font-black uppercase tracking-widest bg-[#beee11]/10 border border-[#beee11]/20 text-[#beee11] px-5 py-1.5 rounded-full hover:bg-[#beee11] hover:text-black transition-all click-feedback"
                          >
                            {displayName}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4">
                  {game.metacritic && (
                    <div className="flex-shrink-0 flex items-center gap-5 bg-black/40 p-5 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Metacritic 评分</span>
                        <span className="text-slate-400 text-[10px] font-bold mt-0.5">{game.ratings_count || '250+'} 条评分</span>
                      </div>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/10 ${game.metacritic >= 75 ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-yellow-500 text-black shadow-yellow-500/20'}`}>
                        {game.metacritic}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery: Compact Mosaic Layout */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Spot: Video or 1st Screenshot */}
              <div className="md:col-span-2 aspect-video rounded-[2.5rem] overflow-hidden bg-[#0e141d] border border-white/10 shadow-3xl group">
                {movies.length > 0 ? (
                  <video src={movies[0].data?.max || movies[0].data?.['480']} poster={movies[0].preview} className="w-full h-full object-cover" controls />
                ) : screenshots.length > 0 ? (
                  <img src={screenshots[0].image} className="w-full h-full object-cover" />
                ) : null}
              </div>

              {/* Right Side Spot: 2nd Screenshot */}
              {screenshots.length > 1 && (
                <div className="aspect-video md:aspect-auto rounded-[2.5rem] overflow-hidden bg-[#0e141d] border border-white/10 hover:border-[#beee11]/30 transition-all group shadow-xl">
                  <img src={screenshots[movies.length > 0 ? 0 : 1].image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
              )}

              {/* Bottom Row: 3 thumbnails */}
              {screenshots.length > 2 && (
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                  {screenshots.slice(movies.length > 0 ? 1 : 2, movies.length > 0 ? 4 : 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-[#0e141d] border border-white/5 transition-all hover:border-[#beee11]/30 shadow-lg group">
                      <img src={img.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      {idx === 2 && screenshots.length > 5 && (
                        <div onClick={() => setActiveTab('media')} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                          <span className="text-[#beee11] font-black text-xl">+{screenshots.length - 5}</span>
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest mt-1">查看全部</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-white/5 pt-4">
              <button onClick={() => setActiveTab('summary')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'summary' ? 'text-white' : 'text-slate-500'}`}>游戏详情 {activeTab === 'summary' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>
              <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'media' ? 'text-white' : 'text-slate-500'}`}>媒体图库 ({screenshots.length}) {activeTab === 'media' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>
              {game.pc_requirements && <button onClick={() => setActiveTab('requirements')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'requirements' ? 'text-white' : 'text-slate-500'}`}>配置要求 {activeTab === 'requirements' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[400px]">
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  <div className="bg-[#1a0a2e]/40 p-10 rounded-[2.5rem] border border-white/5 prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-loose prose-h3:text-white prose-h2:text-white prose-h3:mt-8 prose-h3:mb-4">
                    <div dangerouslySetInnerHTML={{ __html: game.description || '暂无详细描述。' }} />
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                  {screenshots.map((s, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-white/10 hover:border-[#beee11]/40 transition-all click-feedback shadow-xl group">
                      <img src={s.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'requirements' && game.pc_requirements && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-[#beee11] font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#beee11]"></div> 最低配置</h3>
                    <div className="text-slate-400 text-sm leading-loose prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: game.pc_requirements.minimum }} />
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-[#beee11] font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#beee11]"></div> 推荐配置</h3>
                    <div className="text-slate-400 text-sm leading-loose prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: game.pc_requirements.recommended }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
