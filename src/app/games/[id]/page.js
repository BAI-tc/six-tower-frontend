'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 核心类型翻译映射
import LoadingScreen from '@/app/_components/loading-screen';
import { API_BASE, igdb, IMAGE_API, IMAGE_SIZES, genreTranslationMap } from '@/config';
import { SmartImage } from '@/components/common/smart-image';
import { WishlistButton } from '@/hooks/useWishlist';

// 通过 Go 后端代理获取 Steam 游戏详情（避免 CORS 问题）
async function fetchGameFromBackend(steamAppId) {
  try {
    const apiUrl = `${API_BASE}/games/${steamAppId}`;
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const g = data.data;
        return {
          name: g.app_name || g.name,
          background_image: g.background_image,
          description: g.description,
          released: g.release_date,
          metacritic: g.metacritic,
          rating: g.metacritic ? g.metacritic / 20 : null,
          steam_app_id: parseInt(g.app_id),
          developers: g.developer ? [{ name: g.developer }] : [],
          publishers: g.publisher ? [{ name: g.publisher }] : [],
          genres: g.genres?.map(name => ({ name })) || [],
          website: g.website,
          price: g.price,
          _fromBackend: true,
          id: g.id || g.app_id
        };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching from backend:', error.message);
  }
  return null;
}

