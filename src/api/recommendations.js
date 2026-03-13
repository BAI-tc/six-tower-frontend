/**
 * 推荐系统 API 集成模块
 * 对接 steam_recommend-main 后端
 */

import { ULTIM_API_BASE } from '@/config';

/**
 * 获取个性化推荐（For You）
 * 基于用户画像的千人千面推荐
 * @param {number} userId - 用户 ID
 * @param {number} topk - 推荐数量
 * @param {string} algorithm - 算法选择 (auto, embedding, popularity, content)
 * @param {string} rankingStrategy - 排序策略 (default, diversity_focused, quality_focused)
 * @returns {Promise<Object>}
 */
export async function fetchPersonalizedRecommendations(userId, topk = 20, algorithm = 'auto', rankingStrategy = 'default') {
  try {
    // 所有算法现在都通过 Go 后端 (8080) 处理
    const requestUrl = `${ULTIM_API_BASE}/recommendations?user_id=${userId}&topk=${topk}&algorithm=${algorithm}&ranking_strategy=${rankingStrategy}`;

    const response = await fetch(requestUrl, { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
  }
  return { recommendations: [], algorithm: 'error' };
}

/**
 * 获取热门推荐
 * @param {number} limit - 返回数量
 * @param {string} genre - 可选的类型过滤
 * @param {string} steamID - 可选的 Steam ID 用于个性化
 * @returns {Promise<Object>}
 */
export async function fetchPopularGames(limit = 20, genre = null, steamID = null) {
  try {
    const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : '';
    const steamParam = steamID ? `&steam_id=${steamID}` : '';
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/popular?limit=${limit}${genreParam}${steamParam}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching popular games:', error);
  }
  return { games: [], total: 0 };
}

/**
 * 获取趋势推荐
 * @param {number} limit - 返回数量
 * @param {string} timeWindow - 时间窗口 (week, month)
 * @param {string} steamID - 可选的 Steam ID 用于个性化
 * @returns {Promise<Object>}
 */
export async function fetchTrendingGames(limit = 20, timeWindow = 'week', steamID = null) {
  try {
    const steamParam = steamID ? `&steam_id=${steamID}` : '';
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/trending?limit=${limit}&time_window=${timeWindow}${steamParam}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching trending games:', error);
  }
  return { games: [], time_window: timeWindow, total: 0 };
}

/**
 * 获取相似游戏推荐
 * @param {number} productId - 游戏 ID (Steam appid)
 * @param {number} limit - 返回数量
 * @returns {Promise<Object>}
 */
export async function fetchSimilarGames(productId, limit = 10) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/similar/${productId}?limit=${limit}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching similar games:', error);
  }
  return { similar_games: [], total: 0 };
}

/**
 * 获取相似于用户拥有的游戏
 * @param {string} steamId - Steam ID64
 * @param {number} topk - 推荐数量
 * @returns {Promise<Object>}
 */
export async function fetchSimilarToOwned(steamId, topk = 20) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/similar-to-owned/${steamId}?topk=${topk}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching similar to owned:', error);
  }
  return { games: [], total: 0 };
}

/**
 * 获取基于用户类型偏好的推荐
 * @param {string} steamId - Steam ID64
 * @param {number} limit - 每个类型推荐数量
 * @returns {Promise<Object>}
 */
export async function fetchByGenre(steamId, limit = 20) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/by-genre/${steamId}?limit=${limit}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching genre-based recommendations:', error);
  }
  return { games: [], genres: {}, user_preferred_genres: [], total: 0 };
}

/**
 * 获取推荐解释
 * @param {number} userId - 用户 ID
 * @param {number} productId - 游戏 ID
 * @returns {Promise<Object>}
 */
export async function fetchRecommendationExplanation(userId, productId) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/explanation?user_id=${userId}&product_id=${productId}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching recommendation explanation:', error);
  }
  return { explanation: '', influential_games: [], algorithm: 'unknown' };
}

/**
 * 获取热门但用户未拥有的游戏
 * @param {string} steamId - Steam ID64
 * @param {number} limit - 推荐数量
 * @param {number} offset - 偏移量（分页）
 * @param {string} genre - 可选的类型筛选
 * @returns {Promise<Object>}
 */
export async function fetchPopularNotOwned(steamId, limit = 20, offset = 0, genre = null) {
  try {
    const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : '';
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/popular-not-owned/${steamId}?limit=${limit}&offset=${offset}${genreParam}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching popular not owned:', error);
  }
  return { games: [], total: 0, has_more: false };
}

/**
 * 获取基于主题/标签的推荐
 * @param {string} steamId - Steam ID64
 * @param {string} theme - 主题名称 (如 Survival, Horror, Open World)
 * @param {number} limit - 推荐数量
 * @param {number} offset - 偏移量（分页）
 * @returns {Promise<Object>}
 */
