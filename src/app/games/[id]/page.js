'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// 核心组件与配置
import LoadingScreen from '@/app/_components/loading-screen';
import { API_BASE, igdb, IMAGE_API, IMAGE_SIZES, genreTranslationMap } from '@/config';
import { SmartImage } from '@/components/common/smart-image';
import { WishlistButton } from '@/hooks/useWishlist';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * 数据标准化：将各种来源的数据转化为统一格式
 */
// 数据标准化：将各种来源的数据转化为统一格式
function normalizeGameData(data, source = 'backend') {
  if (!data) return null;

  if (source === 'backend') {
    // 过滤掉后端可能返回的 redundant Steam URL 作为官网的情况
    const rawWebsite = data.website || data.store_url;
    const isActuallySteam = rawWebsite?.includes('steampowered.com');

    return {
      id: data.app_id || data.id,
      name: data.app_name || data.name,
      background_image: data.background_image,
      description: data.description || data.short_description,
      released: data.release_date,
      metacritic: data.metacritic,
      rating: data.metacritic ? data.metacritic / 20 : null,
      steam_app_id: parseInt(data.app_id),
      developers: data.developer ? [{ name: data.developer }] : [],
      publishers: data.publisher ? [{ name: data.publisher }] : [],
      genres: data.genres?.map(name => ({ name })) || [],
      tags: data.tags?.map(t => (typeof t === 'string' ? { name: t } : t)) || [],
      website: isActuallySteam ? null : rawWebsite,
      price: data.price,
      discount_price: data.discount_price,
      pc_requirements: data.specs ? { minimum: data.specs.join('<br>') } : null,
      _source: 'backend'
    };
  }

  if (source === 'igdb') {
    return {
      id: data.id,
      name: data.name,
      background_image: data.artworks?.[0]?.image_id
        ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${data.artworks[0].image_id}.jpg`
        : (data.cover?.image_id ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${data.cover.image_id}.jpg` : null),
      cover_url: data.cover?.image_id ? `${IMAGE_API}/${IMAGE_SIZES['c-big']}/${data.cover.image_id}.jpg` : null,
      description: data.summary,
      storyline: data.storyline,
      released: data.release_dates?.[0]?.human || (data.first_release_date
        ? new Date(data.first_release_date * 1000).toLocaleDateString() : null),
      metacritic: data.aggregated_rating ? Math.round(data.aggregated_rating) : null,
      rating: data.aggregated_rating ? data.aggregated_rating / 20 : null,
      genres: data.genres?.map(g => ({ name: g.name })) || [],
      developers: data.involved_companies?.filter(c => c.developer).map(c => ({ name: c.company.name })) || [],
      publishers: data.involved_companies?.filter(c => c.publisher).map(c => ({ name: c.company.name })) || [],
      website: data.websites?.find(w => w.category === 1)?.url,
      game_modes: data.game_modes?.map(m => m.name) || [],
      themes: data.themes?.map(t => t.name) || [],
      player_perspectives: data.player_perspectives?.map(p => p.name) || [],
      game_engines: data.game_engines?.map(e => e.name) || [],
      steam_app_id: data.external_games?.find(e => e.category === 1)?.uid,
      _source: 'igdb'
    };
  }
  return data;
}

