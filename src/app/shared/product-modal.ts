import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { assetUrl, money } from '../core/brand';
import { ModalView, ProductModalService } from '../core/product-modal.service';

/** 商品詳情視窗（全站唯一一份，放在 App 根版型）。
 *  定位是「品牌作品圖鑑」（2026-08-13 主理人指定；2026-08-17 起連導購按鈕、
 *  購物須知連結與「特價」小籤也一併移除）：展示名稱、系列籤、敘述與多圖照片，
 *  不顯示現貨／預購／售完／特價任何狀態字樣與出貨時程，也沒有購買按鈕；
 *  購買一律走頁面上其他導購入口（導覽列、頁尾、各區塊按鈕）到賣貨便。
 *  價格（2026-08-25 主理人指定「款式切換連動價格」）：標題下方顯示目前選中
 *  款式的「NT$ 金額」，點款式籤即時切換；完售款式與未定價款式不顯示價格，
 *  整項完售的歷史展示品完全沒有價格列（版面高度有保留，切換不跳動）。
 *  由 ProductModalService 控制開關；點款式籤可切換照片：
 *  款式若有專屬圖片（variants[].image）主圖會淡入切換，沒有就退回商品主圖。
 *  Coming Soon 預告品項：無款式，只顯示到貨提示框。 */
@Component({
  selector: 'pl-product-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop-modal" [class.is-open]="product()" [attr.aria-hidden]="product() ? 'false' : 'true'">
      <div class="shop-modal-backdrop" (click)="close()"></div>
      <div class="shop-modal-panel" #panel role="dialog" aria-modal="true" aria-label="商品詳情">
        <button class="shop-modal-close" #closeBtn type="button" aria-label="關閉商品詳情" (click)="close()">✕</button>
        <div class="modal-grid">
          @if (product(); as p) {
            <!-- 作品圖鑑定位：完售品項與販售中完全同樣呈現（不灰階、無售完字樣），
                 像展覽歷年作品；購買細節到賣貨便才看得到 -->
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
              @if (hasAnyPrice()) {
                <!-- 價格列跟著選中的款式連動；款式完售時內容留空但高度保留，切換不跳動 -->
                <div class="modal-price">{{ priceText() ?? '' }}</div>
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
                <span class="variant-label">款式（{{ p.variants.length }} 款）</span>
                <div class="variant-list">
                  <!-- 圖鑑化：款式籤只用來切換照片，不標現貨／預購／售完狀態 -->
                  @for (v of p.variants; track $index) {
                    <button
                      type="button"
                      class="variant-btn"
                      [class.is-selected]="selectedIdx() === $index"
                      (click)="select($index)"
                    >
                      {{ v.name }}
                    </button>
                  }
                </div>
              }
              @if (p.comingSoon && p.comingSoonNote) {
                <div class="ship-info">{{ p.comingSoonNote }}</div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductModal {
  private modal = inject(ProductModalService);

  readonly product = this.modal.product;
  readonly selectedIdx = signal(-1);

  /** 這個商品是否有任何「販售中且有定價」的款式（整項完售的歷史展示品＝false，完全不出價格列） */
  readonly hasAnyPrice = computed(() => {
    const p = this.product();
    return !!p && p.variants.some((v) => v.in_stock && v.price != null);
  });

  /** 目前選中款式的價格標示；完售或未定價的款式回傳 null（價格列留空） */
  readonly priceText = computed(() => {
    const v = this.product()?.variants[this.selectedIdx()];
    return v && v.in_stock && v.price != null ? money(v.price) : null;
  });
  readonly mediaSrc = signal('');
  readonly mediaAlt = signal('');
  readonly mediaOpacity = signal<string | null>(null);

  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  constructor() {
    // 開啟／關閉時：鎖住頁面捲動、重設規格選擇、把焦點移到關閉鈕。
    // resetFor 要用 untracked 包住：它的呼叫鏈會讀 mediaSrc()（swapMedia 的防重判斷），
    // 若被 effect 追蹤，規格圖預載完成寫入 mediaSrc 時 effect 會重跑、把主圖蓋回去，
    // 造成規格切圖永遠不生效的無限循環。
    effect(() => {
      const p = this.product();
      document.body.classList.toggle('modal-open', !!p);
      if (!p) return;
      untracked(() => this.resetFor(p));
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
    // 圖鑑化：不分庫存狀態，一律預選第一個款式（款式籤只負責切換照片）
    if (p.variants.length) this.select(0);
    else this.selectedIdx.set(-1);
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
