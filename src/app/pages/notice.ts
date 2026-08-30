import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IG_URL, LINE_URL, SHARE_DISCOUNT, SHARE_DISCOUNT_AMOUNT, THREADS_URL } from '../core/brand';
import { Reveal } from '../core/reveal.directive';
import { LineButton } from '../shared/line-button';
import { PageHero } from '../shared/page-hero';

/** 購物須知頁：左文右圖頁首 → 五張須知卡片（分享優惠三步驟／出貨時間／注意事項／退換貨／LINE 諮詢）。 */
@Component({
  selector: 'app-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Reveal, PageHero, LineButton],
  templateUrl: './notice.html',
})
export class Notice {
  readonly IG_URL = IG_URL;
  readonly LINE_URL = LINE_URL;
  readonly THREADS_URL = THREADS_URL;
  readonly SHARE_DISCOUNT = SHARE_DISCOUNT;
  readonly SHARE_DISCOUNT_AMOUNT = SHARE_DISCOUNT_AMOUNT;
}
