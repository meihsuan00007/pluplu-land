# CLAUDE.md — PluPlu Land

娃衣品牌「PluPlu Land」的概念旗艦店。**純靜態網站**：原生 HTML + CSS + vanilla JS，無 build 工具、無框架（刻意，為了免費的 Decap CMS + Netlify 架構）。目前只陳列展示，**沒有金流／購物車**。

完整背景見 [CLAUDE_CODE_HANDOFF.md](CLAUDE_CODE_HANDOFF.md)；部署步驟見 [README.md](README.md)。

## 檔案結構
- `index.html` / `hamu.html` / `goods.html` / `story.html` / `contact.html` — 五個主要頁面
- `shop.html`（娃衣選品，含分類篩選與商品彈窗，由 `js/shop.js` + `content/products-store.json` 驅動）、`notice.html`（購物須知）
- `css/style.css` — 唯一樣式檔，所有 token 用 CSS 變數管在 `:root`
- `js/main.js` — 手機選單開關、滾動淡入（`.reveal`）、首頁輪播 `setupCarousel()`
- `js/render.js` — fetch `content/*.json` 填入頁面
- `content/site.json` — 各頁文案 / hero 圖 / 聯絡資訊 / 首頁輪播與 Banner
- `content/products-hamu.json`、`content/products-goods.json` — 商品清單
- `content/products-store.json` — 娃衣選品 47 項（**產出檔勿直接手改**：由 `scripts/build-products-json.py` 解析 `plupluland_products.md`（規格與價格）＋ `docs/products/web-copy.md`（文案定稿）產生；賣場更新時改 md 後重跑腳本）
- `assets/images/products/` — 選品商品圖（`scripts/download-product-images.mjs` 從賣貨便下載 → `scripts/compress-product-images.py` 壓縮，最長邊 1600px；對照表在 `docs/products/image-map.md`。⚠️ #30 首圖為主理人提供的本地照片，重跑下載腳本不會覆蓋）
- `assets/images/products/variants/` — 規格專屬圖片。**命名規範：`{商品編號}_{規格名稱}.jpg`**（規格名稱照 JSON 的 `variants[].name`，空格移除、`/` 改 `-`，例：`06_暖陽黃.jpg`、`30_眼鏡-6cm-透棕框.jpg`）。照規範放進來後重跑 build 腳本即自動接到 `variants[].image`；對不到規格的檔名會讓腳本報錯提醒。前台點選規格時主圖淡入切換，沒有專屬圖的規格自動退回商品主圖。
- `admin/config.yml` — Decap CMS 後台欄位定義；`admin/index.html` — 後台入口
- `images/uploads/` — 所有商品實拍照（後台上傳也存這）
- `netlify.toml` — 部署設定（publish `.`，`/content/*.json` 設 no-cache）

## 內容渲染機制（最容易改壞的地方）
- 可編輯元素帶 `data-field="page.key"`（文字）、`data-field-img`、`data-field-href`；商品容器用固定 id：`hamu-grid`、`goods-grid-outerwear`、`goods-grid-hats`；首頁另有 `home-carousel`（輪播）、`promo-grid`（行銷 Banner）、`featured-grid`（推薦牆「大家的心頭好」：從 `products-store.json` 取真實商品，排行寫死在 render.js 的 `FEATURED_IDS`，口水巾與眼鏡固定前兩名；HTML fallback 要與該清單同步）。
- `render.js` 在載入時 fetch JSON 填入；**fetch 失敗時（如 `file://` 直開）保留 HTML 裡寫死的 fallback，不會空白，這是刻意設計**。
- ⚠️ 改任何頁面文字：**HTML 的 fallback 與對應 JSON 兩邊要同步改，不能只改一邊**，否則線上（讀 JSON）跟本機預覽會不一致。
- `data-page` 屬性決定 render.js 抓哪份資料：`home` / `hamu_page` / `goods_page` / `story_page` / `contact_page`。

## Decap CMS 資料結構限制
- 商品 JSON **必須維持 `{"items":[...]}` 包裹格式**（file collection 需要）。
- goods 每筆多一個 `category` 欄位，值只能是 `outerwear` 或 `hats`，render.js 依此分流到兩個 grid。
- products-hamu 的名稱與價格已對應 products-store.json 真實商品，每筆有 `store_id`（對應選品商品編號）：render.js 會轉成卡片的 `data-product-id`，點擊開詳情視窗（hamu.html 已含 modal + shop.js）。products-goods 的價格仍是示意佔位值；`featured` 已不再驅動首頁推薦牆（改用 render.js 的 `FEATURED_IDS`）。
- 各頁主標題（site.json 的 `title`）支援用全形「｜」指定換行位置（render.js 的 `setTitle` 轉成 `<br>`），避免「療癒系」這類詞彙被自動斷在詞中間；HTML fallback 的 `<br>` 要放在相同位置。
- 聯絡資訊（site.json `contact`）只有 Instagram 與客服時間，**Email 已移除**；LINE 加好友連結 `https://lin.ee/p8jJX9m` 寫死在 HTML（綠色 `.line-btn`）。
- 新增 / 改欄位時，**JSON 與 `admin/config.yml` 的 `fields` 要同步**，否則後台編輯不到。
- `products-store.json` **尚未接 Decap 後台**（規格為巢狀結構，config.yml 未定義）；目前更新流程是「改 `plupluland_products.md` → 重跑 build 腳本」，若日後要讓 Melody 在後台編輯需另外設計。
- `shop.html` 的商品牆沒有逐項 HTML fallback（47 項太多）：fetch 失敗時顯示 `.shop-fallback` 備援訊息並導向賣貨便，這是刻意設計。

