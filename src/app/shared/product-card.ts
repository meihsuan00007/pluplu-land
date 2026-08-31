import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
// 注意：卡片根元素不是 role="button"（見模板註解），鍵盤開窗走卡片內的 .card-open 真按鈕
import { ProductModalService } from '../core/product-modal.service';
import { KeepBrandPipe } from '../core/text';
import { BuyButton } from './buy-button';

/** 商品卡片的顯示資料（各頁面把自己的商品資料整理成這個格式再餵進來）。
 *  2026-08-25 起卡片顯示價格（主理人指定格式「NT$ 金額」，用 core/brand.ts 的 priceLabel 產生）；
 *  完售品項不填 priceText（不標價、不做完售標示，當作歷年作品展示）。
 *  2026-08-31 起 images 有多張時，卡片封面直接可輪播（選品陳列架用）。 */
export interface ProductCardData {
  name: string;
  image: string;
  alt?: string;
  /** 左上角貼紙標籤（居家／TOP 1／分類名稱……） */
  tag?: string;
  /** 價格標示（如「NT$ 130」「NT$ 15 起」）；完售品項留空＝不顯示 */
  priceText?: string;
  /** 情境短文 */
  note?: string;
  /** 對應 products-store.json 的商品編號；有值時點卡片會開商品詳情視窗 */
  pid?: string;
  /** 封面輪播用的完整相簿（第一張＝主圖）。留空或只有一張＝靜態封面，沒有箭頭與圓點 */
  images?: string[];
}

/** 圓點指示器最多顯示幾張；相簿更多張（如 #20 的 25 張）改用「第幾張／共幾張」計數，圓點才不會擠成一排小點 */
const MAX_DOTS = 10;

/** 預載一張照片：載好、載失敗、或超過 0.7 秒都算結束（不會讓翻頁卡住）。已在快取裡的照片幾乎立刻結束 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve();
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = src;
    if (img.complete) finish();
    setTimeout(finish, 700);
  });
}

/** 商品卡片（全站唯一一份）：
 *  - 娃寶陳列區：tag ＋ note ＋ 購買按鈕
 *  - 首頁大家的心頭好：TOP 標籤 ＋ 購買按鈕（無 note）
 *  - 選品陳列架：shopStyle=true，分類標籤（無售完貼紙），整卡可點、無購買按鈕，
 *    封面可輪播該品項所有照片（左右箭頭／圓點／手機左右滑／鍵盤左右鍵），
 *    點卡片開詳情視窗時會停在目前這張照片。
 *  有 pid 的卡片點擊會開啟商品詳情視窗；卡片內的購買按鈕與輪播控制不會誤開視窗。 */
