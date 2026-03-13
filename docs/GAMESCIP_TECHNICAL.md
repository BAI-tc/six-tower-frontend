# Gamesci 前端项目技术文档

## 项目概述

Gamesci 是一个基于 Next.js 的游戏发现和详情展示平台前端项目。

---

## 技术栈

### 核心框架
- **Next.js 14.0.0** - React 全栈框架
- **React 18** - UI 库
- **Tailwind CSS 3** - 样式框架

### 主要依赖
- `tailwind-merge` - Tailwind CSS 类名合并工具
- `@svgr/webpack` - SVG 组件化
- `autoprefixer` - CSS 后处理器

### 开发工具
- ESLint - 代码检查
- PostCSS - CSS 转换

---

## 项目结构

```
gamesci/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── _components/        # 共享组件
│   │   │   ├── background.js
│   │   │   ├── card-loading.js
│   │   │   ├── custom-image.js
│   │   │   ├── footer.js
│   │   │   ├── header.js
│   │   │   ├── loading-screen.js
│   │   │   └── search-bar.js
│   │   ├── auth/steam/callback/  # Steam 认证回调
│   │   ├── discover/           # 发现页面
│   │   ├── games/[id]/         # 游戏详情页
│   │   │   └── _components/   # 详情页组件
│   │   ├── home/              # 首页
│   │   ├── login/             # 登录页
│   │   ├── profile/           # 个人资料页
│   │   ├── recommendations/   # 推荐页
│   │   ├── search/            # 搜索页
│   │   ├── layout.js          # 根布局
│   │   └── page.js            # 根页面
│   ├── api/                   # API 封装
│   │   ├── index.js           # 主 API
│   │   └── recommendations.js # 推荐 API
│   ├── config.js              # 配置文件 (主要)
│   ├── hooks/                # 自定义 React Hooks
│   │   ├── useImageOnLoad.js
│   │   ├── useSearchHistory.js
│   │   └── useWishlist.js
│   └── utils/                # 工具函数
│       └── resolve.js
├── public/                    # 静态资源
├── .env.local                # 环境变量
├── next.config.js            # Next.js 配置
├── tailwind.config.js        # Tailwind 配置
└── package.json              # 依赖配置
```

---

## 页面模块

### 1. 首页 (Home) - `/home`
- 展示热门游戏列表
- 分类展示 (新游戏、即将发布、热门游戏)
- 搜索功能

### 2. 游戏详情页 (Game Detail) - `/games/[id]`
- **主要功能**:
  - 游戏基本信息 (名称、评分、发布日期)
  - 开发者/发行商信息
  - 游戏类型标签
  - 平台信息
  - 视频/预告片展示
  - 截图画廊
  - Steam/RAWG 数据获取

- **修改内容**:
  - 添加了 Tab 切换功能 (Summary/Media/Similar Games)
  - 实现了视频预告片播放 (RAWG Movies API)
  - 实现了多截图获取 (Steam + RAWG 双源)
  - 主界面直接展示媒体内容

### 3. 发现页面 (Discover) - `/discover`
- 游戏发现和筛选

### 4. 搜索页面 (Search) - `/search`
- 搜索游戏

### 5. 推荐页面 (Recommendations) - `/recommendations`
- 个性化游戏推荐

### 6. 个人资料页 (Profile) - `/profile`
- 用户游戏库
- 愿望单

### 7. 登录页 (Login) - `/login`
- Steam 登录集成

---

## 后端通信

### 外部 API 服务

#### 1. RAWG API (游戏数据库)
- **基础 URL**: `https://api.rawg.io/api`
- **用途**: 获取游戏基本信息、截图、预告片
- **主要端点**:
  - `/games/{id}` - 游戏详情
  - `/games/{id}/screenshots` - 游戏截图
  - `/games/{id}/movies` - 游戏预告片
  - `/games` - 游戏搜索

```javascript
// 获取游戏详情
const response = await fetch(
  `${RAWG_API_URL}/games/${gameId}?key=${RAWG_API_KEY}&fields=name,description,...`
);

// 获取截图
const screenshots = await fetch(
  `${RAWG_API_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}&page_size=20`
);

// 获取预告片
const movies = await fetch(
  `${RAWG_API_URL}/games/${gameId}/movies?key=${RAWG_API_KEY}&page_size=10`
);
```

#### 2. Steam Store API
- **基础 URL**: `https://store.steampowered.com`
- **用途**: 获取 Steam 游戏详情和截图
- **主要端点**:
  - `/api/appdetails` - 游戏详情
  - `/api/storesearch/` - 游戏搜索

```javascript
// 获取 Steam 游戏详情
const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}`;

// 搜索 Steam 游戏
const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${gameName}`;
```

