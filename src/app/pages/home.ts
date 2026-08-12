import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FEATURED_IDS,
  IG_URL,
  SHARE_DISCOUNT,
  assetUrl,
  money,
  routeFromLegacy,
} from '../core/brand';
import { ProductModalService } from '../core/product-modal.service';
import { PicnicItem, ProductsService } from '../core/products.service';
import { Reveal } from '../core/reveal.directive';
import { SiteContentService } from '../core/site-content.service';
import { BadgeReal } from '../shared/badge-real';
import { BuyButton } from '../shared/buy-button';
import { Carousel } from '../shared/carousel';
import { IgIcon } from '../shared/icons';
import { LineButton } from '../shared/line-button';
import { ProductCard, ProductCardData } from '../shared/product-card';
import { QuoteBlock } from '../shared/quote-block';
import { SectionHead } from '../shared/section-head';
import { StripCta } from '../shared/strip-cta';

/** 首頁：輪播 → 行銷 Banner → 限動活動 → 推薦牆 → 品牌理念 → 陳列櫃 → 圖文區 → 引言 → CTA */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    Reveal,
    BuyButton,
    Carousel,
    SectionHead,
    ProductCard,
    QuoteBlock,
    StripCta,
    BadgeReal,
    LineButton,
    IgIcon,
  ],
  templateUrl: './home.html',
})
export class Home {
  private siteSvc = inject(SiteContentService);
  private products = inject(ProductsService);
  private modal = inject(ProductModalService);

  readonly IG_URL = IG_URL;
  readonly SHARE_DISCOUNT = SHARE_DISCOUNT;
  readonly money = money;

  /** 野餐企劃品項（含 Coming Soon 預告） */
  readonly picnic = this.products.picnicItems;

  readonly home = computed(() => this.siteSvc.site().home);
  readonly slides = computed(() => this.home().carousel ?? []);
  readonly banners = computed(() => (this.home().banners ?? []).slice(0, 3));

  /** 推薦牆「大家的心頭好」：從選品目錄取真實商品，
   *  排行順序由 core/brand.ts 的 FEATURED_IDS 決定（口水巾、眼鏡固定前兩名）。 */
  readonly featured = computed<ProductCardData[]>(() => {
    const catalog = this.products.storeCatalog();
    if (!catalog) return [];
    const byId = new Map(catalog.items.map((it) => [it.id, it]));
    return FEATURED_IDS.flatMap((id, i) => {
      const it = byId.get(id);
      if (!it) return [];
      return [
        {
          name: it.name,
          image: assetUrl(it.image),
          priceText: money(it.price),
          tag: i === 0 ? 'TOP 1' : i === 1 ? 'TOP 2' : undefined,
          pid: it.id,
        },
      ];
    });
  });

  constructor() {
    void this.products.ensureStore();
    void this.products.ensurePicnic();
  }

  /** 點野餐品項卡片：既有選品開商品詳情，Coming Soon 開預告視窗 */
  openPicnic(item: PicnicItem): void {
    void this.modal.openPicnic(item);
  }

  asset(path: string): string {
    return assetUrl(path);
  }

  route(link: string | undefined): string {
    return routeFromLegacy(link);
  }

  /** 後台連結欄位若填的是外部網址（http 開頭），要用開新分頁的方式外連 */
  isExternal(link: string | undefined): boolean {
    return !!link && /^(https?:)?\/\//.test(link);
  }
}
