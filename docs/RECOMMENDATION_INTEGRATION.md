# 推荐系统集成问题记录

## 概述

本文档记录将 `steam_recommend-main` 后端推荐算法集成到 `gg-master` 前端过程中遇到的问题及解决方案。

## 已完成的工作

### 1. API 集成模块
- 创建文件：`src/api/recommendations.js`
- 导出函数：
  - `fetchPersonalizedRecommendations()` - For You 个性化推荐
  - `fetchTrendingGames()` - 趋势推荐
  - `fetchSimilarGames()` - 相似游戏
  - `fetchSimilarToOwned()` - 相似于用户拥有的游戏
  - `fetchByGenre()` - 基于类型偏好
  - `fetchPopularGames()` - 热门推荐
  - `fetchPopularNotOwned()` - 热门但未拥有

### 2. 首页推荐模块
- 修改文件：`src/app/home/page.js`
- 新增 5 个推荐模块：
  1. **Top Rated Games** - 公开，RAWG API
  2. **New & Trending** - 公开，RAWG API
  3. **Trending Now** - 公开+推荐系统 API
  4. **Genre Spotlight** - 公开+推荐系统 API
  5. **For You** - 需要登录，推荐系统 API
  6. **Because You Played** - 需要登录，推荐系统 API
  7. **Similar to Your Games** - 需要登录，推荐系统 API

---

## 已识别的问题

### 问题 1：推荐系统数据为空 ✅ 已解决

**现象**：API 返回 `{"games":[],"total":0}`

**原因**：
1. 后端 Redis 缓存中没有热门游戏数据

**解决方案**（2024-03-10 已执行）：
```bash
cd E:\gamescience\steam_recommend-main

# 运行示例数据加载脚本（会自动创建嵌入向量、热门游戏等）
python scripts/load_sample_data.py
```

**注意**：用户创建部分有 bcrypt 兼容性问题，但热门游戏/嵌入向量/元数据/类型索引已成功加载。

**验证**：
```bash
curl http://127.0.0.1:3002/api/v1/recommendations/popular?limit=5
# 返回: {"games":[{"product_id":178,"score":103404.45}...],...}
```

---

### 问题 2：推荐系统需要用户 ID，但前端使用 Steam ID

**现象**：个性化推荐 API 需要 `user_id`（数据库中的自增 ID），但前端只有 `steam_id`（Steam 64位ID）

**原因**：推荐系统的用户表使用自增 ID，而 gg-master 使用 Steam OpenID 认证

**解决方案**：
1. 在推荐系统中添加 Steam ID 映射
2. 或在 API 层进行 ID 转换

**当前 workaround**：
```javascript
// 临时使用 steam_id 的数字部分作为 user_id
fetchPersonalizedRecommendations(parseInt(steamId), 20, 'auto', 'default')
```

---

### 问题 3：推荐系统 API 响应数据格式与 RAWG 不同

**现象**：NetflixCard 组件无法正确显示推荐游戏

**原因**：两个 API 返回的数据字段不同：
- RAWG: `id`, `name`, `background_image`, `metacritic`
- 推荐系统: `product_id`, `title`, `cover_url`, `popularity_score`

**解决方案**：已修改 `NetflixCard` 组件支持多格式：
```javascript
const appId = game.product_id || game.id || game.appid;
const name = game.title || game.name || game.app_name || `Game ${appId}`;
const coverUrl = game.background_image || game.cover_url ||
  getSteamCoverUrl(appId, 'library_600x900');
```

---

### 问题 4：后端服务未运行

**现象**：`curl` 测试显示无法连接

**解决方案**：
```bash
# 启动后端服务
cd steam_recommend-main

# 开发模式
uvicorn backend.main:app --reload --port 3002

# 或者使用 Docker
docker-compose up -d
```

---

### 问题 5：跨域问题

**现象**：前端调用后端 API 失败

**解决方案**：在 `steam_recommend-main` 的 CORS 配置中添加前端地址：
```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 待完成项

### 高优先级
1. [ ] 初始化推荐系统数据库和种子数据
2. [ ] 解决用户 ID 映射问题（Steam ID → 推荐系统 User ID）
3. [ ] 配置 CORS 允许前端访问

### 中优先级
4. [ ] 添加推荐结果缓存机制
5. [ ] 添加加载状态和错误处理 UI
6. [ ] 添加推荐模块的骨架屏

### 低优先级
7. [ ] 添加推荐效果追踪
8. [ ] 添加 A/B 测试支持

---

## 技术架构

```
gg-master (前端)
    │
    ├── src/api/recommendations.js  ← 推荐 API 封装
    │
    └── src/app/home/page.js       ← 5 个推荐模块
              │
              ▼
    http://127.0.0.1:3002/api/v1/
              │
steam_recommend-main (后端)
    │
    ├── backend/api/v1/endpoints/recommendations.py
    ├── backend/recall/          ← 召回层
    ├── backend/ranking/        ← 排序层
    └── backend/cache/          ← Redis 缓存
```

---

## 配置文件

### 前端 API 配置
文件：`src/config.js`
```javascript
export const API_BASE = 'http://127.0.0.1:3002/api/v1';
```

### 后端配置
文件：`steam_recommend-main/.env`
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## 测试清单

- [ ] `GET /api/v1/recommendations/popular` 返回游戏列表
- [ ] `GET /api/v1/recommendations/trending` 返回趋势游戏
- [ ] `GET /api/v1/recommendations/similar/{item_id}` 返回相似游戏
- [ ] `GET /api/v1/recommendations?user_id=1` 返回个性化推荐
- [ ] 前端首页正常显示所有模块
- [ ] 未登录用户看到公开模块
- [ ] 登录用户看到全部模块

---

## 更新日志

### 2024-03-10
- 创建问题记录文档
- 完成 API 集成模块开发
- 完成首页推荐模块集成
