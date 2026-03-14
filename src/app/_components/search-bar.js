'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RAWG_API_URL, RAWG_API_KEY } from '@/config';
import { useSearchHistory } from '@/hooks/useSearchHistory';

// 防抖 hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// 平台图标映射
const platformIcons = {
  pc: { name: 'PC', color: '#1a0a2e' },
  playstation: { name: 'PlayStation', color: '#003087' },
  xbox: { name: 'Xbox', color: '#107C10' },
  nintendo: { name: 'Switch', color: '#e60012' },
  ios: { name: 'iOS', color: '#000000' },
  android: { name: 'Android', color: '#3DDC84' },
  linux: { name: 'Linux', color: '#FCC624' },
  mac: { name: 'Mac', color: '#000000' },
  web: { name: 'Web', color: '#FF6600' },
};

function getPlatforms(platforms) {
  if (!platforms) return [];
  return platforms.slice(0, 4).map(p => {
    const slug = p.platform?.slug || '';
    let key = 'pc';
    if (slug.includes('playstation')) key = 'playstation';
    else if (slug.includes('xbox')) key = 'xbox';
    else if (slug.includes('nintendo') || slug.includes('switch')) key = 'nintendo';
    else if (slug.includes('ios') || slug.includes('apple')) key = 'ios';
    else if (slug.includes('android')) key = 'android';
    else if (slug.includes('linux')) key = 'linux';
    else if (slug.includes('mac')) key = 'mac';
    else if (slug.includes('web')) key = 'web';
    return platformIcons[key] || { name: p.platform?.name || 'PC', color: '#666' };
  });
}

// 推荐的热门游戏数据（用于首次展示）
const RECOMMENDED_GAMES = [
  { id: 3498, name: 'Grand Theft Auto V', reason: '开放世界动作' },
  { id: 3328, name: 'The Witcher 3: Wild Hunt', reason: '角色扮演杰作' },
  { id: 4200, name: 'Portal 2', reason: '经典解谜' },
  { id: 5286, name: 'Tomb Raider (2013)', reason: '冒险之旅' },
  { id: 802, name: 'Borderlands 2', reason: '合作射击' },
  { id: 28, name: 'Red Dead Redemption 2', reason: '西部史诗' },
];

