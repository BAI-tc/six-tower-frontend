/**
 * 六塔模型权重预设配置
 * 针对不同推荐模块的权重优化组合
 */
import { API_BASE } from '@/config';

export const WEIGHT_PRESETS = {
  // 高分游戏 - 弱化个性化，强化质量基因(Prof)与全局热度
  highRated: {
    svd: 0.2,
    sem: 0.3,
    pop: 1.5,
    prof: 0.8,
    icf: 0.1,
    cp: 0.1
  },

  // 新品热卖 - 极高热度权重，引入分群热度捕捉垂直圈子爆款
  newReleases: {
    svd: 0.1,
    sem: 0.2,
    pop: 2.0,
    prof: 0.5,
    icf: 0.1,
    cp: 0.5
  },

  // 热门趋势 - 结合全局与同好群体的动态趋势
  trending: {
    svd: 0.3,
    sem: 0.2,
    pop: 1.8,
    prof: 0.2,
    icf: 0.2,
    cp: 1.2
  },

  // 热门未拥有 - 在大热榜中剔除已购，SVD保证符合用户大口味
  popularNotOwned: {
    svd: 0.8,
    sem: 0.4,
    pop: 1.5,
    prof: 0.3,
    icf: 0.1,
    cp: 0.3
  },

  // 相似游戏 - 双核心：语义相似+共购关联
  similar: {
    svd: 0.5,
    sem: 1.2,
    pop: 0.2,
    prof: 0.4,
    icf: 1.5,
    cp: 0.1
  },

  // 类型推荐 - 语义塔(Sem)锁死类型标签，SVD做类内排序
  byGenre: {
    svd: 0.6,
    sem: 1.8,
    pop: 0.5,
    prof: 0.3,
    icf: 0.2,
    cp: 0.2
  },

  // 最近游玩 - 基于最后玩过的游戏，触发强关联(ICF)与题材(Sem)
  recentPlayed: {
    svd: 0.4,
    sem: 1.0,
    pop: 0.1,
    prof: 0.2,
    icf: 1.5,
    cp: 0.1
  },

  // 猜你喜欢 - 经典配方：SVD主导，Pop保底
  guessYouLike: {
    svd: 1.2,
    sem: 0.5,
    pop: 1.0,
    prof: 0.2,
    icf: 0.1,
    cp: 0.2
  },

  // 类型热门 - 限定语义空间后的热度竞赛
  genreHot: {
    svd: 0.2,
    sem: 1.0,
    pop: 1.5,
    prof: 0.5,
    icf: 0.1,
    cp: 0.4
  },

  // 同好玩家 - 社会塔核心：完全由同族群(ClusterPop)定义
  tribe: {
    svd: 0.4,
    sem: 0.2,
    pop: 0.3,
    prof: 0.1,
    icf: 0.5,
    cp: 2.0
  },

  // 可能会喜欢 - 强化SVD探索性，增加Prof基因相似度
  quantum: {
    svd: 1.5,
    sem: 0.8,
    pop: 0.5,
    prof: 0.5,
    icf: 0.2,
    cp: 0.2
  },

  // 怀旧重温 - 基因塔(Prof)锁定老款、低活跃但高评分的星系
  resurrection: {
    svd: 0.8,
    sem: 0.4,
    pop: 0.1,
    prof: 1.5,
    icf: 0.2,
    cp: 0.1
  },

  // 时间匹配 - 提取Prof中的"时长基因"，匹配用户历史习惯
  chronos: {
    svd: 0.5,
    sem: 0.3,
    pop: 0.2,
    prof: 1.8,
    icf: 0.1,
    cp: 0.1
  },

  // 核心精选 - 剔除大众热度，专注SVD深度偏好与Sem硬核标签
  cult: {
    svd: 1.2,
    sem: 1.0,
    pop: 0.2,
    prof: 0.8,
    icf: 0.2,
    cp: 0.5
  },

  // 默认权重 - 用于未登录用户
  default: {
    svd: 1.0,
    sem: 0.5,
    pop: 1.5,
    prof: 0.3,
    icf: 0.2,
    cp: 0.3
  },
  // 场景通用权重
  scene: {
    svd: 1.0,
    sem: 0.5,
    pop: 1.5,
    prof: 0.3,
    icf: 0.2,
    cp: 0.3
  }
};

/**
 * 模块配置 - 定义每个模块的参数
 */
export const MODULE_CONFIG = {
  highRated: {
    topk: 40,
    offset: 0,
    preset: 'highRated',
    dedupe: true
  },
  newReleases: {
    topk: 40,
    offset: 40,
    preset: 'newReleases',
    dedupe: true
  },
  trending: {
    topk: 36,
    offset: 80,
    preset: 'trending',
    dedupe: true
  },
  popularNotOwned: {
    topk: 40,
    offset: 116,
    preset: 'popularNotOwned',
    dedupe: true
  },
  similar: {
    topk: 50,
    offset: 156,
    preset: 'similar',
    dedupe: true
  },
  byGenre: {
    topk: 50,
    offset: 206,
    preset: 'byGenre',
    dedupe: true
  },
  recentPlayed: {
    topk: 5,
    offset: 0,
    preset: 'recentPlayed',
    dedupe: false
  },
  guessYouLike: {
    topk: 40,
    offset: 256,
    preset: 'guessYouLike',
    dedupe: true
  },
  genreHot: {
    topk: 30,
    offset: 296,
    preset: 'genreHot',
    dedupe: true
  },
  tribe: {
    topk: 30,
    offset: 326,
    preset: 'tribe',
    dedupe: true
  },
  quantum: {
    topk: 30,
    offset: 356,
    preset: 'quantum',
    dedupe: true
  },
  resurrection: {
    topk: 30,
    offset: 386,
    preset: 'resurrection',
    dedupe: true
  },
  chronos: {
    topk: 30,
    offset: 416,
    preset: 'chronos',
    dedupe: true
  },
  cult: {
    topk: 30,
    offset: 446,
    preset: 'cult',
    dedupe: true
  },
  scene: {
    topk: 30,
    offset: 476,
    preset: 'scene',
    dedupe: true
  }
};

