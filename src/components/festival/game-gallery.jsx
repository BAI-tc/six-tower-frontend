"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/utils/cn"
import { SmartImage } from "@/components/common/smart-image"
import { getChineseName } from "@/config"

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
  'Story Rich': '剧情丰富', 'Dark': 'dark', 'Retro': '复古',
  'Fast-Paced': '快节奏', 'Difficult': '高难度', 'Colorful': '色彩丰富',
  'Cute': '可爱', 'Comedy': '喜剧', 'Drama': '剧情',
}

// 成就/勋章映射表
const achievementMap = {
  '动作': { title: '动作先锋', icon: '⚔️', desc: '追求极限反应的格斗家' },
  '冒险': { title: '资深冒险家', icon: '🧭', desc: '跨越群山与深海的探索者' },
  '角色扮演': { title: '史诗英雄', icon: '🛡️', desc: '于幻想世界书写传奇' },
  '策略': { title: '天才统帅', icon: '🧠', desc: '运筹帷幄的决策大师' },
  '模拟': { title: '造物主', icon: '🌎', desc: '开启你的第二人生' },
  '独立游戏': { title: '独立精神', icon: '🕯️', desc: '感受开发者独特的灵魂' },
  '恐怖': { title: '孤胆勇士', icon: '👻', desc: '直面深藏内心的恐惧' },
  '休闲': { title: '生活家', icon: '☕', desc: '忙碌生活中的温柔慰藉' },
  '策略': { title: '智多星', icon: '♟️', desc: '博弈中的绝对主宰' },
}

// 情感化文案库
const emotionalQuotes = [
  "继续你的冒险，去发现那些惊喜",
  "属于你的游戏世界，正待开启",
  "探索无限可能，找到你的心仪之作",
  "猜你会有兴趣，来看看这些故事",
]

