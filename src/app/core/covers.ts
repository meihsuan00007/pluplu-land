import { ACCESSORY_CAT_KEY, HANDMADE_CAT_KEY, HANDMADE_TAG } from './brand';
import { StoreItem } from './products.service';

/** 首頁三大分類入口方塊的封面照片來源（2026-08-31 主理人指定：每次重新整理隨機換一張）。
 *  照片庫＝該分類所有商品的整本相簿（沒有相簿的品項就用主圖），所以新增商品或補相簿後，
 *  首頁封面自動會抽到新照片，不必再手動換圖。
 *  後台 site.json 的 banner 圖片仍然保留，當作「商品資料還沒載入完」時的預設封面。 */
export type CoverKind = 'new' | 'handmade' | 'accessory';

/** 「新品上市」方塊取樣範圍：最新上架的前 5 名商品 */
export const NEW_ARRIVAL_COUNT = 5;

/** 依方塊種類挑出對應的商品：
 *  new＝目錄最後 5 筆（建檔順序越後面越新）、handmade＝tags 含織女手工系列、accessory＝配件小物分類 */
function itemsOf(items: readonly StoreItem[], kind: CoverKind): StoreItem[] {
  switch (kind) {
    case 'new':
      return items.slice(-NEW_ARRIVAL_COUNT);
    case 'handmade':
      return items.filter((it) => (it.tags ?? []).includes(HANDMADE_TAG));
    case 'accessory':
      return items.filter((it) => it.category === ACCESSORY_CAT_KEY);
  }
}

/** 該方塊的照片庫：把符合的商品整本相簿攤平並去重（同一張照片只會被抽中一次的機率） */
export function coverPool(items: readonly StoreItem[], kind: CoverKind): string[] {
  const pool = new Set<string>();
  for (const it of itemsOf(items, kind)) {
    const shots = it.gallery?.length ? it.gallery : [it.image];
    for (const src of shots) {
      if (src) pool.add(src);
    }
  }
  return [...pool];
}

/** 從照片庫隨機抽一張當封面；照片庫是空的（資料還沒載入或該分類暫時沒商品）時回傳 null，
 *  由呼叫端沿用後台設定的預設封面。rand 可注入（測試用固定亂數）。 */
export function pickCover(
  items: readonly StoreItem[],
  kind: CoverKind,
  rand: () => number = Math.random,
): string | null {
  const pool = coverPool(items, kind);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))] ?? null;
}

/** 從方塊的連結判斷它是哪一種分類入口（後台把連結改掉時，封面來源自動跟著換）：
 *  ?cat=handmade＝織女手作系列、?cat=accessory＝配件專區，其餘一律視為新品上市。
 *  用查詢參數的完整值比對（不是找字串片段），日後多一個開頭相同的分類鍵也不會認錯。 */
export function coverKindOf(link: string | undefined): CoverKind {
  const cat = new URLSearchParams((link ?? '').split('?')[1] ?? '').get('cat');
  if (cat === HANDMADE_CAT_KEY) return 'handmade';
  if (cat === ACCESSORY_CAT_KEY) return 'accessory';
  return 'new';
}
