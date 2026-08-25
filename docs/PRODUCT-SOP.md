# 商品上架 SOP（新增／更新商品的標準流程）

> 給主理人：把這份文件丟給 Claude Code 說「照 SOP 幫我上架這個商品」＋提供商品資訊即可。
> 給未來的 Claude Code session：動手前先讀完「兩種上架方式」的警告，避免資料被腳本蓋掉。

---

## 一、商品資料放在哪裡？

| 東西 | 位置 |
|---|---|
| **商品資料**（選品陳列架全部品項） | `content/products-store.json`（必須維持 `{"categories":[...],"items":[...]}` 格式） |
| **商品主圖** | `assets/images/products/`，命名 `{商品編號}-{英文短名}.jpg`，例：`48-summer-dress.jpg`（最長邊 1600px 以內） |
| **規格專屬圖**（點選規格時切換的圖，可省略） | `assets/images/products/variants/`，命名 `{商品編號}_{規格名稱}.jpg`（規格名照 JSON、空格移除、`/` 改 `-`），例：`48_櫻花粉.jpg` |
| 首頁「大家的心頭好」排行 | `src/app/core/brand.ts` 的 `FEATURED_IDS`（把商品編號加進陣列） |
| 首頁「野餐企劃專區」品項（含 Coming Soon） | `content/products-picnic.json`（格式見文末） |

## 二、上架方式（主理人請直接用方式 C）

### 方式 C：填 Excel 表單交給 Claude Code（主理人專用，最推薦）
1. 開啟範本 `docs/products/product-upload-template.csv`（雙擊會用 Excel 打開，表頭與範例都在裡面，也可以另存成 .xlsx 使用）。
2. 照表頭填商品資料（欄位規則見下方「Excel 表頭欄位說明」）。
3. 商品照片放進 `assets/images/products/`（規格專屬圖放 `variants/`，命名規則見第一節）。
4. 把填好的檔案存在電腦上（例如「下載」資料夾），跟 Claude Code 說：
   「照 SOP 幫我批次上架，表單在 C:\Users\User\Downloads\xxx.xlsx」。
   ⚠️ **請告知檔案路徑讓 Claude 讀原始檔，不要用附件貼上**（附件中文會亂碼）。
5. Claude 會轉換成正式格式、同步來源清單、本機檢查畫面後回報結果。

### Excel 表頭欄位說明

| 欄位 | 怎麼填 | 必填 |
|---|---|---|
| 商品編號 | 兩位數字，接續現有最大編號（目前到 63） | ✔ |
| 商品名稱 | 可含 emoji | ✔ |
| 分類 | 只能填：鼠鼠本體／洋裝・裙子／上衣・毛衣／褲裝／套裝／外套・披肩／帽子・頭飾／包包・提袋／配件小物 | ✔ |
| 系列標籤 | 如「韓國直送」「織女手工系列」，多個用「、」分隔，可留空 | |
| 售價 | 純數字 | ✔ |
| 原價 | 有特價才填（原本的價格）；留空＝沒特價 | |
| 特價標籤 | 如「開幕優惠 6 折」「換季特價」；有填＝特價中 | |
| 販售狀態 | 販售中 或 售完 | ✔ |
| 含娃寶本體 | 是／否（只有鼠鼠本體商品填「是」） | ✔ |
| 圖片檔名 | 只填檔名（如 `48-summer-dress.jpg`），檔案本人放 `assets/images/products/` | ✔ |
| 規格清單 | 每個規格寫「供貨方式\|規格名稱\|價格」，多個規格用全形「；」分隔；售完的規格在名稱後加（售完）。價格是該款式在彈窗顯示的金額，各款不同價就各填各的。例：`現貨\|櫻花粉\|130；預購\|薄荷綠\|140；現貨\|奶油白（售完）\|130` | ✔ |
| 商品介紹 | 官網文案（禁用破折號） | ✔ |
| 小提醒 | 尺寸、材質注意事項，可留空 | |
| 首頁推薦 | 是／否（「是」會加進首頁「大家的心頭好」） | ✔ |

規格專屬圖不用另外填欄位：照命名規則 `{編號}_{規格名}.jpg` 放進 `assets/images/products/variants/` 就會自動接上。

## 二之二、工程端的兩種資料更新方式（擇一，別混用）

### 方式 A：改來源檔＋重跑腳本（批次更新賣場時用）
`content/products-store.json` 是**產出檔**，由腳本讀取兩份來源檔產生：
1. 更新 `plupluland_products.md`（規格、價格、庫存）
2. 更新 `docs/products/web-copy.md`（官網文案）
3. 執行 `python scripts/build-products-json.py` 重新產生 JSON

### 方式 B：直接改 JSON（單筆快速上架）
直接在 `content/products-store.json` 的 `"items"` 陣列**最後**貼上下方範本改內容。
⚠️ **警告**：之後若有人重跑方式 A 的腳本，手動加的商品會被蓋掉。所以用方式 B 上架後，**務必**把同一筆商品也補記到 `plupluland_products.md` 與 `docs/products/web-copy.md`。

