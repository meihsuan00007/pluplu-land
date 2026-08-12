# PluPlu Land 網站 — 使用說明

娃衣品牌「PluPlu Land」的官方網站。使用 **Angular** 框架開發（2026-07 由純靜態網頁改版而來），
內容後台使用 Decap CMS（網址是 `你的網站/admin`），部署在 Netlify（免費）。

---

## 一、在自己電腦上預覽網站（本機開發）

> 改版後**不再使用 VS Code 的 Live Server**。請改用下面的指令。

第一次拿到這個資料夾（或很久沒動過）先安裝一次：

```bash
npm install
```

之後每次要看網站，執行：

```bash
npm start
```

等它顯示 `Local: http://localhost:4200/` 之後，用瀏覽器打開 **http://localhost:4200** 就能看到網站。
改動任何檔案存檔後，瀏覽器會**自動重新整理**，不用重開。
要停止預覽：在終端機按 `Ctrl + C`。

### 其他常用指令

| 指令 | 用途 |
|---|---|
| `npm start` | 本機預覽（開發用，會自動重新整理） |
| `npm run build` | 打包成正式版（結果放在 `dist/` 資料夾；平常不需要自己跑，Netlify 上線時會自動執行） |
| `npm test` | 跑自動化測試（確認頁首頁尾等基本結構沒被改壞） |

---

## 二、把網站放上網路（部署）

網站放在 GitHub，push 之後 Netlify 會**自動打包並上線**，不需要手動操作。

```bash
git add -A
git commit -m "說明這次改了什麼"
git push
```

Netlify 的打包設定已寫在 `netlify.toml`（打包指令、輸出資料夾、舊網址轉址都設定好了），
在 Netlify 網站後台 Import 這個 repo 時保持預設值即可，它會自動讀取。

### 第一次設定（只需做一次）

1. **GitHub**：把這個資料夾推上你的 GitHub repo。
2. **後台設定**：打開 `admin/config.yml`，把 `repo: your-github-username/pluplu-land` 改成你自己的「帳號/repo名稱」。
3. **Netlify**：到 [netlify.com](https://netlify.com) 用 GitHub 帳號登入 → Add new site → Import 這個 repo → Deploy（設定用預設值，`netlify.toml` 會接管）。
4. **開啟後台登入**：Netlify 後台 → Site configuration → Identity → Enable Identity → Registration 設為 Invite only → Services 開啟 Git Gateway → Invite users 寄邀請信給自己，點信中連結設定密碼。

完成後，到 `你的網站網址/admin` 就能用視覺化後台編輯文案與商品，
儲存後 Netlify 會自動重新上線（約 1–2 分鐘生效）。

---

## 三、網址對照

改版後網址結尾不再有 `.html`（舊網址會自動轉到新網址，別人存的舊連結不會壞）：

| 頁面 | 新網址 |
|---|---|
| 首頁 | `/` |
| 娃衣選品 | `/shop` |
| 品牌故事 | `/story` |
| 聯絡我們 | `/contact` |
| 購物須知 | `/notice` |
| 內容後台 | `/admin` |

---

## 四、想改東西？

- 請先看 [CLAUDE.md](CLAUDE.md)（專案總說明）與 [docs/COMPONENTS.md](docs/COMPONENTS.md)（共用元件清單）。
- 文案與商品資料在 `content/` 資料夾的 JSON 檔（後台編輯的就是這些檔案）。
- 照片在 `images/` 與 `assets/images/`。
