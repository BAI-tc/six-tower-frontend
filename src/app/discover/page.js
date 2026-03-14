'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { RAWG_API_URL, RAWG_API_KEY, getChineseName, enrichGamesWithRAWG } from '@/config';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { WishlistButton } from '@/hooks/useWishlist';
import LoadingScreen from '@/app/_components/loading-screen';

const PAGE_SIZE = 60;

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

// 本地 CSV 中的有效 app id 集合
let validAppIds = new Set();
let validAppIdsLoaded = false;

// 从本地 CSV 加载有效的 app id (已禁用: CSV 文件太大不建议在客户端加载)
async function loadValidAppIds() {
  console.log('Valid app IDs filtering disabled for performance');
  validAppIdsLoaded = true;
  return validAppIds;
}

// 过滤游戏，只保留 CSV 中存在的 app id
function filterByValidAppIds(games) {
  if (validAppIds.size === 0) return games;
  return games.filter(g => validAppIds.has(g.id));
}

// 从 RAWG 获取游戏列表
async function fetchGames(params) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.set('page', params.page.toString());
  if (params.page_size) queryParams.set('page_size', params.page_size.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.genres) queryParams.set('genres', params.genres);
  if (params.platforms) queryParams.set('parent_platforms', params.platforms);
  if (params.ordering) queryParams.set('ordering', params.ordering);
  if (params.dates) queryParams.set('dates', params.dates);

  try {
    const response = await fetch(`${RAWG_API_URL}/games?key=${RAWG_API_KEY}&${queryParams.toString()}`, { cache: 'no-store' });
    if (response.status === 401 || response.status === 429) {
      return { games: [], pagination: {}, error: 'RAWG_API_LIMIT' };
    }
    if (response.ok) {
      const data = await response.json();
      return {
        games: data.results || [],
        pagination: {
          page: params.page || 1,
          page_size: params.page_size || PAGE_SIZE,
          total: data.count || 0,
          has_more: !!data.next
        }
      };
    }
  } catch (error) {
    console.error('Error fetching games:', error);
  }
  return { games: [], pagination: {} };
}

