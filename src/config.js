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

// RAWG API (游戏数据) - 通过后端代理以解决生产环境 401 和跨域问题
export const RAWG_API_URL = `${ULTIM_API_BASE}/rawg`;
export const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
export const RAWG_IMAGE_API = 'https://media.rawg.io/media';

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

// 从 RAWG API 获取游戏的 16:9 高清图片
// RAWG 提供的图片通常是 1280x720 (720p) 或更高分辨率
let rawgImageCache = {}; // 内存缓存

// 初始化：从 sessionStorage 加载缓存
if (typeof window !== 'undefined') {
  try {
    const saved = sessionStorage.getItem('rawg_image_cache');
    if (saved) rawgImageCache = JSON.parse(saved);
  } catch (e) {
    console.warn('[RAWG] Failed to load cache from sessionStorage', e);
  }
}

const saveToSession = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('rawg_image_cache', JSON.stringify(rawgImageCache));
    } catch (e) {
      // 容错：缓存过大可能报错
    }
  }
};

// 使用 RAW G 批量搜索一次获取所有游戏的图片
export const fetchRAWGGamesBatch = async (steamAppIds) => {
  // 去重
  const uniqueIds = [...new Set(steamAppIds.map(id => String(id)))];

  // 过滤掉已有缓存图片的，并且排除掉无效的 ID (如 "undefined" 或空值)
  const uncachedIds = uniqueIds.filter(id => id && id !== 'undefined' && id !== 'null' && !rawgImageCache[id]);
  
  // 创建一个暂存区，用于通过名字预测匹配
  // 注意：这只是在 steam_appid 缺失时的最后兜底
  const appIdToNameMap = {};
  steamAppIds.forEach(id => {
      // 假设我们能拿到部分游戏的原始数据，但实际上这里只有ID
      // 后续还是依赖 RAWG 返回的字段更稳
  });

  if (uncachedIds.length === 0) {
    return;
  }

  try {
    // 使用逗号分隔的 steam_appids 批量查询
    const idsParam = uncachedIds.join(',');
    const rawngUrl = `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&steam_appids=${idsParam}&page_size=${uncachedIds.length}`;
    
    const response = await fetch(rawngUrl, { cache: 'no-store' });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      data.results.forEach(game => {
        // 1. 优先尝试直接获取 (部分 RAWG 接口会带这个字段)
        let appId = game.steam_appid ? String(game.steam_appid) : null;

        // 2. 如果没有直接字段，从 stores 列表中精确匹配 Steam 商店的 AppID
        if (!appId && game.stores) {
          const steamStore = game.stores.find(s => s.store && (s.store.id === 1 || s.store.slug === 'steam'));
          if (steamStore && steamStore.url) {
            const match = steamStore.url.match(/\/app\/(\d+)/);
            if (match) appId = match[1];
          }
        }

        if (appId) {
          if (game.background_image) {
            rawgImageCache[appId] = game.background_image;
          } else if (game.short_screenshots && game.short_screenshots.length > 0) {
            rawgImageCache[appId] = game.short_screenshots[0].image;
          }
        }
      });
      saveToSession();
    }
  } catch (err) {
    console.error('[RAWG] Batch fetch error:', err);
  }
};

// 批量获取 RAWG 图片 (检查缓存，必要时批量获取)
export const getRAWGImagesBatch = async (steamAppIds) => {
  const uniqueIds = [...new Set(steamAppIds.map(id => String(id)))];
  const neededIds = uniqueIds.filter(id => !rawgImageCache[id]);

  if (neededIds.length > 0) {
    await fetchRAWGGamesBatch(neededIds);
  }

  const results = {};
  uniqueIds.forEach(id => {
    if (rawgImageCache[id]) {
      results[id] = rawgImageCache[id];
    }
  });

  return results;
};

// 使用 RAW G 和 Steam 搜索 API 批量获取游戏信息 (核心性能优化版)
export const enrichGamesWithRAWG = async (games) => {
  if (!games || games.length === 0) return games;

  const getSteamImage = (appId) => `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

  // 1. 判断哪些游戏需要从 RAWG 补全大图
  const gamesNeedRawg = [];
  const existingImages = {};

  games.forEach(game => {
    // 适配多种潜在的 ID 字段名，特别是推荐接口返回的 gameid
    const appId = String(game.gameid || game.appid || game.id || game.product_id);
    
    // 跳过无效 ID
    if (!appId || appId === 'undefined' || appId === 'null') return;

    if (game.background_image && game.background_image.startsWith('http')) {
      // 后端已返回 RAWG 图片，直接使用
      existingImages[appId] = game.background_image;
    } else {
      gamesNeedRawg.push(appId);
    }
  });

  // 如果所有游戏都有图片，直接返回
  if (gamesNeedRawg.length === 0) {
    return games.map(game => ({ ...game, _enriched: true }));
  }

  // 2. 对于没有图片的游戏，批量获取
  const imageMap = await getRAWGImagesBatch(gamesNeedRawg);

  // 3. 合并已有的图片和从 RAWG 获取的图片
  const allImages = { ...existingImages, ...imageMap };

  // 4. 应用数据
  return games.map(game => {
    const appId = String(game.appid || game.id || game.product_id);
    const backgroundImage = allImages[appId];
    
    // 基础重构：即使没有新图片，也要尝试中文翻译
    let enrichedGame = { ...game };

    // 中文名称翻译（优先映射表，其次检查现有名称是否含中文）
    if (!hasChinese(enrichedGame.name || enrichedGame.title || enrichedGame.app_name)) {
      enrichedGame.name = getChineseName(enrichedGame.name || enrichedGame.title || enrichedGame.app_name);
      enrichedGame.title = enrichedGame.name;
    }

    // 图片处理
    if (backgroundImage) {
      enrichedGame.background_image = backgroundImage;
    } else if (!enrichedGame.background_image) {
      enrichedGame.background_image = getSteamImage(appId);
    }

    // 状态标记
    enrichedGame._enriched = true;
    return enrichedGame;
  });
};

// 辅助函数：判断字符串是否包含中文
function hasChinese(str) {
  if (!str) return false;
  return /[\u4e00-\u9fa5]/.test(str);
}

// 清除缓存 (用于调试)
export const clearRAWGCache = () => {
  rawgImageCache = {};
  steamToRawgCache = {};
  console.log('[RAWG] Cache cleared');
};
