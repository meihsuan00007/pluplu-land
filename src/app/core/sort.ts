/** 選品陳列架的排序（2026-08-31 主理人指定，四種＋熱銷排行）。
 *  「上架順序」＝商品目錄 JSON 的原始順序（建檔順序，越後面越新）；
 *  「價格」只排「販售中且有定價」的品項，完售的歷年作品與未定價品一律排在最後（維持原本相對順序）；
 *  「熱銷排行」依銷量統計 API（core/sales.service.ts）由多到少，銷量相同時上架新的在前，
 *  讀不到銷量（斷網、尚未部署 API）時全部當 0，自然退化成上架新到舊。 */
export type SortKey = 'old' | 'new' | 'price-asc' | 'price-desc' | 'hot';

export const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'old', label: '上架順序：由舊到新' },
  { key: 'new', label: '上架順序：由新到舊' },
  { key: 'hot', label: '熱銷排行：銷量由多到少' },
  { key: 'price-asc', label: '價格：由低到高' },
  { key: 'price-desc', label: '價格：由高到低' },
];

/** 預設排序＝目錄原始順序（與 2026-08-31 之前的陳列架完全相同，不改變既有觀感） */
export const DEFAULT_SORT: SortKey = 'old';

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((o) => o.key === value);
}

interface Sortable {
  price?: number | null;
  status?: string;
}

/** 可以拿來比價的品項：販售中、有定價 */
function sellable(it: Sortable): boolean {
  return it.status === 'available' && typeof it.price === 'number' && Number.isFinite(it.price);
}

/** 回傳排序後的新陣列（不改動原陣列）；同價位維持原本先後（穩定排序）。
 *  salesOf：查某品項累計銷量的函式（熱銷排行用；不給或查不到一律當 0）。 */
export function sortItems<T extends Sortable>(
  items: readonly T[],
  key: SortKey,
  salesOf?: (item: T) => number,
): T[] {
  const list = items.slice();
  switch (key) {
    case 'old':
      return list;
    case 'new':
      return list.reverse();
    case 'hot': {
      // 銷量由多到少；同銷量（含全部 0 的未接 API 狀態）依上架新到舊（目錄順序反過來）
      const ranked = list.map((it, i) => ({ it, i, qty: salesOf?.(it) ?? 0 }));
      ranked.sort((a, b) => b.qty - a.qty || b.i - a.i);
      return ranked.map((r) => r.it);
    }
    case 'price-asc':
    case 'price-desc': {
      const dir = key === 'price-asc' ? 1 : -1;
      const priced = list.filter(sellable);
      const rest = list.filter((it) => !sellable(it));
      // Array.prototype.sort 在現代瀏覽器是穩定的，同價位不會互相換位
      priced.sort((a, b) => ((a.price as number) - (b.price as number)) * dir);
      return [...priced, ...rest];
    }
  }
}