// 从 IGDB 获取游戏详情
async function fetchFromIGDB(id, isSteamId = false) {
  try {
    let igdbGame = null;
    if (isSteamId) {
      // 1. 先尝试作为 Steam ID 获取
      igdbGame = await igdb.getBySteamId(id);
      
      // 2. 如果没找到，尝试直接作为 IGDB ID 获取 (发现页过来的 ID 是 IGDB ID)
      if (!igdbGame) {
        igdbGame = await igdb.getGameDetails(id);
        if (Array.isArray(igdbGame)) igdbGame = igdbGame[0];
      }
    } else {
      igdbGame = await igdb.getGameDetails(id);
      if (Array.isArray(igdbGame)) igdbGame = igdbGame[0];
    }

    if (igdbGame) {
      return {
        ...igdbGame,
        name: igdbGame.name,
        background_image: igdbGame.artworks?.[0]?.image_id 
          ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${igdbGame.artworks[0].image_id}.jpg`
          : (igdbGame.cover?.image_id ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${igdbGame.cover.image_id}.jpg` : null),
        cover_url: igdbGame.cover?.image_id ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${igdbGame.cover.image_id}.jpg` : null,
        description: igdbGame.summary,
        released: igdbGame.release_dates?.[0]?.human || igdbGame.first_release_date 
          ? new Date(igdbGame.first_release_date * 1000).toLocaleDateString() : null,
        metacritic: igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null,
        rating: igdbGame.aggregated_rating ? igdbGame.aggregated_rating / 20 : null,
        genres: igdbGame.genres?.map(g => ({ name: g.name })) || [],
        developers: igdbGame.involved_companies?.filter(c => c.developer).map(c => ({ name: c.company.name })) || [],
        publishers: igdbGame.involved_companies?.filter(c => c.publisher).map(c => ({ name: c.company.name })) || [],
        website: igdbGame.websites?.find(w => w.category === 1)?.url, // 1 是官方网站
        storyline: igdbGame.storyline,
        game_modes: igdbGame.game_modes?.map(m => m.name) || [],
        themes: igdbGame.themes?.map(t => t.name) || [],
        player_perspectives: igdbGame.player_perspectives?.map(p => p.name) || [],
        game_engines: igdbGame.game_engines?.map(e => e.name) || [],
        _fromIGDB: true
      };
    }
  } catch (error) {
    console.error('[IGDB] Fetch detail failed:', error);
  }
  return null;
}

// 统一获取游戏详情（带增强逻辑）
async function fetchGameFullDetail(id) {
  const numericId = parseInt(id, 10);
  const isSteamId = !isNaN(numericId) && /^\d+$/.test(String(id).trim());

  // 1. 优先尝试从 IGDB 获取
  const igdbData = await fetchFromIGDB(id, isSteamId);
  if (igdbData) return igdbData;

  // 2. 尝试从后端代理获取 (包含 Steam 增强)
  if (isSteamId) {
    const backendData = await fetchGameFromBackend(numericId);
    if (backendData && backendData.description) {
      return backendData;
    }
  }

  return null;
}

// 从 Steam Store API 获取游戏信息
async function fetchFromSteamStore(steamAppId) {
  try {
    // 使用后端代理解决 CORS 问题
    const steamStoreUrl = `${API_BASE}/steam/proxy?appids=${steamAppId}&l=schinese`;
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

async function fetchIGDBScreenshots(gameId) {
  try {
    const results = await igdb.getScreenshots(gameId);
    if (Array.isArray(results)) {
      return results.map(s => ({
        id: s.id,
        image: `${IMAGE_API}/${IMAGE_SIZES['s-huge']}/${s.image_id}.jpg`
      }));
    }
  } catch (error) {
    console.error('Error fetching IGDB screenshots:', error);
  }
  return [];
}

async function fetchSteamScreenshots(steamAppId) {
  try {
    // 使用后端代理解决 CORS 问题
    const steamStoreUrl = `${API_BASE}/steam/proxy?appids=${steamAppId}&l=schinese`;
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

      const appIdStr = String(gameId).trim();
      const numericAppId = parseInt(appIdStr, 10);
      const isSteamId = !isNaN(numericAppId) && /^\d+$/.test(appIdStr);

      // 使用统一的快速获取逻辑
      const gameData = await fetchGameFullDetail(appIdStr);

      if (gameData) {
        // 并行获取截图
        const [steamScr, igdbScr] = await Promise.all([
          (isSteamId && numericAppId) ? fetchSteamScreenshots(numericAppId).catch(() => []) : Promise.resolve([]),
          gameData._fromIGDB ? fetchIGDBScreenshots(gameData.id).catch(() => []) : Promise.resolve([])
        ]);

        const allScreenshots = [...steamScr, ...igdbScr];
        if (allScreenshots.length > 0) {
          const uniqueScreenshots = Array.from(new Map(allScreenshots.map(item => [item.image, item])).values());
          setScreenshots(uniqueScreenshots);
        }

        setMovies([]); // 暂时禁用视频
        setGame(gameData);
      } else {
        console.log('❌ All sources failed for Game:', appIdStr);
      }

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

  const posterUrl = game.background_image;

  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      {/* Hero Background */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        {game.background_image && (
          <>
            <SmartImage src={game.background_image} alt={game.name} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover md:object-top dynamic-banner scale-110" priority />
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
              <SmartImage src={posterUrl} alt={game.name} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              
              <div className="absolute top-4 right-4 z-30">
                <WishlistButton game={{ ...game, id: game.steam_app_id || gameId, name: game.name }} />
              </div>
            </div>

            <div className="bg-[#1a0a2e]/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col gap-4 w-full">
              <a href={`https://store.steampowered.com/app/${game.steam_app_id || game.steam_appid || gameId}`} target="_blank" className="w-full py-4 bg-[#beee11] hover:bg-[#d4ff1a] text-black font-black rounded-2xl text-center transition-all click-feedback text-lg">STEAM 商店页</a>
              {game.website && <a href={game.website} target="_blank" className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-center border border-white/10 click-feedback">官方网站</a>}
            </div>

            <div className="bg-[#1a0a2e]/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 w-full flex flex-col gap-6">
              <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">发行日期</span><span className="text-white font-bold">{game.released || '未知'}</span></div>
              {game.developers?.length > 0 && <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">开发商</span><span className="text-[#beee11] font-bold">{game.developers[0].name}</span></div>}
              {game.playtime > 0 && <div><span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">平均游玩时长</span><span className="text-white font-bold">{game.playtime} 小时</span></div>}

              {(game.game_modes?.length > 0 || game.player_perspectives?.length > 0) && (
                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  {game.game_modes?.length > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-2">游戏模式</span>
                      <div className="flex flex-wrap gap-1.5">
                        {game.game_modes.map(mode => (
                          <span key={mode} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                            {genreTranslationMap[mode] || mode}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.player_perspectives?.length > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-2">视角</span>
                      <div className="flex flex-wrap gap-1.5">
                        {game.player_perspectives.map(p => (
                          <span key={p} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                            {genreTranslationMap[p] || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.themes?.length > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-2">主题风格</span>
                      <div className="flex flex-wrap gap-1.5">
                        {game.themes.map(t => (
                          <span key={t} className="text-[10px] bg-[#beee11]/5 border border-[#beee11]/10 px-2 py-0.5 rounded text-[#beee11]/80">
                            {genreTranslationMap[t] || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.game_engines?.length > 0 && (
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-1.5">引擎</span>
                      <span className="text-white text-xs font-bold">{game.game_engines.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {game.tags?.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <span className="text-slate-500 block text-xs font-bold uppercase tracking-widest mb-3">热门标签</span>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.slice(0, 15).map(tag => (
                      <span
                        key={tag.id}
                        className="text-[12px] font-bold text-slate-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 hover:text-white transition-all cursor-default"
                      >
                        #{genreTranslationMap[tag.name] || tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 text-white min-w-0 flex flex-col gap-8">
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tighter leading-tight lg:leading-[1.1]">
                    {game.name}
                  </h1>

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

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 aspect-video rounded-[2.5rem] overflow-hidden bg-[#0e141d] border border-white/10 shadow-3xl group">
                {movies.length > 0 ? (
                  <video src={movies[0].data?.max || movies[0].data?.['480']} poster={movies[0].preview} className="w-full h-full object-cover" controls />
                ) : screenshots.length > 0 ? (
                  <SmartImage src={screenshots[0].image} alt={`${game.name} screenshot`} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover" />
                ) : null}
              </div>

              {screenshots.length > 1 && (
                <div className="aspect-video md:aspect-auto rounded-[2.5rem] overflow-hidden bg-[#0e141d] border border-white/10 hover:border-[#beee11]/30 transition-all group shadow-xl">
                  <SmartImage src={screenshots[movies.length > 0 ? 0 : 1].image} alt={`${game.name} screenshot 2`} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
              )}

              {screenshots.length > 2 && (
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                  {screenshots.slice(movies.length > 0 ? 1 : 2, movies.length > 0 ? 4 : 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-[#0e141d] border border-white/5 transition-all hover:border-[#beee11]/30 shadow-lg group">
                      <SmartImage src={img.image} alt={`${game.name} screenshot ${idx + 1}`} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
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

            <div className="flex gap-8 border-b border-white/5 pt-4">
              <button onClick={() => setActiveTab('summary')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'summary' ? 'text-white' : 'text-slate-500'}`}>游戏详情 {activeTab === 'summary' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>
              <button onClick={() => setActiveTab('media')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'media' ? 'text-white' : 'text-slate-500'}`}>媒体图库 ({screenshots.length}) {activeTab === 'media' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>
              {game.pc_requirements && <button onClick={() => setActiveTab('requirements')} className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all click-feedback relative ${activeTab === 'requirements' ? 'text-white' : 'text-slate-500'}`}>配置要求 {activeTab === 'requirements' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full"></div>}</button>}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  <div className="bg-[#1a0a2e]/40 p-10 rounded-[2.5rem] border border-white/5 prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-loose prose-h3:text-white prose-h2:text-white prose-h3:mt-8 prose-h3:mb-4">
                    {game.storyline && (
                      <div className="mb-8 pb-8 border-b border-white/10">
                        <h2 className="text-[#beee11] text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                          <div className="w-1 h-6 bg-[#beee11] rounded-full"></div>
                          背景故事
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed italic">
                          {game.storyline}
                        </p>
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ 
                      __html: (game.description || '暂无详细描述。') 
                    }} />
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                  {screenshots.map((s, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-white/10 hover:border-[#beee11]/40 transition-all click-feedback shadow-xl group">
                      <SmartImage src={s.image} alt={`${game.name} screenshot ${i}`} gameid={game.steam_app_id || gameId} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
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
