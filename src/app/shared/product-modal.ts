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
import { assetUrl, money, thumbUrl } from '../core/brand';
import { CartService, MAX_QTY } from '../core/cart.service';
import { ModalView, ProductModalService } from '../core/product-modal.service';
import { KeepBrandPipe } from '../core/text';

/** 商品詳情視窗（全站唯一一份，放在 App 根版型）。
 *  定位是「品牌作品圖鑑」（2026-08-13 主理人指定；2026-08-17 起連導購按鈕、
 *  購物須知連結與「特價」小籤也一併移除）：展示名稱、系列籤、敘述與多圖照片，
 *  不顯示現貨／預購／售完／特價任何狀態字樣與出貨時程，也沒有購買按鈕；
 *  購買一律走頁面上其他導購入口（導覽列、頁尾、各區塊按鈕）到賣貨便。
 *  價格（2026-08-25 主理人指定「款式切換連動價格」）：標題下方顯示目前選中
 *  款式的「NT$ 金額」，點款式籤即時切換；完售款式與未定價款式不顯示價格，
 *  整項完售的歷史展示品完全沒有價格列（版面高度有保留，切換不跳動）。
 *  相簿輪播（2026-08-28 主理人指定）：主圖區可瀏覽該品項的所有照片
 *  （各顏色實拍、情境搭配與細節圖），左右箭頭、下方縮圖列、鍵盤左右鍵、
 *  手機左右滑動都能切換；點款式籤會直接跳到該款式的實拍照並連動價格，
 *  反過來滑到某個款式的照片時也會把款式籤與價格切過去。
 *  Coming Soon 預告品項：只有一張主圖、無款式，只顯示到貨提示框。 */
