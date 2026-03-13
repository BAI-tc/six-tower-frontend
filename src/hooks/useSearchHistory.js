import { useState, useEffect, useCallback } from 'react';

// 获取当前用户的 Steam ID
const getSteamId = () => {
  return localStorage.getItem('steam_id');
};

// 根据 Steam ID 获取存储 key
const getStorageKey = () => {
  const steamId = getSteamId();
  if (steamId) {
    return `gg_search_history_${steamId}`;
  }
  return null;
};

// 热门搜索词
const POPULAR_SEARCHES = [
  { id: 1, term: 'Cyberpunk 2077', type: 'popular' },
  { id: 2, term: 'Elden Ring', type: 'popular' },
  { id: 3, term: 'Baldur\'s Gate 3', type: 'popular' },
  { id: 4, term: 'Red Dead Redemption 2', type: 'popular' },
  { id: 5, term: 'The Witcher 3', type: 'popular' },
  { id: 6, term: 'GTA V', type: 'popular' },
  { id: 7, term: 'Hogwarts Legacy', type: 'popular' },
  { id: 8, term: 'Spider-Man', type: 'popular' },
];

// 猜你想搜（模拟推荐算法结果）
const RECOMMENDED_SEARCHES = [
  { id: 101, term: 'Stardew Valley', type: 'recommended', reason: 'Based on your farming games' },
  { id: 102, term: 'Hades', type: 'recommended', reason: 'Popular roguelike' },
  { id: 103, term: 'Celeste', type: 'recommended', reason: 'Platformer recommendation' },
  { id: 104, term: 'Hollow Knight', type: 'recommended', reason: 'Similar to Dark Souls' },
];

export function useSearchHistory() {
  const [history, setHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLogin = () => {
      const steamId = localStorage.getItem('steam_id');
      setIsLoggedIn(!!steamId);
    };

    checkLogin();

    // 监听 localStorage 变化
    const handleStorageChange = (e) => {
      if (e.key === 'steam_id') {
        checkLogin();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 初始化时从 localStorage 加载
  useEffect(() => {
    if (!isLoggedIn) {
      setHistory([]);
      return;
    }

    const storageKey = getStorageKey();
    if (!storageKey) {
      setHistory([]);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, [isLoggedIn]);

  // 保存到 localStorage
  const saveHistory = useCallback((newHistory) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    setHistory(newHistory);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }, []);

  // 添加搜索记录（仅登录用户）
  const addToHistory = useCallback((term) => {
    if (!isLoggedIn) return;
    if (!term || term.trim().length === 0) return;

    const storageKey = getStorageKey();
    if (!storageKey) return;

    const trimmed = term.trim();
    setHistory(prev => {
      // 移除重复项
      const filtered = prev.filter(item => item.term.toLowerCase() !== trimmed.toLowerCase());
      // 添加到开头
      const newHistory = [
        { term: trimmed, timestamp: Date.now() },
        ...filtered
      ].slice(0, 10);

      // 保存
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save search history:', e);
      }

      return newHistory;
    });
  }, [isLoggedIn]);

  // 清空搜索历史
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  // 删除单条记录
  const removeFromHistory = useCallback((term) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.term !== term);
      const storageKey = getStorageKey();
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newHistory));
        } catch (e) {
          console.error('Failed to save search history:', e);
        }
      }
      return newHistory;
    });
  }, []);

  // 获取热门搜索
  const getPopularSearches = useCallback(() => {
    return POPULAR_SEARCHES;
  }, []);

  // 获取猜你想搜（仅登录用户）
  const getRecommendedSearches = useCallback(() => {
    if (!isLoggedIn) return [];
    return RECOMMENDED_SEARCHES;
  }, [isLoggedIn]);

  return {
    history: isLoggedIn ? history : [],
    addToHistory,
    clearHistory,
    removeFromHistory,
    getPopularSearches,
    getRecommendedSearches,
    isLoggedIn,
  };
}

export default useSearchHistory;
