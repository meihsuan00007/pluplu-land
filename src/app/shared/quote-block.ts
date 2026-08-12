import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../core/reveal.directive';
import { KeepBrandPipe, TitleBreakPipe } from '../core/text';

/** 「創辦人的話」引言區（版型共用、文字可換）。
 *  quote 支援全形「｜」指定換行點。 */
@Component({
  selector: 'pl-quote-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, KeepBrandPipe, TitleBreakPipe],
  template: `
    <section class="section">
      <div class="wrap quote-block reveal">
        <blockquote [innerHTML]="quote() | titleBreak"></blockquote>
        <cite>{{ cite() | keepBrand }}</cite>
      </div>
    </section>
  `,
})
export class QuoteBlock {
  readonly quote = input.required<string>();
  readonly cite = input('PluPlu Land 創辦人');
}