（網站上線後也可以用 `你的網站/admin` 後台視覺化編輯，欄位相同，同樣有方式 A 蓋掉的問題。）

## 三、商品資料範本（複製貼上用）

貼在 `content/products-store.json` 的 `"items": [...]` 陣列最後（記得前一筆結尾加逗號）：

```json
{
  "id": "48",
  "name": "商品名稱寫這裡",
  "category": "dress",
  "tags": ["韓國直送"],
  "price": 130,
  "price_max": null,
  "original_price": 130,
  "on_sale": false,
  "sale_label": null,
  "status": "available",
  "body_included": false,
  "image": "assets/images/products/48-summer-dress.jpg",
  "variants": [
    { "supply": "現貨", "name": "櫻花粉", "price": 130, "in_stock": true, "image": null },
    { "supply": "預購", "name": "薄荷綠", "price": 140, "in_stock": true, "image": null }
  ],
  "description": "商品介紹文案寫這裡（官網口吻，禁用破折號）。",
  "reminder": "尺寸或注意事項（沒有就整行改成 null）"
}
```

## 四、欄位說明

| 欄位 | 填什麼 |
|---|---|
| `id` | 商品編號，**兩位數字字串**（接續現有最大編號；目前到 63） |
| `name` | 商品名稱（可含 emoji；品牌名會自動防斷行） |
| `category` | 分類代碼，只能填：`doll`（鼠鼠本體）、`dress`（洋裝・裙子）、`top`（上衣・毛衣）、`bottom`（褲裝）、`set`（套裝）、`outerwear`（外套・披肩）、`headwear`（帽子・頭飾）、`bag`（包包・提袋）、`accessory`（配件小物） |
| `tags` | 系列標籤陣列，如 `["韓國直送"]`、`["織女手工系列"]`；想標「新品」也是加在這裡；沒有就 `[]` |
| `price` / `original_price` | 純數字。沒特價時兩者填一樣。卡片會顯示「NT$ 售價」；完售品項自動不標價 |
| `price_max` | 多規格不同價時填最高價（卡片會顯示「NT$ 售價 起」）；單一價位填 `null` |
| `on_sale` / `sale_label` | 特價中填 `true` ＋標籤文字（如 `"開幕優惠 6 折"`）；否則 `false` ＋ `null` |
| `status` | `"available"`（販售中）或 `"sold_out"`（完售。外觀照常展示，只有詳情視窗會顯示已售完） |
| `body_included` | 是否含娃寶本體（只有鼠鼠本體商品填 `true`） |
| `image` | 主圖路徑（照第一節的資料夾與命名規則） |
| `variants` | 規格陣列。`supply` 只能是 `"現貨"` 或 `"預購"`；`price` 是該款式的售價（彈窗點該款式會顯示「NT$ 金額」，售完或未定價填 `null` 就不顯示）；`in_stock` 填 `false` 代表該款完售；`image` 有規格專屬圖就填路徑，沒有填 `null`。⚠️ 規格名稱請勿以「$數字」結尾、也不要取名「無庫存」，會與資料檔的價格／庫存欄位混淆 |
| `description` | 商品介紹（顯示在詳情視窗） |
| `reminder` | 小提醒框（尺寸、材質注意事項），沒有填 `null` |

> 常見問題：「isNew／comingSoon 這類欄位呢？」
> 選品陳列架沒有這兩個欄位：新品用 `tags` 標；**Coming Soon 預告只有首頁野餐專區支援**（見下節）。

## 五、野餐專區品項格式（含 Coming Soon）

`content/products-picnic.json` 的 `"items"` 陣列，每筆格式：

```json
{
  "id": "picnic-strawhat",
  "store_id": "18",
  "name": "品項名稱",
  "price": 45,
  "image": "assets/images/products/18-plaid-schoolbag.jpg",
  "status": "available",
  "note": "卡片下方的小字",
  "description": "詳情視窗的介紹文字"
}
```
- 已在選品架上的商品：`store_id` 填選品編號（點卡片會開該商品詳情）、`status: "available"`。
- 尚未到貨的預告品項：`store_id` 留空、`price` 填 `null`、`status: "coming_soon"`、圖片可用佔位圖 `assets/images/products/coming-soon-strawhat.svg`／`coming-soon-basket.svg`（畫面會自動停用購買按鈕顯示「即將開賣」）。

## 六、上架五步驟（總結）

1. 圖片放進 `assets/images/products/`（照命名規則）
2. 商品資料加進 `content/products-store.json`（方式 B）或改 md 重跑腳本（方式 A）
3. 想上首頁推薦牆 → 把編號加進 `src/app/core/brand.ts` 的 `FEATURED_IDS`
4. `npm start` 本機檢查：選品陳列架有出現、點卡片詳情視窗正常、規格與價格正確
5. `git add -A` → `git commit` → `git push`，Netlify 自動上線

## 七、文案規範（上架時一併遵守）

- 禁用破折號（——），改用逗號、頓號或「：」
- 不稱「娃娃」，用「娃寶／寶寶／小朋友」
- 商品照片一律實拍，不用 AI 生成圖
