import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { assetUrl, routeFromLegacy } from '../core/brand';
import { CarouselSlide } from '../core/site-content.service';
import { TitleBreakPipe } from '../core/text';

/** 首頁大輪播：淡入切換、自動播放（5 秒）、圓點與左右箭頭、滑鼠移入暫停。
 *  兩種版型：
 *  - 海報模式（slide.poster=true）：圖片本身已含文案與按鈕設計，整張為連結、
 *    手機裁切靠左；hotspot=true 時在圖面左下角按鈕位置疊 .poster-hotspot 熱區
 *   （hover 顯示光圈，座標寫死在 styles.scss，手機 4:3 裁切時 x 軸 ×1.75）。
 *    連結可填 #picnic-plan 這類錨點，會捲動到首頁對應區塊。
 *  - 分割式版型（非海報）：左側格紋色塊（theme: butter／rose）＋標題＋圓角按鈕，
 *    右側情境實拍；手機改上文下圖、隱藏副標。
 *  尊重使用者的「減少動態」系統設定（不自動輪播）。 */
@Component({
  selector: 'pl-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TitleBreakPipe],
  template: `
    <section class="carousel-shell" aria-label="主打活動輪播">
      <div class="wrap">
        <div class="carousel" (mouseenter)="stop()" (mouseleave)="start()">
          <div class="carousel-track">
            @for (s of slides(); track $index) {
              @if (s.poster) {
                @if (isExternal(s.link)) {
                  <a
                    [href]="s.link"
                    target="_blank"
                    rel="noopener"
                    class="carousel-slide carousel-slide--poster"
                    [class.is-active]="index() === $index"
                  >
                    <img [src]="img(s.image)" [alt]="s.title" [attr.loading]="$index === 0 ? null : 'lazy'" />
                    @if (s.hotspot) {
                      <span class="poster-hotspot" aria-hidden="true"></span>
                    }
                  </a>
                } @else {
                  <a
                    [routerLink]="posterRoute(s.link)"
                    [fragment]="fragmentOf(s.link)"
                    class="carousel-slide carousel-slide--poster"
                    [class.is-active]="index() === $index"
                  >
                    <img [src]="img(s.image)" [alt]="s.title" [attr.loading]="$index === 0 ? null : 'lazy'" />
                    @if (s.hotspot) {
                      <span class="poster-hotspot" aria-hidden="true"></span>
                    }
                  </a>
                }
              } @else {
                <div class="carousel-slide carousel-slide--split" [class.is-active]="index() === $index">
                  <div class="split-copy" [class.split-copy--rose]="s.theme === 'rose'">
                    @if (s.eyebrow) {
                      <span class="split-eyebrow">{{ s.eyebrow }}</span>
                    }
                    <h2 [innerHTML]="s.title | titleBreak"></h2>
                    @if (s.subtitle) {
                      <p>{{ s.subtitle }}</p>
                    }
                    @if (s.link && s.link_label) {
                      @if (isExternal(s.link)) {
                        <a [href]="s.link" target="_blank" rel="noopener" class="split-cta">{{ s.link_label }}</a>
                      } @else {
                        <a [routerLink]="route(s.link)" class="split-cta">{{ s.link_label }}</a>
                      }
                    }
                  </div>
                  <div class="split-media">
                    <img [src]="img(s.image)" [alt]="s.title" [attr.loading]="$index === 0 ? null : 'lazy'" />
                  </div>
                </div>
              }
            }
          </div>
          <button class="carousel-arrow prev" aria-label="上一張" (click)="go(index() - 1); start()">‹</button>
          <button class="carousel-arrow next" aria-label="下一張" (click)="go(index() + 1); start()">›</button>
          <div class="carousel-dots">
            @for (s of slides(); track $index) {
              <button
                class="carousel-dot"
                type="button"
                [class.is-active]="index() === $index"
                [attr.aria-label]="'第 ' + ($index + 1) + ' 張'"
                (click)="go($index); start()"
              ></button>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Carousel {
  readonly slides = input.required<CarouselSlide[]>();
  readonly index = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // 輪播內容更換（後台更新 JSON）時回到第一張並重新計時
    effect(() => {
      this.slides();
      this.index.set(0);
      this.start();
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  img(path: string): string {
    return assetUrl(path);
  }

  route(link: string | undefined): string {
    return routeFromLegacy(link);
  }

  /** 海報連結的錨點（#picnic-plan → picnic-plan）；一般連結不帶錨點 */
  fragmentOf(link: string | undefined): string | undefined {
    return link?.startsWith('#') ? link.slice(1) : undefined;
  }

  /** 海報連結目的地：錨點連結留在首頁捲動，一般連結照舊導頁 */
  posterRoute(link: string | undefined): string {
    return link?.startsWith('#') ? '/' : this.route(link);
  }

  /** 後台連結欄位若填外部網址（http 開頭），改用開新分頁外連 */
  isExternal(link: string | undefined): boolean {
    return !!link && /^(https?:)?\/\//.test(link);
  }

  go(n: number): void {
    const len = this.slides().length;
    if (!len) return;
    this.index.set(((n % len) + len) % len);
  }

  start(): void {
    this.stop();
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || this.slides().length < 2) return;
    this.timer = setInterval(() => this.go(this.index() + 1), 5000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
