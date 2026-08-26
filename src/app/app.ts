import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { CartDrawer } from './shared/cart-drawer';
import { Footer } from './shared/footer';
import { Header } from './shared/header';
import { ProductModal } from './shared/product-modal';

/** App 根版型：導覽列 → 目前頁面 → 頁尾 ＋ 全站共用的商品詳情視窗與購物袋側欄。
 *  換頁時同步更新搜尋引擎描述（各頁描述設定在 app.routes.ts 的 data.description）。 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ProductModal, CartDrawer],
  template: `
    <app-header />
    <router-outlet />
    <app-footer />
    <pl-product-modal />
    <pl-cart-drawer />
  `,
})
export class App {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private meta = inject(Meta);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      const description = r.snapshot.data['description'];
      if (description) this.meta.updateTag({ name: 'description', content: description });
    });
  }
}