/**
 * 带权重的推荐获取（支持自定义权重）
 * @param {string} userId - 用户 Steam ID
 * @param {number} topk - 推荐数量
 * @param {Object} weights - 自定义权重
 * @returns {Promise<Object>}
 */
export async function fetchWeightedRecommendationsWithWeights(userId, topk, weights, offset = 0) {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      topk: topk.toString(),
      offset: offset.toString(),
      // 传递自定义权重
      weight_svd: weights.svd.toString(),
      weight_sem: weights.sem.toString(),
      weight_pop: weights.pop.toString(),
      weight_prof: weights.prof.toString(),
      weight_icf: weights.icf.toString(),
      weight_cp: weights.cp.toString()
    });

    const response = await fetch(
      `${API_BASE}/recommendations/weighted?${params}`,
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

/**
 * 去重函数 - 从候选列表中选取不在已展示列表中的游戏
 * @param {Array} candidates - 候选游戏列表
 * @param {Set} usedIds - 已使用的游戏ID集合
 * @param {number} count - 需要选取的数量
 * @returns {Array} 筛选后的游戏列表
 */
export function deduplicateGames(candidates, usedIds, count) {
  const result = [];

  for (const game of candidates) {
    const gameId = game.app_id || game.product_id || game.id;
    if (!usedIds.has(String(gameId))) {
      result.push(game);
      usedIds.add(String(gameId));
      if (result.length >= count) break;
    }
  }

  return result;
}

/**
 * 主页面数据加载器 - 六塔模型 + 去重
 * @param {string} steamId - 用户 Steam ID
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>}
 */
export async function loadSixTowerDataWithDedupe(steamId, options = {}) {
  const {
    trendingCount = 10,
    popularNotOwnedCount = 20,
    similarCount = 30,
    genreCount = 10,
    sceneCount = 12,
    scenes = [3, 7, 8, 9, 10]
  } = options;

  // 全局已使用游戏ID集合（用于去重）
  const usedGameIds = new Set();

  // 首先将用户已拥有的游戏加入已使用集合
  // （需要从API获取，这里先预留接口）

  try {
    // 第一批：核心推荐模块（并行请求）
    const [trendingResult, popularNotOwnedResult, similarResult] = await Promise.all([
      // 为你推荐 - 热门+协同
      fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.trending.topk, WEIGHT_PRESETS.trending, MODULE_CONFIG.trending.offset),
      // 热门未拥有 - 热门为主
      fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.popularNotOwned.topk, WEIGHT_PRESETS.popularNotOwned, MODULE_CONFIG.popularNotOwned.offset),
      // 相似游戏 - 语义+ICF
      fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.similar.topk, WEIGHT_PRESETS.similar, MODULE_CONFIG.similar.offset)
    ]);

    // 去重处理
    const trendingGames = deduplicateGames(
      trendingResult.recommendations || [],
      usedGameIds,
      trendingCount
    );

    const popularNotOwnedGames = deduplicateGames(
      popularNotOwnedResult.recommendations || [],
      usedGameIds,
      popularNotOwnedCount
    );

    const similarGames = deduplicateGames(
      similarResult.recommendations || [],
      usedGameIds,
      similarCount
    );

    // 类型专题 - 使用平衡权重
    const genres = ['动作', '角色扮演', '策略', '冒险', '模拟'];
    const genrePromises = genres.map(async (genre, idx) => {
      // 动态增加 offset，防止多个 genre 之间内容重复
      const genreOffset = MODULE_CONFIG.byGenre.offset + (idx * MODULE_CONFIG.byGenre.topk);
      const result = await fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.byGenre.topk, WEIGHT_PRESETS.byGenre, genreOffset);
      return {
        genre,
        games: deduplicateGames(result.recommendations || [], usedGameIds, genreCount)
      };
    });
    const genreResults = await Promise.all(genrePromises);

    // 场景推荐 - 使用场景专属权重
    const scenePromises = scenes.map(async (sceneId, idx) => {
      // 动态增加 offset，确保不同场景之间内容不重复
      const sceneOffset = MODULE_CONFIG.scene.offset + (idx * MODULE_CONFIG.scene.topk);
      const result = await fetchWeightedRecommendationsWithWeights(steamId, MODULE_CONFIG.scene.topk, WEIGHT_PRESETS.scene, sceneOffset);
      return {
        sceneId,
        games: deduplicateGames(result.recommendations || [], usedGameIds, sceneCount)
      };
    });
    const sceneResults = await Promise.all(scenePromises);

    // 最近玩过的游戏（不参与去重，这是用户明确需要的）
    const recentResponse = await fetch(`${API_BASE}/steam/recent/${steamId}?count=5`);
    const recentData = await recentResponse.json().catch(() => ({ games: [] }));

    return {
      trending: trendingGames,
      popularNotOwned: popularNotOwnedGames,
      similar: similarGames,
      genreSpotlight: genreResults.reduce((acc, { genre, games }) => {
        if (games.length > 0) acc[genre] = games;
        return acc;
      }, {}),
      scenes: sceneResults.map((r, idx) => ({
        id: scenes[idx],
        games: r.games
      })),
      recentGames: recentData.games || []
    };
  } catch (error) {
    console.error('Error loading six tower data:', error);
    return {
      trending: [],
      popularNotOwned: [],
      similar: [],
      genreSpotlight: {},
      scenes: [],
      recentGames: []
    };
  }
}
