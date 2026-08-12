import { ChangeDetectionStrategy, Component } from '@angular/core';

/** 全站共用 SVG 圖示（購物車／Instagram／LINE）。
 *  同一個圖示只在這裡定義一次，導覽列、按鈕、頁尾都引用這裡。 */

@Component({
  selector: 'pl-icon-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1.5"></circle><circle cx="19" cy="21" r="1.5"></circle><path d="M2 3h3l2.6 12.5a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 8H6"></path></svg>`,
})
export class CartIcon {}

@Component({
  selector: 'pl-icon-ig',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
})
export class IgIcon {}

@Component({
  selector: 'pl-icon-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5C6.2 2.5 1.5 6.4 1.5 11.2c0 4.3 3.7 7.9 8.8 8.6.34.07.8.23.92.52.1.27.07.68.03.95l-.14.9c-.04.27-.2 1.04.9.57 1.1-.47 5.9-3.55 8.05-6.07 1.48-1.66 2.44-3.35 2.44-5.43C22.5 6.4 17.8 2.5 12 2.5z"/></svg>`,
})
export class LineIcon {}
