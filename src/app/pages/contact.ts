import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Reveal } from '../core/reveal.directive';
import { SiteContentService } from '../core/site-content.service';
import { IgButton } from '../shared/ig-button';
import { LineButton } from '../shared/line-button';
import { PageHero } from '../shared/page-hero';

/** 聯絡我們頁：頁首 → 聯絡方式卡片（IG／LINE 膠囊按鈕並排＋客服時間）。
 *  不設表單（主理人指定），顧客一律走 LINE／IG 私訊。 */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, PageHero, LineButton, IgButton],
  templateUrl: './contact.html',
})
export class Contact {
  private siteSvc = inject(SiteContentService);

  readonly contact = computed(() => this.siteSvc.site().contact);
}
