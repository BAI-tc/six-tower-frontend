'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RAWG_API_URL, RAWG_API_KEY } from '@/config';
import LoadingScreen from '@/app/_components/loading-screen';
import { WishlistButton } from '@/hooks/useWishlist';

// 类型翻译映射
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

export default function Search() {
  const searchParams = useSearchParams();
  const query = searchParams.get('name') || '';
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchGames(query);
    }
  }, [query]);

  const searchGames = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=30`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const data = await response.json();
        setGames(data.results || []);
      }
    } catch (error) {
      console.error('Error searching games:', error);
    }
    setIsLoading(false);
  };

  // 翻译查询关键词
  const translatedQuery = genreTranslationMap[query] || query;

  return (
    <div className="min-h-screen bg-[#1a0a2e] px-4 xl:px-40 py-8 pt-20">
      <h1 className="text-2xl font-bold text-white mb-6">
        {query ? `搜索结果: "${translatedQuery}"` : '搜索游戏'}
      </h1>

      {isLoading ? (
        <LoadingScreen />
      ) : games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <figure>
                <div className="relative aspect-[3/4] rounded-xl bg-[#0e141d] transition hover:brightness-110 overflow-hidden">
                  {game.background_image ? (
                    <img
                      src={game.background_image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      {game.name}
                    </div>
                  )}
                  <WishlistButton game={game} />
                  {game.metacritic && (
                    <div className="absolute top-2 right-2 bg-[#ff00ff] text-black text-xs font-bold px-2 py-0.5 rounded">
                      {game.metacritic}
                    </div>
                  )}
                </div>
                <figcaption className="mt-2 text-xs font-bold text-white text-center line-clamp-2">
                  {game.name}
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">未找到游戏</p>
      )}
    </div>
  );
}
