# CLAUDE.md — PluPlu Land

娃衣品牌「PluPlu Land」的概念旗艦店。**Angular v21 + SCSS 單頁應用**（2026-07-17 由純靜態 HTML/CSS/JS 重構而來），內容後台用 Decap CMS、部署在 Netlify（免費）。目前只陳列展示，**沒有金流／購物車**，所有購買導向 7-11 賣貨便。

## ⚠️ 與使用者溝通的方式（最重要）

- **主理人（使用者）不懂前端程式碼，也不會自己動 code**，所有修改都透過 Claude Code 進行。
- 回報與提問**不要用程式術語**（不要說 component、signal、routing、build……），改用「影響」與「考量面向」讓使用者做選擇。例：不要問「要不要把這段抽成共用元件？」，要問「這兩頁的這個區塊要不要改成『改一次、兩頁一起變』？」。
- 遇到「各頁內容不一致」或「不確定要不要合併」的問題：寫一份 .md 清單（分類＋標明網站上哪裡看得到＋建議選項）讓使用者回填，參考 `docs/REFACTOR-QUESTIONS.md` 的格式。
- **大規模開發或改版之後，必須自行 spawn subagent 做對抗性驗證**（一個驗證「結果是否符合目的」、一個做 code review），修完問題才回報使用者。
- 從不主動 commit；工作完成後詢問使用者是否要 commit + push。

## 必讀文件（動手前先看）

1. `docs/COMPONENTS.md` — **共用元件與常數總覽**。改按鈕、彈窗、卡片、頁首頁尾、賣場網址、折扣金額之前先查這份，避免重複造輪子或改錯地方。
2. `docs/PRODUCT-SOP.md` — **商品上架標準流程**。新增／更新商品、換圖、標特價、標完售都照這份做（含兩種上架方式的「腳本會蓋掉手改」警告）。
3. `README.md` — 本機預覽指令（`npm start`）與部署流程。
4. 本檔其餘章節 — 資料流、品牌規範、設計系統。

## 專案結構

```
src/
  index.html            分頁外殼（字型、favicon、Netlify Identity）
  styles.scss           全站唯一樣式檔（所有 token 在 :root；元件不寫私有樣式）
  app/
    app.ts / app.config.ts / app.routes.ts   根版型、路由（含舊 .html 網址轉址）
    core/               常數與資料層
      brand.ts            賣貨便網址、LINE/IG、折扣金額、推薦排行等「單一來源」常數
      site-content.service.ts   讀 content/site.json（全站文案）
      products.service.ts       讀三份商品 JSON（store/goods/picnic）
      product-modal.service.ts  商品詳情視窗開關
      text.ts             keepBrand（品牌名不斷行）、titleBreak（「｜」→換行）
      reveal.directive.ts 滾動淡入
    shared/             共用 UI 元件（清單見 docs/COMPONENTS.md）
    pages/              5 個頁面：home / shop / story / contact / notice
content/                後台可編輯的文案與商品 JSON（維持舊格式，Decap 後台不受改版影響）
admin/                  Decap CMS 後台（config.yml 欄位定義）
images/、assets/        照片與商品圖（angular.json 有把這些資料夾映射進網站）
scripts/                商品資料產生腳本（python / node）
netlify.toml            部署設定（打包指令、舊網址 301 轉址、SPA fallback）
files/、files.zip       舊版遺留檔案，一律忽略不改
```

- 本機預覽：`npm start` → http://localhost:4200 （不再用 Live Server）。
- 驗證正式版：`npm run build` 後需要有 SPA fallback 的伺服器（可用 scratchpad 起一個 Node 靜態伺服器；`python -m http.server` 進不了 /shop 這類路由）。
- 單元測試：`npm test`（vitest）。

## 內容資料流（最容易改壞的地方）

