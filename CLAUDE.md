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
scripts/                商品資料產生腳本（python / node；含賣貨便相簿同步 sync-myship-gallery.py）
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
  - `content/products-store.json` — 娃衣選品 62 項（**產出檔勿手改**：由 `scripts/build-products-json.py` 解析 `plupluland_products.md`＋`docs/products/web-copy.md` 產生；賣場更新時改 md 後重跑腳本。2026-08-25 依賣場全量同步：新增 #61 小胖蜂套裝、#62 貴族千鳥格裙、#63 馬海毛質感毛衣；#36/#44/#47 為賣場已下架保留展示、#12 已移除缺號屬正常。多規格不同價的品項有 `price_max` 欄位，卡片顯示「NT$ 最低價 起」。⚠️ #06 官網名稱為「雙層緹花蛋糕裙」，主理人指定拿掉賣場原名的「（超多顏色！）」，全量同步腳本重新產 md 時會被賣場原名蓋回，同步後要記得手動改回來）
- 商品 JSON **必須維持 `{"items":[...]}` 包裹格式**（Decap file collection 需要）。
- 新增／改 JSON 欄位時，`admin/config.yml` 的 `fields` 要同步，否則後台編輯不到。
- `site-content.service.ts` 裡有一份「載入前的預設文案」，只在畫面載入的一瞬間出現，**後台改文案時不需要跟著改它**。
- `assets/images/products/variants/` 規格專屬圖片命名規範：`{商品編號}_{規格名稱}.jpg`（空格移除、`/` 改 `-`）。照規範放入後重跑 build 腳本即自動接上；彈窗點選規格時主圖淡入切換。
- **商品相簿**（彈窗輪播，2026-08-28 新增）：`assets/images/products/gallery/`＋`content/products-store.json` 的 `gallery` 欄位，來源是 `docs/products/gallery-map.json`，由 `scripts/sync-myship-gallery.py` 從賣貨便頁面內嵌 JSON 全量同步後、再由 build 腳本寫入（**兩個都是產出檔，勿手改**）。腳本三個關鍵行為：**瑕疵品過濾**（規格名含「微瑕／瑕疵／出清／NG」一律不進官網，主理人指定；`DEFECT_RE` 在同步腳本與 build 腳本各擋一次）、**重複照片去重**（影像內容指紋＝構圖 dHash/aHash ＋色彩簽章雙條件，避免「同構圖不同色」被誤併；賣場重複上傳只留一張、官網既有主圖與規格圖沿用原路徑）、**相簿第一張固定是主圖**且每個規格圖都保證在相簿裡。賣場新增／刪除商品要補 `ID_MAP`（賣場 `Cgdd_Id` → 官網編號），否則腳本會停下來提示；解析到的商品數低於 `MIN_PRODUCTS` 也會中止且不寫檔（防賣場改版把正確資料洗掉）。腳本另外輸出 `variant_images`（賣場替各規格綁的照片），build 腳本用它補上官網缺的款式專屬圖（手動放進 `variants/` 的圖優先，不會被蓋掉）。彈窗縮圖列另外吃 `assets/images/products/thumbs/` 的 200px 小圖（同一支腳本產生，`brand.ts` 的 `thumbUrl()` 換路徑，缺檔會自動退回原圖）。與賣場的規格／庫存差異清單見 `docs/MYSHIP-DIFF-2026-08-28.md`（待主理人決定，尚未套用）。
- 各頁主標題支援用全形「｜」指定換行位置（`titleBreak` pipe），避免「療癒系」這類詞被斷在中間。

## 購買導流與品牌常數（單一來源）

