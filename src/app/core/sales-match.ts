import { StoreItem } from './products.service';
import { normalizeName } from './sales.service';

/** 手動對照表：銷售紀錄的「簡稱」→ 官網商品編號。
 *  只放自動規則對不到、但人工已確認的品項（依 2026-08-31 銷售紀錄快照）：
 *  - 天使睡衣套裝：官網全名是「😴好眠套組（睡衣＆懶骨頭可拆買）」，款式「粉藍天使睡衣」可佐證
 *  - 鼠鼠遮陽草帽：官網歸在「野餐出遊套組」，款式「遮陽草帽（鼠鼠尺寸）」可佐證
 *  其他對不上的品項清單見 docs/SALES-NAME-REVIEW.md（待主理人確認後加進來）。 */
export const SALES_ALIASES: Readonly<Record<string, string>> = {
  天使睡衣套裝: '03',
  鼠鼠遮陽草帽: '18',
  // 名稱小出入但可確認是同一件商品（官網名稱 vs 紀錄簡稱）：
  '【織女手工系列】毛茸茸兔耳帽': '02', // 官網「毛茸茸『訂做』兔耳帽」
  '【韓國直送】針織相機包': '17', // 官網「探險寶寶套組：針織相機包」
  '【韓國直送】托特包': '44', // 官網「蘋果托特包，可斜背」
  小香披肩: '38', // 官網「小香風披肩，內有兩款」
  細閃燈芯絨斗篷: '21', // 官網「細閃燈芯絨洋裝/斗篷」
};

/** 對照用的寬鬆正規化：在 normalizeName（去空格、全半形、大小寫）之上再拿掉表情符號，
 *  「爆米花 - 咖」才對得上官網款式「爆米花 - 咖🤎」。 */
export function looseName(name: string): string {
  return normalizeName(name).replace(/[\p{Extended_Pictographic}️‍]/gu, '');
}

type MatchItem = Pick<StoreItem, 'id' | 'name' | 'variants'>;

/** 把銷售紀錄（品名 → 累計數量）歸戶到官網商品編號。
 *  試算表的品名是「簡稱＋款式」記法（如「鼠仔 - 黃豆米」「眼鏡 - 4.5cm - 透棕框」），
 *  與官網正式商品名不同，依序用這些規則對照（全部比對都用 looseName）：
 *  1. 與某個商品的「正式名稱」一字不差
 *  2. 與某個商品的「款式名稱」一字不差（眼鏡、墨鏡都是這樣對上的）
 *  3. 段落倒過來與款式一字不差（紀錄「鼠仔 - 黃豆米」＝官網款式「黃豆米鼠仔」）
 *  4. 去掉第一段後與款式一字不差（紀錄「迷你配件 - 珍珠奶茶」＝款式「珍珠奶茶」）
 *  5. 紀錄名以某個商品全名開頭（取最長的那個：「公主紗肩帶小香風洋裝 - 黑」
 *     同時包含「小香風洋裝」，要對到全名較長的公主紗那款）
 *  6. 段落累進包含：從多到少取前幾段，全部段落都出現在「唯一一個」商品名裡就對上
 *    （「眼鏡 - 6cm - 漸層粉黃」是已下架款式，但「眼鏡」＋「6cm」只有 6cm 那款商品同時包含）
 *  7. 手動對照表 SALES_ALIASES（用第一段簡稱查）
 *  8. 第一段簡稱與「唯一一個」商品名互相包含（對到多個＝有歧義，寧可不計）
 *  對不到的品名安靜跳過（多為已下架品、折價券、代購等非官網品項），銷量當 0。 */
export function buildSalesById(
  entries: ReadonlyMap<string, number>,
  items: readonly MatchItem[],
): Map<string, number> {
  const nameList = items.map((it) => ({ id: it.id, n: looseName(it.name) }));
  const byName = new Map(nameList.map(({ n, id }) => [n, id]));
  // 款式名 → 商品編號；同名款式出現在多個商品時記為 null（有歧義不對照）
  const byVariant = new Map<string, string | null>();
  for (const it of items) {
    for (const v of it.variants ?? []) {
      const n = looseName(v.name);
      if (!n || n === '單一規格') continue;
      byVariant.set(n, byVariant.has(n) && byVariant.get(n) !== it.id ? null : it.id);
    }
  }
  const aliases = new Map(Object.entries(SALES_ALIASES).map(([k, id]) => [looseName(k), id]));

  const totals = new Map<string, number>();
  for (const [rawName, qty] of entries) {
    if (!(qty > 0)) continue;
    const id = matchOne(rawName);
    if (id) totals.set(id, (totals.get(id) ?? 0) + qty);
  }
  return totals;

  function matchOne(rawName: string): string | null {
    const full = looseName(rawName);
    const segs = rawName
      .split(' - ')
      .map((s) => s.trim())
      .filter(Boolean);

    const direct = byName.get(full);
    if (direct) return direct;

    const variantHit = byVariant.get(full);
    if (variantHit) return variantHit;

    if (segs.length > 1) {
      const reversed = byVariant.get(looseName(segs.slice().reverse().join('')));
      if (reversed) return reversed;
      const tail = byVariant.get(looseName(segs.slice(1).join(' - ')));
      if (tail) return tail;
    }

    let best: { id: string; len: number } | null = null;
    let tie = false;
    for (const { id, n } of nameList) {
      if (n.length >= 2 && full.startsWith(n)) {
        if (!best || n.length > best.len) {
          best = { id, len: n.length };
          tie = false;
        } else if (n.length === best.len && id !== best.id) {
          tie = true;
        }
      }
    }
    if (best && !tie) return best.id;

    // 段落累進包含：前幾段（至少兩段）全部出現在唯一一個商品名裡
    for (let k = Math.min(segs.length, 3); k >= 2; k--) {
      const parts = segs.slice(0, k).map(looseName).filter((p) => p.length >= 2);
      if (parts.length < 2) continue;
      const hits = new Set<string>();
      for (const { id, n } of nameList) {
        if (parts.every((p) => n.includes(p))) hits.add(id);
      }
      if (hits.size === 1) return [...hits][0];
    }

    const base = looseName(segs[0] ?? '');
    const alias = aliases.get(base);
    if (alias) return alias;

    if (base.length >= 2) {
      const hits = new Set<string>();
      for (const { id, n } of nameList) {
        if (n.includes(base) || base.includes(n)) hits.add(id);
      }
      if (hits.size === 1) return [...hits][0];
    }
    return null;
  }
}