// 从 RAWG 获取品类列表
async function fetchGenres() {
  try {
    const response = await fetch(`${RAWG_API_URL}/genres?key=${RAWG_API_KEY}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    }
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
  return [];
}

// 平台配置
const platformConfig = {
  pc: { name: 'PC', color: '#1a0a2e' },
  playstation: { name: 'PS', color: '#003087' },
  xbox: { name: 'Xbox', color: '#107C10' },
  nintendo: { name: 'Switch', color: '#e60012' },
  ios: { name: 'iOS', color: '#000000' },
  android: { name: 'Android', color: '#3DDC84' },
  linux: { name: 'Linux', color: '#FCC624' },
  mac: { name: 'Mac', color: '#000000' },
};

function getCardPlatforms(game) {
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
      result.push(platformConfig[key] || { name: 'PC' });
    }
  });

  return result.slice(0, 3);
}

// 游戏卡片组件
function GameCard({ game }) {
  const appId = game.id;
  const coverUrl = game.background_image;
  const rating = game.metacritic || game.rating;
  const released = game.released;
  const genres = game.genres?.slice(0, 2).map(g => {
    const name = g.name || g;
    return genreTranslationMap[name] || name;
  }) || [];
  const platforms = getCardPlatforms(game);

  const prices = [0, 0, 4.99, 9.99, 14.99, 19.99, 24.99, 29.99, 39.99, 49.99, 59.99];
  const price = game.price || prices[appId % prices.length];
  const isFree = price === 0;

  return (
    <Link href={`/games/${appId}`} className="block cursor-pointer group">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0e141d] transition-all duration-300">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            {game.name}
          </div>
        )}

        {rating && (
          <div className="absolute top-2 left-2 bg-[#ff00ff] text-black text-xs font-bold px-2 py-0.5 rounded z-10">
            {Math.round(rating)}
          </div>
        )}

        <WishlistButton game={game} />

        {platforms.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {platforms.map((p, idx) => (
              <span key={idx} className="text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                {p.name}
              </span>
            ))}
          </div>
        )}


        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          <p className="text-white text-sm font-bold line-clamp-1 mb-1">{getChineseName(game.name)}</p>
          <div className="flex flex-wrap gap-1 mb-1">
            {genres.map((g, idx) => (
              <span key={idx} className="text-[10px] bg-[#ff00ff]/20 text-[#ff00ff] px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
          {released && (
            <p className="text-slate-400 text-[10px]">{released.split('-')[0]}</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs font-bold text-white text-center line-clamp-2 group-hover:text-[#ff00ff] transition-colors">
        {getChineseName(game.name)}
      </div>
      {released && (
        <p className="text-slate-500 text-xs text-center truncate mt-1">
          {released.split('-')[0]}
        </p>
      )}
    </Link>
  );
}

// 游戏列表项组件
function GameListItem({ game }) {
  const appId = game.id;
  const coverUrl = game.background_image;
  const rating = game.metacritic || game.rating;
  const released = game.released;
  const genres = game.genres?.slice(0, 3).map(g => {
    const name = g.name || g;
    return genreTranslationMap[name] || name;
  }) || [];
  const platforms = getCardPlatforms(game);

  const prices = [0, 0, 4.99, 9.99, 14.99, 19.99, 24.99, 29.99, 39.99, 49.99, 59.99];
  const price = game.price || prices[appId % prices.length];
  const isFree = price === 0;

  return (
    <Link href={`/games/${appId}`} className="block cursor-pointer group">
      <div className="flex gap-3 p-2 bg-[#1a0a2e] hover:bg-[#2d0a3e] rounded-lg transition-colors">
        <div className="w-[60px] h-[80px] rounded overflow-hidden bg-[#0e141d] flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={game.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              {getChineseName(game.name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#ff00ff] transition-colors">
                {getChineseName(game.name)}
              </h3>
              {rating && (
                <span className="bg-[#ff00ff] text-black text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                  {Math.round(rating)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {platforms.length > 0 && (
                <div className="flex gap-1">
                  {platforms.slice(0, 2).map((p, idx) => (
                    <span key={idx} className="text-[9px] text-slate-500">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
              {genres.length > 0 && (
                <span className="text-[9px] text-slate-500">
                  {genres[0]}
                </span>
              )}
              {released && (
                <span className="text-[9px] text-slate-600">{released.split('-')[0]}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 平台选项
const PLATFORM_OPTIONS = [
  { value: '', label: '所有平台' },
  { value: '1', label: 'PC' },
  { value: '2', label: 'Playstation' },
  { value: '3', label: 'Xbox' },
  { value: '4', label: 'iOS' },
  { value: '5', label: 'Android' },
  { value: '6', label: 'Mac' },
  { value: '7', label: 'Linux' },
  { value: '8', label: 'Nintendo' },
];

// 日期选项
const DATE_OPTIONS = [
  { value: '', label: '不限时间' },
  { value: '2025-01-01,2025-12-31', label: '今年' },
  { value: '2024-01-01,2024-12-31', label: '去年' },
  { value: '2025-02-01,2025-03-13', label: '最近30天' },
];

// 排序选项
const SORT_OPTIONS = [
  { value: '-added', label: '热度' },
  { value: '-metacritic', label: '评分' },
  { value: '-rating', label: '用户评分' },
  { value: '-released', label: '发售日期' },
  { value: 'name', label: '名称' },
];

function FilterDropdown({ label, options, value, onChange, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value ? options.find(o => o.value === value)?.label : label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-[#0e141d] border border-slate-600 rounded-lg text-white hover:border-[#ff00ff] transition-colors min-w-[120px] ${value ? 'border-[#ff00ff]' : ''}`}
      >
        {icon}
        <span className="text-sm truncate flex-1 text-left">{selectedLabel}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a0a2e] border border-[#2d0a3e] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#2d0a3e] transition-colors ${value === option.value ? 'text-[#ff00ff] bg-[#2d0a3e]' : 'text-white'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 60,
    ordering: '-added',
    genres: '',
    platforms: '',
    dates: '',
    search: '',
  });

  const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();

  useEffect(() => {
    // 先加载本地有效的 app id
    loadValidAppIds();
    loadGenres();
  }, []);

  useEffect(() => {
    loadGames();
  }, [filters]);

  const loadGenres = async () => {
    const data = await fetchGenres();
    setGenres(data);
  };

  const loadGames = async () => {
    setIsLoading(true);
    
    // 因为 RAWG API 单次请求最多返回 40 条数据，为了实现 60 条（6*10）的展示，
    // 我们将 UI 的每一页对应到 RAWG 的两个连续页（每页 30 条）
    const fetchPagePart = async (pageNum) => {
      const params = {
        page: pageNum,
        page_size: 30,
        ordering: filters.ordering,
        genres: filters.genres,
        platforms: filters.platforms,
        dates: filters.dates,
        search: filters.search,
      };
      return await fetchGames(params);
    };

    try {
      // 并行请求两个部分
      const [data1, data2] = await Promise.all([
        fetchPagePart(filters.page * 2 - 1),
        fetchPagePart(filters.page * 2)
      ]);

      if (data1.error === 'RAWG_API_LIMIT' || data2.error === 'RAWG_API_LIMIT') {
        window.alert('RAWG API 次数已达上限或 Key 无效，部分内容可能无法显示。');
        setIsLoading(false);
        return;
      }

      const combinedGames = [...(data1.games || []), ...(data2.games || [])];
      
      // 添加：使用全局增强工具补全中文名称和高清图片
      const enrichedGames = await enrichGamesWithRAWG(combinedGames);
      
      // 过滤只保留 CSV 中存在的 app id (如果已加载)
      const filteredGames = validAppIds.size > 0 ? filterByValidAppIds(enrichedGames) : enrichedGames;
      
      setGames(filteredGames);
      setPagination({
        ...data2.pagination,
        page: filters.page,
        page_size: 60,
        has_more: data2.pagination.has_more
      });
    } catch (error) {
      console.error('Error in loadGames:', error);
    }

    setIsLoading(false);
    if (initialLoad) {
      setInitialLoad(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleHistoryClick = (term) => {
    handleFilterChange('search', term);
  };

  const activeFilterCount = [filters.platforms, filters.genres, filters.dates].filter(Boolean).length;

  if (initialLoad) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen pt-20">
      <main className="container mx-auto px-4 xl:px-40 py-8">
        {/* 标题标语 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            两万多款精选游戏等你发现！
          </h1>
        </div>

        {/* 筛选栏 */}
        <div className="rounded-xl p-4 mb-6 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(26,10,46,0.8) 0%, rgba(45,26,74,0.8) 100%)' }}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索游戏..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filters.search.trim()) {
                      addToHistory(filters.search.trim());
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-[#0e141d] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#ff00ff] text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <FilterDropdown
                label="任何时间"
                options={DATE_OPTIONS}
                value={filters.dates}
                onChange={(v) => handleFilterChange('dates', v)}
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />

              <FilterDropdown
                label="所有平台"
                options={PLATFORM_OPTIONS}
                value={filters.platforms}
                onChange={(v) => handleFilterChange('platforms', v)}
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />

              <FilterDropdown
                label="所有类型"
                options={[{ value: '', label: '所有类型' }, ...genres.map(g => ({ value: g.slug, label: genreTranslationMap[g.name] || g.name }))]}
                value={filters.genres}
                onChange={(v) => handleFilterChange('genres', v)}
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
              />

              <FilterDropdown
                label="排序方式"
                options={SORT_OPTIONS}
                value={filters.ordering}
                onChange={(v) => handleFilterChange('ordering', v)}
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
              />

              <div className="flex bg-[#0e141d] rounded-lg border border-slate-600 overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#ff00ff] text-black' : 'text-slate-400 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[#ff00ff] text-black' : 'text-slate-400 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {(activeFilterCount > 0 || filters.ordering !== '-added') && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#2d0a3e] justify-end">
              {filters.dates && <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff00ff]/20 text-[#ff00ff] text-xs rounded">{DATE_OPTIONS.find(o => o.value === filters.dates)?.label}<button onClick={() => handleFilterChange('dates', '')}>✕</button></span>}
              {filters.platforms && <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff00ff]/20 text-[#ff00ff] text-xs rounded">{PLATFORM_OPTIONS.find(o => o.value === filters.platforms)?.label}<button onClick={() => handleFilterChange('platforms', '')}>✕</button></span>}
              {filters.genres && <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff00ff]/20 text-[#ff00ff] text-xs rounded">{genres.find(g => g.slug === filters.genres)?.name}<button onClick={() => handleFilterChange('genres', '')}>✕</button></span>}
              <button onClick={() => setFilters({ page: 1, page_size: 60, ordering: '-added', genres: '', platforms: '', dates: '', search: '' })} className="text-xs text-slate-500 hover:text-[#ff00ff]">清除全部</button>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="rounded-xl p-4 mb-6 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(26,10,46,0.6) 0%, rgba(45,26,74,0.6) 100%)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">最近搜索</h3>
              <button onClick={clearHistory} className="text-xs text-slate-500 hover:text-[#ff00ff]">清除全部</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((item, idx) => (
                <button key={idx} onClick={() => handleHistoryClick(item.term)} className="flex items-center gap-2 px-3 py-1.5 bg-[#0e141d] hover:bg-[#2d0a3e] rounded-lg text-sm text-white group">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {item.term}
                  <button onClick={(e) => { e.stopPropagation(); removeFromHistory(item.term); }} className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100">✕</button>
                </button>
              ))}
            </div>
          </div>
        )}


        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="w-20 h-20 border-[3px] border-transparent border-t-[#ff00ff] border-r-[#00ffff] rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-[3px] border-transparent border-b-[#ff00ff] border-l-[#00ffff] rounded-full animate-[spin_1.5s_linear_reverse]"></div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {games.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {games.map(game => (
                  <GameListItem key={game.id} game={game} />
                ))}
              </div>
            )}

            {/* 分页按钮 */}
            <div className="flex justify-center gap-4 py-6">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="px-6 py-2 bg-[#2d0a3e] text-white rounded-lg disabled:opacity-30 hover:bg-[#ff00ff]"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                className="px-6 py-2 bg-[#2d0a3e] text-white rounded-lg hover:bg-[#ff00ff]"
              >
                下一页
              </button>
            </div>
          </>
        )}
      </main>

      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(26,10,46,0.3) 30%, rgba(26,10,46,0.5) 100%)' }} />
    </div>
  );
}
