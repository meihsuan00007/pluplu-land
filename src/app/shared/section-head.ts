import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../core/reveal.directive';
import { KeepBrandPipe, TitleBreakPipe } from '../core/text';

/** 區塊標題組（小字英文 eyebrow ＋ 大標 ＋ 可選導言），全站置中樣式共用。
 *  標題支援全形「｜」指定換行點；品牌名自動不斷行。 */
@Component({
  selector: 'pl-section-head',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, KeepBrandPipe, TitleBreakPipe],
  template: `
    <div class="section-head reveal">
      <span class="eyebrow">{{ eyebrow() | keepBrand }}</span>
      <h2 [innerHTML]="title() | titleBreak"></h2>
      @if (lead()) {
        <p class="lead" style="margin:14px auto 0;">{{ lead() | keepBrand }}</p>
      }
    </div>
  `,
})
export class SectionHead {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input<string | undefined>(undefined);
}
