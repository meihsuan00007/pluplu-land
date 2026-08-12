import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../core/reveal.directive';
import { KeepBrandPipe } from '../core/text';

/** 每頁最下方的「行動呼籲橫幅」（深色區塊：標題＋一句話＋一顆按鈕）。
 *  external=true 時按鈕外連（開新分頁），否則走站內路由。
 *  首頁的「全實拍」徽章這類額外內容可用 <ng-content> 投影在標題上方，
 *  並設 hasIntro=true 讓標題保持原本的間距。 */
@Component({
  selector: 'pl-strip-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Reveal, KeepBrandPipe],
  template: `
    <div class="strip">
      <div class="wrap reveal">
        <ng-content />
        <h2 [style.margin-top]="hasIntro() ? '20px' : null">{{ title() | keepBrand }}</h2>
        <p>{{ body() | keepBrand }}</p>
        @if (external()) {
          <a [href]="link()" class="btn" target="_blank" rel="noopener">{{ label() }}</a>
        } @else {
          <a [routerLink]="link()" class="btn">{{ label() }}</a>
        }
      </div>
    </div>
  `,
})
export class StripCta {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly label = input.required<string>();
  readonly link = input.required<string>();
  readonly external = input(false);
  readonly hasIntro = input(false);
}