@Component({
  selector: 'pl-product-modal',
  imports: [KeepBrandPipe],
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
            <div class="modal-gallery">
              <div
                class="modal-media"
                (touchstart)="onTouchStart($event)"
                (touchend)="onTouchEnd($event)"
              >
                <img [src]="mediaSrc()" [alt]="mediaAlt()" [style.opacity]="mediaOpacity()" />
                @if (hasCarousel()) {
                  <button class="gallery-nav gallery-nav--prev" type="button" aria-label="上一張照片" (click)="step(-1)">‹</button>
                  <button class="gallery-nav gallery-nav--next" type="button" aria-label="下一張照片" (click)="step(1)">›</button>
                  <span class="gallery-count" aria-hidden="true">{{ index() + 1 }} / {{ gallery().length }}</span>
                }
              </div>
              @if (hasCarousel()) {
                <div class="modal-thumbs" #thumbStrip role="group" aria-label="商品照片縮圖">
                  @for (t of thumbs(); track $index) {
                    <button
                      type="button"
                      class="modal-thumb"
                      [class.is-active]="index() === $index"
                      [attr.aria-label]="'第 ' + ($index + 1) + ' 張照片'"
                      [attr.aria-current]="index() === $index ? 'true' : null"
                      (click)="goTo($index)"
                    >
                      <img [src]="t.small" alt="" loading="lazy" (error)="onThumbError($event, t.full)" />
                    </button>
                  }
                </div>
              }
            </div>
            <div class="modal-info">
              @if (p.tags.length) {
                <div class="tag-chips">
                  @for (t of p.tags; track $index) {
                    <span class="tag-chip">{{ t }}</span>
                  }
                </div>
              }
              <h3>{{ p.name | keepBrand }}</h3>
              @if (hasAnyPrice()) {
                <!-- 價格列跟著選中的款式連動；款式完售時內容留空但高度保留，切換不跳動 -->
                <div class="modal-price">{{ priceText() ?? '' }}</div>
              }
              @if (!p.bodyIncluded) {
                <p class="note-nobody">＊此品項不含娃寶本體，僅含衣裝／配件本身。</p>
              }
              @if (p.description) {
                <p class="modal-desc">{{ p.description | keepBrand }}</p>
              }
              @if (p.reminder) {
                <div class="reminder-box">小提醒｜{{ p.reminder }}</div>
              }
              @if (p.variants.length) {
                <span class="variant-label">款式（{{ p.variants.length }} 款）</span>
                <div class="variant-list">
                  <!-- 圖鑑化：款式籤只用來切換照片與價格，不標現貨／預購／售完狀態 -->
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
              @if (canAddToCart()) {
                <!-- 一鍵加入購物袋（2026-08-26 主理人指定）：只有「販售中且有定價」的
                     款式會出現（與價格顯示同進退），完售款式與歷史展示品自然沒有按鈕 -->
                <div class="modal-cart-row">
                  <div class="qty-stepper" aria-label="數量">
                    <button type="button" aria-label="減少數量" [disabled]="qty() <= 1" (click)="decQty()">−</button>
                    <span class="qty-num">{{ qty() }}</span>
                    <button type="button" aria-label="增加數量" [disabled]="qty() >= MAX_QTY" (click)="incQty()">＋</button>
                  </div>
                  <button type="button" class="add-to-cart-btn" (click)="addToCart()">加入購物袋</button>
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
  private cart = inject(CartService);

  readonly product = this.modal.product;
  readonly selectedIdx = signal(-1);
  /** 目前顯示的是相簿裡的第幾張照片 */
  readonly index = signal(0);
  /** 加入購物袋的數量（開新商品或加入成功後重設為 1） */
  readonly qty = signal(1);

  /** 這個商品的完整相簿（第一張＝主圖） */
  readonly gallery = computed(() => this.product()?.gallery ?? []);
  /** 只有一張照片時不出現箭頭與縮圖列 */
  readonly hasCarousel = computed(() => this.gallery().length > 1);
  /** 縮圖列吃 200px 小圖（手機開一次彈窗最多 25 張，用原圖太吃流量）；
   *  small 還沒產出時 onerror 會退回 full */
  readonly thumbs = computed(() =>
    this.gallery().map((g) => ({ small: thumbUrl(g), full: assetUrl(g) })),
  );

  /** 目前選中的款式可否加入購物袋（＝販售中且有定價，與價格顯示同一套條件） */
  readonly canAddToCart = computed(() => {
    const p = this.product();
    const v = p?.variants[this.selectedIdx()];
    return !!p?.id && !!v && v.in_stock && v.price != null;
  });

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
  private thumbStrip = viewChild<ElementRef<HTMLElement>>('thumbStrip');
  private touchStart: { x: number; y: number } | null = null;
  /** 顧客最後親手點過的款式（不是被翻照片連動選到的）；一張照片被多款共用時用來選回正確那款 */
  private pickedIdx = -1;

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
    // focusImage：野餐專區點的是哪張卡片，就從相簿裡那張開始
    const start = p.focusImage ? Math.max(0, p.gallery.indexOf(p.focusImage)) : 0;
    this.index.set(start);
    this.mediaSrc.set(assetUrl(p.gallery[start] ?? p.image));
    this.mediaAlt.set(p.name);
    this.mediaOpacity.set(null);
    this.qty.set(1);
    // 圖鑑化：不分庫存狀態，一律預選第一個款式（價格列才有東西可顯示）。
    // 照片則停在主圖（＝顧客剛剛點的那張卡片），不會一開啟就跳到某個規格的特寫；
    // 主圖若正好是某個款式的實拍照，goTo 會把款式籤切到那一款，兩邊保持一致。
    // focusVariant：從野餐專區進來時，先把「顧客點的其實是哪一款」記起來，
    // 這樣即使那張照片被多款共用，選中的款式與價格也會跟卡片上顯示的一致
    this.pickedIdx = p.focusVariant ? this.matchVariant(p, p.focusVariant) : -1;
    this.selectedIdx.set(p.variants.length ? Math.max(0, this.pickedIdx) : -1);
    if (p.variants.length) this.goTo(start);
  }

  /** 用品名找對應款式（完全相同 > 開頭相同 > 互相包含）；找不到回 -1 */
  private matchVariant(p: ModalView, name: string): number {
    const n = name.trim();
    const exact = p.variants.findIndex((v) => v.name.trim() === n);
    if (exact >= 0) return exact;
    const starts = p.variants.findIndex((v) => v.name.trim().startsWith(n));
    if (starts >= 0) return starts;
    return p.variants.findIndex((v) => n.startsWith(v.name.trim()));
  }

  /** 點款式籤：切換價格，並把輪播跳到該款式的實拍照（沒有專屬圖就回到主圖） */
  select(idx: number): void {
    const p = this.product();
    if (!p) return;
    this.pickedIdx = idx;   // 記住顧客親手點的那一款，翻照片時優先選回它
    this.selectedIdx.set(idx);
    const v = p.variants[idx];
    const target = v?.image ? p.gallery.indexOf(v.image) : 0;
    this.goTo(target >= 0 ? target : 0, false);
  }

  /** 切到相簿第 i 張。syncVariant＝滑到某個款式的照片時，把款式籤與價格一起切過去 */
  goTo(i: number, syncVariant = true): void {
    const p = this.product();
    const list = p?.gallery ?? [];
    if (!p || !list.length) return;
    const n = list.length;
    const next = ((i % n) + n) % n;
    this.index.set(next);
    if (syncVariant) {
      // 一張照片常常被多個款式共用（賣場端本來就這樣綁：#20 的芬達／起司／柳橙汁
      // 是同一張合照、#18 的紅色小布包綁到草帽那張、#62 四色共用一張合照）。
      // 選款規則，由強到弱：
      //   1. 目前選中的款式本來就對得上這張照片 → 不動
      //   2. 顧客最後親手點過的那一款有對到這張照片 → 選回它
      //   3. 都不是 → 選第一個用這張照片的款式
      // 少了 1、2，顧客選好「遮陽草帽」後左右翻一輪回來就會被換成同圖的
      // 「格紋小布包 - 紅」，連價格也跟著變，加入購物袋就加錯款。
      const owners = p.variants.reduce<number[]>(
        (acc, v, i) => (v.image === list[next] ? [...acc, i] : acc),
        [],
      );
      if (owners.length && !owners.includes(this.selectedIdx())) {
        const preferred = this.pickedIdx;
        this.selectedIdx.set(owners.includes(preferred) ? preferred : owners[0]);
      }
    }
    const v = p.variants[this.selectedIdx()];
    const alt = v?.image && v.image === list[next] ? `${p.name}｜${v.name}` : p.name;
    this.swapMedia(assetUrl(list[next]), alt);
    this.scrollThumbIntoView(next);
  }

  /** 縮圖小圖缺檔時退回原圖，不留破圖 */
  onThumbError(e: Event, full: string): void {
    const img = e.target as HTMLImageElement;
    if (img.getAttribute('src') !== full) img.setAttribute('src', full);
  }

  step(delta: number): void {
    this.goTo(this.index() + delta);
  }

  onTouchStart(e: TouchEvent): void {
    const t = e.changedTouches[0];
    this.touchStart = t ? { x: t.clientX, y: t.clientY } : null;
  }

  /** 手機左右滑動換照片：位移要 40px 以上，而且橫向要明顯大於縱向，
   *  否則帶點斜度的直向捲動會誤觸翻頁。 */
  onTouchEnd(e: TouchEvent): void {
    const start = this.touchStart;
    this.touchStart = null;
    if (!start || !this.hasCarousel()) return;
    const t = e.changedTouches[0];
    const dx = (t?.clientX ?? start.x) - start.x;
    const dy = (t?.clientY ?? start.y) - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) this.step(dx < 0 ? 1 : -1);
  }

  /** 縮圖列跟著目前照片捲動，作用中的縮圖不會被藏在看不到的地方 */
  private scrollThumbIntoView(i: number): void {
    queueMicrotask(() => {
      const strip = this.thumbStrip()?.nativeElement;
      const btn = strip?.children[i] as HTMLElement | undefined;
      if (!strip || !btn) return;
      const left = btn.offsetLeft - (strip.clientWidth - btn.clientWidth) / 2;
      strip.scrollTo({ left, behavior: 'smooth' });
    });
  }

  /** 主圖淡入切換：先預載新圖，載好才換上，避免閃爍（沿用原 shop.js 行為）。
   *  swapToken：連續快速切換時，先發出的請求若比較慢載完，回來時 token 已經
   *  不是最新的，就直接丟掉，不會把顧客現在看的照片蓋回舊的那張。 */
  private swapToken = 0;

  private swapMedia(src: string, alt: string): void {
    const token = ++this.swapToken;
    if (this.mediaSrc() === src) {
      this.mediaAlt.set(alt);
      this.mediaOpacity.set('1');
      return;
    }
    // 不設 0：預載期間留著舊照片、只是淡一點，弱網下才不會出現一整格空白
    this.mediaOpacity.set('0.45');
    const pre = new Image();
    pre.onload = () => {
      if (token !== this.swapToken) return;
      this.mediaSrc.set(src);
      this.mediaAlt.set(alt);
      this.mediaOpacity.set('1');
    };
    pre.onerror = () => {
      if (token === this.swapToken) this.mediaOpacity.set('1');
    };
    pre.src = src;
  }

  readonly MAX_QTY = MAX_QTY;

  incQty(): void {
    this.qty.update((n) => Math.min(MAX_QTY, n + 1));
  }

  decQty(): void {
    this.qty.update((n) => Math.max(1, n - 1));
  }

  /** 把目前選中的款式（含數量）加進購物袋，跳出小提示；彈窗保持開啟方便繼續逛 */
  addToCart(): void {
    const p = this.product();
    const v = p?.variants[this.selectedIdx()];
    if (!p?.id || !v || !v.in_stock || v.price == null) return;
    // 只有一個款式的商品不記款式名，購物袋與明細就不會出現「款式：點點派對裙」這種贅字
    const variant = p.variants.length > 1 ? v.name : '';
    this.cart.add(
      { pid: p.id, name: p.name, variant, price: v.price, image: v.image || p.image },
      this.qty(),
    );
    this.qty.set(1);
    this.cart.showToast('已加入購物袋！');
  }

  close(): void {
    this.modal.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    // 側欄疊在彈窗上時，Esc 先交給側欄關（逐層關閉），彈窗留著
    if (this.cart.drawerOpen()) return;
    if (this.product()) this.close();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (this.canUseArrows()) this.step(-1);
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.canUseArrows()) this.step(1);
  }

  /** 鍵盤左右鍵只在「彈窗開著、購物袋側欄沒疊在上面」時換照片 */
  private canUseArrows(): boolean {
    return !!this.product() && !this.cart.drawerOpen() && this.hasCarousel();
  }
}