- **JSON 是唯一內容來源**（改版後不再有「HTML fallback 要兩邊同步改」的問題）：
  - `content/site.json` — 各頁文案 / hero 圖 / 聯絡資訊 / 首頁輪播與 Banner
  - `content/products-picnic.json` — 首頁野餐企劃專區（`#picnic-plan`）：`store_id` 有值＝既有選品；`status: coming_soon`＝預告品項（佔位圖 `assets/images/products/coming-soon-*.svg`＋停用購買按鈕「即將開賣」，點卡片開預告視窗）
  - `content/products-store.json` — 娃衣選品 62 項（**產出檔勿手改**：由 `scripts/build-products-json.py` 解析 `plupluland_products.md`＋`docs/products/web-copy.md` 產生；賣場更新時改 md 後重跑腳本。2026-08-25 依賣場全量同步：新增 #61 小胖蜂套裝、#62 貴族千鳥格裙、#63 馬海毛質感毛衣；#36/#44/#47 為賣場已下架保留展示、#12 已移除缺號屬正常。多規格不同價的品項有 `price_max` 欄位，卡片顯示「NT$ 最低價 起」）
- 商品 JSON **必須維持 `{"items":[...]}` 包裹格式**（Decap file collection 需要）。
- 新增／改 JSON 欄位時，`admin/config.yml` 的 `fields` 要同步，否則後台編輯不到。
- `site-content.service.ts` 裡有一份「載入前的預設文案」，只在畫面載入的一瞬間出現，**後台改文案時不需要跟著改它**。
- `assets/images/products/variants/` 規格專屬圖片命名規範：`{商品編號}_{規格名稱}.jpg`（空格移除、`/` 改 `-`）。照規範放入後重跑 build 腳本即自動接上；彈窗點選規格時主圖淡入切換。
- 各頁主標題支援用全形「｜」指定換行位置（`titleBreak` pipe），避免「療癒系」這類詞被斷在中間。

## 購買導流與品牌常數（單一來源）

全部集中在 `src/app/core/brand.ts`，**改一處全站生效**：
- 賣貨便網址 `BUY_URL`（換賣場只改這裡）
- IG 私訊直達 `IG_DM_URL`（ig.me）、Threads `THREADS_URL`（購物袋私訊客服鈕用；與 IG 同名帳號，2026-08-26 主理人確認）
- **輕量購物袋**（2026-08-26 主理人指定，給海外／香港顧客一鍵結單；無金流）：狀態在 `core/cart.service.ts`（localStorage 記憶、件數／總額 computed、明細文字產生器 `orderText()`）、側欄元件 `shared/cart-drawer.ts`（掛在根版型）。彈窗「加入購物袋」只對「販售中且有定價」的款式出現（與款式價格顯示同一套條件，完售款式自然沒有按鈕）。導覽列購物車 icon 改為開啟側欄＋玫瑰色件數標籤（**不再直接外連賣貨便**，賣貨便入口在側欄底部連結、頁尾與各區塊按鈕）。側欄底部：一鍵複製訂單明細（Toast 提示）＋ LINE／IG／Threads 私訊快捷鈕（點擊時自動複製明細，顧客開對話直接貼上）。加入當下的價格是快照，最終金額由客服確認。
- LINE `https://lin.ee/p8jJX9m`、IG `@plupluland_tw`
- 「發限動折扣」金額 `SHARE_DISCOUNT_AMOUNT`（首頁活動區、選品頁橫幅、購物須知三處同步）
- 首頁推薦牆排行 `FEATURED_IDS`（口水巾、眼鏡固定第 1、2 名）

## 設計系統