// 获取推荐游戏详情
async function fetchRecommendedGames() {
  const ids = RECOMMENDED_GAMES.map(g => g.id).join(',');
  try {
    const res = await fetch(
      `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&ids=${ids}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map(game => {
        const rec = RECOMMENDED_GAMES.find(r => r.id === game.id);
        return {
          ...game,
          reason: rec?.reason || game.genres?.[0]?.name || ''
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch recommended games:', err);
  }
  return [
    { id: 4200, name: 'Portal 2', background_image: 'https://media.rawg.io/media/resize/1280/-/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg', reason: '经典解谜', metacritic: 95 },
    { id: 5286, name: 'Tomb Raider (2013)', background_image: 'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg', reason: '冒险之旅', metacritic: 86 }
  ];
}

async function fetchHotGames() {
  try {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    const dateStr = `${lastYear.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
    const res = await fetch(
      `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&dates=${dateStr}&ordering=-added&page_size=4`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map(game => ({
        ...game,
        reason: game.genres?.[0]?.name || '热门'
      }));
    }
  } catch (err) {
    console.error('Failed to fetch hot games:', err);
  }
  return [
    { id: 3498, name: 'Grand Theft Auto V', background_image: 'https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg', reason: 'Action', metacritic: 92 },
    { id: 3328, name: 'The Witcher 3: Wild Hunt', background_image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg', reason: 'RPG', metacritic: 92 }
  ];
}

// 搜索建议下拉组件
function SearchDropdown({
  query,
  onSelectGame,
  onSelectTerm,
  onClose,
  showHistory = false,
  history = [],
  popular = [],
  recommended = [],
  onClearHistory,
  onRemoveHistory,
  isLoggedIn = false
}) {
  const [games, setGames] = useState([]);
  const [hotGames, setHotGames] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotLoading, setHotLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const hasInput = query.length >= 2;
  const fetchedInitial = useRef(false);

  // 获取初始数据（首次加载，仅登录用户）
  useEffect(() => {
    if (!hasInput && !fetchedInitial.current && isLoggedIn) {
      fetchedInitial.current = true;
      setHotLoading(true);
      setRecLoading(true);
      fetchHotGames().then(data => {
        setHotGames(data);
        setHotLoading(false);
      });
      fetchRecommendedGames().then(data => {
        setRecommendedGames(data);
        setRecLoading(false);
      });
    }
  }, [hasInput, isLoggedIn]);

  // 获取搜索建议
  useEffect(() => {
    if (!hasInput) {
      setGames([]);
      return;
    }

    const fetchGames = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(debouncedQuery)}&page_size=8&page=1`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (data.results) {
          setGames(data.results.map(game => ({
            id: game.id,
            name: game.name,
            background_image: game.background_image,
            metacritic: game.metacritic,
            genres: game.genres?.slice(0, 2).map(g => g.name) || [],
            platforms: getPlatforms(game.platforms)
          })));
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
      setLoading(false);
    };

    fetchGames();
  }, [debouncedQuery, hasInput]);

  // 渲染游戏卡片（横向大卡片）
  const renderGameCard = (game, size = 'small') => {
    const isLarge = size === 'large';
    const cardWidth = isLarge ? 'w-[280px]' : 'w-[180px]';
    const imgHeight = isLarge ? 'h-[160px]' : 'h-[120px]';

    return (
      <Link
        key={game.id}
        href={`/games/${game.id}`}
        className={`${cardWidth} flex-shrink-0 group cursor-pointer`}
        onClick={onClose}
      >
        <div className={`relative ${imgHeight} rounded-xl overflow-hidden bg-[#0e141d]`}>
          {game.background_image ? (
            <img
              src={game.background_image}
              alt={game.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              {game.name.charAt(0)}
            </div>
          )}
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          {/* 评分 */}
          {game.metacritic && (
            <div className="absolute top-2 right-2 bg-[#ff00ff] text-black text-xs font-bold px-2 py-0.5 rounded">
              {game.metacritic}
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-white text-sm font-medium truncate group-hover:text-[#ff00ff] transition-colors">
            {game.name}
          </p>
          {game.reason && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">{game.reason}</p>
          )}
          {/* 平台图标 */}
          {game.platforms && game.platforms.length > 0 && (
            <div className="flex gap-1 mt-1">
              {game.platforms.slice(0, 3).map((p, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-slate-400 bg-[#2d0a3e] px-1.5 py-0.5 rounded"
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  };

  // 渲染游戏搜索结果
  const renderGameSuggestions = () => (
    <ul className="py-2 max-h-96 overflow-y-auto">
      {games.map((game) => (
        <li key={game.id}>
          <Link
            href={`/games/${game.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#2d0a3e] transition-colors"
            onClick={onClose}
          >
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#0e141d] flex-shrink-0">
              {game.background_image ? (
                <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  {game.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{game.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {game.genres.map((genre, idx) => (
                  <span key={idx} className="text-xs text-slate-400">{genre}</span>
                ))}
              </div>
              {game.platforms && game.platforms.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {game.platforms.slice(0, 3).map((p, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 bg-[#2d0a3e] px-1 py-0.5 rounded">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {game.metacritic && (
              <div className="flex-shrink-0 bg-[#ff00ff] text-black text-xs font-bold px-2 py-1 rounded">
                {game.metacritic}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  // 渲染推荐游戏（横向滚动卡片）
  const renderRecommendedSection = () => (
    <div className="py-3">
      <div className="px-4 pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        为您推荐
      </div>
      {recLoading ? (
        <div className="px-4 py-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d0a3e] border-t-[#ff00ff] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {recommendedGames.map(game => renderGameCard(game, 'small'))}
        </div>
      )}
    </div>
  );

  // 渲染列表项
  const renderSection = (title, items, type) => (
    <div className="py-2">
      <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id || item.term}>
            <button
              onClick={() => onSelectTerm(item.term)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#2d0a3e] transition-colors text-left"
            >
              <span className="text-white">{item.term}</span>
              {item.reason && (
                <span className="text-xs text-slate-500">{item.reason}</span>
              )}
              {type === 'history' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHistory(item.term);
                  }}
                  className="text-slate-500 hover:text-white p-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a0a2e] border border-[#2d0a3e] rounded-xl shadow-2xl z-50 overflow-hidden">
      {hasInput ? (
        loading ? (
          <div className="p-4 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#2d0a3e] border-t-[#ff00ff] rounded-full animate-spin"></div>
          </div>
        ) : games.length > 0 ? (
          renderGameSuggestions()
        ) : (
          <div className="p-4 text-slate-400 text-sm text-center">未找到相关游戏</div>
        )
      ) : (
        <div className="max-h-[500px] overflow-y-auto pt-2 pb-4">
          {/* 热门搜索 (Hot Searches) - 垂直列表 */}
          {isLoggedIn && (
            <div className="mb-2">
              <div className="px-4 pb-2 text-sm text-slate-300">
                热门搜索
              </div>
              {hotLoading ? (
                <div className="px-4 py-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#2d0a3e] border-t-[#ff00ff] rounded-full animate-spin"></div>
                </div>
              ) : (
                <ul>
                  {hotGames.map(game => (
                    <li key={game.id}>
                      <Link
                        href={`/games/${game.id}`}
                        className="flex items-start gap-4 px-4 py-2 hover:bg-[#2d0a3e] transition-colors group"
                        onClick={onClose}
                      >
                        <div className="w-[160px] h-[75px] rounded-lg overflow-hidden bg-[#0e141d] flex-shrink-0 relative">
                          {game.background_image ? (
                            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                              {game.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className="text-white font-medium text-sm truncate group-hover:text-[#ff00ff] transition-colors">{game.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-slate-400">{game.reason}</span>
                            {game.metacritic && (
                              <span className="text-xs bg-slate-800 text-white px-1.5 py-0.5 rounded">{game.metacritic}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 推荐的游戏 (Recommended) - 横向卡片 */}
          {isLoggedIn && (recommendedGames.length > 0 || recLoading) && (
            <div className="mb-2 mt-4">
              <div className="px-4 pb-3 text-sm text-slate-300">
                推荐给您
              </div>
              {recLoading ? (
                <div className="px-4 py-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#2d0a3e] border-t-[#ff00ff] rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {recommendedGames.map(game => renderGameCard(game, 'small'))}
                </div>
              )}
            </div>
          )}

          {/* 历史搜索记录 (History) - 横向展示 */}
          {isLoggedIn && showHistory && history.length > 0 && (
            <div className="px-4 py-2 mt-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm text-slate-300">最新搜索记录</span>
                <button onClick={onClearHistory} className="text-xs text-slate-500 hover:text-[#ff00ff] transition-colors">清除</button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-[#00b0f0] mt-1">
                {history.filter(h => h.term.toLowerCase().includes(query.toLowerCase())).map((item, index) => (
                  <span key={item.term} className="inline-block">
                    <button 
                      onClick={(e) => { e.preventDefault(); onSelectTerm(item.term); }}
                      className="hover:underline hover:text-white transition-colors text-left"
                    >
                      {item.term}
                    </button>
                    {index < history.filter(h => h.term.toLowerCase().includes(query.toLowerCase())).length - 1 && <span className="text-slate-500 ml-1">,</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 主搜索框组件
export default function SearchBar({
  placeholder = '搜索游戏...',
  className = '',
  showHistory = false,
  onSearch,
  isLoginPage = false
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const router = useRouter();

  const {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getPopularSearches,
    getRecommendedSearches,
    isLoggedIn
  } = useSearchHistory();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      addToHistory(query);
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/search?name=${encodeURIComponent(query)}`);
      }
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSelectTerm = (term) => {
    addToHistory(term);
    if (onSearch) {
      onSearch(term);
    } else {
      router.push(`/search?name=${encodeURIComponent(term)}`);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          {/* 搜索图标 */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={`w-5 h-5 ${isLoginPage ? 'text-black/50' : 'text-white/70'} group-hover:text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            placeholder={isFocused ? '' : placeholder}
            className={`w-full pl-12 pr-12 py-3 rounded-full border transition-all duration-200 text-sm font-medium ${
              isLoginPage
                ? `${isFocused ? 'bg-white border-gray-300' : 'bg-white/10 border-white/20'} text-black placeholder-gray-400 hover:border-gray-300 hover:bg-white focus:bg-white focus:border-gray-400 focus:shadow-lg focus:outline-none`
                : `${isFocused ? 'bg-white border-white/40' : 'bg-white/10 border-white/10'} text-white placeholder-slate-300 hover:bg-white/20 hover:border-white/30 focus:bg-white/95 focus:border-white/40 focus:outline-none`
            }`}
          />
          {/* 清除按钮 */}
          {query && (
            <button
              type="button"
              onClick={handleClose}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 ${
                isLoginPage ? 'text-gray-400 hover:text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {isOpen && isFocused && (query.trim().length >= 2 || isLoggedIn) && (
        <SearchDropdown
          query={query}
          onSelectGame={() => {
            if (query.trim()) addToHistory(query);
            handleClose();
          }}
          onSelectTerm={handleSelectTerm}
          onClose={handleClose}
          showHistory={showHistory}
          history={history}
          popular={getPopularSearches()}
          recommended={getRecommendedSearches()}
          onClearHistory={clearHistory}
          onRemoveHistory={removeFromHistory}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
