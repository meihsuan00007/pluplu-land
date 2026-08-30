import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IG_URL } from '../core/brand';
import { IgIcon } from './icons';

/** Instagram 深棕色膠囊按鈕（與 pl-line-button 完全相同的膠囊規格，兩顆並排時高度一致）。
 *  文字可換：聯絡頁用「追蹤 Instagram」，也可傳帳號名。網址來自 core/brand.ts 的 IG_URL。 */
@Component({
  selector: 'pl-ig-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IgIcon],
  template: `<a class="ig-btn" [href]="IG_URL" target="_blank" rel="noopener"><pl-icon-ig />{{ label() }}</a>`,
})
export class IgButton {
  readonly IG_URL = IG_URL;
  readonly label = input('追蹤 Instagram');
}
