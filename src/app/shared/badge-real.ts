import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** 「全實拍」標章（外觀全站共用一份）：純文字說明標籤，不是按鈕。
 *  文字兩種用法：頁首短版「全實拍・零 AI」（預設）、
 *  說明區長版「全站商品照片皆為實拍」（自行傳入 text）。
 *  onDark：放在深色區塊（如首頁底部橫幅）時改用奶油色。 */
@Component({
  selector: 'pl-badge-real',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge-real" [class.badge-real--dark]="onDark()">{{ text() }}</span>`,
})
export class BadgeReal {
  readonly text = input('全實拍・零 AI');
  readonly onDark = input(false);
}