// 简化主题名称 - 翻译为中文
const simplifyThemeName = (theme) => {
  if (!theme) return "游戏"
  // 1. 清洗特殊字符
  let cleaned = theme.replace(/['"\[\]]/g, '').replace(/\s*\([^)]*\)\s*/g, '').trim()

  // 2. 按照分隔符拆分
  let parts = cleaned.split(/[|,]/).map(p => p.trim()).filter(Boolean)

  // 3. 翻译
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

  // 4. 去重
  let uniqueParts = [...new Set(translatedParts)]

  // 5. 重新拼接
  return uniqueParts.slice(0, 3).join(' · ') || "游戏"
}

const defaultGames = [
  {
    id: 1,
    title: "星际征途",
    category: "角色扮演",
    platform: "全平台",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    featured: true,
    color: "from-blue-500/20 to-purple-500/20",
  },
  {
    id: 2,
    title: "幻想王国",
    category: "动作冒险",
    platform: "PC / 主机",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
    featured: false,
    color: "from-green-500/20 to-teal-500/20",
  },
  {
    id: 3,
    title: "赛博之城",
    category: "开放世界",
    platform: "次世代主机",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    featured: true,
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    id: 4,
    title: "像素大冒险",
    category: "独立游戏",
    platform: "全平台",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
    featured: false,
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 5,
    title: "机甲风暴",
    category: "动作射击",
    platform: "PC",
    image: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop",
    featured: true,
    color: "from-yellow-500/20 to-amber-500/20",
  },
  {
    id: 6,
    title: "古墓奇缘",
    category: "解谜冒险",
    platform: "全平台",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop",
    featured: false,
    color: "from-indigo-500/20 to-blue-500/20",
  },
  {
    id: 7,
    title: "末日生存",
    category: "生存恐怖",
    platform: "PC / 主机",
    image: "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=400&h=300&fit=crop",
    featured: false,
    color: "from-gray-500/20 to-slate-500/20",
  },
  {
    id: 8,
    title: "魔法学院",
    category: "模拟经营",
    platform: "全平台",
    image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=300&fit=crop",
    featured: true,
    color: "from-violet-500/20 to-purple-500/20",
  },
]

export function GameGallery({ games = defaultGames, recommendationData = null }) {
  const scrollContainerRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)

  // 解析玩家偏好统计数据
  const parsedPreferences = recommendationData?.top_preferences?.map((pref) => {
    const match = pref.match(/^(.+?)\s+\(([0-9.]+)%\)$/)
    if (match) {
      return { name: simplifyThemeName(match[1]), score: parseFloat(match[2]) }
    }
    return { name: simplifyThemeName(pref), score: 0 }
  }) || []

  // 准备游戏数据：如果有推荐数据则使用，否则使用默认数据
  const displayGames = games.length > 0 ? games.map((game, index) => {
    // 如果是从推荐数据传入的
    if (game.gameid) {
      const theme = recommendationData?.recommendations
        ? Object.entries(recommendationData.recommendations).find(([_, themeGames]) =>
          themeGames.some(g => g.gameid === game.gameid)
        )?.[0]
        : null

      const translatedTheme = theme ? simplifyThemeName(theme) : null

      return {
        id: game.gameid,
        title: getChineseName(game.title),
        category: translatedTheme || "为你推荐",
        image: game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${game.gameid}/library_600x900.jpg`,
        featured: index < 3,
        color: ["from-blue-500/20 to-purple-500/20", "from-green-500/20 to-teal-500/20", "from-orange-500/20 to-red-500/20"][index % 3],
        rating: game.metacritic || "4.8",
        recommendationReason: null // 移除算法气息强的理由
      }
    }
    return {
      ...game,
      title: getChineseName(game.title),
      rating: game.rating || "4.8"
    }
  }) : defaultGames

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="pt-32 pb-24 md:pt-48 md:pb-36 bg-background overflow-hidden relative">
      {/* 背景装饰图案层 - 引用 theme 的高级质感 */}

      {/* 1. 基础网格点 */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* 2. 细腻斜纹层 */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, #ffffff 20px, #ffffff 21px)`,
        }}
      />

      {/* 3. 霓虹氛围发光 */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[140px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      {/* 4. 品牌水印 - 极低透明度 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
        <span className="text-[400px] font-black tracking-tighter text-white">GAME</span>
      </div>

      {/* 5. 动态个性化荣誉印章 - 将偏好融入背景 */}
      {recommendationData && parsedPreferences.length > 0 && (
        <div className="absolute top-48 -right-5 hidden xl:flex flex-col gap-16 opacity-30 pointer-events-none select-none rotate-45 origin-top-right">
          {parsedPreferences.slice(0, 3).map((pref, idx) => {
            const achievement = achievementMap[pref.name] || { title: pref.name, icon: '✨' }
            return (
              <div
                key={idx}
                className={cn(
                  "flex flex-col items-end transition-all duration-1000",
                  idx === 0 ? "mr-0" : idx === 1 ? "mr-24" : "mr-48"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-5xl filter grayscale contrast-50 opacity-40">{achievement.icon}</span>
                  <span className="text-5xl font-['Microsoft_YaHei','微软雅黑'] font-black text-foreground/80 tracking-widest uppercase">
                    {achievement.title}
                  </span>
                </div>
                <p className="text-xs font-['Microsoft_YaHei','微软雅黑'] font-bold text-[var(--game-gold)] mt-2 tracking-[0.4em] opacity-60">FESTIVAL HONORARY BADGE</p>
              </div>
            )
          })}
        </div>
      )}
      {/* 标题区域 - 响应式宽度对齐首页 */}
      <div className="px-4 xl:px-40 mb-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">
                {recommendationData ? "发现属于你的冒险" : "精选游戏展示"}
              </h2>
              {recommendationData ? (
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="text-muted-foreground text-sm font-medium">
                    {emotionalQuotes[Math.floor(Math.random() * emotionalQuotes.length)]}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  探索本届游戏节的高光之作
                </p>
              )}
            </div>
            {/* 移除原本顶部的按钮组 */}
          </div>
        </div>
      </div>

      {/* 卡片展示区域 - 同样应用 container 限制宽度以对齐 */}
      <div className="px-4 xl:px-40 relative group/gallery">
        {/* 左侧切换按钮 */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-8 lg:left-20 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-background/40 backdrop-blur-md border border-white/10 text-foreground hover:bg-background/80 transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex items-center justify-center shadow-xl hover:scale-110"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* 右侧切换按钮 */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-8 lg:right-20 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-background/40 backdrop-blur-md border border-white/10 text-foreground hover:bg-background/80 transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex items-center justify-center shadow-xl hover:scale-110"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="container mx-auto relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide p-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayGames.map((game, index) => (
              <div
                key={game.id}
                className="flex-shrink-0 snap-center"
                onMouseEnter={() => setHoveredId(game.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Link
                  href={`/games/${game.id}`}
                  className={cn(
                    "relative w-72 md:w-80 rounded-2xl overflow-hidden shadow-lg transition-all duration-500 cursor-pointer block",
                    "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10",
                    hoveredId === game.id ? "scale-105 shadow-2xl border-[#ff00ff]/30" : ""
                  )}
                >
                  {/* 游戏封面 */}
                  <div className="relative aspect-video overflow-hidden">
                    <SmartImage
                      src={game.image}
                      alt={game.title}
                      gameid={game.id}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{
                        transform: hoveredId === game.id ? "scale(1.1)" : "scale(1)",
                      }}
                    />
                    {/* 渐变遮罩 */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${game.color} to-transparent`} />

                    {/* 精选标签 */}
                    {game.featured && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-[var(--game-gold)] text-foreground px-3 py-1 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        精选
                      </div>
                    )}

                    {/* 推荐原因标签 */}
                    {game.recommendationReason && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[var(--game-purple)]/80 text-white px-2 py-1 rounded-full text-xs">
                        {game.recommendationReason}
                      </div>
                    )}
                  </div>

                  {/* 游戏信息 (Epic 风格) */}
                  <div className="bg-card p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold group-hover:text-[var(--game-gold)] transition-colors">
                      {game.category}
                    </p>
                    <h3 className="font-bold text-xl text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded font-medium">
                        {game.platform}
                      </span>
                      <div className="flex items-center gap-1 text-[var(--game-gold)] font-bold text-sm">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{game.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* 悬浮效果遮罩 */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-white/5 dark:bg-foreground/5 transition-opacity duration-300 pointer-events-none",
                      hoveredId === game.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 移动端滑动提示 */}
      <div className="md:hidden flex justify-center mt-4">
        <div className="flex gap-2">
          {displayGames.map((game) => (
            <div
              key={game.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                hoveredId === game.id ? "bg-foreground" : "bg-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
      {/* 底部锯齿边缘 - 对接下方暖色区域 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg
          className="w-full h-8 md:h-12"
          viewBox="0 0 1200 48"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path
            d="M0 48L30 24L60 48L90 24L120 48L150 24L180 48L210 24L240 48L270 24L300 48L330 24L360 48L390 24L420 48L450 24L480 48L510 24L540 48L570 24L600 48L630 24L660 48L690 24L720 48L750 24L780 48L810 24L840 48L870 24L900 48L930 24L960 48L990 24L1020 48L1050 24L1080 48L1110 24L1140 48L1170 24L1200 48V48H0Z"
            style={{ fill: "#e8dcc8" }}
          />
        </svg>
      </div>
    </section>
  )
}
