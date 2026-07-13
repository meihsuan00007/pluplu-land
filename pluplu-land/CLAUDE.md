# CLAUDE.md — PluPlu Land

娃衣品牌「PluPlu Land」的概念旗艦店。**純靜態網站**：原生 HTML + CSS + vanilla JS，無 build 工具、無框架（刻意，為了免費的 Decap CMS + Netlify 架構）。目前只陳列展示，**沒有金流／購物車**。

完整背景見 [CLAUDE_CODE_HANDOFF.md](CLAUDE_CODE_HANDOFF.md)；部署步驟見 [README.md](README.md)。

## 檔案結構
- `index.html` / `hamu.html` / `goods.html` / `story.html` / `contact.html` — 五個頁面
- `css/style.css` — 唯一樣式檔，所有 token 用 CSS 變數管在 `:root`
- `js/main.js` — 手機選單開關、滾動淡入（`.reveal`）
- `js/render.js` — fetch `content/*.json` 填入頁面
- `content/site.json` — 各頁文案 / hero 圖 / 聯絡資訊
- `content/products-hamu.json`、`content/products-goods.json` — 商品清單
- `admin/config.yml` — Decap CMS 後台欄位定義；`admin/index.html` — 後台入口
- `images/uploads/` — 所有商品實拍照（後台上傳也存這）
- `netlify.toml` — 部署設定（publish `.`，`/content/*.json` 設 no-cache）

## 內容渲染機制（最容易改壞的地方）
- 可編輯元素帶 `data-field="page.key"`（文字）、`data-field-img`、`data-field-href`；商品容器用固定 id：`hamu-grid`、`goods-grid-outerwear`、`goods-grid-hats`。
- `render.js` 在載入時 fetch JSON 填入；**fetch 失敗時（如 `file://` 直開）保留 HTML 裡寫死的 fallback，不會空白，這是刻意設計**。
- ⚠️ 改任何頁面文字：**HTML 的 fallback 與對應 JSON 兩邊要同步改，不能只改一邊**，否則線上（讀 JSON）跟本機預覽會不一致。
- `data-page` 屬性決定 render.js 抓哪份資料：`home` / `hamu_page` / `goods_page` / `story_page` / `contact_page`。

## Decap CMS 資料結構限制
- 商品 JSON **必須維持 `{"items":[...]}` 包裹格式**（file collection 需要）。
- goods 每筆多一個 `category` 欄位，值只能是 `outerwear` 或 `hats`，render.js 依此分流到兩個 grid。
- 新增 / 改欄位時，**JSON 與 `admin/config.yml` 的 `fields` 要同步**，否則後台編輯不到。

## 設計系統
- 改色 / 改字體 / 改版型 → 改 `css/style.css` 的 `:root` 變數，別散改各處。
- 主色：`--cream #FBF6EA`、`--brown-deep #6B4A32`；點綴：`--moss #7C8A63`、`--rose #C97B82`。
- 字體：標題 `--serif-cjk`（M PLUS Rounded 1c，**圓體，不要手寫感**）、內文 `--sans-cjk`（Noto Sans TC）、拉丁點綴 `--accent-lat`（Quicksand）。
- 簽名視覺：陳列櫃 `.shelf`、手縫虛線 `.stitch`、商品貼紙標籤 `.product-tape`。

## 品牌語言規範
- **不稱「娃娃」**，一律用「娃寶／寶寶／小朋友」等擬人化稱呼。
- **全站堅持實拍照片，絕不放 AI 生成圖**（品牌現階段最不妥協的堅持）。
- 調性：溫柔陪伴感、日系極簡。

## 改 CSS 後要檢查的斷點
style.css 用到的 breakpoint：**480 / 560 / 760 / 820 / 900px**。改版型後至少過一輪窄機（320–480）、平板（760–820）。
目前所有手機版修正僅在單檔預覽目視過，**尚未在真機／DevTools 逐頁逐斷點驗證**。

## 部署狀態與待辦
- Step 1 GitHub repo：完成。
- Step 2 改 `admin/config.yml` 的 repo 名稱：目前仍是預留值 `your-github-username/pluplu-land`，**待確認 Melody 是否已在線上版改對**。
- Step 3 接 Netlify（Import → Deploy）：狀態未確認。
- Step 4 Netlify Identity + Git Gateway（開後台登入）：**尚未做**。
- ⚠️ 待釐清：`config.yml` 目前是 `backend: name: github`，與「Identity + Git Gateway」流程通常需要的 `git-gateway` 不一致，上線前需確認。
