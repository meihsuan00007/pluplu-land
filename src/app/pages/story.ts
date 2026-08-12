import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Reveal } from '../core/reveal.directive';
import { SiteContentService } from '../core/site-content.service';
import { KeepBrandPipe } from '../core/text';
import { BadgeReal } from '../shared/badge-real';
import { PageHero } from '../shared/page-hero';
import { QuoteBlock } from '../shared/quote-block';
import { SectionHead } from '../shared/section-head';
import { Steps } from '../shared/steps';
import { StripCta } from '../shared/strip-cta';

/** 品牌故事頁：頁首 → 時間軸 → 圖文區 → 引言 → 四位店員 → 實拍堅持 → 出貨三步驟 → CTA */
@Component({
  selector: 'app-story',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, KeepBrandPipe, PageHero, SectionHead, QuoteBlock, BadgeReal, Steps, StripCta],
  templateUrl: './story.html',
})
export class Story {
  private siteSvc = inject(SiteContentService);

  readonly page = computed(() => this.siteSvc.site().story_page);
  readonly timeline = computed(() => this.page().timeline ?? []);

  /** 店員大頭貼還沒放上時，隱藏破圖、露出米色圓形佔位 */
  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
