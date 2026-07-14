# 設計文件：全站排版規格一致化＋首頁 Lativ 風格電商改版

日期：2026-07-14
狀態：已實作（依使用者提供的規格書執行）

## 背景

使用者以尺規工具量測發現：各分頁頁首圖文區塊的文字起始 y 軸與區塊高度不一致
（例：contact 頁文字起始 y=376、hamu 頁 y=300），切換頁面時視覺跳動。
同時首頁缺乏電商行銷感，希望參考 lativ.com.tw 的首頁結構。

## 一、全站統一排版規格

### `.duo` 圖文對稱版型（css/style.css）

所有「圖＋文」區塊（含各頁 page hero 與內文段落）一律使用：

- 文字區塊固定 **45%**、圖片區塊固定 **55%**（`grid-template-columns: minmax(0,45fr) minmax(0,55fr)`）
- 中間留白固定 `gap: 56px`
- `align-items: start`：文字與圖框頂部對齊線一致
- 圖片容器 `.duo-media` 固定 `aspect-ratio: 4/5` ＋ `object-fit: cover`，
  不論照片原始尺寸，圖框尺寸全站一致
- 圖片在左時使用 `.duo--flip`（欄位變 55/45，圖片仍佔 55%）
- ≤820px 收合為單欄、gap 32px，文字在上圖片在下

### `.page-hero` 統一頁首

- 全站內頁頁首 padding 固定 `64px 0`（≤820px 為 `40px 0`），
  **禁止用 inline style 覆寫**（改版前各頁 inline padding 不一，是跳動主因之一）

### Navbar / Footer

- `.site-nav .wrap` 高度寫死 **72px**（原為 padding 撐出、高度浮動）
- Footer 全站同一份 markup、padding 固定 `56px 0 40px`

### 既有 bug 修正

- `.timeline-row:last-child .timeline-line` 原本 `display:none` 導致
  grid 自動排版把文字欄擠進 1px 欄（文字直排）；改為 `background:transparent`。

## 二、首頁 Lativ 風格改版（index.html）

由上而下的新結構：

1. **頂部大輪播** `#home-carousel`：滿版、桌機 21:9（max-height 560px）、手機 4:3；
   淡入切換、5 秒自動播放（hover 暫停、`prefers-reduced-motion` 停用）、
   切換點點＋左右箭頭。邏輯在 `js/main.js` 的 `setupCarousel()`（掛在 `window` 供 render.js 重新初始化）。
2. **行銷組合 Banner** `#promo-grid`：左一張大直式（`.promo-item--tall`，1:1）＋右二張上下疊；
   ≤760px 直向堆疊、各 16:9。
3. **商品推薦牆** `#featured-grid`：`.product-grid--wall` 4 欄（≤900 3 欄、≤760 2 欄）、
   hover 圖片放大 1.05、每張卡顯示品名＋價格，整卡可點回對應分頁。
4. 品牌理念（沿用 `home.eyebrow/title/lead` data-field）→ 陳列櫃 → 兩段 `.duo` 導流 → 金句 → 品牌故事 strip。

## 三、資料與 CMS 同步（Decap）

- `content/site.json` → `home` 新增 `carousel[]`（image/eyebrow/title/subtitle/link_label/link）
  與 `banners[]`（image/label_en/title/subtitle/link，取前 3 張）；移除不再使用的 `home.hero_image`。
- `content/products-hamu.json`、`products-goods.json` 每筆新增
  `price`（字串，選填）與 `featured`（布林，勾選即出現在首頁推薦牆）。
  **目前所有價格皆為示意佔位值，尚未經品牌確認。**
- `admin/config.yml` 已同步以上所有欄位。
- `js/render.js`：新增 `renderCarousel`／`renderBanners`；首頁會同時抓兩份商品 JSON、
  篩 `featured` 填入推薦牆；`productCard` 支援價格與整卡連結；輸出前經 HTML escape。
- HTML fallback 與 JSON 內容維持兩邊同步（維持原有的 file:// 直開不空白設計）。

## 驗證紀錄

- 以 Edge headless 對五頁截圖：桌機 1440、窄屏 500（Edge 視窗最小寬度）、平板 800。
- hamu／goods／story／contact 頁首的 eyebrow、標題、圖框頂部 y 軸已完全一致。
- JSON 渲染確認生效（輪播自動播放、推薦牆 8 件 featured 商品正確出現）。
- 注意：≤480px 斷點因 headless 最小視窗限制未能截圖，建議上線前用 DevTools 實測一輪。
