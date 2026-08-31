/**
 * 全站品牌常數（單一來源）。
 * 賣場網址、LINE、IG、活動折扣金額都只在這裡設定一次，
 * 改這裡＝全站所有按鈕、連結、文案一起更新。
 */

/** 全站唯一的購買通路：7-11 賣貨便（網站沒有內建金流，所有下單都導去這裡） */
export const BUY_URL = 'https://myship.7-11.com.tw/general/detail/GM2605058795102';

/** LINE 官方帳號加好友連結與顯示名稱 */
export const LINE_URL = 'https://lin.ee/p8jJX9m';
export const LINE_HANDLE = '@plupluland_tw';

/** Instagram */
export const IG_URL = 'https://www.instagram.com/plupluland_tw';
export const IG_HANDLE = '@plupluland_tw';
/** IG 私訊直達連結（購物袋「私訊客服」用；ig.me 會直接開對話視窗） */
export const IG_DM_URL = 'https://ig.me/m/plupluland_tw';

/** Threads（購物袋「私訊客服」用；帳號與 IG 同名，2026-08-26 主理人確認） */
export const THREADS_URL = 'https://www.threads.net/@plupluland_tw';

/** 「發限動」活動折扣金額（首頁活動區、選品頁橫幅、購物須知三處共用）。
 *  改折扣只要改這個數字，三個頁面會一起更新。 */
export const SHARE_DISCOUNT_AMOUNT = 30;
export const SHARE_DISCOUNT = `NT$${SHARE_DISCOUNT_AMOUNT}`;

/** 銷量統計 API（Google Apps Script Web App，部署方式見 docs/SALES-API-SETUP.md）。
 *  選品頁「熱銷排行」排序的資料來源；只回傳「商品名稱: 累計售出數量」的 JSON。
 *  2026-08-31 主理人部署完成接上。讀失敗或逾時＝銷量全當 0、熱銷排行退化為上架新到舊。
 *  品名歸戶規則在 core/sales-match.ts，對不上的品名清單見 docs/SALES-NAME-REVIEW.md。 */
export const SALES_API_URL =
  'https://script.google.com/macros/s/AKfycbwVMijzBRFtCaAWisDjEme-t5AArJuH0QoZfk_zeb-QKGTNJV4qmPJ-1hJ1zAIHr2IpZA/exec';

/** 首頁「大家的心頭好」排行（對應 products-store.json 的商品編號；
 *  2026-08-28 主理人指定精簡為 4 款：野餐出遊套組（草帽）、好眠套組、眼鏡 4.5cm、牛仔吊帶褲） */
export const FEATURED_IDS = ['18', '03', '29', '11'];

/** 首頁「針織企劃」專區（#knit-collection）的精選品項（輪播針織海報跳到這裡；
 *  2026-08-28 主理人指定：針織開襟小外套、馬海毛質感毛衣、雙層緹花蛋糕裙） */
export const KNIT_IDS = ['48', '63', '06'];

/** 「織女手作系列」虛擬分類（選品陳列架篩選籤＋首頁方塊導流共用）。
 *  不是 products-store.json 的正式分類，而是撈商品 tags 裡含 HANDMADE_TAG 的品項；
 *  商品名稱與資料沿用賣場原文「織女手工系列」，網站上的顯示名稱依主理人指定為「織女手作系列」。 */
export const HANDMADE_CAT_KEY = 'handmade';
export const HANDMADE_CAT_LABEL = '織女手作系列';
export const HANDMADE_TAG = '織女手工系列';

/** 金額顯示格式：NT$ 1,234。 */
export function money(n: number): string {
  return 'NT$ ' + Number(n).toLocaleString('zh-Hant-TW');
}

/** 商品卡的價格標示（2026-08-25 起全站恢復顯示價格，主理人指定格式 NT$ 金額）：
 *  多規格不同價的品項（price_max > price）顯示「NT$ 最低價 起」；
 *  完售品項不標價格（由呼叫端判斷 status 後不傳入），當作歷年作品展示。 */
export function priceLabel(price: number, priceMax?: number | null): string {
  return money(price) + (priceMax && priceMax > price ? ' 起' : '');
}

/** JSON 內的資源路徑（images/…、assets/…）補成根路徑，
 *  避免在 /hamu 這類路由下相對路徑解析錯誤。 */
export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return '/' + path;
}

const PRODUCT_IMG_DIR = 'assets/images/products/';

/** 商品相簿的縮圖版（彈窗縮圖列用）：assets/images/products/… → …/products/thumbs/…
 *  小圖由 scripts/sync-myship-gallery.py 產生（200px）。萬一某張還沒產出，
 *  模板的 onerror 會退回原圖，不會出現破圖。 */
export function thumbUrl(path: string): string {
  if (!path) return path;
  const rel = path.replace(/^\//, '');
  if (!rel.startsWith(PRODUCT_IMG_DIR)) return assetUrl(path);
  return assetUrl(PRODUCT_IMG_DIR + 'thumbs/' + rel.slice(PRODUCT_IMG_DIR.length));
}


/** 舊版 .html 連結轉成 Angular 路由
 *（content/site.json 由後台編輯，裡面可能仍寫 hamu.html 這種舊格式） */
export function routeFromLegacy(link: string | null | undefined): string {
  if (!link) return '/';
  if (/^(https?:)?\/\//.test(link)) return link; // 外部連結原樣保留
  const clean = link.replace(/\.html$/, '');
  if (clean === '' || clean === 'index' || clean === '.') return '/';
  return clean.startsWith('/') ? clean : '/' + clean;
}
