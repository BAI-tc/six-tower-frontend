"use client"

import { useState, useEffect } from "react"
import { Sparkles, Gamepad2, ChevronRight, TrendingUp, Star, Info } from "lucide-react"
import { cn } from "@/utils/cn"

// API基础URL
const ULTIM_API_BASE = process.env.NEXT_PUBLIC_ULTIM_API_URL || "https://tian.fourever.top/api/v1"

// 玩家偏好展示组件
export function PlayerPreferenceCard({ steamId, className }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!steamId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${ULTIM_API_BASE}/recommendations/player-preference?steam_id=${steamId}`
        )
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [steamId])

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-foreground/10 rounded w-1/3"></div>
        <div className="h-32 bg-foreground/5 rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-foreground/5 rounded"></div>
          <div className="h-24 bg-foreground/5 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("p-6 border border-red-500/30 rounded-xl bg-red-500/5", className)}>
        <p className="text-red-400">无法加载玩家偏好数据</p>
      </div>
    )
  }

  if (!data?.data) {
    return null
  }

  const { data: preferenceData, from_cache: fromCache } = data
  const { top_preferences, recommendations, owned_games_count, matched_games_count } = preferenceData

  // 游戏主题/类型中英文映射
  const themeNameMap = {
    // 常见游戏类型
    'Action': '动作',
    'Adventure': '冒险',
    'RPG': '角色扮演',
    'Strategy': '策略',
    'Simulation': '模拟',
    'Casual': '休闲',
    'Indie': '独立游戏',
    'Horror': '恐怖',
    'Puzzle': '解谜',
    'Racing': '赛车',
    'Sports': '体育',
    'Fighting': '格斗',
    'Platformer': '平台跳跃',
    'Shooter': '射击',
    'MMORPG': '大型多人在线',
    'MOBA': 'MOBA',
    'Roguelike': 'Roguelike',
    'Roguelite': 'Roguelite',
    'Sandbox': '沙盒',
    'Open World': '开放世界',
    'Survival': '生存',
    'Building': '建造',
    'Crafting': '合成',
    'Multiplayer': '多人',
    'Singleplayer': '单人',
    'Co-op': '合作',
    'PvP': '对战',
    'Early Access': '抢先体验',
    'Free To Play': '免费游玩',
    'Visual Novel': '视觉小说',
    'Tower Defense': '塔防',
    'Card Game': '卡牌游戏',
    'Turn-Based': '回合制',
    'Real-Time': '实时战略',
    'Arcade': '街机',
    'Beat em up': '清版动作',
    'Stealth': '潜行',
    'Metroidvania': '银河恶魔城',
    'Souls-like': '魂类',
    'Action RPG': '动作角色扮演',
    'JRPG': '日式角色扮演',
    'Space': '太空',
    'Sci-Fi': '科幻',
    'Fantasy': '奇幻',
    'Medieval': '中世纪',
    'Cyberpunk': '赛博朋克',
    'Zombie': '僵尸',
    'Post-apocalyptic': '末世',
    'Anime': '动漫',
    'Pixel Art': '像素风格',
    '2D': '2D',
    '3D': '3D',
    'First-Person': '第一人称',
    'Third-Person': '第三人称',
    'Top-Down': '俯视角',
    'Side Scroller': '横版',
    'Story Rich': '剧情丰富',
    'Choices Matter': '选择影响剧情',
    'Permadeath': '永久死亡',
    'Dark': '黑暗',
    'Retro': '复古',
    'Moddable': '可模组化',
    'Soundtrack': '音乐',
    'Relaxing': '放松',
    'Fast-Paced': '快节奏',
    'Difficult': '高难度',
    'Colorful': '色彩丰富',
    'Cute': '可爱',
    'Gore': '血腥',
    'Nudity': '成人内容',
    'Violence': '暴力',
    'Comedy': '喜剧',
    'Drama': '剧情',
    'Mystery': '神秘',
    'Romance': '恋爱',
    'Horror Game': '恐怖游戏',
    'Action Game': '动作游戏',
    'Adventure Game': '冒险游戏',
    'Simulation Game': '模拟游戏',
    'Strategy Game': '策略游戏',
    'RPG Game': '角色扮演游戏',
    'Casual Game': '休闲游戏',
    'Indie Game': '独立游戏',
    'Action Roguelike': '动作Roguelike',
    'Action Adventure': '动作冒险',
  }

  // 简化主题名称 - 翻译为中文
  const simplifyThemeName = (theme) => {
    if (!theme) return "游戏"
    // 移除引号、方括号、括号等特殊字符，提取核心名称
    let cleaned = theme
      .replace(/['"\[\]]/g, '')  // 移除引号和方括号
      .replace(/\s*\([^)]*\)\s*/g, '')  // 移除括号及其内容
      .trim()

    // 尝试翻译每个关键词
    let translated = cleaned
    // 先处理复合词（较长的先匹配）
    const keywords = Object.keys(themeNameMap).sort((a, b) => b.length - a.length)
    for (const keyword of keywords) {
      if (translated.includes(keyword)) {
        translated = translated.replace(new RegExp(keyword, 'gi'), themeNameMap[keyword])
      }
    }

    return translated.substring(0, 30) || "游戏"
  }

  // 解析偏好主题
  const parsedPreferences = top_preferences.map((pref) => {
    // 匹配 "主题名 (xx.x%)" 格式
    const match = pref.match(/^(.+?)\s+\(([0-9.]+)%\)$/)
    if (match) {
      return { name: simplifyThemeName(match[1]), score: parseFloat(match[2]) }
    }
    return { name: simplifyThemeName(pref), score: 0 }
  })

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--game-gold)]/20 rounded-lg">
            <Gamepad2 className="w-6 h-6 text-[var(--game-gold)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold">你的游戏偏好</h3>
            <p className="text-sm text-foreground/60">
              基于你的 {owned_games_count} 款游戏分析 · 匹配 {matched_games_count} 款
              {fromCache && <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">缓存</span>}
            </p>
          </div>
        </div>
      </div>

      {/* 偏好主题条形图 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[var(--game-gold)]" />
          <span className="text-sm font-medium">Top 偏好类型</span>
        </div>
        {parsedPreferences.slice(0, 6).map((pref, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{pref.name}</span>
              <span className="text-foreground/60">{pref.score}%</span>
            </div>
            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--game-gold)] to-[var(--game-orange)] rounded-full transition-all duration-500"
                style={{ width: `${pref.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 推荐游戏区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--game-purple)]" />
          <span className="text-sm font-medium">为你推荐</span>
        </div>

        {Object.entries(recommendations || {}).map(([theme, games]) => (
          <div key={theme} className="space-y-3">
            {/* 主题标题 - 简化显示 */}
            <div className="flex items-center gap-2 py-2">
              <ChevronRight className="w-4 h-4 text-[var(--game-purple)]" />
              <h4 className="font-medium text-sm">{simplifyThemeName(theme)}</h4>
            </div>

            {/* 游戏列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {games.slice(0, 3).map((game, idx) => (
                <a
                  key={idx}
                  href={`/games/${game.gameid}`}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-foreground/10 hover:border-[var(--game-gold)]/50 bg-foreground/5 hover:bg-[var(--game-gold)]/5 transition-all"
                >
                  {/* 游戏图片 */}
                  <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-foreground/10">
                    <img
                      src={game.background_image || `https://steamcdn-a.akamaihd.net/steam/apps/${game.gameid}/library_600x900.jpg`}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x900/1a1a2e/ffffff?text=No+Image"
                      }}
                    />
                  </div>

                  {/* 游戏信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{game.title}</p>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      {game.recommendations > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {game.recommendations.toLocaleString()}
                        </span>
                      )}
                      {game.metacritic > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {game.metacritic}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 算法说明 */}
      <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-foreground/60 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-foreground/60 space-y-1">
            <p className="font-medium text-foreground/80">推荐算法说明</p>
            <p>基于你的游戏库，通过语义分析识别你喜欢的主题类型（如RPG、射击、独立游戏等）。</p>
            <p>然后从这些主题的高热度游戏中筛选你尚未拥有的作品进行推荐。</p>
            <p className="text-[var(--game-gold)]">最近购买的20款游戏权重更高，反映你当前的兴趣倾向。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerPreferenceSection({ steamId }) {
  // 优先使用传入的steamId，否则从localStorage获取
  const [currentSteamId, setCurrentSteamId] = useState(null)

  useEffect(() => {
    // 客户端渲染时获取steam_id
    if (typeof window !== 'undefined') {
      const storedSteamId = localStorage.getItem('steam_id')
      setCurrentSteamId(steamId || storedSteamId || null)
    }
  }, [steamId])

  // 如果没有登录，显示提示
  if (!currentSteamId) {
    return (
      <div className="p-6 border border-foreground/10 rounded-xl bg-foreground/5 text-center">
        <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
        <p className="text-foreground/60">登录后查看你的游戏偏好</p>
        <a href="/login" className="inline-block mt-4 px-6 py-2 bg-[var(--game-gold)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity">
          立即登录
        </a>
      </div>
    )
  }

  return (
    <section className="py-12">
      <PlayerPreferenceCard steamId={currentSteamId} />
    </section>
  )
}