- 改色／字體／版型 → 改 `src/styles.scss` 的 `:root` 變數，別散改各處。
- 主色：`--cream #FBF6EA`、`--brown-deep #6B4A32`；點綴：`--moss #7C8A63`、`--rose #C97B82`。
- 字體：標題 M PLUS Rounded 1c（圓體，不要手寫感）、內文 Noto Sans TC、拉丁點綴 Quicksand（在 `src/index.html` 以 link 載入）。M PLUS 缺繁中字時先退 **Huninn（jf open 粉圓，台灣開源圓體）** 再退 Noto Sans TC（2026-08-26 缺字修復：避免同一行混出細黑體），fallback 鏈只改 styles.scss 的三個字體變數。
- 導覽列：品牌 LOGO 為去背字標圖檔 `images/logo-wordmark.png`（點擊回首頁；2026-08-17 主理人指定：不加「首頁」文字、不裁圓、固定 65px 高）；頁尾與 favicon 仍用圓形 `images/logo.png`。文字選單為 娃衣選品／品牌故事／購物須知／聯絡我們；右上三顆圓 icon 為**奶茶棕色階**（購物袋＝淺、IG＝中、LINE＝深，token `--nav-icon-*`，主理人指定；購物車 icon 2026-08-26 起開啟購物袋側欄、不再外連賣貨便）。
- **全站段落間距規格**：相鄰區塊之間留白統一 200px（`.section` 各出 100px、stitch 分隔線置中不佔間距；手機減半）。改間距只改 styles.scss 的 `.section` 規則。例外（2026-08-17 主理人指定）：頁首區與第一個區塊的間距縮為 60%（`.page-hero` padding 38/60、首段 `padding-top:60px`，手機減半），導覽列 LOGO 高 52px。
- 實拍標章 `.badge-real`：**純文字＋小圓點＋手縫虛線底線**，刻意不做膠囊外框（避免誤認為按鈕，主理人指定）。
- **商品詳情彈窗是「作品圖鑑」＋「款式連動價格」**（2026-08-13 主理人指定；2026-08-17 精簡；2026-08-25 加回價格）：展示名稱、系列籤、敘述與多圖照片，標題下方顯示**目前選中款式的「NT$ 金額」**（各款式獨立價格在 `variants[].price`，點款式籤即時連動切換；完售款式與未定價款式不顯示金額但價格列高度保留、版面不跳動；整項完售的歷史展示品完全沒有價格列）。**仍然不顯示現貨／預購／售完／特價任何狀態字樣與出貨時程，也沒有賣貨便導購按鈕與購物須知連結**（2026-08-26 起有「加入購物袋」按鈕＋數量選擇，只對販售中且有定價的款式出現；勿重建 ship-info 出貨說明、售完停用按鈕、「前往賣貨便選購」鈕與「特價」小籤；「特價」系列籤在彈窗資料層過濾；選品卡片的特價貼紙已於 2026-08-26 全站移除）。購買動線走導覽列／頁尾／各區塊的賣貨便按鈕。完售品項不做灰階與售完貼紙，與販售中完全同樣呈現（像展示歷年作品）。彈窗版型：左欄照片固定 1:1 正方形＋圓角 12px（不因文字長短變形），右欄文字桌機獨立捲動、手機整面板捲動。
- 選品分類名稱：「鼠鼠本體」「褲裝」（改名要同時改 `scripts/build-products-json.py`、`content/products-store.json`、`admin/config.yml` 三處）。
- 已移除的頁面（勿重建）：「はむにぎり倉鼠娃」頁（2026-07-17，舊網址轉回首頁）、「娃裝配件」頁（2026-08-05，舊網址 /goods 與 goods.html 轉到 /shop）。相關資料檔與後台收藏一併移除；本體與衣裝都在娃衣選品分類裡。
- 品牌故事頁段落間距為主理人指定的 450px 大留白（`.story-spacing`，手機縮為 150px），樣式在 styles.scss。
- 頁尾連結順序：品牌故事 → 購物須知 → 聯絡我們（主理人指定）＋橘色賣貨便膠囊＋綠色 LINE 膠囊（規格相同）。
- 圖文對稱區塊一律用 `.duo`（文字 55%／圖 45%、1:1 方形圖、頂部對齊；圖在左加 `.duo--flip`）。
- 全站商品圖統一 `.product-photo`：1:1 正方形＋圓角 12px＋cover。
- 輪播兩種版型（2026-08-12 起**兩種都是整張滿版可點、不做實體按鈕、不疊光圈熱區**，跳轉目的地由 site.json 的 link 欄位決定，換網址只改 JSON）：**海報模式**（poster:true，圖片本身已含文案與按鈕設計，手機 4:3 靠左裁切）；**分割式版型**（非海報：左格紋色塊 theme butter/rose ＋右實拍，格紋色在 `--gingham-*`，手機上文下圖）。hotspot 熱區與 link_label 按鈕欄位已整組移除（勿重建，光圈會與圖上的按鈕對不準）；「遇見はむにぎり娃寶」Banner 已刪除（2026-08-12），目前輪播只有野餐海報＋新品娃裝兩張。
- **商品卡顯示價格、彈窗不顯示**（2026-08-25 主理人指定，取代 08-12 的全站隱藏價格）：選品卡、首頁推薦牆、野餐專區卡片顯示「NT$ 金額」（`brand.ts` 的 `priceLabel()`；多規格不同價顯示「NT$ 最低價 起」，靠 JSON 的 `price_max` 欄位）。**完售品項不標價、也不標完售字樣**（維持歷年作品展示的乾淨版面）；**「特價」黃色貼紙已全站移除**（2026-08-26 主理人指定，勿重建），特價品項直接顯示特價後價格、不另外標示。商品詳情彈窗顯示「跟著款式走」的價格（見下方彈窗條目）。野餐專區的價格優先用 picnic JSON 各品項自己的 price（一張卡常對應選品的其中一個規格，取整個選品的最低價會標錯；對應選品整項完售時自動不標價，邏輯在 `home.ts` 的 `picnicPrice()`）。
- 選品陳列架有「**織女手作系列**」虛擬分類籤：不是 products-store.json 的正式分類，而是撈商品 tags 含「織女手工系列」的品項（常數在 `brand.ts` 的 `HANDMADE_*`）。選品頁網址可帶 `?cat=分類鍵`（如 `/shop?cat=handmade`、`/shop?cat=accessory`）直接切到指定分類，首頁「織女手作系列」「配件專區」方塊就是這樣導流。
- 新增共用元件：selector 用 `pl-` 前綴，並把 selector 加進 styles.scss 頂部的 `display:contents` 清單（見 docs/COMPONENTS.md 的規則）。

