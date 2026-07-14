# PluPlu Land 網站專案 — Claude Code 交接 Prompt

我要把這個網站專案的開發工作交給你（Claude Code）接手。這份文件是我從另一個 Claude 對話（claude.ai 網頁版）搬過來的完整背景，請你先讀完整份，理解專案現況，然後照最下面的「請你做的事」進行。

---

## 一、專案是什麼

**PluPlu Land**：一個娃衣品牌的概念旗艦店網站。品牌賣兩類商品：
1. **はむにぎり倉鼠娃**（導流主力商品，日本當紅角色）
2. **娃裝配件**（主要營收來源，手作針織外套、帽飾、披肩等）

目前網站定位是「陳列展示＋方便日常維護」，**沒有金流／購物車**，之後才會視情況加購物車外掛或搬到 Shopify。

品牌調性：溫柔陪伴感、日系極簡風、堅持全部使用實拍照片（絕不用 AI 生成圖）。品牌用語規範：不稱商品為「娃娃」，一律用「娃寶」「寶寶」「小朋友」這類擬人化稱呼。

---

## 二、技術架構

**純靜態網站，沒有 build 工具、沒有框架**（不是 React/Vue/Next.js，就是原生 HTML + CSS + vanilla JS）。刻意保持簡單，因為要用免費的 Decap CMS + Netlify 架構，不需要 build step。

```
index.html / hamu.html / goods.html / story.html / contact.html   → 五個頁面
css/style.css         → 唯一的樣式檔（所有顏色、字體、版型都在這裡，用 CSS 變數管理）
js/main.js            → 手機選單開關、滾動淡入動畫
js/render.js          → 讀取 content/ 裡的 JSON，把文字和商品清單動態填入頁面
content/site.json               → 各頁面標題文案、hero 圖片、聯絡資訊
content/products-hamu.json      → 倉鼠娃商品清單（陣列包在 {"items":[...]} 裡）
content/products-goods.json     → 娃裝配件商品清單（多一個 category 欄位分「外套洋裝／帽飾披肩」）
images/logo.png       → 品牌 Logo
images/uploads/        → 所有商品照片（之後透過後台上傳的新照片也會存這裡）
admin/config.yml      → Decap CMS 後台欄位設定
admin/index.html      → 後台登入頁
netlify.toml           → Netlify 部署設定
README.md              → 完整部署步驟說明（GitHub → Netlify → Identity → Git Gateway）
```

**內容渲染邏輯**：每個頁面的 HTML 裡，可編輯的文字元素上都有 `data-field="xxx.yyy"` 屬性，商品格子的容器有 `id="hamu-grid"` / `id="goods-grid-outerwear"` / `id="goods-grid-hats"`。`js/render.js` 在頁面載入時 fetch 對應的 JSON，把資料填進這些元素。**如果 fetch 失敗（例如用 file:// 直接開檔案），HTML 裡原本寫好的靜態內容會留著當 fallback，不會空白**，這是刻意設計的。

**設計系統（CSS 變數，定義在 `css/style.css` 最上面）**：
- 主色：米杏底色 `--cream #FBF6EA`、深棕字 `--brown-deep #6B4A32`
- 點綴色：苔綠 `--moss #7C8A63`、絨紅 `--rose #C97B82`
- 字體：標題用圓體 `M PLUS Rounded 1c`（品牌主理人明確要求「不要手寫感，要圓體或正黑體」），內文用 `Noto Sans TC`
- 簽名視覺元素：「陳列櫃」網格（`.shelf`）、手縫虛線分隔線（`.stitch`）、商品卡片上的貼紙標籤（`.product-tape`），呼應娃裝縫紉與實體選物店陳列的品牌調性

---

## 三、後台系統（Decap CMS）

`admin/config.yml` 定義了三個可編輯區塊：
1. **網站文字設定**（對應 `content/site.json`）：各頁 hero 標題/文案/圖片、品牌故事時間軸、聯絡資訊
2. **はむにぎり倉鼠娃商品**（對應 `content/products-hamu.json`）
3. **娃裝配件商品**（對應 `content/products-goods.json`，含分類欄位）

部署方式：GitHub repo + Netlify hosting + Netlify Identity（登入驗證）+ Git Gateway（讓後台編輯直接 commit 回 repo）。`admin/config.yml` 裡的 `repo:` 欄位目前還是預留值 `your-github-username/pluplu-land`，**要記得確認品牌主理人的實際 GitHub 帳號/repo 名稱有沒有填正確**。