// 通过 Go 后端代理获取 Steam 游戏详情
async function fetchGameFromBackend(steamAppId) {
  try {
    const apiUrl = `${API_BASE}/games/${steamAppId}`;
    const response = await fetch(apiUrl, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data) {
        return normalizeGameData(data.data, 'backend');
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
    // 如果是 Steam ID，先尝试通过 Steam ID 关联查询
    if (isSteamId) {
      const igdbGame = await igdb.getBySteamId(id);
      if (igdbGame) return normalizeGameData(igdbGame, 'igdb');
      // 如果通过 Steam ID 没找到，不要再用数字 ID 查询（会查询到错误的 IGDB 游戏）
      return null;
    }
    // 只有非 Steam ID（如纯数字字符串）才直接用 IGDB ID 查询
    const results = await igdb.getGameDetails(id);
    const igdbGame = Array.isArray(results) ? results[0] : results;
    if (igdbGame) return normalizeGameData(igdbGame, 'igdb');
  } catch (error) {
    console.error('[IGDB] Fetch detail failed:', error);
  }
  return null;
}

async function fetchGameFullDetail(id) {
  const numericId = parseInt(id, 10);
  const isSteamId = !isNaN(numericId) && /^\d+$/.test(String(id).trim());

  // 1. 优先尝试从 IGDB 获取（数据更全）
  const igdbData = await fetchFromIGDB(id, isSteamId);
  if (igdbData) return igdbData;

  // 2. 尝试从后端代理获取
  if (isSteamId) {
    const backendData = await fetchGameFromBackend(numericId);
    if (backendData) return backendData;
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

async function fetchSteamData(steamAppId) {
  try {
    const steamStoreUrl = `${API_BASE}/steam/proxy?appids=${steamAppId}&l=schinese`;
    const response = await fetch(steamStoreUrl, { signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const data = await response.json();
      const steamGame = data[steamAppId];
      if (steamGame?.success && steamGame.data) {
        const gameData = steamGame.data;
        const screenshots = gameData.screenshots?.map((s, index) => ({
          id: `steam_${index}`,
          image: s.path_full,
          thumbnail: s.path_thumbnail
        })) || [];

        return {
          screenshots,
          website: gameData.website,
          pc_requirements: gameData.pc_requirements
        };
      }
    }
  } catch (error) {
    console.error('Error fetching Steam data:', error);
  }
  return { screenshots: [], website: null, pc_requirements: null };
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params?.id;
  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;
      setLoading(true);

      const appIdStr = String(gameId).trim();
      const isSteamId = /^\d+$/.test(appIdStr);

      let gameData = await fetchGameFullDetail(appIdStr);

      if (gameData) {
        // 并行获取截图和其他 Steam 数据
        const [steamInfo, igdbScr] = await Promise.all([
          (isSteamId) ? fetchSteamData(appIdStr).catch(() => ({ screenshots: [] })) : Promise.resolve({ screenshots: [] }),
          (gameData._source === 'igdb') ? fetchIGDBScreenshots(gameData.id).catch(() => []) : Promise.resolve([])
        ]);

        // 数据补全：如果 IGDB/内部库 没给官网，用 Steam 的
        if (!gameData.website && steamInfo.website) {
          gameData = { ...gameData, website: steamInfo.website };
        }

        // 数据补全：如果没配置要求，用 Steam 的
        if (!gameData.pc_requirements && steamInfo.pc_requirements) {
          gameData = { ...gameData, pc_requirements: steamInfo.pc_requirements };
        }

        const allScreenshots = [...(steamInfo.screenshots || []), ...igdbScr];
        const uniqueScreenshots = Array.from(new Map(allScreenshots.map(item => [item.image, item])).values());
        setScreenshots(uniqueScreenshots);
        setGame(gameData);
      }
      setLoading(false);
    };

    loadGame();
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

  const posterUrl = game.cover_url || game.background_image;
  // 黑神话悟空特殊处理：使用 Steam 竖版封面
  const steamIdForLink = game.steam_app_id || (game._source === 'backend' ? game.id : gameId);
  const finalPosterUrl = (steamIdForLink === 2358720 || game.name?.includes('悟空') || game.name?.includes('Wukong'))
    ? `https://steamcdn-a.akamaihd.net/steam/apps/2358720/library_600x900.jpg`
    : posterUrl;

  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      {/* Hero Background */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        {game.background_image && (
          <>
            <SmartImage src={game.background_image} alt={game.name} gameid={steamIdForLink} className="w-full h-full object-cover md:object-top dynamic-banner scale-110" priority />
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-[#1a0a2e]/60 via-[#1a0a2e]/20 to-transparent backdrop-blur-[60px] opacity-90"></div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#1a0a2e] via-[#1a0a2e]/80 to-transparent"></div>
          </>
        )}
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-8 -mt-56 md:-mt-72 relative z-10 pb-20 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Side Info */}
          <div className="w-full lg:w-[320px] xl:w-[350px] flex-shrink-0 flex flex-col gap-6 items-center lg:items-start">
            <div className="w-[280px] lg:w-full rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-white/10 aspect-[3/4] bg-[#0e141d] relative group">
              <SmartImage src={finalPosterUrl} alt={game.name} gameid={steamIdForLink} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute top-4 right-4 z-30">
                <WishlistButton game={{ ...game, id: steamIdForLink, name: game.name }} />
              </div>
            </div>

            <div className="bg-[#1a0a2e]/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col gap-4 w-full">
              {game.steam_app_id ? (
                <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" className="w-full py-4 bg-[#beee11] hover:bg-[#d4ff1a] text-black font-black rounded-2xl text-center transition-all click-feedback text-sm">STEAM 商店页</a>
              ) : (
                <a href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`} target="_blank" className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl text-center transition-all click-feedback text-sm border border-white/10">在 STEAM 搜索</a>
              )}
              
              {game.website && (
                <a href={game.website} target="_blank" className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-black uppercase tracking-widest rounded-xl text-center border border-white/10 transition-all">官方网站</a>
              )}
            </div>

            <div className="bg-[#1a0a2e]/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 w-full flex flex-col gap-6">
              <div><span className="text-slate-500 block text-sm font-bold uppercase tracking-widest mb-1.5">发行日期</span><span className="text-white font-bold text-sm">{game.released || '未知'}</span></div>
              {game.developers?.length > 0 && <div><span className="text-slate-500 block text-sm font-bold uppercase tracking-widest mb-1.5">开发商</span><span className="text-[#beee11] font-bold text-sm">{game.developers[0].name}</span></div>}

              {/* Additional IGDB Metadata */}
              {(game.game_modes?.length > 0 || game.themes?.length > 0) && (
                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  {game.game_modes?.map(mode => (
                    <div key={mode} className="text-sm bg-white/5 border border-white/10 px-3 py-1.5 rounded text-slate-300 w-fit">
                      {genreTranslationMap[mode] || mode}
                    </div>
                  ))}
                </div>
              )}

              {/* Tags Rendering - Improved for both array and object types */}
              {game.tags?.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <span className="text-slate-500 block text-sm font-bold uppercase tracking-widest mb-3">热门标签</span>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.slice(0, 15).map((tag, idx) => (
                      <span key={idx} className="text-lg font-bold text-slate-400 bg-black/20 px-4 py-2 rounded-lg border border-white/5 hover:text-white transition-all">
                        #{genreTranslationMap[tag.name] || tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 text-white min-w-0 flex flex-col gap-8">
            <div className="flex flex-col gap-6 pt-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tighter leading-tight">
                {game.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                {game.genres?.map(genre => (
                  <Link href={`/discover?genre=${genre.name}`} key={genre.name} className="text-base font-black uppercase tracking-widest bg-[#beee11]/10 border border-[#beee11]/20 text-[#beee11] px-6 py-2 rounded-full hover:bg-[#beee11] hover:text-black transition-all">
                    {genreTranslationMap[genre.name] || genre.name}
                  </Link>
                ))}
                {game.metacritic && (
                  <div className={`ml-auto px-4 py-2 rounded-xl font-black text-black ${game.metacritic >= 75 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    METACRITIC {game.metacritic}
                  </div>
                )}
              </div>
            </div>

            {/* Media Display - Defensive Check for Array Length */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 aspect-video rounded-[2.5rem] overflow-hidden bg-[#0e141d] border border-white/10">
                {screenshots.length > 0 ? (
                  <SmartImage src={screenshots[0].image} alt={game.name} gameid={steamIdForLink} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">No Preview</div>
                )}
              </div>
              <div className="hidden md:block space-y-4">
                {screenshots.slice(1, 3).map((s, i) => (
                  <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                    <SmartImage src={s.image} alt={game.name} gameid={steamIdForLink} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-white/5">
              {['summary', 'media', 'requirements'].map(tab => (
                (tab !== 'requirements' || game.pc_requirements) && (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-lg font-black uppercase tracking-widest relative ${activeTab === tab ? 'text-[#beee11]' : 'text-slate-500'}`}>
                    {tab === 'summary' ? '详情' : tab === 'media' ? `媒体 (${screenshots.length})` : '配置'}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#beee11] rounded-full" />}
                  </button>
                )
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'summary' && (
                <div className="bg-[#1a0a2e]/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  {game.storyline && (
                    <div className="border-b border-white/10 pb-6 italic text-slate-300 text-lg leading-relaxed">
                      {game.storyline}
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none text-slate-400 leading-loose" dangerouslySetInnerHTML={{ __html: game.description || '暂无详细描述。' }} />
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {screenshots.map((s, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-white/10 hover:border-[#beee11]/40 transition-all">
                      <SmartImage src={s.image} alt={i} gameid={steamIdForLink} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'requirements' && game.pc_requirements && (
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 prose prose-invert max-w-none text-slate-400"
                  dangerouslySetInnerHTML={{ __html: game.pc_requirements.minimum || game.pc_requirements.recommended }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