## 品牌語言規範

- **不稱「娃娃」**，一律用「娃寶／寶寶／小朋友」等擬人化稱呼。
- **全站禁用破折號（——）**，改用逗號、頓號或「：」斷句。
- 品牌名稱「PluPlu Land」不可斷行：JSON 文案經 `keepBrand` pipe 處理；模板寫死處用 `PluPlu&nbsp;Land`。
- 按鈕與短標籤套 `word-break:keep-all`；**長句內文不可套**，會撐破版面。
- **全站堅持實拍照片，絕不放 AI 生成圖**（品牌現階段最不妥協的堅持）。
- 調性：溫柔陪伴感、日系極簡。

## 改 CSS 後要檢查的斷點

styles.scss 的 breakpoint：**480 / 560 / 760 / 820 / 900 / 1000px（導覽列收合為漢堡選單）**。
改版型後至少過一輪窄機（500px 寬，Edge headless 最窄只能開到約 500）、平板（760–820）、桌機（1440）。

## 部署狀態與待辦

- Netlify 打包設定已寫在 `netlify.toml`（`npm ci && npm run build`、publish `dist/pluplu-land/browser`、舊 .html 網址 301 轉址、SPA fallback）。
- `admin/config.yml` 的 repo 名稱仍是預留值 `your-github-username/pluplu-land`，上線前要改成實際 repo。
- Netlify Identity + Git Gateway（後台登入）尚未開通；`config.yml` 目前 `backend: name: github` 與 Git Gateway 流程的差異上線前需確認。
- 聯絡頁不設表單（主理人指定，2026-07-17 移除）：顧客一律走 LINE／IG 私訊。
- 野餐海報圖內文字寫「2026的好天氣」，跨年要換圖。
- 已知限制：分享連結到 LINE／FB 時，內頁的預覽標題與描述會顯示首頁的版本（單頁應用特性）。若日後在意，可加「預先產生各頁 HTML」（prerender）解決，屬獨立工程。