---

## 四、目前進度與已知問題

品牌主理人（Melody）正在照 `README.md` 的步驟，一步步自己在 GitHub 網頁版 + Netlify 上設定：
- Step 1（GitHub 建 repo、上傳檔案）：完成，中途卡過一次「資料夾沒有一起上傳」的問題（用網頁版 Upload files 選擇視窗選不到資料夾，只能拖曳整個資料夾或改用 GitHub Desktop）
- Step 2（改 `admin/config.yml` 的 repo 名稱）：應該已完成
- Step 3（接上 Netlify、Import an existing project、Deploy）：剛講解完，狀態不確定是否已實際操作完成
- Step 4（Netlify Identity + Git Gateway，開後台登入）：**還沒做**

**已經在對話中修過的 bug**（都已經反映在目前的程式碼裡，不用重修，但你可以檢查一下 Netlify 上實際部署的版本是不是最新的）：
1. 手機版漢堡選單打開時背景是透明的，導致選單文字和首頁內容重疊 → 已改成 `position:fixed` 全螢幕不透明遮罩 + `opacity`/`visibility` 雙重控制，並加上 `body.nav-open{overflow:hidden}` 防止背景捲動
2. 首頁「全實拍 NO AI」圓形貼紙因為父層 `overflow:hidden` 被裁掉一角 → 改成用圖片本身的 `border-radius` 而不是容器裁切
3. 聯絡我們頁的 Email／Instagram 網址（英文長字串）在窄螢幕上會撐破版面 → 加了 `overflow-wrap:anywhere` 和 grid 子項目 `min-width:0`

**還沒驗證過的地方**：所有手機版排版修正都只在「單檔內嵌預覽版本」裡目視確認過，**還沒有在真實手機瀏覽器或 DevTools 裝置模擬器裡逐頁、逐斷點實際測試過**。建議你接手後找機會用瀏覽器工具（或請品牌主理人截圖）系統性地過一輪五個頁面在窄螢幕（320px～480px）、平板寬度（760px～820px）下的呈現。

---

## 五、請你做的事

1. **通讀整個專案**（五個 HTML 頁面、`css/style.css`、`js/main.js`、`js/render.js`、`content/*.json`、`admin/config.yml`、`README.md`），確認你對現況的理解跟這份文件一致。
2. **寫一份 `CLAUDE.md`**，放在專案根目錄，內容至少要包含：
   - 專案一句話說明＋技術棧（純靜態 HTML/CSS/JS，無 build 工具）
   - 檔案結構速查（可以濃縮上面第二節的表格）
   - 內容渲染機制的重點（`data-field` 屬性、`render.js` 的 fallback 設計原則——**這是容易被誤改壞的地方，修改任何頁面文字時，要嘛同步改 HTML 裡的 fallback 文字，要嘛同步改對應的 JSON，兩邊不能只改一邊**）
   - 設計系統 tokens（顏色、字體變數名稱，改版型或色彩時應該改 `:root` 裡的變數而不是散改各處）
   - 品牌語言規範（不用「娃娃」、用「娃寶/寶寶/小朋友」；全站堅持實拍照片、不放 AI 生成圖）
   - Decap CMS 後台的資料結構限制（商品 JSON 必須維持 `{"items":[...]}` 包裹格式，因為 file collection 的關係；新增欄位要同步改 `admin/config.yml` 的 fields 定義，不然後台編輯不到）
   - 目前的部署狀態與待辦（照第四節內容整理成清單）
   - 「改動 CSS 後，行動版斷點要檢查哪幾個尺寸」這類容易忘記的檢查清單
   - CLAUDE.md 保持精簡（大概 20–80 行的範圍即可），不要把這份交接文件整篇貼進去；深入的細節可以留在這份交接 prompt 或另外開 `.claude/rules/` 分檔案，CLAUDE.md 只放「每次都該記得」的核心事實
3. **確認並建立專案記憶**：如果你的版本支援 `/init`，可以先跑一次打底，再依照上面第 2 點的內容手動補齊/調整。跑完後跟我確認一下 `CLAUDE.md` 有沒有正確被讀取（例如用 `/memory` 檢查）。
4. 完成後，簡短跟我複述一次你理解的「目前最優先要做的事」是什麼，讓我確認交接沒有漏掉東西。

有任何在這份文件裡沒交代清楚、你需要我補充的地方，直接問，不用自己猜。
