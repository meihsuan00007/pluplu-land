import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BUY_URL, IG_URL, LINE_URL } from '../core/brand';
import { CartIcon, IgIcon, LineIcon } from './icons';

/** 全站導覽列（唯一一份）。
 *  結構：LOGO（點擊回首頁）→ 文字選單三項 → 右上角三顆圓形功能 icon
 *（賣貨便＝淺棕、IG＝中棕、LINE＝深棕，顏色在 styles.scss 的 --nav-icon-* 設定）
 *  → 手機版漢堡按鈕。手機選單開啟時鎖住頁面捲動（body.nav-open）。 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, CartIcon, IgIcon, LineIcon],
  template: `
    <nav class="site-nav">
      <div class="wrap">
        <a routerLink="/" class="brand-mark" (click)="closeMenu()">
          <img src="/images/logo.png" alt="PluPlu Land" />
          <span>首頁</span>
        </a>
        <div class="nav-links" [class.open]="menuOpen()">
          <a routerLink="/shop" routerLinkActive="current" (click)="closeMenu()">娃衣選品</a>
          <a routerLink="/story" routerLinkActive="current" (click)="closeMenu()">品牌故事</a>
          <a routerLink="/notice" routerLinkActive="current" (click)="closeMenu()">購物須知</a>
          <a routerLink="/contact" routerLinkActive="current" (click)="closeMenu()">聯絡我們</a>
        </div>
        <div class="nav-icons">
          <a class="nav-icon nav-icon--cart" [href]="BUY_URL" target="_blank" rel="noopener" aria-label="前往賣貨便下單"><pl-icon-cart /></a>
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
  readonly BUY_URL = BUY_URL;
  readonly IG_URL = IG_URL;
  readonly LINE_URL = LINE_URL;

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
}
