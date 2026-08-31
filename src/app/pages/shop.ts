import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
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
import { buildSalesById } from '../core/sales-match';
import { SalesService } from '../core/sales.service';
import { DEFAULT_SORT, SORT_OPTIONS, SortKey, isSortKey, sortItems } from '../core/sort';
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
 *  2026-08-31 起：陳列架有排序選單（?sort=，邏輯在 core/sort.ts），
 *  卡片封面可輪播該品項的整本相簿（gallery）。
 *  載入失敗時顯示備援訊息並導向賣貨便（刻意設計）。 */
@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHero, BadgeReal, SectionHead, ProductCard, Steps, StripCta],
  templateUrl: './shop.html',
})
export class Shop {
  private products = inject(ProductsService);
  private sales = inject(SalesService);
  private location = inject(Location);

  readonly BUY_URL = BUY_URL;
  readonly stripBody = `收到產品後發限動或 Threads 標記我們，下次消費可以折 ${SHARE_DISCOUNT} 唷。`;

  readonly catalog = this.products.storeCatalog;
  /** 使用者點選（或由網址 ?cat= 帶入）的分類鍵 */
  readonly currentCat = signal('all');
  /** 排序（或由網址 ?sort= 帶入）；選項清單給模板的下拉選單用 */
  readonly sortKey = signal<SortKey>(DEFAULT_SORT);
  readonly sortOptions = SORT_OPTIONS;

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

  /** 各商品的累計銷量（熱銷排行用）：銷售紀錄品名 → 商品編號的歸戶結果 */
  private readonly salesById = computed(() => {
    const catalog = this.catalog();
    const entries = this.sales.sales();
    if (!catalog || !entries.size) return new Map<string, number>();
    return buildSalesById(entries, catalog.items);
  });

  readonly cards = computed<ProductCardData[]>(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const catLabel = new Map(catalog.categories.map((c) => [c.key, c.label]));
    const cat = this.activeCat();
    const filtered = catalog.items.filter((it) =>
      cat === 'all'
        ? true
        : cat === HANDMADE_CAT_KEY
          ? (it.tags ?? []).includes(HANDMADE_TAG)
          : it.category === cat,
    );
    // 熱銷排行的銷量對照：讀 salesById 讓資料晚一步到貨時（API 回來）排序自動跟著更新
    const salesById = this.salesById();
    return sortItems(filtered, this.sortKey(), (it) => salesById.get(it.id) ?? 0).map((it) => ({
      name: it.name,
      image: assetUrl(it.image),
      // 封面輪播：整本相簿（第一張是主圖；只有一張時卡片自動不出現箭頭與圓點）
      images: it.gallery && it.gallery.length > 1 ? it.gallery.map(assetUrl) : undefined,
      tag: catLabel.get(it.category) ?? '',
      // 「特價」貼紙已全站移除（2026-08-26 主理人指定），特價品直接顯示特價後價格
      // 完售品項不標價（歷年作品展示）；多規格不同價顯示「NT$ 最低價 起」
      priceText: it.status === 'available' ? priceLabel(it.price, it.price_max) : undefined,
      pid: it.id,
    }));
  });

  constructor() {
    void this.products.ensureStore();
    // 熱銷排行的銷量統計（Apps Script API；沒設定網址或讀失敗時銷量全當 0，頁面照常）
    void this.sales.ensureSales();
    // 首頁三大方塊精準導流：/shop?cat=handmade（織女手作系列）、/shop?cat=accessory（配件小物）、
    // /shop?sort=new（新品上市：陳列架自動切成「上架順序：由新到舊」）
    const route = inject(ActivatedRoute);
    route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.applyParams(params.get('cat'), params.get('sort'));
      // 帶分類或排序進來＝從首頁方塊導流來的，自動捲到選品陳列架讓顧客直接看到商品
      if (params.get('cat') || params.get('sort')) this.scrollToShelf();
    });
    // 分類／排序是用 syncUrl 直接改網址列（不經過路由器，才不會每換一次就被捲回頁面頂端），
    // 所以路由器並不知道目前有 ?cat=、?sort=。顧客在本頁再點一次導覽列「娃衣選品」時
    //（app.config 設了 onSameUrlNavigation:'reload'，會發出 NavigationEnd），
    // 從路由器眼中的網址重讀一次，讓畫面跟著回到「全部＋預設排序」，與網址列一致。
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const snap = route.snapshot.queryParamMap;
        this.applyParams(snap.get('cat'), snap.get('sort'));
      });
  }

  /** 把網址參數套到畫面：沒帶分類退回「全部」，看不懂的排序值安靜退回預設 */
  private applyParams(cat: string | null, sort: string | null): void {
    this.currentCat.set(cat ?? 'all');
    this.sortKey.set(isSortKey(sort) ? sort : DEFAULT_SORT);
  }

  /** 換排序（下拉選單）：同步網址列，重新整理或分享連結都停在同一種排序 */
  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortKey.set(isSortKey(value) ? value : DEFAULT_SORT);
    this.syncUrl();
  }

  /** 把目前的分類與排序寫回網址列（預設值不寫，網址保持乾淨）。
   *  用實際生效的分類（activeCat）而不是網址帶進來的原始值，
   *  帶了不存在的分類鍵進來時才不會把那個怪值再寫回網址。 */
  private syncUrl(): void {
    const params: string[] = [];
    const cat = this.activeCat();
    if (cat !== 'all') params.push(`cat=${cat}`);
    if (this.sortKey() !== DEFAULT_SORT) params.push(`sort=${this.sortKey()}`);
    this.location.replaceState('/shop', params.join('&'));
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
    this.syncUrl();
  }
}
