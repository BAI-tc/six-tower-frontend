'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '@/app/_components/loading-screen';
import { igdb, IMAGE_API, IMAGE_SIZES, genreTranslationMap } from '@/config';
import { WishlistButton } from '@/hooks/useWishlist';

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
      const results = await igdb.search(searchQuery);
      // 转换数据格式以适配现有 UI
      const mappedGames = Array.isArray(results) ? results.map(game => ({
        ...game,
        // IGDB 使用 cover.image_id
        background_image: game.cover ? `${IMAGE_API}/${IMAGE_SIZES['c-big']}/${game.cover.image_id}.jpg` : null,
        // 映射评分为 metacritic 风格以便显示
        metacritic: game.aggregated_rating ? Math.round(game.aggregated_rating) : null
      })) : [];
      setGames(mappedGames);
    } catch (error) {
      console.error('Error searching games:', error);
      setGames([]);
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
