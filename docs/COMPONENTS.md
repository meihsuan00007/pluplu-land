# 共用元件總覽（開發前必讀）

> **給未來的 Claude Code session**：要改按鈕、彈窗、卡片、頁首頁尾之前，先在這份文件找。
> 每一種 UI 都**只有一份**程式碼，改一處＝全站同步。**不要**在頁面裡重新手刻一顆長得一樣的按鈕。
> 找元件的方式：grep 這份文件裡的 selector（如 `pl-buy-button`）或 CSS class（如 `.buy-btn`）。

## 常數（先看這裡，很多「要改的東西」其實是常數）

檔案：`src/app/core/brand.ts`

| 常數 | 內容 | 改它會影響 |
|---|---|---|
| `BUY_URL` | 7-11 賣貨便賣場網址 | 全站所有購買按鈕、購物車 icon、彈窗選購鈕 |
| `LINE_URL` / `LINE_HANDLE` | LINE 加好友連結／帳號名 | 所有 LINE 按鈕 |
| `IG_URL` / `IG_HANDLE` | Instagram 連結／帳號名 | 導覽列 icon、首頁活動區、聯絡頁 |
| `SHARE_DISCOUNT_AMOUNT` | 「分享實穿照」折扣金額（數字 30；IG 限動／貼文或 Threads 擇一、每人限領一次） | 首頁活動區、選品頁橫幅、購物須知，三處一起變 |
| `LOOKBOOK_POOL` / `pickLookbook()` | 首頁 Lookbook 小基地照片庫與隨機抽 6 張的邏輯（`core/lookbook.ts`） | 首頁 Lookbook 區塊；加照片只改這份清單 |
| `FEATURED_IDS` | 首頁「大家的心頭好」排行（口水巾、眼鏡固定前兩名） | 首頁推薦牆 |
| `money()` / `priceLabel()` | 金額格式 NT$ 1,234／商品卡價格標示（多規格不同價自動加「起」） | 選品卡、推薦牆、野餐專區的價格（完售品項不標價） |
| `IG_DM_URL` / `THREADS_URL` | IG 私訊直達（ig.me）／Threads 帳號連結 | 購物袋側欄的私訊客服快捷鈕 |
| `HANDMADE_CAT_KEY` / `HANDMADE_CAT_LABEL` / `HANDMADE_TAG` | 「織女手作系列」虛擬分類（key `handmade`、顯示名、對應商品 tags 的「織女手工系列」） | 選品陳列架篩選籤、首頁「織女手作系列」方塊導流（`/shop?cat=handmade`） |

> 價格顯示（2026-08-25 起恢復）：商品卡顯示「NT$ 金額」（多價位加「起」）、彈窗顯示跟著款式走的價格、購物袋顯示單價與總額；**完售品項與完售款式一律不標價**。相關函式 `money()`／`priceLabel()` 見上表。

## 共用元件（src/app/shared/）

