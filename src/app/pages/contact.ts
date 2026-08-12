import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LINE_HANDLE } from '../core/brand';
import { Reveal } from '../core/reveal.directive';
import { SiteContentService } from '../core/site-content.service';
import { IgIcon } from '../shared/icons';
import { LineButton } from '../shared/line-button';
import { PageHero } from '../shared/page-hero';

/** 聯絡我們頁：頁首 → 聯絡方式卡片（LINE／IG／客服時間）＋留言表單卡片。
 *  表單目前為靜態展示，尚未串接寄送功能（送出只會擋掉重新整理）。 */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, PageHero, LineButton, IgIcon],
  templateUrl: './contact.html',
})
export class Contact {
  private siteSvc = inject(SiteContentService);

  readonly LINE_HANDLE = LINE_HANDLE;
  readonly contact = computed(() => this.siteSvc.site().contact);
}