全部集中在 `src/app/core/brand.ts`，**改一處全站生效**：
- 賣貨便網址 `BUY_URL`（換賣場只改這裡）
- IG 私訊直達 `IG_DM_URL`（ig.me）、Threads `THREADS_URL`（購物袋私訊客服鈕用；與 IG 同名帳號，2026-08-26 主理人確認）
- **輕量購物袋**（2026-08-26 主理人指定，給海外／香港顧客一鍵結單；無金流）：狀態在 `core/cart.service.ts`（localStorage 記憶、件數／總額 computed、明細文字產生器 `orderText()`）、側欄元件 `shared/cart-drawer.ts`（掛在根版型）。彈窗「加入購物袋」只對「販售中且有定價」的款式出現（與款式價格顯示同一套條件，完售款式自然沒有按鈕）。導覽列購物車 icon 改為開啟側欄＋玫瑰色件數標籤（**不再直接外連賣貨便**，賣貨便入口在側欄底部連結、頁尾與各區塊按鈕）。側欄底部：一鍵複製訂單明細（Toast 提示）＋ LINE／IG／Threads 私訊快捷鈕（點擊時自動複製明細，顧客開對話直接貼上）；清單最下方有「清空購物袋」低調文字鈕（附二次確認視窗，2026-08-26）。加入當下的價格是快照，最終金額由客服確認。
- LINE `https://lin.ee/p8jJX9m`、IG `@plupluland_tw`
- 「分享實穿照折扣」金額 `SHARE_DISCOUNT_AMOUNT`（首頁活動區、選品頁橫幅、購物須知三處同步）。2026-08-31 起規則（三步驟：分享→私訊截圖領折扣碼→下次結帳折抵）：IG 限動（須公開）或貼文、或 Threads 發文並標記，**IG 與 Threads 各可領一次、一人最多兩張**（購物須知頁是完整三步驟版，首頁活動區與選品頁橫幅是精簡提示）。購物須知最後一張「先來聊聊」諮詢卡只放一顆 LINE 膠囊鈕、不放其他社群；排版與其他須知卡同規格（靠左對齊＋小標左側細線＋按鈕靠左，2026-08-31 主理人指定，勿做置中版）。
- 首頁「Lookbook 小基地」（原「陳列櫃裡的日常片刻」，2026-08-31 改名）：6 格照片每次重新整理從 `core/lookbook.ts` 的 `LOOKBOOK_POOL` 隨機抽 6 張不重複（Fisher-Yates），新增照片只要放進 `images/uploads/` 再加一筆到清單；只收有娃寶入鏡的生活實拍，Banner 圖與純道具照不放。
- 首頁推薦牆排行 `FEATURED_IDS`（2026-08-28 精簡為固定 4 款：野餐出遊套組、好眠套組、眼鏡 4.5cm、牛仔吊帶褲；平板 2×2、手機 1 欄）與針織企劃專區 `KNIT_IDS`（#knit-collection，2026-08-28 新增：針織開襟小外套、馬海毛毛衣、雙層緹花蛋糕裙）

## 設計系統

