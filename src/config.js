// API 配置
// ULTIM Golang 高并发/低延迟 API 服务 (统一后端)
// 注意：Python 后端 (3001) 已弃用，所有 API 都通过 Go 后端 (8080) 提供
export const API_BASE = 'https://tian.fourever.top/api/v1';
export const ULTIM_API_BASE = 'https://tian.fourever.top/api/v1';
// 搜索服务 API
export const SEARCH_API = 'http://127.0.0.1:3003/api';

// RAWG API (游戏数据)
export const RAWG_API_URL = 'https://api.rawg.io/api';
export const RAWG_API_KEY = '49c56ac48faa4766a9f6a2fc0e24c97f';
export const RAWG_IMAGE_API = 'https://media.itch.zone/image';

// IGDB 图片 API
export const IMAGE_API = 'https://images.igdb.com';
export const IMAGE_SIZES = {
  'c-small': 'cover_small',
  'c-big': 'cover_big',
  'c-medium': 'cover_medium',
  'c-large': 'cover_large',
  'screenshot-huge': 'screenshot_huge',
  'screenshot-big': 'screenshot_big',
  'screenshot-medium': 'screenshot_med',
  '720p': '720p',
  '1080p': '1080p',
  'logo-med': 'logo_med',
};

// Steam 图片基础 URL
export const STEAM_IMAGE_BASE = 'https://media.steampowered.com/steamcommunity/public/images/apps';

// 生成 Steam 封面 URL
export const getSteamCoverUrl = (appId, size = 'capsule_231x87') => {
  return `${STEAM_IMAGE_BASE}/${appId}/${size}.jpg`;
};

// 生成 Steam 库封面 URL (高清)
export const getSteamLibraryUrl = (appId) => {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/library_600x900.jpg`;
};

// 生成 Steam Hero 图片 (460x215)
export const getSteamHeroUrl = (appId) => {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/library_hero.jpg`;
};

// 从 RAWG API 获取游戏的 16:9 高清图片
// RAWG 提供的图片通常是 1280x720 (720p) 或更高分辨率
let rawgImageCache = {};      // steamAppId -> background_image
let steamToRawgCache = {};    // steamAppId -> rawgId

// 使用 RAW G 批量搜索一次获取所有游戏的图片
export const fetchRAWGGamesBatch = async (steamAppIds) => {
  // 去重
  const uniqueIds = [...new Set(steamAppIds.map(id => String(id)))];

  // 过滤掉已有缓存图片的
  const uncachedIds = uniqueIds.filter(id => !rawgImageCache[id]);

  if (uncachedIds.length === 0) {
    console.log('[RAWG] All images already cached');
    return;
  }

  try {
    // 使用逗号分隔的 steam_appids 批量查询 (RAWG支持最多500个)
    // 同时请求 background_image
    const idsParam = uncachedIds.join(',');
    const response = await fetch(
      `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&steam_appids=${idsParam}&page_size=${uncachedIds.length}&fields=id,background_image,short_screenshots,name`,
      { cache: 'no-store' }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        data.results.forEach(game => {
          if (game.steam_appid) {
            const appId = String(game.steam_appid);
            // 保存steam到rawg的映射
            steamToRawgCache[appId] = game.id;
            // 保存图片
            if (game.background_image) {
              rawgImageCache[appId] = game.background_image;
            } else if (game.short_screenshots && game.short_screenshots.length > 0) {
              rawgImageCache[appId] = game.short_screenshots[0].image;
            }
          }
        });
        console.log('[RAWG] Fetched images for', data.results.length, 'games');
      }
    }
  } catch (error) {
    console.error('[RAWG] Error batch fetching games:', error);
  }
};

// 批量获取 RAWG 图片 (检查缓存，必要时批量获取)
export const getRAWGImagesBatch = async (steamAppIds) => {
  const uniqueIds = [...new Set(steamAppIds.map(id => String(id)))];

  // 统计需要获取的数量
  const cachedCount = uniqueIds.filter(id => rawgImageCache[id]).length;
  const neededCount = uniqueIds.length - cachedCount;

  console.log('[RAWG] Cached:', cachedCount, '/', uniqueIds.length);

  // 如果有未缓存的，批量获取
  if (neededCount > 0) {
    await fetchRAWGGamesBatch(uniqueIds);
  }

  // 返回结果
  const results = {};
  uniqueIds.forEach(id => {
    if (rawgImageCache[id]) {
      results[id] = rawgImageCache[id];
    }
  });

  return results;
};

// 使用 RAWG 搜索 API 批量获取游戏图片（类似 Festival 的方式）
// 接收游戏对象数组，每个对象需要包含 appid 和 title/name
export const enrichGamesWithRAWG = async (games) => {
  if (!games || games.length === 0) return games;

  const enrichedGames = await Promise.all(games.slice(0, 30).map(async (game) => {
    // 优先使用 title，其次 name
    const title = game.title || game.name || game.app_name;
    const appId = String(game.appid || game.id || game.product_id);

    // 如果已经有图片且是 RAW G 图片，直接返回
    if (game.background_image && game.background_image.includes('rawg.io')) {
      return game;
    }

    // 检查缓存
    if (rawgImageCache[appId]) {
      return { ...game, background_image: rawgImageCache[appId] };
    }

    if (!title) return game;

    try {
      const response = await fetch(
        `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}&page_size=1`,
        { cache: 'no-store' }
      );

      // API 限制或错误时跳过
      if (!response.ok) {
        return game;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const rawgGame = data.results[0];
        // 保存到缓存
        if (rawgGame.background_image) {
          rawgImageCache[appId] = rawgGame.background_image;
        }
        return {
          ...game,
          background_image: rawgGame.background_image || game.background_image,
          rawg_id: rawgGame.id,
          rawg_genres: rawgGame.genres,
          rawg_rating: rawgGame.rating,
          rawg_metacritic: rawgGame.metacritic,
          rawg_released: rawgGame.released
        };
      }
    } catch (e) {
      console.warn(`[RAWG] Failed to enrich game ${title}:`, e.message);
    }
    return game;
  }));

  return games.length > 30 ? [...enrichedGames, ...games.slice(30)] : enrichedGames;
};

// 清除缓存 (用于调试)
export const clearRAWGCache = () => {
  rawgImageCache = {};
  steamToRawgCache = {};
  console.log('[RAWG] Cache cleared');
};
