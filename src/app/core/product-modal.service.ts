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
  /** 彈窗輪播的完整相簿（含各顏色實拍、情境搭配與細節圖）；第一張固定是主圖。
   *  Coming Soon 預告品項只有主圖一張。 */
  gallery: string[];
  /** 開啟時要停在相簿的哪一張（野餐專區點某張卡片時用；沒有就從主圖開始） */
  focusImage: string | null;
  /** 開啟時要優先選中的款式名稱（同一張照片被多款共用時用來選對那一款） */
  focusVariant: string | null;
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

  /** 開啟選品商品（id 對應 products-store.json 的商品編號）。
   *  focusImage：指定要停在相簿裡的哪一張（例如首頁野餐專區點的就是那張照片）。 */
  async open(id: string, focusImage?: string, focusVariant?: string): Promise<void> {
    const catalog = await this.products.ensureStore();
    const item = catalog?.items.find((p) => p.id === id);
    if (!item) return;
    this.product.set({
      ...this.fromStore(item),
      focusImage: focusImage ?? null,
      focusVariant: focusVariant ?? null,
    });
  }

  /** 開啟野餐企劃品項：有 store_id 走選品詳情，Coming Soon 顯示預告內容 */
  async openPicnic(item: PicnicItem): Promise<void> {
    if (item.store_id) {
      // 帶著卡片上的那張照片與品名進去：彈窗才會停在同一張照片、
      // 並且在一張照片被多個款式共用時（例如 #18 的草帽與紅色小布包）選對款式與價格
      await this.open(item.store_id, item.image, item.name);
      return;
    }
    this.product.set({
      id: null,
      name: item.name,
      image: item.image,
      gallery: [item.image],
      focusImage: null,
      focusVariant: null,
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
      gallery: item.gallery?.length ? item.gallery : [item.image],
      focusImage: null,
      focusVariant: null,
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