#### 3. Steam 图片服务
- **用途**: 获取游戏封面图
- **基础 URL**: `https://media.steampowered.com/steamcommunity/public/images/apps`

```javascript
// 封面图
const coverUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/library_600x900.jpg`;
```

#### 4. 自定义后端 API
- **基础 URL**: `http://127.0.0.1:3001/api/v1` (本地)
- **用途**: 用户数据、游戏库、愿望单

#### 5. ULTIM Golang API
- **基础 URL**: `http://127.0.0.1:8080/api/v1`
- **用途**: 高并发/低延迟游戏数据服务

#### 6. 搜索服务 API
- **基础 URL**: `http://127.0.0.1:3003/api`
- **用途**: 搜索功能

---

## 游戏详情页数据获取逻辑

### 当前实现流程

```javascript
// 1. 获取游戏基本信息
let gameData = await fetchGameDetails(gameId);

// 2. 如果没找到，尝试通过 Steam ID 搜索
if (!gameData) {
  gameData = await searchGameBySteamId(gameId);
}

// 3. 获取截图 (多源获取)
const steamAppId = gameData?.parent_app_id || gameData?.steam_app_id;
let screenshotsData = [];

// 3.1 优先通过 Steam ID 获取
if (steamAppId) {
  screenshotsData = await fetchSteamScreenshots(steamAppId);
}

// 3.2 如果没有，通过名称搜索 Steam
if (screenshotsData.length === 0 && gameData?.name) {
  screenshotsData = await fetchSteamScreenshotsByName(gameData.name);
}

// 3.3 最后尝试 RAWG 截图 API
if (screenshotsData.length === 0 && gameData?.id) {
  screenshotsData = await fetchRAWGScreenshots(gameData.id);
}

// 4. 获取预告片
const moviesData = await fetchRAWGMovies(gameData.id);
```

---

## 环境变量配置 (.env.local)

```env
# RAWG API Key
NEXT_PUBLIC_RAWG_API_KEY=9b3e6bbc879b4684ab490b2d5b2a115e

# 本地后端 API
API_BASE=http://127.0.0.1:3001/api/v1
ULTIM_API_BASE=http://127.0.0.1:8080/api/v1
SEARCH_API=http://127.0.0.1:3003/api
```

---

## 遇到的问题及解决方案

### 1. RAWG API 不返回 short_screenshots

**问题**: RAWG API 的免费版不会在游戏详情中返回 `short_screenshots` 字段

**解决**: 使用单独的截图 API 端点
```javascript
// 改用专门的截图 API
`${RAWG_API_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}`
```

### 2. Steam ID 获取不到

**问题**: RAWG 返回的数据中 `parent_app_id` 或 `steam_app_id` 字段不存在

**解决**: 通过游戏名称搜索 Steam 获取截图
```javascript
// 使用 Steam 搜索 API
`https://store.steampowered.com/api/storesearch/?term=${gameName}`
```

### 3. RAWG 免费版 API 限制

**问题**:
- 免费版 API 有请求频率限制
- 部分字段需要付费版才能获取 (如详细截图)

**解决**: 结合 Steam API 和 RAWG API 双源获取

### 4. 截图显示问题

**问题**: Media Tab 切换无反应

**解决**: 添加 `activeTab` 状态管理，实现 Tab 切换功能

### 5. 函数命名错误

**问题**: `fetchRAWG Screenshots` 函数名有空格导致语法错误

**解决**: 修正为 `fetchRAWGScreenshots`

---

## UI 组件说明

### 游戏详情页主要组件

1. **Hero Background** - 顶部背景大图
2. **Game Cover** - 游戏封面海报
3. **Quick Stats Panel** - 快速信息面板 (发布日期、开发商、平台等)
4. **Media Gallery** - 媒体画廊
   - Videos & Trailers - 视频预告片
   - Screenshots - 截图网格
5. **Content Tabs** - 内容切换标签
6. **Similar Games** - 相似游戏推荐

### Tab 功能

- **Summary**: 简短游戏介绍 (最多 500 字符)
- **Media**: 完整视频和截图库
- **Similar Games**: 相似游戏信息

---

## 运行项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## 扩展建议

### 1. 图片优化
- 考虑使用 Next.js Image 组件进行优化
- 添加图片懒加载和预加载

### 2. 缓存策略
- 为 API 响应添加缓存减少请求
- 使用 React Query 或 SWR 管理服务器状态

### 3. 错误处理
- 添加更完善的错误边界
- 实现重试机制

### 4. 性能优化
- 拆分大型组件
- 使用 React.lazy 懒加载

---

## 参考

- [RAWG API 文档](https://rawg.io/apidocs)
- [Steam Store API](https://store.steampowered.com/api/)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
