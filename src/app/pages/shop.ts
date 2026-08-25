import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BUY_URL,
  HANDMADE_CAT_KEY,
  HANDMADE_CAT_LABEL,
  HANDMADE_TAG,
  SHARE_DISCOUNT,
  assetUrl,
  priceLabel,
} from '../core/brand';
import { ProductsService } from '../core/products.service';
import { BadgeReal } from '../shared/badge-real';
import { PageHero } from '../shared/page-hero';
import { ProductCard, ProductCardData } from '../shared/product-card';
import { SectionHead } from '../shared/section-head';
import { Steps } from '../shared/steps';
import { StripCta } from '../shared/strip-cta';

/** 娃衣選品頁：62 項真實商品的商品牆＋分類篩選。
 *  資料來自 content/products-store.json（產出檔勿手改，見 CLAUDE.md）。
 *  分類籤除正式分類外，另有「織女手作系列」虛擬分類（依商品 tags 篩選）；
 *  網址可帶 ?cat=分類鍵 直接切到指定分類（首頁方塊導流用）。
 *  2026-08-25 起卡片顯示價格（NT$ 金額；完售品項不標價，當作歷年作品展示）。
 *  載入失敗時顯示備援訊息並導向賣貨便（刻意設計）。 */
@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHero, BadgeReal, SectionHead, ProductCard, Steps, StripCta],
  templateUrl: './shop.html',
})
export class Shop {
  private products = inject(ProductsService);
  private location = inject(Location);

  readonly BUY_URL = BUY_URL;
  readonly stripBody = `收到產品後發限動標記我們，下次消費可以折 ${SHARE_DISCOUNT} 唷。`;

  readonly catalog = this.products.storeCatalog;
  /** 使用者點選（或由網址 ?cat= 帶入）的分類鍵 */
  readonly currentCat = signal('all');

  /** 分類籤（「全部」＋織女手作系列＋有商品的正式分類） */
  readonly filterChips = computed(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const chips = [{ key: 'all', label: '全部' }];
    if (catalog.items.some((it) => (it.tags ?? []).includes(HANDMADE_TAG))) {
      chips.push({ key: HANDMADE_CAT_KEY, label: HANDMADE_CAT_LABEL });
    }
    for (const c of catalog.categories) {
      if (catalog.items.some((it) => it.category === c.key)) chips.push(c);
    }
    return chips;
  });

  /** 實際生效的分類：網址帶了不存在的分類鍵時，安靜退回「全部」 */
  readonly activeCat = computed(() => {
    const cat = this.currentCat();
    return this.filterChips().some((c) => c.key === cat) ? cat : 'all';
  });

  readonly cards = computed<ProductCardData[]>(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const catLabel = new Map(catalog.categories.map((c) => [c.key, c.label]));
    const cat = this.activeCat();
    return catalog.items
      .filter((it) =>
        cat === 'all'
          ? true
          : cat === HANDMADE_CAT_KEY
            ? (it.tags ?? []).includes(HANDMADE_TAG)
            : it.category === cat,
      )
      .map((it) => ({
        name: it.name,
        image: assetUrl(it.image),
        tag: catLabel.get(it.category) ?? '',
        saleTape: it.on_sale ? (it.sale_label ?? '特價') : undefined,
        // 完售品項不標價（歷年作品展示）；多規格不同價顯示「NT$ 最低價 起」
        priceText: it.status === 'available' ? priceLabel(it.price, it.price_max) : undefined,
        pid: it.id,
      }));
  });

  constructor() {
    void this.products.ensureStore();
    // 首頁方塊精準導流：/shop?cat=handmade（織女手作系列）、/shop?cat=accessory（配件小物）
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        // 沒帶參數時要退回「全部」：從 ?cat=handmade 點導覽列回 /shop 時篩選才會重設
        const cat = params.get('cat');
        this.currentCat.set(cat ?? 'all');
        // 帶分類進來＝從首頁方塊導流來的，自動捲到選品陳列架讓顧客直接看到商品
        if (cat) this.scrollToShelf();
      });
  }

  /** 平滑捲動到「選品陳列架」區塊（#shop-shelf）。
   *  延遲一小拍，讓路由內建的「換頁回到頂端」先發生，捲動才不會被蓋掉；
   *  尊重使用者的「減少動態」系統設定（改為直接跳至定位）。 */
  private scrollToShelf(): void {
    setTimeout(() => {
      const el = document.getElementById('shop-shelf');
      if (!el) return;
      const reduced =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }, 150);
  }

  /** 點分類籤：切換篩選並同步網址列的 ?cat=（重新整理或分享連結會停留在同一分類） */
  setCat(key: string): void {
    this.currentCat.set(key);
    this.location.replaceState('/shop', key === 'all' ? '' : `cat=${key}`);
  }
}
