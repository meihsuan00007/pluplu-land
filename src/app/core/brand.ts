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

/** 「發限動」活動折扣金額（首頁活動區、選品頁橫幅、購物須知三處共用）。
 *  改折扣只要改這個數字，三個頁面會一起更新。 */
export const SHARE_DISCOUNT_AMOUNT = 30;
export const SHARE_DISCOUNT = `NT$${SHARE_DISCOUNT_AMOUNT}`;

/** 首頁「大家的心頭好」排行順序（對應 products-store.json 的商品編號；
 *  口水巾、眼鏡固定為第 1、2 名） */
export const FEATURED_IDS = ['31', '30', '24', '01', '02', '03', '09', '11'];

/** 金額顯示格式：NT$ 1,234 */
export function money(n: number): string {
  return 'NT$ ' + Number(n).toLocaleString('zh-Hant-TW');
}

/** JSON 內的資源路徑（images/…、assets/…）補成根路徑，
 *  避免在 /hamu 這類路由下相對路徑解析錯誤。 */
export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return '/' + path;
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