export async function fetchByTheme(steamId, theme, limit = 20, offset = 0) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/by-theme/${steamId}?theme=${encodeURIComponent(theme)}&limit=${limit}&offset=${offset}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching by theme:', error);
  }
  return { games: [], total: 0, has_more: false, theme: theme };
}

/**
 * 获取用户最近玩过的游戏
 * @param {string} steamId - Steam ID64
 * @param {number} count - 返回数量
 * @returns {Promise<Object>}
 */
export async function fetchRecentlyPlayed(steamId, count = 10) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/steam/recent/${steamId}?count=${count}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching recently played:', error);
  }
  return { games: [] };
}

/**
 * 获取用户游戏库
 * @param {string} steamId - Steam ID64
 * @returns {Promise<Object>}
 */
export async function fetchUserLibrary(steamId) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/steam/games/${steamId}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user library:', error);
  }
  return { games: [] };
}

// ========== 场景切换模块 (场景二：星系穿越 / 场景三：部落回响) ==========

/**
 * 获取用户的场景信息
 * @param {string} userId - 用户 Steam ID
 * @returns {Promise<Object>}
 */
export async function fetchSceneInfo(userId) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/scene/info?user_id=${userId}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching scene info:', error);
  }
  return { scene_id: 2, galaxy_info: null, tribe_info: null };
}

/**
 * 获取场景推荐
 * @param {string} userId - 用户 Steam ID
 * @param {number} sceneId - 场景ID (2=星系穿越, 3=部落回响)
 * @param {number} topk - 推荐数量
 * @param {string} anchorGameId - 锚点游戏ID (用于星系穿越)
 * @returns {Promise<Object>}
 */
export async function fetchSceneRecommendation(userId, sceneId = 2, topk = 20, anchorGameId = null) {
  try {
    let url = `${ULTIM_API_BASE}/recommendations/scene?user_id=${userId}&scene_id=${sceneId}&topk=${topk}`;
    if (anchorGameId) {
      url += `&anchor_game_id=${anchorGameId}`;
    }
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching scene recommendation:', error);
  }
  return { recommendations: [], algorithm: 'error' };
}

/**
 * 获取星系穿越推荐
 * @param {string} userId - 用户 Steam ID
 * @param {string} anchorGameId - 锚点游戏ID
 * @param {number} topk - 推荐数量
 * @returns {Promise<Object>}
 */
export async function fetchGalaxyRecommendations(userId, anchorGameId = null, topk = 20) {
  try {
    let url = `${ULTIM_API_BASE}/recommendations/galaxy?user_id=${userId}&topk=${topk}`;
    if (anchorGameId) {
      url += `&anchor_game_id=${anchorGameId}`;
    }
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching galaxy recommendations:', error);
  }
  return { recommendations: [], algorithm: 'error' };
}

// ========== 六塔模型权重配置 API ==========

/**
 * 六塔模型默认权重配置
 */
export const DEFAULT_SIX_TOWER_WEIGHTS = {
  svd: 1.2,   // 协同过滤权重
  sem: 0.5,   // 语义推荐权重
  pop: 1.5,   // 热门推荐权重
  prof: 0.2,  // 用户画像/聚类权重
  icf: 0.1,   // 物品协同过滤权重
  cp: 0.05    // 聚类热门权重
};

/**
 * 获取六塔模型权重配置
 * @returns {Promise<Object>} { success: boolean, weights: {...}, source: 'default'|'custom' }
 */
export async function fetchSixTowerWeights() {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/weights`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching six tower weights:', error);
  }
  return { success: false, weights: DEFAULT_SIX_TOWER_WEIGHTS, source: 'default' };
}

/**
 * 设置六塔模型权重配置
 * @param {Object} weights - 权重配置 { svd, sem, pop, prof, icf, cp }
 * @returns {Promise<Object>} { success: boolean, message: string, weights: {...} }
 */
export async function setSixTowerWeights(weights) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/weights`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weights),
      }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error setting six tower weights:', error);
  }
  return { success: false, message: 'Failed to set weights' };
}

/**
 * 重置六塔模型权重为默认值
 * @returns {Promise<Object>} { success: boolean, message: string, weights: {...} }
 */
export async function resetSixTowerWeights() {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/weights/reset`,
      { method: 'POST' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error resetting six tower weights:', error);
  }
  return { success: false, message: 'Failed to reset weights' };
}

/**
 * 获取使用自定义权重的推荐
 * @param {string} userId - 用户 Steam ID
 * @param {number} topk - 推荐数量
 * @returns {Promise<Object>} { algorithm: 'Six_Tower_Weighted', weights: {...}, recommendations: [...] }
 */
export async function fetchWeightedRecommendations(userId, topk = 20) {
  try {
    const response = await fetch(
      `${ULTIM_API_BASE}/recommendations/weighted?user_id=${userId}&topk=${topk}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching weighted recommendations:', error);
  }
  return { recommendations: [], algorithm: 'error' };
}