## 設計系統
- 改色 / 改字體 / 改版型 → 改 `css/style.css` 的 `:root` 變數，別散改各處。
- 主色：`--cream #FBF6EA`、`--brown-deep #6B4A32`；點綴：`--moss #7C8A63`、`--rose #C97B82`。
- 字體：標題 `--serif-cjk`（M PLUS Rounded 1c，**圓體，不要手寫感**）、內文 `--sans-cjk`（Noto Sans TC）、拉丁點綴 `--accent-lat`（Quicksand）。
- 簽名視覺：陳列櫃 `.shelf`、手縫虛線 `.stitch`、商品貼紙標籤 `.product-tape`。
- **圖文對稱區塊一律用 `.duo`**（文字 55% / 圖 45%、gap 56px、圖框固定 **1:1 正方形** + cover + 圓角 12px、頂部對齊 `align-items:start`；圖在左加 `.duo--flip`）；內頁頁首一律用 `.page-hero`（padding 寫死，**不要用 inline style 覆寫**）；Navbar 高度固定 72px。
- 商品詳情視窗（`#shop-modal`）已從 shop.html 抽象化：頁面只要放 modal markup ＋載入 `js/shop.js`，任何帶 `data-product-id`（對應 products-store.json 的 id）的元素點擊就會開窗；首頁推薦牆即走此機制。卡片內 `.product-buy` 按鈕不受攔截、照常外連賣貨便。
- 全站商品圖統一規格：`.product-photo` 基底即 **1:1 正方形＋圓角 12px＋cover**（娃寶陳列區、大家的心頭好、選品陳列架共用），不要在個別區塊覆寫比例。
- 導覽列**沒有「首頁」與「聯絡我們」連結**（點 LOGO 回首頁；聯絡入口在頁尾與 icon）；文字選單只有はむにぎり倉鼠娃／娃衣選品／品牌故事，右上角固定三個圓形功能 icon：購物車（賣貨便，橘 `--seven-orange`）、Instagram（玫瑰）、LINE（綠），手機版維持水平並排在漢堡選單旁。
- 頁尾選單：品牌故事、聯絡我們、購物須知＋兩顆膠囊按鈕：橘色 `.buy-btn`（前往賣貨便下單，含購物車 icon）與綠色 `.line-btn`（加入 LINE 好友），兩者規格完全相同。
- 娃寶陳列區（hamu-grid）最多顯示 **6 個品項**（render.js `slice(0, 6)`）。
- 輪播支援**海報模式**（carousel item 的 `poster: true`）：圖片本身已含文字設計時整張為連結、不疊文字卡片，手機裁切靠左（`.carousel-slide--poster`）；野餐季 Banner（`images/uploads/picnic-banner.jpg`，2100×900）即此模式。

## 購買導流（7-11 賣貨便）
- 網站無內建金流，所有購買都導向賣貨便：`https://myship.7-11.com.tw/general/detail/GM2605058795102`。
- 這個網址出現在：各頁 nav 的 `.nav-buy`、footer 的 `.buy-link`、商品卡的 `.product-buy`（render.js 的 `BUY_URL` 常數與各頁 HTML fallback）、`js/shop.js` 的 `STORE_URL`。**若賣場網址更換，以上位置要全部同步改**。
- 品牌故事頁有「PluPlu的四位店員」區塊，大頭貼放 `images/staff/`（manager＝花生米／parttimer＝多多／accountant＝比司吉／buyer＝Coco，470px 方形，由主理人提供的合照裁出），未放照片時顯示米色圓形佔位。
- 「出貨前的小小儀式」使用 `.steps` 流程元件（圓形 icon＋玫瑰色數字標籤，三欄含手機版），story.html 與 goods.html 共用同一份文案：嚴格驗貨、細緻剪線頭、手工打結收尾。**兩頁要同步改**。

## 品牌語言規範
- **不稱「娃娃」**，一律用「娃寶／寶寶／小朋友」等擬人化稱呼。
- **全站堅持實拍照片，絕不放 AI 生成圖**（品牌現階段最不妥協的堅持）。
- 調性：溫柔陪伴感、日系極簡。

## 改 CSS 後要檢查的斷點
style.css 用到的 breakpoint：**480 / 560 / 760 / 820 / 900 / 1000px（導覽列收合為漢堡選單）**。改版型後至少過一輪窄機（320–480）、平板（760–820）。
目前所有手機版修正僅在單檔預覽目視過，**尚未在真機／DevTools 逐頁逐斷點驗證**。

## 部署狀態與待辦
- Step 1 GitHub repo：完成。
- Step 2 改 `admin/config.yml` 的 repo 名稱：目前仍是預留值 `your-github-username/pluplu-land`，**待確認 Melody 是否已在線上版改對**。
- Step 3 接 Netlify（Import → Deploy）：狀態未確認。
- Step 4 Netlify Identity + Git Gateway（開後台登入）：**尚未做**。
- ⚠️ 待釐清：`config.yml` 目前是 `backend: name: github`，與「Identity + Git Gateway」流程通常需要的 `git-gateway` 不一致，上線前需確認。
