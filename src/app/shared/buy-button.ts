import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BUY_URL } from '../core/brand';
import { CartIcon } from './icons';

/** 「前往賣貨便下單」按鈕（全站購買導流的唯一元件）。
 *  三種外觀，網址一律來自 core/brand.ts 的 BUY_URL：
 *  - hero    ：內頁頁首的棕色實心按鈕
 *  - capsule ：頁尾的橘色膠囊按鈕（含購物車 icon）
 *  - card    ：商品卡下方的玫瑰色小按鈕（含購物車 icon）
 *  card 變體會擋下點擊與 Enter 鍵冒泡，避免觸發商品卡的「開啟詳情視窗」
 *（鍵盤焦點在按鈕上按 Enter 時，瀏覽器會自己開連結，不能再讓卡片也開彈窗）。 */
@Component({
  selector: 'pl-buy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CartIcon],
  template: `
    @switch (variant()) {
      @case ('hero') {
        <a [href]="BUY_URL" class="btn solid" target="_blank" rel="noopener">{{ label() }}</a>
      }
      @case ('capsule') {
        <a [href]="BUY_URL" class="buy-btn" target="_blank" rel="noopener"><pl-icon-cart />{{ label() }}</a>
      }
      @case ('card') {
        <a
          [href]="BUY_URL"
          class="product-buy"
          target="_blank"
          rel="noopener"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          ><pl-icon-cart />{{ label() }}</a
        >
      }
    }
  `,
})
export class BuyButton {
  readonly BUY_URL = BUY_URL;
  readonly variant = input<'hero' | 'capsule' | 'card'>('hero');
  readonly label = input('前往賣貨便下單');
}