@Component({
  selector: 'pl-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuyButton, KeepBrandPipe],
  template: `
    <div
      class="product-card reveal in"
      [class.shop-card]="shopStyle()"
      [class.is-openable]="!!data().pid"
      (click)="onCardClick()"
      (keydown.arrowLeft)="onArrow(-1, $event)"
      (keydown.arrowRight)="onArrow(1, $event)"
      (mouseenter)="warm()"
      (focusin)="warm()"
    >
      <!-- 鍵盤／讀屏的「開啟詳情」入口：卡片本身不再當按鈕（卡片裡還有箭頭、圓點、購買鈕，
          按鈕包按鈕不合無障礙規範）。這顆看不見的真按鈕在 Tab 順序最前面，Enter／空白鍵觸發後
          點擊事件會冒泡到卡片的 (click) 開啟視窗；滑鼠使用者照常點整張卡。 -->
      @if (data().pid) {
        <button type="button" class="card-open sr-only">查看「{{ data().name | keepBrand }}」詳情</button>
      }
      <div
        class="product-photo"
        [class.has-carousel]="hasCarousel()"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <div class="card-track" [style.transform]="'translateX(-' + index() * 100 + '%)'">
          @for (src of images(); track src; let i = $index) {
            <div class="card-slide">
              @if (loaded(i)) {
                <img
                  [src]="src"
                  [alt]="i === 0 ? data().alt || data().name : data().name + ' 照片 ' + (i + 1)"
                  [attr.loading]="i === 0 ? 'lazy' : 'eager'"
                />
              }
            </div>
          }
        </div>
        @if (data().tag) {
          <span class="product-tape">{{ data().tag }}</span>
        }
        @if (hasCarousel()) {
          <!-- 箭頭與圓點 tabindex=-1：鍵盤使用者用卡片的左右鍵翻照片就好，
              不然每張卡要按十幾下 Tab 才能走到下一張卡 -->
          <button
            type="button"
            class="gallery-nav gallery-nav--prev card-nav"
            aria-label="上一張照片"
            tabindex="-1"
            (click)="step(-1, $event)"
          >
            ‹
          </button>
          <button
            type="button"
            class="gallery-nav gallery-nav--next card-nav"
            aria-label="下一張照片"
            tabindex="-1"
            (click)="step(1, $event)"
          >
            ›
          </button>
          @if (showDots()) {
            <div class="card-dots" role="group" aria-label="商品照片">
              @for (src of images(); track src; let i = $index) {
                <button
                  type="button"
                  class="card-dot"
                  [class.is-active]="i === index()"
                  [attr.aria-label]="'第 ' + (i + 1) + ' 張照片'"
                  [attr.aria-current]="i === index() ? 'true' : null"
                  tabindex="-1"
                  (click)="goTo(i, $event)"
                ></button>
              }
            </div>
          } @else {
            <span class="gallery-count card-count" aria-hidden="true">{{ index() + 1 }} / {{ images().length }}</span>
          }
        }
      </div>
      <div class="product-name">{{ data().name | keepBrand }}</div>
      @if (data().priceText) {
        <div class="product-price">{{ data().priceText }}</div>
      }
      @if (data().note) {
        <p class="product-note">{{ data().note | keepBrand }}</p>
      }
      <!-- 彈性填充：把購買按鈕推到卡片底部，同一排卡片的按鈕高度就會對齊
          （卡片標題行數不同時，多出來的空間由這裡吸收） -->
      <div class="card-fill" aria-hidden="true"></div>
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

  /** 封面照片清單：沒給 images 就只有主圖一張 */
  readonly images = computed(() => {
    const d = this.data();
    return d.images && d.images.length ? d.images : [d.image];
  });
  readonly hasCarousel = computed(() => this.images().length > 1);
  readonly showDots = computed(() => this.images().length <= MAX_DOTS);
  /** 目前顯示第幾張；只有卡片真的換成「別的商品」（排序／篩選後元件被重用）才回到第一張。
   *  以商品編號（沒有就用主圖路徑）當依據，而不是相簿陣列本身：
   *  切換排序時上層會重新產生一模一樣內容的新陣列，用陣列當依據會把顧客翻到一半的進度打回第一張 */
  readonly index = linkedSignal<string, number>({
    source: () => this.data().pid ?? this.data().image,
    // 資料物件換新但仍是同一件商品 → 保留翻到的張數；真的換商品才回到 0
    computation: (key, previous) => (previous && previous.source === key ? previous.value : 0),
  });
  /** 顧客碰過這張卡（滑入／碰觸／聚焦）後才開始預載相鄰照片，
   *  列表一開始只載每張卡的主圖，62 張卡不會一次抓幾百張照片 */
  private warmed = signal(false);
  private touchStart: { x: number; y: number } | null = null;

  /** 第 i 張要不要真的放進 <img>：主圖一律放；其餘只放目前這張的左右鄰居（含頭尾相接），
   *  換到下一張時照片已經在旁邊等著，滑過去不會看到空白 */
  loaded(i: number): boolean {
    if (i === 0) return true;
    if (!this.warmed()) return false;
    const n = this.images().length;
    const d = Math.abs(i - this.index());
    return Math.min(d, n - d) <= 1;
  }

  warm(): void {
    if (this.hasCarousel()) this.warmed.set(true);
  }

  /** 正在等照片載好、還沒真的切過去的目標張數（連點時以它為基準累加，不會跳過中間的張數） */
  private pendingIndex: number | null = null;
  private switchToken = 0;

  /** 切到第 i 張：先把那張照片抓進瀏覽器快取，載好（或最多等 0.7 秒）才真的平移過去，
   *  跳到不相鄰的照片、或弱網時，不會先看到一格奶油色空白再彈出照片 */
  goTo(i: number, event?: Event): void {
    event?.stopPropagation();
    const n = this.images().length;
    if (n < 2) return;
    this.warmed.set(true);
    const next = ((i % n) + n) % n;
    if (next === this.index() && this.pendingIndex === null) return;
    this.pendingIndex = next;
    const token = ++this.switchToken;
    const src = this.images()[next];
    preloadImage(src).then(() => {
      if (token !== this.switchToken) return;
      this.pendingIndex = null;
      // 等照片的期間卡片若已換成別的商品，就不要把舊的張數套到新商品上
      if (this.images()[next] !== src) return;
      this.index.set(next);
    });
  }

  step(delta: number, event?: Event): void {
    this.goTo((this.pendingIndex ?? this.index()) + delta, event);
  }

  /** 鍵盤左右鍵翻照片（焦點在卡片上時） */
  onArrow(delta: number, event: Event): void {
    if (!this.hasCarousel()) return;
    event.preventDefault();
    this.step(delta, event);
  }

  onTouchStart(e: TouchEvent): void {
    this.warm();
    const t = e.changedTouches[0];
    this.touchStart = t ? { x: t.clientX, y: t.clientY } : null;
  }

  /** 手機左右滑動換照片：位移要 40px 以上，而且橫向要明顯大於縱向，
   *  否則帶點斜度的直向捲動會誤觸翻頁（與商品詳情視窗同一套判斷） */
  onTouchEnd(e: TouchEvent): void {
    const start = this.touchStart;
    this.touchStart = null;
    if (!start || !this.hasCarousel()) return;
    const t = e.changedTouches[0];
    const dx = (t?.clientX ?? start.x) - start.x;
    const dy = (t?.clientY ?? start.y) - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) this.step(dx < 0 ? 1 : -1);
  }

  /** 點卡片（或鍵盤按下卡片裡的「查看詳情」鈕）開詳情視窗；封面正停在某張照片時，視窗也直接停在那張 */
  onCardClick(): void {
    const pid = this.data().pid;
    if (!pid) return;
    const focus = this.hasCarousel() ? this.images()[this.index()] : undefined;
    void this.modal.open(pid, focus);
  }
}
