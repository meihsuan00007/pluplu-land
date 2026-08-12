import { Injectable, inject, signal } from '@angular/core';
import { PicnicItem, ProductsService, StoreItem, StoreVariant } from './products.service';

/** 商品詳情視窗的統一顯示資料：
 *  一般選品商品（有規格）與野餐 Coming Soon 預告品項（無規格）都轉成這個格式。
 *  全站不顯示價格，所以這裡沒有價格欄位；特價資訊只留 onSale／saleLabel 小籤。 */
export interface ModalView {
  name: string;
  image: string;
  onSale: boolean;
  saleLabel: string | null;
  tags: string[];
  bodyIncluded: boolean;
  description: string | null;
  reminder: string | null;
  variants: StoreVariant[];
  soldOut: boolean;
  comingSoon: boolean;
  /** Coming Soon 品項的到貨提示（顯示在出貨說明框的位置） */
  comingSoonNote: string | null;
}

/** 商品詳情視窗（全站共用）的開關狀態。
 *  任何頁面呼叫 open(商品編號) 就會開啟視窗——首頁推薦牆、野餐專區、
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
      name: item.name,
      image: item.image,
      onSale: false,
      saleLabel: null,
      tags: [],
      bodyIncluded: true,
      description: item.description ?? null,
      reminder: null,
      variants: [],
      soldOut: false,
      comingSoon: item.status === 'coming_soon',
      comingSoonNote: item.note ?? '預計陸續到貨，敬請期待！',
    });
  }

  close(): void {
    this.product.set(null);
  }

  private fromStore(item: StoreItem): ModalView {
    return {
      name: item.name,
      image: item.image,
      onSale: item.on_sale,
      saleLabel: item.sale_label,
      tags: item.tags ?? [],
      bodyIncluded: item.body_included,
      description: item.description ?? null,
      reminder: item.reminder ?? null,
      variants: item.variants,
      soldOut: item.status === 'sold_out',
      comingSoon: false,
      comingSoonNote: null,
    };
  }
}