| Selector | 檔案 | 用途 | 主要輸入 |
|---|---|---|---|
| `app-header` | `header.ts` | 全站導覽列（文字選單：娃衣選品／品牌故事／購物須知／聯絡我們＋手機漢堡選單、右上三顆圓 icon） | 無（內容寫死） |
| `app-footer` | `footer.ts` | 全站頁尾（連結順序：品牌故事→購物須知→聯絡我們＋兩顆膠囊按鈕） | 無 |
| `pl-buy-button` | `buy-button.ts` | 「前往賣貨便下單」按鈕，三種外觀 | `variant`: `hero`(頁首棕色實心)／`capsule`(頁尾橘膠囊)／`card`(商品卡玫瑰小鈕)、`label` |
| `pl-line-button` | `line-button.ts` | LINE 綠色膠囊按鈕 | `label`（預設「加入 LINE 好友」） |
| `pl-ig-button` | `ig-button.ts` | Instagram 深棕膠囊按鈕（與 LINE 鈕同規格，2026-08-31 新增；聯絡頁兩顆並排） | `label`（預設「追蹤 Instagram」） |
| `pl-badge-real` | `badge-real.ts` | 「全實拍」標章（純文字＋虛線底線的說明標籤，不是按鈕） | `text`（預設「全實拍・零 AI」）、`onDark`（深色底用） |
| `pl-product-card` | `product-card.ts` | 商品卡片（首頁心頭好／選品陳列架共用；2026-08-25 起顯示價格；2026-08-31 起 `images` 多張時封面可輪播） | `data: ProductCardData`（`priceText` 有值才顯示價格，完售品項留空；`images` 給整本相簿＝封面可左右翻、圓點／計數、手機滑動、鍵盤左右鍵，點卡片開視窗停在同一張）、`showBuy`、`shopStyle`；`data.pid` 有值＝點卡片開詳情視窗 |
| （排序）`SORT_OPTIONS` / `sortItems()` | `core/sort.ts` | 選品陳列架排序（上架順序新舊、熱銷排行、價格高低；價格排序完售與未定價一律墊底），網址 `?sort=` 可帶 | 選品頁工具列 `.shelf-toolbar` 的下拉選單 |
| `SALES_API_URL` / `SalesService` | `brand.ts`、`core/sales.service.ts` | 熱銷排行的銷量統計來源（主理人 Google 帳號的 Apps Script API，只回「商品名稱: 數量」；部署見 docs/SALES-API-SETUP.md；網址留空或讀失敗＝銷量全當 0） | 選品頁「熱銷排行」排序 |
| `pl-product-modal` | `product-modal.ts` | 商品詳情彈出視窗（全站唯一，掛在 `app.ts` 根版型）。定位是「作品圖鑑」：照片固定 1:1，無購買按鈕，不顯示現貨／預購／售完／特價狀態與出貨時程；2026-08-25 起標題下方顯示「跟著款式走」的價格（`variants[].price`，完售款式不顯示、版面高度保留不跳動）；2026-08-28 起主圖區是**相簿輪播**（`gallery` 欄位）：左右箭頭／下方縮圖列／鍵盤左右鍵／手機左右滑動都能換照片，點款式籤會跳到該款式的實拍照，滑到某款式的照片時款式籤與價格也會跟著切 | 無輸入，由 `ProductModalService` 控制 |
| `pl-carousel` | `carousel.ts` | 首頁大輪播（海報模式＋分割式版型、自動播 5 秒；兩種版型都整張滿版可點、不做實體按鈕也不疊光圈熱區，跳轉目的地看 site.json 的 link） | `slides`（來自 site.json 的 home.carousel） |
| `pl-page-hero` | `page-hero.ts` | 內頁頁首（一律左對齊：短線小標＋標題＋導言；有 image＝左文右圖【五頁皆用此版】，無 image＝純文字備用。置中版已廢除勿重建） | `eyebrow`/`title`/`lead`/`image`/`alt`/`hasActions`；按鈕徽章用 `<ng-content>` 投影 |
| `pl-section-head` | `section-head.ts` | 區塊標題組（英文小字＋大標＋導言） | `eyebrow`/`title`/`lead` |
| `pl-strip-cta` | `strip-cta.ts` | 每頁底部深色行動呼籲橫幅 | `title`/`body`/`label`/`link`/`external`/`hasIntro` |
| `pl-quote-block` | `quote-block.ts` | 創辦人引言區 | `quote`（用全形「｜」指定換行）/`cite` |
| `pl-steps` | `steps.ts` | 出貨前三步驟（驗貨→剪線頭→打結收尾，內容固定共用） | `title`/`lead`（story 與 shop 兩頁使用） |
| `pl-cart-drawer` | `cart-drawer.ts` | 購物袋側欄（全站唯一，掛在 `app.ts` 根版型；清單＋數量加減＋清空購物袋二次確認＋一鍵複製明細＋LINE/IG/Threads 私訊鈕＋全站 Toast） | 無輸入，由 `CartService` 控制 |
| `pl-icon-cart` / `pl-icon-ig` / `pl-icon-line` | `icons.ts` | 三個 SVG 圖示（唯一定義處） | 無 |

## 核心服務與工具（src/app/core/）

| 檔案 | 用途 |
|---|---|
| `brand.ts` | 品牌常數（見上表）＋ `money()` 金額格式、`assetUrl()` 圖片路徑、`routeFromLegacy()` 舊連結轉路由 |
| `site-content.service.ts` | 讀 `content/site.json`（全站文案），內含載入前的預設文案（不需與 JSON 同步維護） |
| `products.service.ts` | 讀兩份商品 JSON：選品目錄（store）／野餐（picnic），各載一次快取 |
| `product-modal.service.ts` | 商品詳情視窗開關：`open(商品編號)`、`openPicnic(野餐品項)`、`close()` |
| `cart.service.ts` | 購物袋狀態（localStorage 記憶）：`add()`、`changeQty()`、`remove()`、件數 `count`、總額 `total`、明細文字 `orderText()`、側欄開關與 Toast |
| `text.ts` | `keepBrand` pipe（品牌名不斷行）、`titleBreak` pipe（全形「｜」→ 換行） |
| `reveal.directive.ts` | 滾動淡入：模板元素掛 `class="reveal"` 並在元件 imports 加 `Reveal` 即生效 |

## 新增共用元件時的規則

1. 檔案放 `src/app/shared/`，selector 用 `pl-` 前綴。
2. 到 `src/styles.scss` 最上方的 `display:contents` 清單加上新 selector（讓元件標籤不影響版面）。
3. 樣式一律寫在 `src/styles.scss`（全站唯一樣式檔），不要用元件私有樣式檔。
4. 把元件登記到本文件的表格裡。

## 頁面（src/app/pages/）

5 頁：`home`／`shop`／`story`／`contact`／`notice`，
每頁一個 `.ts`（資料）＋`.html`（版面）。路由與分頁標題在 `src/app/app.routes.ts`。
（「はむにぎり倉鼠娃」頁與「娃裝配件」頁已移除，勿重建；本體與衣裝都在選品店的分類裡，本體分類名為「鼠鼠本體」。）
