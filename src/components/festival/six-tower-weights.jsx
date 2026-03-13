"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Save, RotateCcw, Sliders, Info } from "lucide-react"
import { cn } from "@/utils/cn"
import {
  fetchSixTowerWeights,
  setSixTowerWeights,
  resetSixTowerWeights,
  DEFAULT_SIX_TOWER_WEIGHTS
} from "@/api/recommendations"

// 六塔模型权重配置说明
const WEIGHT_INFO = {
  svd: {
    name: "SVD 协同过滤",
    description: "基于用户-游戏交互矩阵的协同过滤推荐",
    icon: "🔗",
    color: "from-blue-500 to-cyan-500"
  },
  sem: {
    name: "语义推荐",
    description: "基于游戏标签和描述的语义相似度推荐",
    icon: "🧠",
    color: "from-purple-500 to-pink-500"
  },
  pop: {
    name: "热门推荐",
    description: "基于游戏热度（玩家数、销量）的推荐",
    icon: "🔥",
    color: "from-red-500 to-orange-500"
  },
  prof: {
    name: "用户画像",
    description: "基于用户聚类画像的个性化推荐",
    icon: "👤",
    color: "from-green-500 to-emerald-500"
  },
  icf: {
    name: "物品协同过滤",
    description: "基于游戏之间相似度的推荐",
    icon: "🎯",
    color: "from-yellow-500 to-amber-500"
  },
  cp: {
    name: "聚类热门",
    description: "基于同好群体偏好的推荐",
    icon: "👥",
    color: "from-indigo-500 to-violet-500"
  }
}

export function SixTowerWeightsPanel({ className, onWeightsChange }) {
  const [weights, setWeights] = useState(DEFAULT_SIX_TOWER_WEIGHTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [message, setMessage] = useState(null)

  // 加载当前权重配置
  useEffect(() => {
    loadWeights()
  }, [])

  const loadWeights = async () => {
    setLoading(true)
    try {
      const result = await fetchSixTowerWeights()
      if (result.success && result.weights) {
        setWeights(result.weights)
        onWeightsChange?.(result.weights)
      }
    } catch (error) {
      console.error("Failed to load weights:", error)
      showMessage("加载权重配置失败", "error")
    } finally {
      setLoading(false)
    }
  }

  const saveWeights = async () => {
    setSaving(true)
    try {
      const result = await setSixTowerWeights(weights)
      if (result.success) {
        showMessage("权重配置已保存", "success")
        onWeightsChange?.(weights)
      } else {
        showMessage("保存失败", "error")
      }
    } catch (error) {
      console.error("Failed to save weights:", error)
      showMessage("保存失败", "error")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    setResetting(true)
    try {
      const result = await resetSixTowerWeights()
      if (result.success && result.weights) {
        setWeights(result.weights)
        showMessage("已重置为默认权重", "success")
        onWeightsChange?.(result.weights)
      } else {
        showMessage("重置失败", "error")
      }
    } catch (error) {
      console.error("Failed to reset weights:", error)
      showMessage("重置失败", "error")
    } finally {
      setResetting(false)
    }
  }

  const updateWeight = (key, value) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setWeights(prev => ({ ...prev, [key]: numValue }))
    }
  }

  const showMessage = (text, type = "info") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const getTotalWeight = () => {
    return Object.values(weights).reduce((sum, w) => sum + w, 0).toFixed(2)
  }

  if (loading) {
    return (
      <div className={cn("bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6", className)}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--game-gold)]" />
          <span className="ml-2 text-gray-400">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6", className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-[var(--game-gold)]" />
          <h3 className="text-xl font-bold text-white">六塔模型权重配置</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Info className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 说明信息 */}
      {showInfo && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-blue-400 font-semibold mb-2">六塔模型说明</h4>
          <p className="text-sm text-gray-300">
            六塔推荐模型融合了6种不同的推荐策略，通过调整各塔的权重来控制推荐结果的倾向性。
            权重越高，对应策略在最终推荐中的影响力越大。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>默认权重总和: <span className="text-[var(--game-gold)]">3.55</span></div>
            <div>当前权重总和: <span className="text-[var(--game-gold)]">{getTotalWeight()}</span></div>
          </div>
        </div>
      )}

      {/* 权重滑块 */}
      <div className="space-y-4">
        {Object.entries(WEIGHT_INFO).map(([key, info]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{info.icon}</span>
                <span className="text-white font-medium">{info.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={weights[key]}
                  onChange={(e) => updateWeight(key, e.target.value)}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--game-gold)]"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={weights[key]}
                  onChange={(e) => updateWeight(key, e.target.value)}
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-sm focus:border-[var(--game-gold)] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-6">{info.description}</p>
            {/* 进度条 */}
            <div className="h-1 ml-6 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-300", info.color)}
                style={{ width: `${(weights[key] / 3) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
        <button
          onClick={resetToDefault}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={cn("w-4 h-4", resetting && "animate-spin")} />
          <span>重置默认</span>
        </button>

        <button
          onClick={saveWeights}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--game-gold)] hover:bg-[var(--game-gold)]/80 text-black font-semibold transition-colors disabled:opacity-50"
        >
          <Save className={cn("w-4 h-4", saving && "animate-pulse")} />
          <span>{saving ? "保存中..." : "保存配置"}</span>
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={cn(
            "mt-4 p-3 rounded-lg text-sm text-center transition-all",
            message.type === "success" ? "bg-green-500/20 text-green-400" :
            message.type === "error" ? "bg-red-500/20 text-red-400" :
            "bg-blue-500/20 text-blue-400"
          )}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

// 迷你权重显示组件（用于展示当前使用的权重）
export function MiniWeightsDisplay({ weights = DEFAULT_SIX_TOWER_WEIGHTS, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Object.entries(weights).map(([key, value]) => {
        const info = WEIGHT_INFO[key]
        return (
          <div
            key={key}
            className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-lg text-xs"
          >
            <span>{info?.icon}</span>
            <span className="text-gray-400">{info?.name.split(' ')[0]}</span>
            <span className="text-[var(--game-gold)] font-medium">{value.toFixed(2)}</span>
          </div>
        )
      })}
    </div>
  )
}
