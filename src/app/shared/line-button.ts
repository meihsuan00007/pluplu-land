import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LINE_URL } from '../core/brand';
import { LineIcon } from './icons';

/** LINE 官方風綠色膠囊按鈕（全站唯一一份）。
 *  文字可換：頁尾用「加入 LINE 好友」、聯絡頁用「&#64;plupluland_tw」。 */
@Component({
  selector: 'pl-line-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LineIcon],
  template: `<a class="line-btn" [href]="LINE_URL" target="_blank" rel="noopener"><pl-icon-line />{{ label() }}</a>`,
})
export class LineButton {
  readonly LINE_URL = LINE_URL;
  readonly label = input('加入 LINE 好友');
}
