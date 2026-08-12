import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUY_URL, SHARE_DISCOUNT, assetUrl, money } from '../core/brand';
import { ProductsService } from '../core/products.service';
import { BadgeReal } from '../shared/badge-real';
import { PageHero } from '../shared/page-hero';
import { ProductCard, ProductCardData } from '../shared/product-card';
import { SectionHead } from '../shared/section-head';
import { Steps } from '../shared/steps';
import { StripCta } from '../shared/strip-cta';

/** 娃衣選品頁：47 項真實商品的商品牆＋分類篩選。
 *  資料來自 content/products-store.json（產出檔勿手改，見 CLAUDE.md）。
 *  載入失敗時顯示備援訊息並導向賣貨便（刻意設計）。 */
@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHero, BadgeReal, SectionHead, ProductCard, Steps, StripCta],
  templateUrl: './shop.html',
})
export class Shop {
  private products = inject(ProductsService);

  readonly BUY_URL = BUY_URL;
  readonly stripBody = `收到產品後發限動標記我們，下次消費可以折 ${SHARE_DISCOUNT} 唷。`;

  readonly catalog = this.products.storeCatalog;
  readonly currentCat = signal('all');

  /** 分類籤（「全部」＋有商品的分類） */
  readonly filterChips = computed(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const chips = [{ key: 'all', label: '全部' }];
    for (const c of catalog.categories) {
      if (catalog.items.some((it) => it.category === c.key)) chips.push(c);
    }
    return chips;
  });

  readonly cards = computed<ProductCardData[]>(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const catLabel = new Map(catalog.categories.map((c) => [c.key, c.label]));
    const cat = this.currentCat();
    return catalog.items
      .filter((it) => cat === 'all' || it.category === cat)
      .map((it) => ({
        name: it.name,
        image: assetUrl(it.image),
        tag: catLabel.get(it.category) ?? '',
        saleTape: it.on_sale ? (it.sale_label ?? '特價') : undefined,
        priceText: it.on_sale ? undefined : money(it.price),
        sale: it.on_sale
          ? { priceText: money(it.price), originalText: money(it.original_price) }
          : undefined,
        pid: it.id,
      }));
  });

  constructor() {
    void this.products.ensureStore();
  }
}
