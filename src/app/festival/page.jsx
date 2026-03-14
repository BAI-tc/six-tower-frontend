"use client"

import { useState, useEffect } from "react"
import { GameGallery } from "@/components/festival/game-gallery"
import {
  AutoScrollGallery,
  GameReleaseCard,
  DarkGameCard,
  CornerDecorCard,
  JaggedPromoCard,
  BannerGameCard,
  VideoCard
} from "@/components/festival/cards"
import { enrichGamesWithRAWG, getChineseName } from "@/config"

// 主题名称翻译映射
const themeNameMap = {
  'Action': '动作', 'Adventure': '冒险', 'RPG': '角色扮演',
  'Strategy': '策略', 'Simulation': '模拟', 'Casual': '休闲',
  'Indie': '独立游戏', 'Horror': '恐怖', 'Puzzle': '解谜',
  'Racing': '赛车', 'Sports': '体育', 'Fighting': '格斗',
  'Platformer': '平台跳跃', 'Shooter': '射击', 'MMORPG': '大型多人在线',
  'MOBA': 'MOBA', 'Roguelike': 'Roguelike', 'Roguelite': 'Roguelite',
  'Sandbox': '沙盒', 'Open World': '开放世界', 'Survival': '生存',
  'Building': '建造', 'Multiplayer': '多人', 'Co-op': '合作',
  'Early Access': '抢先体验', 'Free To Play': '免费游玩',
  'Tower Defense': '塔防', 'Card Game': '卡牌游戏', 'Turn-Based': '回合制',
  'Arcade': '街机', 'Stealth': '潜行', 'Metroidvania': '银河恶魔城',
  'Souls-like': '魂类', 'Action RPG': '动作角色扮演', 'JRPG': '日式角色扮演',
  'Space': '太空', 'Sci-Fi': '科幻', 'Fantasy': '奇幻',
  'Medieval': '中世纪', 'Cyberpunk': '赛博朋克', 'Zombie': '僵尸',
  'Post-apocalyptic': '末世', 'Anime': '动漫', 'Pixel Art': '像素风格',
  'First-Person': '第一人称', 'Third-Person': '第三人称',
  'Story Rich': '剧情丰富', 'Dark': '黑暗', 'Retro': '复古',
  'Fast-Paced': '快节奏', 'Difficult': '高难度', 'Colorful': '色彩丰富',
  'Cute': '可爱', 'Comedy': '喜剧', 'Drama': '剧情',
}

