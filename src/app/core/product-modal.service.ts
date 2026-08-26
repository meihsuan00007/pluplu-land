import { Injectable, inject, signal } from '@angular/core';
import { PicnicItem, ProductsService, StoreItem, StoreVariant } from './products.service';

/** 商品詳情視窗的統一顯示資料：
 *  一般選品商品（有款式）與野餐 Coming Soon 預告品項（無款式）都轉成這個格式。
 *  彈窗是作品圖鑑，但 2026-08-25 起顯示「跟著款式走」的價格（variants[].price，
 *  完售款式與未定價款式不顯示）；仍然沒有特價欄位，「特價」標籤也會從 tags 過濾掉。 */
export interface ModalView {
  /** products-store.json 的商品編號（加入購物袋用；Coming Soon 預告品項為 null） */
  id: string | null;
  name: string;
  image: string;
  tags: string[];
  bodyIncluded: boolean;
  description: string | null;
  reminder: string | null;
  variants: StoreVariant[];
  comingSoon: boolean;
  /** Coming Soon 品項的到貨提示（顯示在出貨說明框的位置） */
  comingSoonNote: string | null;
}

/** 商品詳情視窗（全站共用）的開關狀態。
 *  任何頁面呼叫 open(商品編號) 就會開啟視窗：首頁推薦牆、野餐專區、
 *  娃寶陳列區、選品陳列架都是走這一條路。 */
@Injectable({ providedIn: 'root' })
export class ProductModalService {
  private products = inject(ProductsService);

  /** 目前開啟的商品，null = 視窗關閉 */
  readonly product = signal<ModalView | null>(null);

  /** 開啟選品商品（id 對應 products-store.json 的商品編號） */
  async open(id: string): Promise<void> {
    const catalog = await this.products.ensureStore();
    const item = catalog?.items.find((p) => p.id === id);
    if (item) this.product.set(this.fromStore(item));
  }

  /** 開啟野餐企劃品項：有 store_id 走選品詳情，Coming Soon 顯示預告內容 */
  async openPicnic(item: PicnicItem): Promise<void> {
    if (item.store_id) {
      await this.open(item.store_id);
      return;
    }
    this.product.set({
      id: null,
      name: item.name,
      image: item.image,
      tags: [],
      bodyIncluded: true,
      description: item.description ?? null,
      reminder: null,
      variants: [],
      comingSoon: item.status === 'coming_soon',
      comingSoonNote: item.note ?? '預計陸續到貨，敬請期待！',
    });
  }

  close(): void {
    this.product.set(null);
  }

  private fromStore(item: StoreItem): ModalView {
    return {
      id: item.id,
      name: item.name,
      image: item.image,
      // 「特價」是 build 腳本依售價自動加的狀態籤，圖鑑彈窗不顯示（選品卡片的特價貼紙照舊）
      tags: (item.tags ?? []).filter((t) => t !== '特價'),
      bodyIncluded: item.body_included,
      description: item.description ?? null,
      reminder: item.reminder ?? null,
      variants: item.variants,
      comingSoon: false,
      comingSoonNote: null,
    };
  }
}
