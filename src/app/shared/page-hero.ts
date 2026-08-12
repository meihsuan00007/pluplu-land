import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { assetUrl } from '../core/brand';
import { KeepBrandPipe, TitleBreakPipe } from '../core/text';

/** 內頁頁首區（全站統一規格，padding 寫死在 .page-hero，不要用 inline style 覆寫）。
 *  兩種模式：
 *  - 預設「左文右圖」：eyebrow ＋ H1 ＋ 導言 ＋（可選）動作列 ＋ 1:1 方形圖
 *  - center=true「置中無圖」：購物須知頁使用
 *  標題支援全形「｜」指定換行點（轉成 <br>），避免詞彙被斷在中間。
 *  動作列內容（按鈕、徽章）由使用的頁面用 <ng-content> 投影進來，
 *  有放內容時記得設 hasActions，沒有就不會多出空白間距。 */
@Component({
  selector: 'pl-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KeepBrandPipe, TitleBreakPipe],
  template: `
    <header class="page-hero">
      @if (center()) {
        <div class="wrap">
          <div class="section-head reveal in" style="margin-bottom:0;">
            <span class="eyebrow">{{ eyebrow() | keepBrand }}</span>
            <h1 style="font-size:clamp(30px,4vw,44px);" [innerHTML]="title() | titleBreak"></h1>
            <p class="lead text-flow" style="margin:16px auto 0;">{{ lead() | keepBrand }}</p>
          </div>
        </div>
      } @else {
        <div class="wrap duo">
          <div class="duo-copy reveal in">
            <span class="eyebrow">{{ eyebrow() | keepBrand }}</span>
            <h1 [innerHTML]="title() | titleBreak"></h1>
            <p class="lead">{{ lead() | keepBrand }}</p>
            @if (hasActions()) {
              <div class="duo-actions"><ng-content /></div>
            }
          </div>
          <div class="duo-media reveal in">
            <img [src]="imageSrc()" [alt]="alt()" />
          </div>
        </div>
      }
    </header>
  `,
})
export class PageHero {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input.required<string>();
  readonly image = input<string>('');
  readonly alt = input('');
  readonly hasActions = input(false);
  readonly center = input(false);

  imageSrc(): string {
    return assetUrl(this.image());
  }
}