// 简化主题名称 - 翻译为中文并去重
const simplifyThemeName = (theme) => {
  if (!theme) return "游戏"
  let cleaned = theme.replace(/['"\[\]]/g, '').replace(/\s*\([^)]*\)\s*/g, '').trim()
  let parts = cleaned.split(/[|,]/).map(p => p.trim()).filter(Boolean)
  let translatedParts = parts.map(part => {
    let translated = part
    const keywords = Object.keys(themeNameMap).sort((a, b) => b.length - a.length)
    for (const keyword of keywords) {
      if (translated.toLowerCase().includes(keyword.toLowerCase())) {
        translated = translated.replace(new RegExp(keyword, 'gi'), themeNameMap[keyword])
      }
    }
    return translated
  })
  let uniqueParts = [...new Set(translatedParts)]
  return uniqueParts.slice(0, 2).join(' · ') || "游戏"
}

// 动态文案引擎映射
const personalizedCopyMap = {
  'Simulation': { title: "开启你的第二人生", sub: "佛系玩家的首选", action: "开始模拟" },
  'Sim': { title: "开启你的第二人生", sub: "佛系玩家的首选", action: "开始模拟" },
  'Indie': { title: "被忽略的小众神作", sub: "感受开发者独特的灵魂", action: "探索灵魂" },
  'Adventure': { title: "继续你的奇幻冒险", sub: "资深冒险家的归宿", action: "立即启航" },
  'Action': { title: "挑战极限的感官盛宴", sub: "属于强者的动作舞台", action: "进入战场" },
  'RPG': { title: "在幻想中书写传奇", sub: "沉浸式的角色史诗", action: "成为主角" },
  'Strategy': { title: "运筹帷幄的指尖博弈", sub: "天才统帅的决策场", action: "即刻布局" },
  'Casual': { title: "忙碌生活中的温柔慰藉", sub: "寻找那份久违的轻松", action: "点点看看" },
  'Horror': { title: "心跳加速的暗黑探索", sub: "直面深藏内心的恐惧", action: "准备尖叫" },
  'Puzzle': { title: "精密严谨的智力挑战", sub: "解开那些被尘封的谜题", action: "破解未知" },
  'Default': { title: "发现属于你的冒险", sub: "继续你的游戏之旅", action: "去发现" }
}

// 获取动态个性化文案
// 兜底高品质游戏池 (当推荐数量不足时使用) - RAWG 图片优先，Steam 后备
const FALLBACK_GAMES = [
  { gameid: "1245620", title: "ELDEN RING", background_image: "https://media.rawg.io/media/resize/1280/-/games/b29/b294fdd866dcdb643e7bab370a552855.jpg" },
  { gameid: "413150", title: "Stardew Valley", background_image: "https://media.rawg.io/media/resize/1280/-/games/713/713269608dc8f2f40f5a670a14b2de94.jpg" },
  { gameid: "1145360", title: "Hades", background_image: "https://media.rawg.io/media/resize/1280/-/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg" },
  { gameid: "374320", title: "Dark Souls III", background_image: "https://media.rawg.io/media/resize/1280/-/games/da1/da1b267764d77221f07a4386b6548e5a.jpg" },
  { gameid: "105600", title: "Terraria", background_image: "https://media.rawg.io/media/games/f46/f466571d536f2e3ea9e815ad17177501.jpg" },
  { gameid: "730", title: "Counter-Strike: Global Offensive", background_image: "https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg" },
  { gameid: "271590", title: "Grand Theft Auto V", background_image: "https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg" },
  { gameid: "1174180", title: "Red Dead Redemption 2", background_image: "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg" },
  { gameid: "292030", title: "The Witcher 3: Wild Hunt", background_image: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg" }
];

const getDynamicCopy = (topPreferences) => {
  const defaultObj = {
    primary: personalizedCopyMap.Default,
    secondary: personalizedCopyMap.Default
  };

  if (!topPreferences || topPreferences.length === 0) return defaultObj;
  
  // 提取第一个非空标签
  const primaryPref = topPreferences[0].split('(')[0].trim();
  const secondaryPref = topPreferences[1]?.split('(')[0].trim();

  // 匹配映射
  const match = Object.keys(personalizedCopyMap).find(key => 
    primaryPref.toLowerCase().includes(key.toLowerCase())
  );

  const secondMatch = secondaryPref ? Object.keys(personalizedCopyMap).find(key => 
    secondaryPref.toLowerCase().includes(key.toLowerCase())
  ) : null;

  return {
    primary: personalizedCopyMap[match] || personalizedCopyMap.Default,
    secondary: personalizedCopyMap[secondMatch] || personalizedCopyMap.Default
  };
}

const ULTIM_API_BASE = process.env.NEXT_PUBLIC_ULTIM_API_URL || "https://tian.fourever.top/api/v1"

// 辅助函数：从推荐数据中提取所有游戏（去重）
function extractAllRecommendedGames(recommendations) {
  const games = []
  if (!recommendations) return games

  Object.values(recommendations).forEach(themeGames => {
    if (Array.isArray(themeGames)) {
      themeGames.forEach(game => {
        if (!games.find(g => g.gameid === game.gameid)) {
          games.push(game)
        }
      })
    }
  })
  return games
}

// RAWG 数据补全已由全局 enrichGamesWithRAWG 接管，不再使用本地按名称搜索的低效方案


export default function FestivalPage() {
  const [recommendationData, setRecommendationData] = useState(null)
  const [allRecommendedGames, setAllRecommendedGames] = useState([])

  useEffect(() => {
    const steamId = typeof window !== 'undefined' ? localStorage.getItem('steam_id') : null

    if (steamId) {
      fetch(`${ULTIM_API_BASE}/recommendations/player-preference?steam_id=${steamId}`)
        .then(res => res.json())
        .then(async data => {
          setRecommendationData(data.data)
          const games = extractAllRecommendedGames(data.data.recommendations)
          setAllRecommendedGames(games)

          // 异步增强数据 - 使用全局优化的批量 AppID 搜索方案
          const enriched = await enrichGamesWithRAWG(games)
          setAllRecommendedGames(enriched)
        })
        .catch(err => {
          console.error("Failed to fetch recommendations:", err)
        })
    }
  }, [])

  // 保证至少有一定规模的游戏池进行展示，并去重（包括与首页去重）
  const displayPool = (() => {
    // 1. 获取首页已展示的游戏 ID
    let homeShownIds = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('homepage_shown_ids');
        if (stored) {
          homeShownIds = JSON.parse(stored).map(id => String(id));
        }
      } catch (e) {
        console.warn('Failed to read homepage shown IDs', e);
      }
    }

    // 2. 过滤推荐的游戏：去重 + 过滤首页已显示的
    const uniqueRecommended = allRecommendedGames.filter(
      (game, index, self) => 
        self.findIndex(g => String(g.gameid) === String(game.gameid)) === index &&
        !homeShownIds.includes(String(game.gameid))
    );

    // 3. 过滤后备游戏：过滤首页已显示的 + 过滤已在推荐中的
    const fallbackUnique = FALLBACK_GAMES.filter(
      fg => !uniqueRecommended.some(ag => String(ag.gameid) === String(fg.gameid)) &&
            !homeShownIds.includes(String(fg.gameid))
    );

    // 4. 合并结果
    return [...uniqueRecommended, ...fallbackUnique];
  })();

  // 1. 画廊 (大图展示) - 取前 8 个
  const galleryGames = displayPool.slice(0, 8);
  
  // 2. 依次分配下方模块，使用 offset 确保完全不重复
  const card1Game = displayPool[8] || displayPool[0];
  const card2Game = displayPool[9] || displayPool[1];
  const card3Game = displayPool[10] || displayPool[2];
  const card4Game = displayPool[11] || displayPool[3];
  const card5Game = displayPool[12] || displayPool[4];
  
  // 3. 底部横幅 - 从第 13 个开始取
  const bannerGames = [
    displayPool[13] || displayPool[5],
    displayPool[14] || displayPool[6]
  ].filter(Boolean);

  // 4. 自动滚动画廊数据 - 从第 15 个开始，避开上方核心位
  // 添加去重逻辑：先过滤掉首页已显示和画廊已用的游戏
  const scrollPool = displayPool.length > 20
    ? displayPool.slice(15).filter(g => !galleryGames.some(gg => String(gg.gameid) === String(g.gameid)))
    : displayPool.filter(g => !galleryGames.some(gg => String(gg.gameid) === String(g.gameid)));

  // 对滚动池进行去重
  const usedScrollIds = new Set();
  const uniqueScrollGames = [];
  scrollPool.forEach(game => {
    if (!usedScrollIds.has(String(game.gameid))) {
      usedScrollIds.add(String(game.gameid));
      uniqueScrollGames.push(game);
    }
  });

  const galleryGamesForScroll = uniqueScrollGames.map(game => {
    const theme = recommendationData?.recommendations
      ? Object.entries(recommendationData.recommendations).find(([_, themeGames]) =>
          themeGames.some(g => String(g.gameid) === String(game.gameid))
        )?.[0]
      : null
    
    return {
      gameid: game.gameid,
      image: game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${game.gameid}/header.jpg`,
      title: getChineseName(game.title),
      category: simplifyThemeName(theme)
    }
  });

  const dynamicCopy = getDynamicCopy(recommendationData?.top_preferences);

  return (
    <>
      {/* 1. 精选游戏展示 */}
      <GameGallery games={galleryGames} recommendationData={recommendationData} />

      {/* 2. 主内容区域 - 使用 themed-background */}
      <main className="relative bg-[#e8dcc8] pt-12 pb-24 overflow-hidden">
        {/* 背景装饰层 - 暖色调高级质感 */}
        
        {/* 1. 网格点 - 暖色调适配 */}
        <div 
          className="absolute inset-0 opacity-[0.1] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #b8954f 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* 2. 背景水印数字 - 增强层级 */}
        <div className="absolute inset-0 flex items-center justify-around opacity-[0.05] pointer-events-none select-none">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-[240px] font-black text-amber-900/20">26</span>
          ))}
        </div>

        {/* 3. 霓虹氛围 - 针对暖色背景优化的橙黄色调 */}
        <div className="absolute top-1/4 left-0 w-[800px] h-[800px] bg-orange-400/10 rounded-full blur-[160px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[160px] translate-x-1/2 pointer-events-none" />

        <div className="px-4 xl:px-40 relative z-10">
          <div className="container mx-auto space-y-24">
            {/* 3. 自动滚动画廊 */}
            <section className="relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-neutral-800">{dynamicCopy.primary.title}</h2>
                  <div className="hidden md:block h-1 w-24 bg-neutral-800/10"></div>
                </div>
                {recommendationData?.top_preferences && (
                  <div className="flex flex-wrap gap-2">
                    {recommendationData.top_preferences.slice(0, 4).map((pref, i) => {
                      const name = simplifyThemeName(pref.split('(')[0])
                      return (
                        <span key={i} className="text-sm font-bold px-2 py-0.5 bg-neutral-800/10 text-neutral-800 rounded border border-neutral-800/20">
                          {name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <AutoScrollGallery games={galleryGamesForScroll.length > 0 ? galleryGamesForScroll : [
                { image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", alt: "游戏 1" },
                { image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80", alt: "游戏 2" },
                { image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80", alt: "游戏 3" },
              ]} speed={40} />
            </section>

            {/* 4. 游戏卡片区域 */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-l-4 border-[var(--game-gold)] pl-4 text-neutral-800">{dynamicCopy.secondary.title}</h3>
                  {card1Game && (
                    <GameReleaseCard
                      gameid={card1Game.gameid}
                      image={card1Game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${card1Game.gameid}/header.jpg`}
                      title={getChineseName(card1Game.title)}
                      releaseDate={`属于你的${dynamicCopy.secondary.action}`}
                      platform={dynamicCopy.secondary.sub}
                    />
                  )}
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-l-4 border-blue-500 pl-4 text-neutral-800">适合独处的角落</h3>
                  {card2Game && (
                    <VideoCard
                      gameid={card2Game.gameid}
                      thumbnail={card2Game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${card2Game.gameid}/header.jpg`}
                      title={getChineseName(card2Game.title)}
                      duration={card2Game.metacritic ? `${card2Game.metacritic}分` : "热门"}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-l-4 border-[var(--game-red)] pl-4 text-neutral-800">寻找灵魂共鸣</h3>
                  {card3Game && (
                    <JaggedPromoCard
                      gameid={card3Game.gameid}
                      image={card3Game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${card3Game.gameid}/header.jpg`}
                      title={getChineseName(card3Game.title)}
                      description={card3Game.description || dynamicCopy.primary.sub}
                    />
                  )}
                </div>
                {card4Game && (
                  <DarkGameCard
                    gameid={card4Game.gameid}
                    image={card4Game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${card4Game.gameid}/header.jpg`}
                    title={getChineseName(card4Game.title)}
                    description={card4Game.description || "发现属于你的高光时刻"}
                    featured={true}
                  />
                )}
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-l-4 border-purple-500 pl-4 text-neutral-800">特别活动</h3>
                  <CornerDecorCard
                    title="开发者交流会"
                    description="与全球顶尖工作室制作人面对面交流。"
                    buttonText="立即参与"
                    href="https://gamesci.cn/about"
                  />
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-l-4 border-green-500 pl-4 text-neutral-800">高分游戏</h3>
                  {card5Game && (
                    <GameReleaseCard
                      gameid={card5Game.gameid}
                      image={card5Game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${card5Game.gameid}/header.jpg`}
                      title={getChineseName(card5Game.title)}
                      releaseDate={card5Game.metacritic ? `Metacritic: ${card5Game.metacritic}` : "热门推荐"}
                      platform={`${card5Game.recommendations?.toLocaleString() || '1,000+'} 人评价`}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* 5. 宽屏横幅卡片 */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-black text-neutral-800">{dynamicCopy.primary.sub === personalizedCopyMap.Default.sub ? "发现你的心仪之选" : dynamicCopy.primary.sub}</h2>
                <div className="h-1 flex-grow bg-neutral-800/10"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bannerGames.length > 0 ? bannerGames.map((game, index) => (
                  <BannerGameCard
                    key={game.gameid}
                    gameid={game.gameid}
                    image={game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${game.gameid}/header.jpg`}
                    title={getChineseName(game.title)}
                    subtitle="属于你的高光之作"
                    variant={index === 0 ? "gradient" : "dark"}
                  />
                ) ) : (
                  <>
                    <BannerGameCard
                      image="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80"
                      title="幻想王国"
                      subtitle="重新定义的开放世界冒险体验。"
                      variant="gradient"
                    />
                    <BannerGameCard
                      image="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80"
                      title="机甲风暴"
                      subtitle="感受极致的金属碰撞与速度对抗。"
                      variant="dark"
                    />
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 底部锯齿边缘 - 为后续区域做对接准备 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-8 md:h-12"
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path
              d="M0 48L30 24L60 48L90 24L120 48L150 24L180 48L210 24L240 48L270 24L300 48L330 24L360 48L390 24L420 48L450 24L480 48L510 24L540 48L570 24L600 48L630 24L660 48L690 24L720 48L750 24L780 48L810 24L840 48L870 24L900 48L930 24L960 48L990 24L1020 48L1050 24L1080 48L1110 24L1140 48L1170 24L1200 48V48H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </main>
    </>
  )
}