- 改色／字體／版型 → 改 `src/styles.scss` 的 `:root` 變數，別散改各處。
- 主色：`--cream #FBF6EA`、`--brown-deep #6B4A32`；點綴：`--moss #7C8A63`、`--rose #C97B82`。
- 字體：標題 M PLUS Rounded 1c（圓體，不要手寫感）、內文 Noto Sans TC、拉丁點綴 Quicksand（在 `src/index.html` 以 link 載入）。M PLUS 缺繁中字時先退 **Huninn（jf open 粉圓，台灣開源圓體）** 再退 Noto Sans TC（2026-08-26 缺字修復：避免同一行混出細黑體），fallback 鏈只改 styles.scss 的三個字體變數。
- 導覽列：品牌 LOGO 為去背字標圖檔 `images/logo-wordmark.png`（點擊回首頁；2026-08-17 主理人指定：不加「首頁」文字、不裁圓、固定 65px 高）；頁尾與 favicon 仍用圓形 `images/logo.png`。文字選單為 娃衣選品／品牌故事／購物須知／聯絡我們；右上三顆圓 icon 為**奶茶棕色階**（購物袋＝淺、IG＝中、LINE＝深，token `--nav-icon-*`，主理人指定；購物車 icon 2026-08-26 起開啟購物袋側欄、不再外連賣貨便）。
- **全站段落間距規格**：相鄰區塊之間留白統一 200px（`.section` 各出 100px、stitch 分隔線置中不佔間距；手機減半）。改間距只改 styles.scss 的 `.section` 規則。例外（2026-08-17 主理人指定）：頁首區與第一個區塊的間距縮為 60%（`.page-hero` padding 38/60、首段 `padding-top:60px`，手機減半），導覽列 LOGO 高 52px。
- 實拍標章 `.badge-real`：**純文字＋小圓點＋手縫虛線底線**，刻意不做膠囊外框（避免誤認為按鈕，主理人指定）。
- **商品詳情彈窗有相簿輪播**（2026-08-28 主理人指定）：主圖區可瀏覽該品項的所有照片（各顏色實拍、情境搭配、細節圖），左右箭頭／下方縮圖列／鍵盤左右鍵／手機左右滑動都能切換，右下角有「第幾張／共幾張」。**點款式籤會跳到該款式的實拍照並連動價格；反過來滑到某款式的照片時，款式籤與價格也會切過去**。賣場常把同一張照片綁在多個款式上（#18 草帽與紅色小布包、#20 芬達／起司／柳橙汁、#62 四色合照），所以選款規則是「目前選中的款式對得上這張照片就不動 → 否則優先選回顧客親手點過的那一款 → 都不是才選第一個」，翻照片不會偷換掉款式與價格、加入購物袋不會加錯款。首頁野餐專區點卡片進來會停在同一張照片、並選中對應款式（`open(id, focusImage, focusVariant)`）。只有一張照片的品項不出現箭頭與縮圖列。主圖與縮圖都是 1:1＋圓角 12px／6px，切換時版面不跳動。彈窗打開時停在主圖（＝顧客剛點的那張卡片），不會一開啟就跳到某個規格的特寫。
- **商品詳情彈窗是「作品圖鑑」＋「款式連動價格」**（2026-08-13 主理人指定；2026-08-17 精簡；2026-08-25 加回價格）：展示名稱、系列籤、敘述與多圖照片，標題下方顯示**目前選中款式的「NT$ 金額」**（各款式獨立價格在 `variants[].price`，點款式籤即時連動切換；完售款式與未定價款式不顯示金額但價格列高度保留、版面不跳動；整項完售的歷史展示品完全沒有價格列）。**仍然不顯示現貨／預購／售完／特價任何狀態字樣與出貨時程，也沒有賣貨便導購按鈕與購物須知連結**（2026-08-26 起有「加入購物袋」按鈕＋數量選擇，只對販售中且有定價的款式出現；勿重建 ship-info 出貨說明、售完停用按鈕、「前往賣貨便選購」鈕與「特價」小籤；「特價」系列籤在彈窗資料層過濾；選品卡片的特價貼紙已於 2026-08-26 全站移除）。購買動線走導覽列／頁尾／各區塊的賣貨便按鈕。完售品項不做灰階與售完貼紙，與販售中完全同樣呈現（像展示歷年作品）。彈窗版型：左欄照片固定 1:1 正方形＋圓角 12px（不因文字長短變形），右欄文字桌機獨立捲動、手機整面板捲動。
- 選品分類名稱：「鼠鼠本體」「褲裝」（改名要同時改 `scripts/build-products-json.py`、`content/products-store.json`、`admin/config.yml` 三處）。
- 已移除的頁面與區塊（勿重建）：「はむにぎり倉鼠娃」頁（2026-07-17，舊網址轉回首頁）、「娃裝配件」頁（2026-08-05，舊網址 /goods 與 goods.html 轉到 /shop）、首頁「精挑細選：替娃寶張羅的生活感」圖文區塊（2026-08-28 主理人指定刪除）。相關資料檔與後台收藏一併移除；本體與衣裝都在娃衣選品分類裡。
- 品牌故事頁段落間距為主理人指定的 450px 大留白（`.story-spacing`，手機縮為 150px），樣式在 styles.scss。
- 頁尾連結順序：品牌故事 → 購物須知 → 聯絡我們（主理人指定）＋橘色賣貨便膠囊＋綠色 LINE 膠囊（規格相同）。
- 圖文對稱區塊一律用 `.duo`（文字 55%／圖 45%、1:1 方形圖、頂部對齊；圖在左加 `.duo--flip`）。
- 全站商品圖統一 `.product-photo`：1:1 正方形＋圓角 12px＋cover。
- 輪播兩種版型（2026-08-12 起**兩種都是整張滿版可點、不做實體按鈕、不疊光圈熱區**，跳轉目的地由 site.json 的 link 欄位決定，換網址只改 JSON）：**海報模式**（poster:true，圖片本身已含文案與按鈕設計，手機 4:3 靠左裁切）；**分割式版型**（非海報：左格紋色塊 theme butter/rose ＋右實拍，格紋色在 `--gingham-*`，手機上文下圖）。hotspot 熱區與 link_label 按鈕欄位已整組移除（勿重建，光圈會與圖上的按鈕對不準）；「遇見はむにぎり娃寶」Banner 已刪除（2026-08-12）；2026-08-28 起輪播為兩張海報：野餐季（連 `#picnic-plan`）＋針織開襟衫（連 `#knit-collection`），分割式版型暫無使用但勿刪程式。
- **商品卡顯示價格、彈窗不顯示**（2026-08-25 主理人指定，取代 08-12 的全站隱藏價格）：選品卡、首頁推薦牆、野餐專區卡片顯示「NT$ 金額」（`brand.ts` 的 `priceLabel()`；多規格不同價顯示「NT$ 最低價 起」，靠 JSON 的 `price_max` 欄位）。**完售品項不標價、也不標完售字樣**（維持歷年作品展示的乾淨版面）；**「特價」黃色貼紙已全站移除**（2026-08-26 主理人指定，勿重建），特價品項直接顯示特價後價格、不另外標示。商品詳情彈窗顯示「跟著款式走」的價格（見下方彈窗條目）。野餐專區的價格優先用 picnic JSON 各品項自己的 price（一張卡常對應選品的其中一個規格，取整個選品的最低價會標錯；對應選品整項完售時自動不標價，邏輯在 `home.ts` 的 `picnicPrice()`）。
- **選品陳列架排序與卡片封面輪播**（2026-08-31 主理人指定）：分類籤右側有排序下拉（上架順序由舊到新／由新到舊、熱銷排行、價格由低到高／由高到低；邏輯在 `core/sort.ts`，價格排序時完售與未定價一律墊底；預設＝目錄原始順序，網址可帶 `?sort=new` 等）。**熱銷排行**銷量來自主理人 Google 帳號的 Apps Script 統計 API（試算表全程私密；腳本在 `scripts/gas-sales-api.gs`、部署指南 `docs/SALES-API-SETUP.md`、網址填 `brand.ts` 的 `SALES_API_URL`；未設定或讀失敗＝銷量全當 0、退化為上架新到舊；名稱對照忽略空格與全半形，`core/sales.service.ts`）。陳列架每張卡片的封面直接可輪播該品項整本相簿（`ProductCardData.images`＝`gallery`）：左右箭頭（桌機滑到卡片才出現）、≤10 張顯示圓點／更多改「第幾張／共幾張」、手機左右滑、鍵盤左右鍵；點卡片開詳情視窗會停在目前這張。為了不讓 62 張卡一開始就抓幾百張照片，相鄰照片要等顧客滑到／碰到卡片才開始預載。首頁的卡片沒傳 `images`，維持靜態封面。
- 選品陳列架有「**織女手作系列**」虛擬分類籤：不是 products-store.json 的正式分類，而是撈商品 tags 含「織女手工系列」的品項（常數在 `brand.ts` 的 `HANDMADE_*`）。選品頁網址可帶 `?cat=分類鍵`（如 `/shop?cat=handmade`、`/shop?cat=accessory`）直接切到指定分類，首頁「織女手作系列」「配件專區」方塊就是這樣導流。
- 新增共用元件：selector 用 `pl-` 前綴，並把 selector 加進 styles.scss 頂部的 `display:contents` 清單（見 docs/COMPONENTS.md 的規則）。

## 品牌語言規範

- **不稱「娃娃」**，一律用「娃寶／寶寶／小朋友」等擬人化稱呼。
- **全站禁用破折號（——）**，改用逗號、頓號或「：」斷句。
- 品牌名稱「PluPlu Land」不可斷行：JSON 文案經 `keepBrand` pipe 處理；模板寫死處用 `PluPlu&nbsp;Land`。
- 按鈕與短標籤套 `word-break:keep-all`；**長句內文不可套**，會撐破版面。唯一例外：購物須知頁頭導言（2026-08-31 主理人指定套 keep-all），做法是文案在 `notice.html` 用零寬空格 `&#8203;` 預留最後一句的換行點＋`overflow-wrap:anywhere` 保險，改那段文案時要保留換行點。
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
