import { Injectable, computed, effect, signal } from '@angular/core';
import { money } from './brand';

/** 購物袋裡的一列（同商品同款式合併為一列，數量累加） */
export interface CartLine {
  /** products-store.json 的商品編號 */
  pid: string;
  name: string;
  /** 款式名稱（單一規格商品也會有，如「單一規格」） */
  variant: string;
  /** 加入當下的款式售價快照（客服會再確認，價格以確認為準） */
  price: number;
  image: string;
  qty: number;
}

const STORAGE_KEY = 'pluplu-cart-v1';
/** 單一款式的數量上限（彈窗數量選擇器與購物袋加減共用） */
export const MAX_QTY = 99;

/** 輕量購物袋（2026-08-26 主理人指定，給海外／香港顧客一鍵結單用）。
 *  沒有金流：顧客把選好的品項加進袋子 → 一鍵複製格式化明細 → 私訊客服確認
 *  現貨／預購與總金額。狀態存在瀏覽器（localStorage），重新整理不會消失。
 *  只有「販售中且有定價」的款式能加入（彈窗的加入按鈕與價格顯示同進退）。 */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.load());
  /** 購物袋側欄開關 */
  readonly drawerOpen = signal(false);
  /** 全站共用的小提示（Toast）文字，null = 隱藏 */
  readonly toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /** 袋內總件數（導覽列 icon 的數字標籤） */
  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  /** 預估總金額（台幣） */
  readonly total = computed(() => this.lines().reduce((n, l) => n + l.price * l.qty, 0));

  constructor() {
    // 內容一變就寫回 localStorage（隱私模式等寫入失敗時安靜略過，功能照常）
    effect(() => {
      const data = JSON.stringify({ lines: this.lines() });
      try {
        localStorage.setItem(STORAGE_KEY, data);
      } catch {
        /* 無法儲存時購物袋仍可用，只是重新整理會清空 */
      }
    });
  }

  /** 加入購物袋：同商品同款式已在袋中就數量累加 */
  add(line: Omit<CartLine, 'qty'>, qty: number): void {
    const n = Math.max(1, Math.min(MAX_QTY, Math.round(qty)));
    this.lines.update((lines) => {
      const i = lines.findIndex((l) => l.pid === line.pid && l.variant === line.variant);
      if (i < 0) return [...lines, { ...line, qty: n }];
      const next = [...lines];
      next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + n) };
      return next;
    });
  }

  /** 調整數量（delta = +1 / -1）；減到 0 就把該列移除 */
  changeQty(pid: string, variant: string, delta: number): void {
    this.lines.update((lines) =>
      lines
        .map((l) =>
          l.pid === pid && l.variant === variant
            ? { ...l, qty: Math.min(MAX_QTY, l.qty + delta) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  remove(pid: string, variant: string): void {
    this.lines.update((lines) => lines.filter((l) => !(l.pid === pid && l.variant === variant)));
  }

  clear(): void {
    this.lines.set([]);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  /** 顯示小提示，2.6 秒後自動消失（連續觸發時重新計時） */
  showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2600);
  }

  /** 把袋內內容整理成可直接傳給客服的純文字明細 */
  orderText(): string {
    const lines = this.lines();
    const rows = lines.map((l, i) => {
      // 單一規格商品不需要「款式：單一規格」這種贅字
      const variant = l.variant && l.variant !== '單一規格' ? `（款式：${l.variant}）` : '';
      return `${i + 1}. ${l.name}${variant} x ${l.qty} - ${money(l.price * l.qty)}`;
    });
    return [
      '【PluPlu Land 訂單確認清單】',
      ...rows,
      '----------------------------',
      `共 ${this.count()} 件商品｜預估總金額：${money(this.total())}`,
      '（請直接將此明細傳送給客服確認現貨/預購與可寄送日期）',
    ].join('\n');
  }

  private load(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw) as { lines?: unknown };
      if (!Array.isArray(data.lines)) return [];
      // 只還原欄位齊全的資料列，避免舊格式或壞資料弄壞畫面
      // （type predicate：先把每列當未知資料逐欄驗證，通過才視為 CartLine）
      const isCartLine = (l: unknown): l is CartLine => {
        const o = l as Record<string, unknown> | null;
        return (
          !!o &&
          typeof o['pid'] === 'string' &&
          typeof o['name'] === 'string' &&
          typeof o['variant'] === 'string' &&
          typeof o['image'] === 'string' &&
          typeof o['price'] === 'number' &&
          typeof o['qty'] === 'number' &&
          (o['qty'] as number) > 0
        );
      };
      // 數值收斂：數量取整並夾在 1–上限、價格不得為負（防手改 localStorage 的怪數字進到明細）
      return (data.lines as unknown[]).filter(isCartLine).map((l) => ({
        ...l,
        qty: Math.max(1, Math.min(MAX_QTY, Math.round(l.qty))),
        price: Math.max(0, l.price),
      }));
    } catch {
      return [];
    }
  }
}
