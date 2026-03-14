'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE, ULTIM_API_BASE, getSteamCoverUrl, RAWG_API_URL, RAWG_API_KEY, enrichGamesWithRAWG, getChineseName } from '@/config';
import { useWishlist } from '@/hooks/useWishlist';
import LoadingScreen from '@/app/_components/loading-screen';
import { SmartImage } from '@/components/common/smart-image';
import {
  fetchUserProfile,
  fetchUserPreferences,
  fetchProfileCompleteness
} from '@/api/user';
import { fetchInteractionHistory, deleteInteractionHistory, fetchInteractionStats } from '@/api/interactions';
import { 
  User, 
  Settings, 
  Gamepad2, 
  Heart, 
  Star, 
  Clock, 
  Save, 
  LogOut, 
  ExternalLink, 
  Trash2,
  Trophy,
  History,
  ShieldCheck
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// 获取用户游戏库
async function fetchUserLibrary(steamId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/steam/games/${steamId}`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) {
    console.error('Error loading library:', err);
  }
  return [];
}

// 获取最近玩过
async function fetchRecentlyPlayed(steamId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/steam/recent/${steamId}?count=10`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (err) {
    console.error('Error loading recent games:', err);
  }
  return [];
}

// 获取 Steam 用户信息
async function fetchSteamUserInfo(steamId) {
  try {
    const response = await fetch(`${ULTIM_API_BASE}/steam/user/${steamId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Error loading user info:', err);
  }
  return null;
}

// 游戏卡片组件
function GameCard({ game, onRemove, showRemove }) {
  const appId = game.game_data?.id || game.game_id;
  const name = getChineseName(game.game_data?.name || game.name || '未知游戏');
  const coverUrl = game.game_data?.background_image || game.background_image;

  return (
    <div className="relative group">
      {showRemove && onRemove && (
        <button
          onClick={() => onRemove(game.game_id)}
          className="absolute -top-2 -right-2 z-20 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-all hover:scale-110"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      )}
      <Link href={`/games/${appId}`} className="block group">
        <div className="aspect-video rounded-lg overflow-hidden bg-[#1a1a2e]/40 border border-white/5 relative group">
          <SmartImage
            src={coverUrl}
            alt={name}
            gameid={appId}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
        </div>
         <div className="mt-2 px-1 text-center">
           <p className="text-[11px] font-bold text-blue-100 truncate group-hover:text-blue-400 transition-colors">
             {name}
           </p>
         </div>
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [library, setLibrary] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [activeTab, setActiveTab] = useState('steam');

  const [userProfile, setUserProfile] = useState(null);
  const [dnaStats, setDnaStats] = useState([]);
  const [completeness, setCompleteness] = useState(0);
  const [interactionStats, setInteractionStats] = useState({});
  const [history, setHistory] = useState([]);

  const { wishlist, loading: wishlistLoading, refresh: refreshWishlist } = useWishlist(mounted);

  // 防止 SSR hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const steamId = localStorage.getItem('steam_id');
    const username = localStorage.getItem('steam_username');
    const avatar = localStorage.getItem('steam_avatar');

    if (!steamId) {
      router.push('/login');
      return;
    }

    setUser({
      steamId,
      username: username || 'Steam 用户',
      avatar: avatar || ''
    });

    loadData(steamId);
  }, [router]);

  const loadData = async (steamId) => {
    setIsLoading(true);

    const [libraryData, recentData, profile, prefs, complete, iStats, hist] = await Promise.all([
      fetchUserLibrary(steamId),
      fetchRecentlyPlayed(steamId),
      fetchUserProfile(steamId),
      fetchUserPreferences(steamId),
      fetchProfileCompleteness(steamId),
      fetchInteractionStats(steamId),
      fetchInteractionHistory(steamId)
    ]);

    // 补全 RAWG 图片数据
    // 对于整个库，我们只补全前 60 个（首页展示的数量），避免请求压力过大
    const [enrichedLibrary, enrichedRecent] = await Promise.all([
      enrichGamesWithRAWG(libraryData.slice(0, 60)),
      enrichGamesWithRAWG(recentData)
    ]);

    setLibrary([...enrichedLibrary, ...libraryData.slice(60)]);
    setRecentGames(enrichedRecent);
    setUserProfile(profile.data);
    setDnaStats(prefs.data?.preferred_genres || []);
    setCompleteness(complete.data?.completion_score || 0);
    setInteractionStats(iStats.data || {});
    setHistory(hist.data || []);
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('steam_id');
    localStorage.removeItem('steam_username');
    localStorage.removeItem('steam_avatar');
    localStorage.removeItem('steam_expires');
    router.push('/login');
  };

  // 计算游戏库统计
  const calculateStats = () => {
    const totalGames = library?.length || 0;
    const totalPlaytime = library?.reduce((acc, game) => acc + (game.playtime_forever || 0), 0) || 0;
    const hoursPlayed = Math.round(totalPlaytime / 60);

    return {
      totalGames,
      hoursPlayed,
      recentGamesCount: recentGames?.length || 0,
      wishlistCount: wishlist?.length || 0,
      interactionCount: interactionStats?.total_interactions || 0,
      reviewCount: interactionStats?.review_count || 0
    };
  };

  if (isLoading || wishlistLoading) {
    return <LoadingScreen />;
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0f1729] pt-32 text-white">


      <main className="container mx-auto px-4 xl:px-40 relative z-10 pb-12">
        {/* 用户主要信息 */}
        <div className="bg-[#1a1a2e]/60 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(26,10,46,0.8) 0%, rgba(45,27,78,0.6) 100%)' }}>


          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8">
            {/* 头像 */}
            <div className="relative">

              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-40 h-40 rounded-full border-4 border-white/20 relative z-10 object-cover"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-neutral-200 flex items-center justify-center relative z-10 border-4 border-white/20">
                  <User className="w-12 h-12 text-neutral-400" />
                </div>
              )}
            </div>

            {/* 用户核心信息 */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full mb-3">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-bold text-blue-300 tracking-widest">已验证玩家</span>
              </div>
              <h1 className="text-5xl font-black text-white mb-3">{user?.username}</h1>
              <p className="text-blue-200/60 text-base font-medium mb-6">Steam ID: {user?.steamId}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  href="https://steamcommunity.com/my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 transition-all flex items-center gap-2 text-base font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  Steam 个人资料
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-base font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>

            {/* 核心数据仪表盘 */}
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              {[
                { label: "游戏珍藏", value: stats.totalGames, color: "text-white" },
                { label: "探索时长", value: `${stats.hoursPlayed}小时`, color: "text-blue-300" },
                { label: "专业评测", value: stats.reviewCount, color: "text-white" },
                { label: "游戏足迹", value: stats.interactionCount, color: "text-blue-300" }
              ].map((stat, i) => (
                <div key={i} className="bg-[#1a1a2e]/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center min-w-[100px]">
                  <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* 标签页导航 */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { key: 'steam', label: '我的游戏库', Icon: Gamepad2 },
            { key: 'wishlist', label: '愿望清单', Icon: Heart },
            { key: 'recent', label: '最近足迹', Icon: Clock },
            { key: 'history', label: '探索记录', Icon: History }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap flex items-center gap-3 border border-white/10",
                 activeTab === tab.key
                   ? "bg-white text-blue-900 translate-y-[-2px]"
                   : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
               )}
             >
               <tab.Icon className={cn("w-4 h-4", activeTab === tab.key ? "text-blue-600" : "text-white/40")} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

         {/* 标签页内容 */}
         {activeTab === 'steam' && (
           <div className="bg-[#1a1a2e]/60 backdrop-blur-md rounded-2xl p-8 border border-white/5">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Gamepad2 className="w-6 h-6 text-blue-400" /> 我的游戏库
                </h3>
                <div className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-white/40">
                   共 {library?.length || 0} 款
                </div>
            </div>
            {library?.length > 0 ? (
              <div className="grid grid-cols-6 gap-3">
                {library.slice(0, 60).map(game => (
                  <a
                    key={game.appid}
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-[#1a1a2e]/40 border border-white/5 mb-3 relative group">
                      <SmartImage
                        src={game.background_image || getSteamCoverUrl(game.appid, 'capsule_231x87')}
                        alt={game.name}
                        gameid={game.appid}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <p className="text-xs font-bold text-white truncate px-1 group-hover:text-blue-400 transition-colors">
                      {getChineseName(game.name)}
                    </p>
                    {game.playtime_forever > 0 && (
                      <p className="text-xs font-black text-blue-300/80 px-1 mt-1 tracking-wider">
                        已游玩 {Math.round(game.playtime_forever / 60)} 小时
                      </p>
                    )}
                  </a>
                ))}
              </div>
            ) : (
               <p className="text-white/30 text-center py-20 italic">您的游戏库空空如也...</p>
            )}
            {(library?.length || 0) > 60 && (
              <p className="text-neutral-400 text-center mt-12 text-sm font-medium">
                以及其他 {(library?.length || 0) - 60} 款精彩作品
              </p>
            )}
          </div>
        )}

         {activeTab === 'wishlist' && (
           <div className="bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-400 fill-current" /> 愿望清单
                </h3>
                <div className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-white/40">
                   共 {wishlist?.length || 0} 款
                </div>
              </div>
            {wishlist?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {wishlist.map(game => (
                  <GameCard
                    key={game.game_id}
                    game={game}
                    showRemove={true}
                    onRemove={async (gameId) => {
                      await fetch(`${API_BASE}/wishlist`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ steam_id: user?.steamId, game_id: gameId })
                      });
                      refreshWishlist();
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-neutral-400 mb-6 italic">您的愿望单中暂无珍藏</p>
                <Link
                  href="/discover"
                  className="inline-block px-8 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all"
                >
                  去发现新世界
                </Link>
              </div>
            )}
          </div>
        )}

         {activeTab === 'recent' && (
           <div className="bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-white/5">
             <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
               <Clock className="w-6 h-6 text-blue-400" /> 最近足迹
             </h3>
            {recentGames?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {recentGames.map(game => (
                  <a
                    key={game.appid}
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-[#1a1a2e]/40 border border-white/5 mb-3 relative group">
                      <SmartImage
                        src={game.background_image || getSteamCoverUrl(game.appid, 'capsule_231x87')}
                        alt={game.name}
                        gameid={game.appid}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 truncate px-1 group-hover:text-[var(--game-gold)] transition-colors">
                      {getChineseName(game.name)}
                    </p>
                    <p className="text-xs font-black text-neutral-400 px-1 mt-1 tracking-wider">
                      已游玩 {Math.round(game.playtime_forever / 60)} 小时
                    </p>
                  </a>
                ))}
              </div>
            ) : (
               <p className="text-white/30 text-center py-20 italic">近期暂无冒险记录</p>
            )}
          </div>
        )}

         {activeTab === 'history' && (
           <div className="bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-white/5">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <History className="w-6 h-6 text-blue-300" /> 探索记录
                </h3>
               <button 
                  onClick={async () => {
                     if(window.confirm('确定要清除所有交互历史吗？此操作不可恢复。')) {
                        await deleteInteractionHistory(user.steamId);
                        setHistory([]);
                     }
                  }}
                   className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/10 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest active:scale-95"
               >
                  清除数据
               </button>
            </div>
            
            {history?.length > 0 ? (
               <div className="space-y-4">
                 {history.slice(0, 30).map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between p-5 bg-[#1a1a2e]/40 rounded-xl border border-white/5">
                     <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                           item.interaction_type === 'play' ? 'bg-green-100 text-green-600' :
                           item.interaction_type === 'view' ? 'bg-blue-100 text-blue-600' :
                           'bg-orange-100 text-orange-600'
                        }`}>
                           {item.interaction_type.toUpperCase()[0]}
                        </div>
                         <div>
                            <p className="text-white text-base font-bold">{getChineseName(item.product_name || `游戏 ID: ${item.product_id}`)}</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
                               操作: <span className="text-white/60">{item.interaction_type === 'play' ? '游玩' : item.interaction_type === 'view' ? '查看' : '收藏'}</span> • 
                               分值: <span className="text-blue-400">{item.interaction_value || 0}</span>
                            </p>
                         </div>
                     </div>
                     <span className="text-[10px] text-neutral-300 font-bold">{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-neutral-200 rounded-3xl">
                <p className="text-neutral-400 font-medium italic">您的虚拟足迹尚待开拓</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
