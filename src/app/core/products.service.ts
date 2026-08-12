import { Injectable, signal } from '@angular/core';

/** content/products-store.json（由 scripts/build-products-json.py 產出，勿手改） */
export interface StoreVariant {
  supply: '現貨' | '預購';
  name: string;
  in_stock: boolean;
  image: string | null;
}

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  tags?: string[];
  price: number;
  original_price: number;
  on_sale: boolean;
  sale_label: string | null;
  status: 'available' | 'sold_out';
  body_included: boolean;
  image: string;
  variants: StoreVariant[];
  description?: string | null;
  reminder?: string | null;
}

export interface StoreCatalog {
  categories: { key: string; label: string }[];
  items: StoreItem[];
}

/** content/products-picnic.json（首頁野餐企劃專區；後台可編輯）。
 *  store_id 有值＝既有選品（點卡片開選品詳情視窗）；
 *  status: coming_soon＝尚未到貨預告品項（Coming Soon 佔位圖＋停用購買按鈕）。 */
export interface PicnicItem {
  id: string;
  store_id?: string;
  name: string;
  price: number | null;
  image: string;
  status: 'available' | 'coming_soon';
  note?: string;
  description?: string;
}

/** 商品資料載入器：各 JSON 載一次（進入頁面時才載入，結果快取共用）。 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  /** 娃衣選品目錄（47 項真實商品，商品詳情視窗也吃這份） */
  readonly storeCatalog = signal<StoreCatalog | null>(null);
  /** 選品目錄載入失敗（顯示備援訊息、導向賣貨便） */
  readonly storeFailed = signal(false);
  readonly picnicItems = signal<PicnicItem[]>([]);

  private storePromise: Promise<StoreCatalog | null> | null = null;
  private picnicPromise: Promise<void> | null = null;

  // 各 ensure 方法：成功後快取結果；失敗時把快取清空，
  // 下次進入頁面會重新嘗試載入（避免一次網路不穩就永遠載不到）。
  ensureStore(): Promise<StoreCatalog | null> {
    if (!this.storePromise) {
      this.storePromise = this.fetchJson<StoreCatalog>('/content/products-store.json').then((data) => {
        if (data && data.items && data.items.length) {
          this.storeCatalog.set(data);
          this.storeFailed.set(false);
          return data;
        }
        this.storeFailed.set(true);
        this.storePromise = null;
        return null;
      });
    }
    return this.storePromise;
  }

  ensurePicnic(): Promise<void> {
    if (!this.picnicPromise) {
      this.picnicPromise = this.fetchJson<{ items: PicnicItem[] }>('/content/products-picnic.json').then((data) => {
        if (data?.items?.length) this.picnicItems.set(data.items);
        else this.picnicPromise = null;
      });
    }
    return this.picnicPromise;
  }

  private fetchJson<T>(url: string): Promise<T | null> {
    return fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
      .catch(() => null);
  }
}
