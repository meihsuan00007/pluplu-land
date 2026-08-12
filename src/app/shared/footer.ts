import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuyButton } from './buy-button';
import { LineButton } from './line-button';

/** 全站頁尾（唯一一份）。
 *  連結順序（主理人指定）：品牌故事 → 購物須知 → 聯絡我們，
 *  之後接橘色賣貨便膠囊按鈕與綠色 LINE 膠囊按鈕（兩顆規格相同）。 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BuyButton, LineButton],
  template: `
    <footer>
      <div class="wrap footer-inner">
        <a routerLink="/" class="footer-brand">
          <img src="/images/logo.png" alt="PluPlu Land" />
          <span>PluPlu Land</span>
        </a>
        <div class="footer-links">
          <a routerLink="/story">品牌故事</a>
          <a routerLink="/notice">購物須知</a>
          <a routerLink="/contact">聯絡我們</a>
          <pl-buy-button variant="capsule" />
          <pl-line-button />
        </div>
        <p class="footer-note">
          © PluPlu&nbsp;Land・棉寓，意為軟綿綿的小天地。目前為品牌概念展示，暫不提供線上結帳；想帶娃寶回家，可至7-11賣貨便下單。
        </p>
      </div>
    </footer>
  `,
})
export class Footer {}
