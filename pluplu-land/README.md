# PluPlu Land 網站 — 部署與後台使用說明

這個資料夾是完整的網站，包含一個可視覺化編輯的「內容管理後台」（網址是 `你的網站/admin`）。
上線完全免費，只需要 GitHub 帳號 + Netlify 帳號（都是免費申請）。

---

## 一、把網站放上網路（第一次設定，約 15 分鐘）

### 步驟 1：建立 GitHub 帳號與 repo
1. 到 [github.com](https://github.com) 註冊帳號（如果還沒有的話）。
2. 建立一個新的 repository，命名為 `pluplu-land`（可以自訂名稱），設定為 **Public** 或 **Private** 皆可。
3. 把這整個資料夾的所有檔案上傳到這個 repo（可以直接在 GitHub 網頁上用「Add file → Upload files」拖拉上傳，不需要會下指令）。

### 步驟 2：修改後台設定檔裡的 repo 名稱
打開 `admin/config.yml`，把這一行：
```yaml
repo: your-github-username/pluplu-land
```
改成你自己的「GitHub帳號/repo名稱」，例如：
```yaml
repo: melody-chen/pluplu-land
```
存檔後上傳回 GitHub（覆蓋原本的檔案）。

### 步驟 3：連接 Netlify
1. 到 [netlify.com](https://netlify.com) 用剛剛的 GitHub 帳號註冊/登入。
2. 點選「Add new site → Import an existing project」，選擇你的 `pluplu-land` repo。
3. 部署設定保持預設值即可（Build command 留空，Publish directory 填 `.`），點選「Deploy」。
4. 幾十秒後，Netlify 會給你一個網址，例如 `pluplu-land.netlify.app`，這就是你的網站正式網址了。（之後也可以在 Netlify 裡綁定自己的網域名稱。）

### 步驟 4：開啟後台登入功能
1. 在 Netlify 的網站後台，進入 **Site configuration → Identity**，點選「Enable Identity」。
2. 進入 Identity 設定，把「Registration」設為 **Invite only**（比較安全，只有你邀請的人能登入後台）。
3. 往下捲到 **Services → Git Gateway**，點選「Enable Git Gateway」。
4. 回到 Identity 頁籤，點選「Invite users」，輸入你自己的 email，寄一封邀請信給自己。
5. 打開信箱裡的邀請信，點選連結，設定一組後台登入密碼。

### 完成！
之後只要到 `你的網站網址/admin`（例如 `pluplu-land.netlify.app/admin`），
輸入剛剛設定的帳號密碼，就能進入後台。

---

## 二、日常維護怎麼用後台

登入後台後，左側選單會看到三個可編輯的區塊：

- **網站文字設定**：首頁、はむにぎり倉鼠娃頁、娃裝配件頁、品牌故事頁的標題／文案／主視覺圖片，以及聯絡資訊（Email、Instagram、客服時間）。
- **はむにぎり倉鼠娃商品**：可以新增、刪除、編輯每一款娃寶的名稱、標籤、照片與說明文字。
- **娃裝配件商品**：同上，並多一個「分類」欄位（外套洋裝 / 帽飾披肩），決定商品要顯示在頁面上的哪一區。

每次編輯完，點右上角「Publish」，網站會在幾十秒內自動更新，不需要重新上傳檔案、也不需要懂程式碼。

上傳新商品照片時，直接在編輯畫面裡的圖片欄位選擇上傳即可，後台會自動幫你存放好。

---

## 三、之後要開賣（串金流）的路

目前這個網站**沒有購物車、沒有金流**，純粹是陳列展示＋方便你自己維護內容。
等你準備好要正式開賣時，比較常見、對現有網站改動最小的兩個方向：

1. **輕量購物車外掛**：像 Snipcart、Shopify 的「Buy Button」，可以直接嵌入現有商品卡片旁邊，不需要重做整個網站。
2. **搬到完整電商平台**：例如 Shopify、WooCommerce，把現在整理好的商品照片與文案直接搬過去建立商品頁。

兩種方向都可以之後再找人（或再回來問我）評估，現階段不需要現在決定。

---

## 檔案結構說明

```
index.html / hamu.html / goods.html / story.html / contact.html   → 五個頁面
css/style.css        → 網站樣式（顏色、字體、版型）
js/main.js           → 選單開關、滾動動畫
js/render.js         → 讀取 content/ 裡的資料，把文字圖片填進頁面
content/site.json               → 各頁面文字與聯絡資訊（後台「網站文字設定」對應這個檔案）
content/products-hamu.json      → 倉鼠娃商品清單（後台「はむにぎり倉鼠娃商品」對應這個檔案）
content/products-goods.json     → 娃裝配件商品清單（後台「娃裝配件商品」對應這個檔案）
images/uploads/       → 商品照片（後台上傳的新照片也會存在這裡）
images/logo.png       → 品牌 Logo
admin/config.yml      → 後台欄位設定
admin/index.html      → 後台登入頁面
```
