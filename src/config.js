// API 配置
// ULTIM Golang 高并发/低延迟 API 服务 (统一后端)
// 注意：Python 后端 (3001) 已弃用，所有 API 都通过 Go 后端 (8080) 提供
export const API_BASE = 'https://tian.fourever.top/api/v1';
export const ULTIM_API_BASE = 'https://tian.fourever.top/api/v1';
// 搜索服务 API
export const SEARCH_API = 'http://127.0.0.1:3003/api';

// 核心类型翻译映射
export const genreTranslationMap = {
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
  'Space': '太空',
  'Point-and-click': '点选',
  'Music': '音乐',
  'Tactical': '战术',
  'Quiz/Trivia': '问答',
  'Hack and slash/Beat \'em up': '砍杀',
  'Pinball': '弹球',
  'Visual Novel': '视觉小说',
  'Turn-based strategy (TBS)': '回合制策略',
  'Real Time Strategy (RTS)': '即时战略',
  'MOBA': 'MOBA',
  // 游戏模式 (Game Modes)
  'Single player': '单人',
  'Multiplayer': '多人',
  'Co-operative': '合作',
  'Splitscreen': '分屏',
  'Massively Multiplayer Online (MMO)': '大型多人在线',
  'Battle Royale': '战术竞技',
  // 视角 (Player Perspectives)
  'First person': '第一人称',
  'Third person': '第三人称',
  'Bird view / Isometric': '俯视角',
  'Side view': '侧视角',
  'Virtual Reality': '虚拟现实',
  'Text': '文本',
  'Auditory': '听觉',
  // 主题 (Themes)
  'Action': '动作',
  'Fantasy': '奇幻',
  'Science fiction': '科幻',
  'Horror': '恐怖',
  'Survival': '生存',
  'Historical': '历史',
  'Stealth': '潜行',
  'Comedy': '喜剧',
  'Business': '经营',
  'Drama': '剧情',
  'Non-fiction': '非虚构',
  'Kids': '儿童',
  'Sandbox': '沙盒',
  'Open world': '开放世界',
  'War': '战争',
  'Educational': '教育',
  'Mystery': '悬疑',
  'Party': '派对',
  'Romance': '浪漫',
  'Erotic': '成人',
  'Thriller': '惊悚'
};

// 常用游戏名称中英文映射 (作为备选)
export const gameNameMap = {
  'Garry\'s Mod': '盖瑞模组',
  'Portal': '传送门',
  'Portal 2': '传送门2',
  'Elden Ring': '艾尔登法环',
  'Cyberpunk 2077': '赛博朋克 2077',
  'Black Myth: Wukong': '黑神话：悟空',
  // ... 其他已在映射表中的
};

// 获取游戏的中文名称
export const getChineseName = (originalName) => {
  if (!originalName) return '';
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(originalName)) return originalName;
  // 按照完整名称匹配
  if (gameNameMap[originalName]) return gameNameMap[originalName];
  // 模糊匹配 (可选)
  return originalName;
};

// IGDB API (游戏数据) - 通过后端代理以使用客户端凭证模式
export const IGDB_API_URL = `${ULTIM_API_BASE}/igdb`;

// IGDB 图片 API
export const IMAGE_API = 'https://images.igdb.com/igdb/image/upload';
export const IMAGE_SIZES = {
  'c-sm': 't_cover_small',
  'c-big': 't_cover_big',
  's-md': 't_screenshot_med',
  's-big': 't_screenshot_big',
  's-huge': 't_screenshot_huge',
  logo: 't_logo_med',
  thumb: 't_thumb',
  micro: 't_micro',
  hd: 't_720p',
  'full-hd': 't_1080p',
};

// Steam CDN 基础 URL (使用 akamaihd CDN)
export const STEAM_IMAGE_BASE = 'https://steamcdn-a.akamaihd.net/steam/apps';

// 生成 Steam 封面 URL
export const getSteamCoverUrl = (appId, size = 'capsule_231x87') => {
  return `${STEAM_IMAGE_BASE}/${appId}/${size}.jpg`;
};

// 生成 Steam 库封面 URL (高清)
export const getSteamLibraryUrl = (appId) => {
  return `${STEAM_IMAGE_BASE}/${appId}/library_600x900.jpg`;
};

// 生成 Steam Hero 图片 (460x215)
export const getSteamHeroUrl = (appId) => {
  return `${STEAM_IMAGE_BASE}/${appId}/library_hero.jpg`;
};

