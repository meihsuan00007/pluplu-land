import { NgTemplateOutlet, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FEATURED_IDS, IG_URL, KNIT_IDS, SHARE_DISCOUNT, assetUrl, priceLabel, routeFromLegacy } from '../core/brand';
import { CoverKind, coverKindOf, pickCover } from '../core/covers';
import { pickLookbook } from '../core/lookbook';
import { ProductModalService } from '../core/product-modal.service';
import { PicnicItem, ProductsService, StoreItem } from '../core/products.service';
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

/** 首頁區塊順序（2026-08-31 主理人指定的 10 個區塊，由上而下）：
 *  1 頂部輪播 → 2 創辦人引言 → 3 三大分類入口方塊 → 4 分享優惠橫幅 → 5 Lookbook 小基地
 *  → 6 品牌情境標語 → 7 大家的心頭好 → 8 野餐季企劃 → 9 秋日針織企劃 → 10 品牌故事引導。 */
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

  /** 野餐企劃品項（含 Coming Soon 預告） */
  readonly picnic = this.products.picnicItems;

  /** Lookbook 小基地：每次進首頁（重新整理）從照片庫隨機抽 6 張不重複的實拍照，
   *  在同一次瀏覽中固定不變（切到別頁再回來會重抽一次，因為首頁會重新建立） */
  readonly lookbook = pickLookbook(6);

  readonly home = computed(() => this.siteSvc.site().home);
  readonly slides = computed(() => this.home().carousel ?? []);
  /** 這次瀏覽已經抽到的封面（抽過就記住）。後台文案與商品目錄是分兩批載入的，
   *  沒有記住的話顧客眼前的封面可能會再被換掉一次；重新整理（首頁重新建立）才重抽。 */
  private readonly picked = new Map<CoverKind, string>();

  /** 三大分類入口方塊（新品上市／織女手作系列／配件專區）。
   *  封面照片每次重新整理隨機換一張：從該方塊對應分類的商品相簿裡抽（邏輯在 core/covers.ts）。
   *  商品資料還沒載入完、或該分類暫時沒有照片時，沿用後台 site.json 設定的預設封面。 */
  readonly banners = computed(() => {
    const base = (this.home().banners ?? []).slice(0, 3);
    const items = this.products.storeCatalog()?.items;
    if (!items?.length) return base;
    return base.map((b) => {
      const kind = coverKindOf(b.link);
      const cover = this.picked.get(kind) ?? pickCover(items, kind);
      if (!cover) return b;
      this.picked.set(kind, cover);
      return { ...b, image: cover };
    });
  });

  /** 推薦牆「大家的心頭好」：從選品目錄取真實商品，
   *  排行順序由 core/brand.ts 的 FEATURED_IDS 決定（2026-08-28 起固定 4 款，前兩名掛 TOP 貼紙）。 */
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
          tag: i === 0 ? 'TOP 1' : i === 1 ? 'TOP 2' : undefined,
          // 完售品項不標價（歷年作品展示）；多規格不同價顯示「NT$ 最低價 起」
          priceText: it.status === 'available' ? priceLabel(it.price, it.price_max) : undefined,
          pid: it.id,
        },
      ];
    });
  });

  /** 針織企劃專區（#knit-collection，輪播針織海報跳到這裡）：
   *  品項清單在 core/brand.ts 的 KNIT_IDS，資料撈選品目錄的即時內容 */
  readonly knit = computed<StoreItem[]>(() => {
    const catalog = this.products.storeCatalog();
    if (!catalog) return [];
    return KNIT_IDS.flatMap((id) => {
      const it = catalog.items.find((x) => x.id === id);
      return it ? [it] : [];
    });
  });

  constructor() {
    void this.products.ensureStore();
    void this.products.ensurePicnic();

    // 冷載入帶錨點（如分享連結 /#knit-collection）的補捲：
    // 商品卡片是非同步載入，路由內建的錨點捲動會在卡片長出來之前發生，
    // 位在商品區塊下方的錨點會被後來渲染的內容往下推、落點跑掉（手機上偏差可達一整個螢幕）。
    // 等選品目錄與野餐清單首次都有資料、畫面畫完後，再往正確位置補捲一次（只補這一次）。
    const scroller = inject(ViewportScroller);
    const hash = typeof location !== 'undefined' ? location.hash.slice(1) : '';
    if (hash) {
      const once = effect(() => {
        if (this.products.storeCatalog() && this.products.picnicItems().length) {
          setTimeout(() => scroller.scrollToAnchor(hash), 120);
          once.destroy();
        }
      });
    }
  }

  /** 點針織企劃卡片：開選品詳情視窗 */
  openStore(id: string): void {
    void this.modal.open(id);
  }

  /** 選品的價格標示（完售品項不標價；多規格不同價顯示「NT$ 最低價 起」） */
  storePrice(it: StoreItem): string | undefined {
    return it.status === 'available' ? priceLabel(it.price, it.price_max) : undefined;
  }

  /** 點野餐品項卡片：既有選品開商品詳情，Coming Soon 開預告視窗 */
  openPicnic(item: PicnicItem): void {
    void this.modal.openPicnic(item);
  }

  /** 野餐品項的價格標示：優先用野餐 JSON 各品項自己的價格
   *（一張卡常對應選品的其中一個規格，整個選品的最低價會標錯，如提籃標到蝴蝶結的 15 元）；
   *  Coming Soon、或對應選品整項完售時不標價。 */
  picnicPrice(item: PicnicItem): string | undefined {
    if (item.status !== 'available') return undefined;
    const store = item.store_id
      ? this.products.storeCatalog()?.items.find((it) => it.id === item.store_id)
      : undefined;
    if (store && store.status !== 'available') return undefined;
    if (item.price != null) return priceLabel(item.price);
    return store ? priceLabel(store.price, store.price_max) : undefined;
  }

  asset(path: string): string {
    return assetUrl(path);
  }

  /** 方塊連結的路由路徑（去掉 ?cat=… 查詢參數的部分） */
  route(link: string | undefined): string {
    return routeFromLegacy(link).split('?')[0];
  }

  /** 方塊連結的查詢參數（/shop?cat=handmade → { cat: 'handmade' }），沒有就回 null */
  routeQuery(link: string | undefined): Record<string, string> | null {
    const query = (link ?? '').split('?')[1];
    if (!query) return null;
    return Object.fromEntries(new URLSearchParams(query));
  }

  /** 後台連結欄位若填的是外部網址（http 開頭），要用開新分頁的方式外連 */
  isExternal(link: string | undefined): boolean {
    return !!link && /^(https?:)?\/\//.test(link);
  }
}
