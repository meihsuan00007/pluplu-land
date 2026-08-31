import { Injectable, signal } from '@angular/core';
import { SALES_API_URL } from './brand';

/** 商品名稱正規化：對照銷量時忽略空格與全半形差異（試算表手打的品名常有這類小出入）。 */
export function normalizeName(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

/** 銷量統計載入器（選品頁「熱銷排行」排序用）。
 *  資料來源是主理人 Google 帳號裡的 Apps Script 統計 API（見 docs/SALES-API-SETUP.md），
 *  只拿得到「商品名稱: 累計售出數量」，沒有任何客戶資料。
 *  讀取失敗、逾時、或網址尚未設定時，銷量一律當 0：頁面照常運作，熱銷排行退化為上架新到舊。 */
@Injectable({ providedIn: 'root' })
export class SalesService {
  /** 銷售紀錄原始品名 → 累計售出數量（歸戶到商品編號的邏輯在 core/sales-match.ts） */
  readonly sales = signal<ReadonlyMap<string, number>>(new Map());

  private promise: Promise<void> | null = null;

  /** 載入一次並快取（整個瀏覽階段共用；沒設定 API 網址就什麼都不做） */
  ensureSales(): Promise<void> {
    if (!SALES_API_URL) return Promise.resolve();
    if (!this.promise) {
      this.promise = this.load().catch(() => {
        // 失敗允許下次進頁面重試（例如一時斷網）
        this.promise = null;
      });
    }
    return this.promise;
  }

  private async load(): Promise<void> {
    // 6 秒等不到就放棄，不讓一支統計 API 拖慢整個選品頁
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(SALES_API_URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`sales api ${res.status}`);
      const data: unknown = await res.json();
      const map = new Map<string, number>();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const [name, value] of Object.entries(data as Record<string, unknown>)) {
          const qty = Number(value);
          const key = name.trim();
          if (key && Number.isFinite(qty) && qty > 0) map.set(key, (map.get(key) ?? 0) + qty);
        }
      }
      this.sales.set(map);
    } finally {
      clearTimeout(timer);
    }
  }
}
