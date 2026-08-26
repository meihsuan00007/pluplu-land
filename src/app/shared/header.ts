import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IG_URL, LINE_URL } from '../core/brand';
import { CartService } from '../core/cart.service';
import { CartIcon, IgIcon, LineIcon } from './icons';

/** 全站導覽列（唯一一份）。
 *  結構：去背字標 LOGO（點擊回首頁，不加文字、不裁圓，2026-08-17 主理人指定）
 *  → 文字選單四項 → 右上角三顆圓形功能 icon
 *（購物袋＝淺棕、IG＝中棕、LINE＝深棕，顏色在 styles.scss 的 --nav-icon-* 設定；
 *  2026-08-26 起購物車 icon 改為開啟「購物袋」側欄並顯示件數標籤，
 *  賣貨便入口改由購物袋側欄、頁尾與各區塊按鈕提供）
 *  → 手機版漢堡按鈕。手機選單開啟時鎖住頁面捲動（body.nav-open）。 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, CartIcon, IgIcon, LineIcon],
  template: `
    <nav class="site-nav">
      <div class="wrap">
        <a routerLink="/" class="brand-mark" aria-label="回到首頁" (click)="closeMenu()">
          <img src="/images/logo-wordmark.png" alt="PluPlu Land" />
        </a>
        <div class="nav-links" [class.open]="menuOpen()">
          <a routerLink="/shop" routerLinkActive="current" (click)="closeMenu()">娃衣選品</a>
          <a routerLink="/story" routerLinkActive="current" (click)="closeMenu()">品牌故事</a>
          <a routerLink="/notice" routerLinkActive="current" (click)="closeMenu()">購物須知</a>
          <a routerLink="/contact" routerLinkActive="current" (click)="closeMenu()">聯絡我們</a>
        </div>
        <div class="nav-icons">
          <button
            type="button"
            class="nav-icon nav-icon--cart"
            [attr.aria-label]="cartCount() > 0 ? '開啟購物袋（' + cartCount() + ' 件）' : '開啟購物袋'"
            (click)="openCart()"
          >
            <pl-icon-cart />
            @if (cartCount() > 0) {
              <span class="nav-cart-badge" aria-hidden="true">{{ cartCount() > 99 ? '99+' : cartCount() }}</span>
            }
          </button>
          <a class="nav-icon nav-icon--ig" [href]="IG_URL" target="_blank" rel="noopener" aria-label="Instagram"><pl-icon-ig /></a>
          <a class="nav-icon nav-icon--line" [href]="LINE_URL" target="_blank" rel="noopener" aria-label="加入 LINE 好友"><pl-icon-line /></a>
        </div>
        <button
          class="nav-toggle"
          [class.open]="menuOpen()"
          [attr.aria-expanded]="menuOpen()"
          aria-label="開啟選單"
          (click)="toggleMenu()"
        >
          <span></span>
        </button>
      </div>
    </nav>
  `,
})
export class Header {
  private cart = inject(CartService);

  readonly IG_URL = IG_URL;
  readonly LINE_URL = LINE_URL;
  readonly cartCount = this.cart.count;

  readonly menuOpen = signal(false);

  constructor() {
    // 選單開啟時鎖住頁面捲動（沿用原本 body.nav-open 的 CSS 規則）
    effect(() => {
      document.body.classList.toggle('nav-open', this.menuOpen());
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openCart(): void {
    this.closeMenu();
    this.cart.openDrawer();
  }
}
