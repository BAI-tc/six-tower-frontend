'use client';

import { useState, useEffect, useCallback } from 'react';

// Use Go backend for wishlist
const API_BASE = 'https://tian.fourever.top/api/v1';

// 获取当前用户steam_id
function getCurrentSteamId() {
  if (typeof window === 'undefined') return 'anonymous';
  return localStorage.getItem('steam_id') || 'anonymous';
}

// 游戏状态管理 hook - 只保留愿望单
export function useGameStatus(gameId) {
  const [status, setStatus] = useState({ in_wishlist: false });
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`${API_BASE}/game-status?steam_id=${getCurrentSteamId()}&game_id=${gameId}`);
      const data = await res.json();
      if (data.success) {
        setStatus({ in_wishlist: data.data.in_wishlist || false });
      }
    } catch (e) {
      console.error('Failed to check game status:', e);
    }
  }, [gameId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const addToWishlist = useCallback(async (gameData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: getCurrentSteamId(),
          game_id: gameId,
          game_data: gameData
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => ({ ...prev, in_wishlist: true }));
      }
    } catch (e) {
      console.error('Failed to add to wishlist:', e);
    }
    setLoading(false);
  }, [gameId]);

  const removeFromWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: getCurrentSteamId(),
          game_id: gameId
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => ({ ...prev, in_wishlist: false }));
      }
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
    }
    setLoading(false);
  }, [gameId]);

  return {
    status,
    loading,
    addToWishlist,
    removeFromWishlist,
    refreshStatus: checkStatus
  };
}

// 愿望单按钮组件 - 始终显示桃心
export function WishlistButton({ game }) {
  const gameData = {
    id: game.id,
    name: game.name,
    background_image: game.background_image,
    released: game.released,
    metacritic: game.metacritic,
    genres: game.genres?.slice(0, 3).map(g => g.name) || [],
    rating: game.rating
  };

  const { status, loading, addToWishlist, removeFromWishlist } = useGameStatus(game.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (status.in_wishlist) {
      removeFromWishlist();
    } else {
      addToWishlist(gameData);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-2.5 bg-black/60 hover:bg-red-500 rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/10 group active:scale-90"
      title={status.in_wishlist ? '从愿望单移除' : '添加到愿望单'}
    >
      <svg
        className={`w-5 h-5 text-white transition-all duration-300 ${status.in_wishlist ? 'fill-current' : 'fill-none group-hover:fill-current'}`}
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

// 获取用户愿望单
export function useWishlist(shouldFetch = true) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist?steam_id=${getCurrentSteamId()}`);
      const data = await res.json();
      if (data.success) {
        setWishlist(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch wishlist:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (shouldFetch) {
      fetchWishlist();
    }
  }, [fetchWishlist, shouldFetch]);

  return { wishlist, loading, refresh: fetchWishlist };
}

export default useGameStatus;
