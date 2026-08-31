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

/** 一件商品可以拿來當封面的照片：**只用主圖**（相簿第一張），不從整本相簿抽。
 *  2026-08-31 主理人指定：相簿裡有白底單品照、局部細節特寫這類不適合當封面的照片，
 *  只認主圖就不會抽到它們。主圖沒填時退而用相簿第一張。 */
function coverShotsOf(it: StoreItem): string[] {
  const main = it.image || it.gallery?.[0];
  return main ? [main] : [];
}

/** 該方塊的候選商品：屬於這個分類、而且真的有主圖可以當封面的品項 */
function candidatesOf(items: readonly StoreItem[], kind: CoverKind): StoreItem[] {
  return itemsOf(items, kind).filter((it) => coverShotsOf(it).length > 0);
}

/** 該方塊的封面照片庫（每件商品出一張主圖，重複的只留一張）。給測試與除錯看用。 */
export function coverPool(items: readonly StoreItem[], kind: CoverKind): string[] {
  const pool = new Set<string>();
  for (const it of candidatesOf(items, kind)) {
    for (const src of coverShotsOf(it)) pool.add(src);
  }
  return [...pool];
}

/** 亂數轉成陣列索引（rand 剛好回傳 1 時不會超出範圍） */
function indexOf(rand: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(rand() * length));
}

/** 隨機抽一張封面。**先平均抽一件商品、再從那件商品的封面照片裡抽一張**
 *（2026-08-31 主理人指定：照片多的商品不會因此被抽中的機率變高，每件商品露臉機會均等）。
 *  該分類暫時沒有可用商品時回傳 null，由呼叫端沿用後台設定的預設封面。
 *  rand 可注入（測試用固定亂數）。 */
export function pickCover(
  items: readonly StoreItem[],
  kind: CoverKind,
  rand: () => number = Math.random,
): string | null {
  const candidates = candidatesOf(items, kind);
  if (!candidates.length) return null;
  const shots = coverShotsOf(candidates[indexOf(rand, candidates.length)]!);
  return shots[indexOf(rand, shots.length)] ?? null;
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
