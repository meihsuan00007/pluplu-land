import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUY_URL, assetUrl, money } from '../core/brand';
import { ModalView, ProductModalService } from '../core/product-modal.service';

const SHIP_TEXT: Record<string, string> = {
  現貨: '現貨規格｜下單後 3–10 個工作天出貨',
  預購: '預購規格｜下單即叫貨，約 10–20 天出貨，不接急單',
};
const SOLDOUT_TEXT = '這個品項已經全數售完，若想蹲補貨消息，歡迎加 LINE（@plupluland_tw）問問。';

/** 商品詳情視窗（全站唯一一份，放在 App 根版型）。
 *  由 ProductModalService 控制開關；規格選擇會連動出貨時間說明，
 *  規格若有專屬圖片（variants[].image）主圖會淡入切換，沒有就退回商品主圖。
 *  Coming Soon 預告品項：無價格、無規格，購買按鈕停用顯示「即將開賣」。 */
@Component({
  selector: 'pl-product-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="shop-modal" [class.is-open]="product()" [attr.aria-hidden]="product() ? 'false' : 'true'">
      <div class="shop-modal-backdrop" (click)="close()"></div>
      <div class="shop-modal-panel" #panel role="dialog" aria-modal="true" aria-label="商品詳情">
        <button class="shop-modal-close" #closeBtn type="button" aria-label="關閉商品詳情" (click)="close()">✕</button>
        <div class="modal-grid">
          @if (product(); as p) {
            <!-- 完售品項不做灰階與售完貼紙（主理人指定：像展示歷年作品一樣正常呈現），
                 售完資訊由下方的規格狀態、補貨說明與「已售完」按鈕傳達 -->
            <div class="modal-media">
              <img [src]="mediaSrc()" [alt]="mediaAlt()" [style.opacity]="mediaOpacity()" />
            </div>
            <div class="modal-info">
              @if (p.tags.length) {
                <div class="tag-chips">
                  @for (t of p.tags; track $index) {
                    <span class="tag-chip">{{ t }}</span>
                  }
                </div>
              }
              <h3>{{ p.name }}</h3>
              @if (p.price !== null) {
                <div class="modal-price">
                  @if (p.onSale) {
                    <span class="price-sale">{{ money(p.price) }}</span>
                    <del class="price-original">{{ money(p.originalPrice) }}</del>
                    <span class="sale-chip">{{ p.saleLabel || '特價' }}</span>
                  } @else {
                    {{ money(p.price) }}
                  }
                </div>
              }
              @if (!p.bodyIncluded) {
                <p class="note-nobody">＊此品項不含娃寶本體，僅含衣裝／配件本身。</p>
              }
              @if (p.description) {
                <p class="modal-desc">{{ p.description }}</p>
              }
              @if (p.reminder) {
                <div class="reminder-box">小提醒｜{{ p.reminder }}</div>
              }
              @if (p.variants.length) {
                <span class="variant-label">規格（{{ p.variants.length }} 款）</span>
                <div class="variant-list">
                  @for (v of p.variants; track $index) {
                    <button
                      type="button"
                      class="variant-btn"
                      [class.is-soldout]="!v.in_stock"
                      [class.is-selected]="selectedIdx() === $index"
                      [disabled]="!v.in_stock"
                      [attr.aria-disabled]="v.in_stock ? null : 'true'"
                      (click)="select($index)"
                    >
                      <span class="variant-supply" [class.variant-supply--pre]="v.supply === '預購'">{{ v.supply }}</span>
                      {{ v.name }}
                      @if (!v.in_stock) {
                        <span class="variant-oos">售完</span>
                      }
                    </button>
                  }
                </div>
              }
              <div class="ship-info" [class.is-soldout]="shipSoldOut()">{{ shipText() }}</div>
              <div class="modal-actions">
                @if (p.comingSoon) {
                  <span class="btn solid is-disabled" aria-disabled="true">即將開賣</span>
                } @else if (p.soldOut) {
                  <span class="btn solid is-disabled" aria-disabled="true">已售完</span>
                } @else {
                  <a class="btn solid" [href]="BUY_URL" target="_blank" rel="noopener">前往賣貨便選購</a>
                }
                <a class="notice-link" routerLink="/notice" (click)="close()">購物須知・退換貨規則</a>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductModal {
  private modal = inject(ProductModalService);

  readonly BUY_URL = BUY_URL;
  readonly money = money;

  readonly product = this.modal.product;
  readonly selectedIdx = signal(-1);
  readonly mediaSrc = signal('');
  readonly mediaAlt = signal('');
  readonly mediaOpacity = signal<string | null>(null);

  readonly shipSoldOut = computed(() => {
    const p = this.product();
    return !!p && !p.comingSoon && this.selectedIdx() < 0;
  });
  readonly shipText = computed(() => {
    const p = this.product();
    if (!p) return '';
    if (p.comingSoon) return p.comingSoonNote ?? '';
    const idx = this.selectedIdx();
    if (idx < 0) return SOLDOUT_TEXT;
    return SHIP_TEXT[p.variants[idx].supply] ?? '';
  });

  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  constructor() {
    // 開啟／關閉時：鎖住頁面捲動、重設規格選擇、把焦點移到關閉鈕
    effect(() => {
      const p = this.product();
      document.body.classList.toggle('modal-open', !!p);
      if (!p) return;
      this.resetFor(p);
      queueMicrotask(() => {
        const panel = this.panel()?.nativeElement;
        if (panel) panel.scrollTop = 0;
        this.closeBtn()?.nativeElement.focus();
      });
    });
  }

  private resetFor(p: ModalView): void {
    this.mediaSrc.set(assetUrl(p.image));
    this.mediaAlt.set(p.name);
    this.mediaOpacity.set(null);
    const firstInStock = p.variants.findIndex((v) => v.in_stock);
    if (p.soldOut || firstInStock === -1) {
      this.selectedIdx.set(-1);
    } else {
      this.select(firstInStock);
    }
  }

  select(idx: number): void {
    const p = this.product();
    if (!p) return;
    this.selectedIdx.set(idx);
    const v = p.variants[idx];
    const src = assetUrl(v.image || p.image);
    const alt = v.image ? `${p.name}｜${v.name}` : p.name;
    this.swapMedia(src, alt);
  }

  /** 主圖淡入切換：先預載新圖，載好才換上，避免閃爍（沿用原 shop.js 行為） */
  private swapMedia(src: string, alt: string): void {
    if (this.mediaSrc() === src) {
      this.mediaAlt.set(alt);
      return;
    }
    this.mediaOpacity.set('0');
    const pre = new Image();
    pre.onload = () => {
      this.mediaSrc.set(src);
      this.mediaAlt.set(alt);
      this.mediaOpacity.set('1');
    };
    pre.onerror = () => this.mediaOpacity.set('1');
    pre.src = src;
  }

  close(): void {
    this.modal.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.product()) this.close();
  }
}