// 使用 IGDB 批量补全游戏信息
export const enrichGamesWithIGDB = async (games) => {
  if (!games || games.length === 0) return games;

  const gamesNeedEnrich = [];
  const existingImages = {};

  games.forEach(game => {
    const appId = String(game.gameid || game.appid || game.id || game.product_id);
    if (!appId || appId === 'undefined' || appId === 'null') return;

    // 只有当图片已经是 IGDB 的时候，才认为不需要补全
    if (game.background_image && game.background_image.includes('images.igdb.com')) {
      existingImages[appId] = game.background_image;
    } else {
      gamesNeedEnrich.push(appId);
    }
  });

  if (gamesNeedEnrich.length > 0) {
    try {
      const idsParam = gamesNeedEnrich.map(id => `"${id}"`).join(',');
      const results = await igdb.request('/games', `
        fields name, cover.image_id, artworks.image_id, external_games.uid;
        where external_games.category = 1 & external_games.uid = (${idsParam});
        limit 100;
      `);

      if (Array.isArray(results)) {
        results.forEach(res => {
          const steamId = res.external_games?.find(ext => ext.category === 1)?.uid;
          if (steamId) {
            // 存储官方原图数据：artwork 用于横屏，cover 用于竖屏
            existingImages[steamId] = {
              landscape: res.artworks && res.artworks.length > 0
                ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${res.artworks[0].image_id}.jpg`
                : (res.cover?.image_id ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${res.cover.image_id}.jpg` : null),
              portrait: res.cover?.image_id
                ? `${IMAGE_API}/${IMAGE_SIZES['hd']}/${res.cover.image_id}.jpg`
                : null
            };
          }
        });
      }
    } catch (err) {
      console.error('[IGDB] Enrichment error:', err);
    }
  }

  return games.map(game => {
    const appId = String(game.gameid || game.appid || game.id || game.product_id);
    const backgroundImage = existingImages[appId];
    let enrichedGame = { ...game };

    if (!hasChinese(enrichedGame.name || enrichedGame.title || enrichedGame.app_name)) {
      enrichedGame.name = getChineseName(enrichedGame.name || enrichedGame.title || enrichedGame.app_name);
      enrichedGame.title = enrichedGame.name;
    }

    if (backgroundImage) {
      if (typeof backgroundImage === 'object') {
        // 如果是新格式，根据上下文选择。首页和卡片目前默认为横版高清需求
        enrichedGame.background_image = backgroundImage.landscape || backgroundImage.portrait;
        enrichedGame.cover_url = backgroundImage.portrait;
      } else {
        enrichedGame.background_image = backgroundImage;
      }
    }

    enrichedGame._enriched = true;
    return enrichedGame;
  });
};

// 辅助函数：判断字符串是否包含中文
export function hasChinese(str) {
  if (!str) return false;
  return /[\u4e00-\u9fa5]/.test(str);
}

// IGDB 专用 API 封装
const fullGameQuery = `
  fields
    name,
    summary,
    aggregated_rating, 
    cover.image_id, 
    artworks.image_id,
    genres.name,
    screenshots.image_id, 

    release_dates.platform.name,
    release_dates.human,

    involved_companies.developer, 
    involved_companies.publisher, 
    involved_companies.company.name, 

    game_modes.name, 
    game_engines.name, 
    player_perspectives.name,
    themes.name,

    external_games.category, 
    external_games.name, 
    external_games.url, 

    similar_games.name,
    similar_games.cover.image_id,

    websites.url,
    websites.category,
    websites.trusted,
    first_release_date
;`;

export const igdb = {
  async request(resource, body) {
    try {
      const response = await fetch(`${IGDB_API_URL}${resource}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: body,
      });
      return await response.json();
    } catch (error) {
      console.error('[IGDB] Request error:', error);
      return [];
    }
  },

  // 搜索游戏
  search(name) {
    return this.request('/games', `
      fields name, cover.image_id, summary, aggregated_rating, genres.name, first_release_date;
      where cover.image_id != null;
      search "${name}";
      limit 24;
    `);
  },

  // 获取热门游戏
  getPopular(limit = 12) {
    return this.request('/games', `
      fields name, cover.image_id, aggregated_rating, genres.name, first_release_date;
      sort aggregated_rating desc;
      where aggregated_rating_count > 20 & aggregated_rating != null;
      limit ${limit};
    `);
  },

  // 根据 ID 获取详情
  getGameDetails(id) {
    return this.request('/games', `${fullGameQuery} where id = ${id};`);
  },

  // 根据 Steam AppID 获取详情
  async getBySteamId(appId) {
    const results = await this.request('/games', `${fullGameQuery} where external_games.category = 1 & external_games.uid = "${appId}";`);
    return results && results.length > 0 ? results[0] : null;
  },

  // 获取截图
  getScreenshots(gameId) {
    return this.request('/screenshots', `fields image_id; where game = ${gameId}; limit 10;`);
  },

  // 获取相似游戏
  getSimilarGames(similarIds) {
    if (!similarIds || similarIds.length === 0) return [];
    const ids = similarIds.join(',');
    return this.request('/games', `fields name, cover.image_id, aggregated_rating; where id = (${ids}); limit 6;`);
  }
};
