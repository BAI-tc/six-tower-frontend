// API 配置
// ULTIM Golang 高并发/低延迟 API 服务 (统一后端)
// 注意：Python 后端 (3001) 已弃用，所有 API 都通过 Go 后端 (8080) 提供
export const API_BASE = 'https://tian.fourever.top/api/v1';
export const ULTIM_API_BASE = 'https://tian.fourever.top/api/v1';
// 搜索服务 API
export const SEARCH_API = 'http://127.0.0.1:3003/api';

// 常用游戏名称中英文映射
export const gameNameMap = {
  'Garry\'s Mod': '盖瑞模组',
  'Portal': '传送门',
  'Portal 2': '传送门2',
  'L4D2': '求生之路2',
  'Left 4 Dead 2': '求生之路2',
  'CS:GO': '反恐精英：全球攻势',
  'Counter-Strike: Global Offensive': '反恐精英：全球攻势',
  'CS2': '反恐精英2',
  'Counter-Strike 2': '反恐精英2',
  'GTA V': '侠盗猎车手5',
  'Grand Theft Auto V': '侠盗猎车手5',
  'Elden Ring': '艾尔登法环',
  'ELDEN RING': '艾尔登法环',
  'Hollow Knight': '空洞骑士',
  'Hades': '哈迪斯',
  'Cyberpunk 2077': '赛博朋克 2077',
  'The Witcher 3: Wild Hunt': '巫师3：狂猎',
  'Red Dead Redemption 2': '荒野大镖客：救赎 2',
  'Stardew Valley': '星露谷物语',
  'Terraria': '泰拉瑞亚',
  'Dota 2': '刀塔 2',
  'Apex Legends': 'Apex 英雄',
  'Destiny 2': '命运 2',
  'Warframe': '星际战甲',
  'Rust': '锈蚀',
  'Dead by Daylight': '黎明杀机',
  'Phasmophobia': '恐鬼症',
  'Baldur\'s Gate 3': '博德之门 3',
  'Black Myth: Wukong': '黑神话：悟空',
  'God of War': '战神',
  'Horizon Zero Dawn': '地平线：零之曙光',
  'Sekiro: Shadows Die Twice': '只狼：影逝二度',
  'Monster Hunter: World': '怪物猎人：世界',
  'Palworld': '幻兽帕鲁',
  'Enshrouded': '雾锁王国',
  'Helldivers 2': '地狱潜者 2',
  'Starfield': '星空',
  'Armored Core VI': '装甲核心 VI',
  'Forza Horizon 5': '极限竞速：地平线 5',
  'Sea of Thieves': '盗贼之海',
  'Valheim': '英灵神殿',
  'Deep Rock Galactic': '深岩银河',
  'V Rising': '夜族崛起',
  'Vampire Survivors': '吸血鬼幸存者',
  'Dave the Diver': '潜水员戴夫',
  'Sifu': '师父',
  'Stray': '迷失',
  'Palworld': '幻兽帕鲁',
  'Ghost of Tsushima': '对马岛之魂',
  'God of War Ragnarök': '战神：诸神黄昏',
  'Spider-Man Remastered': '蜘蛛侠：重制版',
  'Resident Evil 4': '生化危机 4',
  'Resident Evil Village': '生化危机 8：村庄',
  'Devil May Cry 5': '鬼泣 5',
  'Street Fighter 6': '街头霸王 6',
  'Tekken 8': '铁拳 8',
  'Final Fantasy VII Remake': '最终幻想 VII 重制版',
  'Persona 5 Royal': '女神异闻录 5 皇家版',
  'Like a Dragon: Infinite Wealth': '如龙 8',
  'Judgment': '审判之眼',
  'Death Stranding': '死亡搁浅',
  'Control': '控制',
  'Detroit: Become Human': '底特律：化身为人',
  'NieR:Automata': '尼尔：机械纪元',
  'Overwatch 2': '守望先锋 2',
  'League of Legends': '英雄联盟',
  'Valorant': '无畏契约',
  'Genshin Impact': '原神',
  'Honkai: Star Rail': '崩坏：星穹铁道'
};

// 获取游戏的中文名称
export const getChineseName = (originalName) => {
  if (!originalName) return '';
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(originalName)) return originalName;
  // 查找映射表
  return gameNameMap[originalName] || originalName;
};

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

// 使用 RAW G 和 Steam 搜索 API 批量获取游戏信息
export const enrichGamesWithRAWG = async (games) => {
  if (!games || games.length === 0) return games;

  const enrichedGames = await Promise.all(games.slice(0, 200).map(async (game) => {
    const title = game.title || game.name || game.app_name;
    const appId = String(game.appid || game.id || game.product_id);

    // 如果已经有图片且是 RAW G 图片，且名字已经是中文（粗略判断），则跳过
    const isChinese = (str) => /[\u4e00-\u9fa5]/.test(str);
    
    // 尝试获取 Steam 中文数据 (CORS 可能有风险，但在某些环境下可行)
    // 更好的做法是通过后端代理，但这里先尝试直接获取或从已有的 RAWG 数据补全
    let chineseName = game.chinese_name || (isChinese(title) ? title : null);
    let description = game.description || '';

    // 检查缓存
    if (rawgImageCache[appId] && chineseName) {
      return { ...game, background_image: rawgImageCache[appId], name: chineseName, title: chineseName };
    }

    try {
      // 1. 先尝试从 RAWG 获取详情和图片
      const rawgResponse = await fetch(
        `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}&page_size=1`,
        { cache: 'no-store' }
      );

      if (rawgResponse.ok) {
        const data = await rawgResponse.json();
        if (data.results && data.results.length > 0) {
          const rawgGame = data.results[0];
          
          if (rawgGame.background_image) {
            rawgImageCache[appId] = rawgGame.background_image;
          }

          // 2. 尝试从 Steam 获取中文名称和描述 (利用跨域兼容性或后端代理)
          // 注意：这里如果 client 直接请求 store.steampowered.com 可能会 CORS
          // 但我们可以优先保留现有数据
          
          return {
            ...game,
            background_image: rawgGame.background_image || game.background_image,
            name: chineseName || rawgGame.name,
            title: chineseName || rawgGame.name,
            rawg_id: rawgGame.id,
            rawg_genres: rawgGame.genres,
            rawg_rating: rawgGame.rating,
            rawg_metacritic: rawgGame.metacritic,
            rawg_released: rawgGame.released
          };
        }
      }
    } catch (e) {
      console.warn(`[RAWG] Failed to enrich game ${title}:`, e.message);
    }
    return game;
  }));

  return games.length > 200 ? [...enrichedGames, ...games.slice(200)] : enrichedGames;
};

// 清除缓存 (用于调试)
export const clearRAWGCache = () => {
  rawgImageCache = {};
  steamToRawgCache = {};
  console.log('[RAWG] Cache cleared');
};
