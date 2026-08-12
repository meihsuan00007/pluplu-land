import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ProductModalService } from '../core/product-modal.service';
import { KeepBrandPipe } from '../core/text';
import { BuyButton } from './buy-button';

/** 商品卡片的顯示資料（各頁面把自己的商品資料整理成這個格式再餵進來）。
 *  2026-08-12 起全站不顯示價格（價格到賣貨便才看得到），卡片沒有價格欄位。 */
export interface ProductCardData {
  name: string;
  image: string;
  alt?: string;
  /** 左上角貼紙標籤（居家／TOP 1／分類名稱……） */
  tag?: string;
  /** 右上角特價貼紙文字（僅選品陳列架使用） */
  saleTape?: string;
  /** 情境短文 */
  note?: string;
  /** 對應 products-store.json 的商品編號；有值時點卡片會開商品詳情視窗 */
  pid?: string;
}

/** 商品卡片（全站唯一一份）：
 *  - 娃寶陳列區：tag ＋ note ＋ 購買按鈕
 *  - 首頁大家的心頭好：TOP 標籤 ＋ 購買按鈕（無 note）
 *  - 選品陳列架：shopStyle=true，分類標籤＋售完/特價貼紙，整卡可點、無購買按鈕
 *  有 pid 的卡片點擊會開啟商品詳情視窗；卡片內的購買按鈕照常外連賣貨便（不會誤開視窗）。 */
@Component({
  selector: 'pl-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuyButton, KeepBrandPipe],
  template: `
    <div
      class="product-card reveal in"
      [class.shop-card]="shopStyle()"
      [attr.role]="data().pid ? 'button' : null"
      [attr.tabindex]="data().pid ? 0 : null"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardSpace($event)"
    >
      <div class="product-photo">
        <img [src]="data().image" [alt]="data().alt || data().name" loading="lazy" />
        @if (data().tag) {
          <span class="product-tape">{{ data().tag }}</span>
        }
        @if (data().saleTape) {
          <span class="product-tape product-tape--sale">{{ data().saleTape }}</span>
        }
      </div>
      <div class="product-name">{{ data().name | keepBrand }}</div>
      @if (data().note) {
        <p class="product-note">{{ data().note | keepBrand }}</p>
      }
      @if (showBuy()) {
        <pl-buy-button variant="card" />
      }
    </div>
  `,
})
export class ProductCard {
  private modal = inject(ProductModalService);

  readonly data = input.required<ProductCardData>();
  /** 是否顯示卡片下方的「前往賣貨便下單」按鈕 */
  readonly showBuy = input(true);
  /** 選品陳列架樣式（整卡可點、頂端對齊） */
  readonly shopStyle = input(false);

  onCardClick(): void {
    const pid = this.data().pid;
    if (pid) void this.modal.open(pid);
  }

  /** 空白鍵也能開啟（比照原生按鈕行為），並擋掉頁面捲動 */
  onCardSpace(event: Event): void {
    if (!this.data().pid) return;
    event.preventDefault();
    this.onCardClick();
  }
}
