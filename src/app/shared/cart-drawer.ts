import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUY_URL, IG_DM_URL, LINE_URL, THREADS_URL, assetUrl, money } from '../core/brand';
import { CartService, MAX_QTY } from '../core/cart.service';
import { KeepBrandPipe } from '../core/text';

/** 購物袋側欄（全站唯一一份，掛在 App 根版型；2026-08-26 主理人指定，
 *  給海外／香港顧客「一鍵結單」用）。由導覽列購物袋 icon 開啟，右側滑出：
 *  清單（縮圖＋名稱＋款式＋單價＋數量加減＋刪除）→ 件數與預估總金額 →
 *  「一鍵複製訂單明細」＋ LINE／IG／Threads 私訊客服快捷鈕（點擊時會順手
 *  把明細複製好，顧客開啟對話直接貼上）。沒有金流：現貨／預購與最終金額
 *  由客服確認。本元件同時負責顯示全站共用的 Toast 小提示。 */
@Component({
  selector: 'pl-cart-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KeepBrandPipe],
  template: `
    <div class="cart-drawer" [class.is-open]="cart.drawerOpen()" [attr.aria-hidden]="cart.drawerOpen() ? 'false' : 'true'">
      <div class="cart-backdrop" (click)="cart.closeDrawer()"></div>
      <aside class="cart-panel" role="dialog" aria-modal="true" aria-label="購物袋">
        <div class="cart-head">
          <h3>購物袋</h3>
          <button class="cart-close" #closeBtn type="button" aria-label="關閉購物袋" (click)="cart.closeDrawer()">✕</button>
        </div>

        @if (!cart.lines().length) {
          <div class="cart-empty">
            <p>購物袋還空空的，去替寶寶挑幾件衣裳吧！</p>
            <a routerLink="/shop" class="cart-empty-link" (click)="cart.closeDrawer()">前往娃衣選品 →</a>
          </div>
        } @else {
          <div class="cart-list">
            @for (line of cart.lines(); track line.pid + '｜' + line.variant) {
              <div class="cart-line">
                <img class="cart-thumb" [src]="asset(line.image)" [alt]="line.name" loading="lazy" />
                <div class="cart-line-info">
                  <div class="cart-line-name">{{ line.name | keepBrand }}</div>
                  @if (line.variant && line.variant !== '單一規格') {
                    <div class="cart-line-variant">款式：{{ line.variant }}</div>
                  }
                  <div class="cart-line-price">{{ price(line.price) }}</div>
                  <div class="cart-line-actions">
                    <div class="qty-stepper qty-stepper--small" aria-label="數量">
                      <button type="button" aria-label="減少數量" (click)="cart.changeQty(line.pid, line.variant, -1)">−</button>
                      <span class="qty-num">{{ line.qty }}</span>
                      <button type="button" aria-label="增加數量" [disabled]="line.qty >= MAX_QTY" (click)="cart.changeQty(line.pid, line.variant, 1)">＋</button>
                    </div>
                    <button type="button" class="cart-line-remove" aria-label="移除這個品項" (click)="cart.remove(line.pid, line.variant)">刪除</button>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="cart-foot">
            <div class="cart-total-row">
              <span>共 {{ cart.count() }} 件商品</span>
              <span class="cart-total">預估總金額 <strong>{{ price(cart.total()) }}</strong></span>
            </div>
            <button type="button" class="cart-copy-btn" (click)="copyOrder()">一鍵複製訂單明細</button>
            <p class="cart-hint">複製後私訊我們，客服會確認現貨／預購狀態、寄送日期與最終金額。</p>
            <div class="cart-social-row">
              <a class="cart-social cart-social--line" [href]="LINE_URL" target="_blank" rel="noopener" (click)="copyForSocial()">LINE 客服</a>
              <a class="cart-social cart-social--ig" [href]="IG_DM_URL" target="_blank" rel="noopener" (click)="copyForSocial()">IG 私訊</a>
              <a class="cart-social cart-social--threads" [href]="THREADS_URL" target="_blank" rel="noopener" (click)="copyForSocial()">Threads</a>
            </div>
            <a class="cart-buy-link" [href]="BUY_URL" target="_blank" rel="noopener">習慣逐項下單？前往 7-11 賣貨便 →</a>
          </div>
        }
      </aside>
    </div>

    <!-- 全站共用 Toast（加入購物袋、複製明細都用這個） -->
    @if (cart.toast(); as t) {
      <div class="pl-toast" role="status">{{ t }}</div>
    }
  `,
})
export class CartDrawer {
  readonly cart = inject(CartService);
  readonly MAX_QTY = MAX_QTY;
  readonly LINE_URL = LINE_URL;
  readonly IG_DM_URL = IG_DM_URL;
  readonly THREADS_URL = THREADS_URL;
  readonly BUY_URL = BUY_URL;

  private closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  constructor() {
    // 開啟時鎖住頁面捲動＋把焦點移到關閉鈕（比照商品詳情視窗）
    effect(() => {
      const open = this.cart.drawerOpen();
      document.body.classList.toggle('cart-open', open);
      if (open) queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
    });
  }

  asset(path: string): string {
    return assetUrl(path);
  }

  price(n: number): string {
    return money(n);
  }

  /** 按鈕 A：一鍵複製訂單明細 */
  async copyOrder(): Promise<void> {
    const ok = await this.copyText(this.cart.orderText());
    this.cart.showToast(ok ? '已複製訂單明細！' : '複製失敗，請截圖購物袋內容給客服');
  }

  /** 私訊快捷鈕：連結照常開新分頁，同時把明細複製好讓顧客直接貼上 */
  copyForSocial(): void {
    void this.copyText(this.cart.orderText()).then((ok) => {
      this.cart.showToast(ok ? '明細已複製，開啟對話後貼上就可以囉！' : '請先按「一鍵複製訂單明細」再貼給客服');
    });
  }

  /** 複製到剪貼簿：新式 API 失敗時退回舊招（隱形文字框＋execCommand） */
  private async copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* 繼續嘗試舊方法 */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cart.drawerOpen()) this.cart.closeDrawer();
  }
}
