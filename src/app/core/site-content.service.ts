import { Injectable, signal } from '@angular/core';

/** content/site.json 的資料結構（由 Decap CMS 後台編輯） */
export interface CarouselSlide {
  image: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  link?: string;
  poster?: boolean;
  /** 分割式版型左側格紋色塊主題 */
  theme?: 'butter' | 'rose';
}

export interface PromoBanner {
  image: string;
  label_en?: string;
  title: string;
  subtitle?: string;
  link?: string;
}

export interface TimelineRow {
  year: string;
  title: string;
  body: string;
}

export interface PageCopy {
  eyebrow: string;
  title: string;
  lead: string;
  hero_image?: string;
  timeline?: TimelineRow[];
}

export interface SiteContent {
  home: PageCopy & { carousel: CarouselSlide[]; banners: PromoBanner[] };
  story_page: PageCopy;
  contact: { instagram_handle: string; instagram_url: string; hours: string };
}

/** 載入前的預設文案：與 content/site.json 目前內容一致，
 *  確保畫面不會在資料抓取完成前空白（等同舊版 HTML fallback 的角色）。
 *  ⚠️ 若後台改了文案，這份預設「不需要」跟著改：它只在載入的一瞬間出現。 */
const DEFAULT_SITE: SiteContent = {
  home: {
    eyebrow: 'PluPlu Land · 軟綿綿的小天地',
    title: '在軟綿綿的小天地，遇見想陪你的娃寶。',
    lead: '軟綿綿的娃寶們，和一件一件精心挑選的小衣裳。這裡沒有交易的距離感，只有陪伴的溫度。進來坐坐吧，我們不趕時間。',
    carousel: [
      {
        image: 'images/uploads/picnic-banner-3.jpg',
        eyebrow: 'PICNIC SEASON',
        title: '野餐季企劃新品登場',
        poster: true,
        link: '#picnic-plan',
      },
      {
        image: 'images/uploads/knit-banner-1.jpg',
        eyebrow: 'KNIT COLLECTION',
        title: '針織開襟衫溫柔上市',
        poster: true,
        link: '#knit-collection',
      },
    ],
    banners: [
      {
        image: 'images/uploads/denim-dress-hand.jpg',
        label_en: 'New in',
        title: '新品上市',
        subtitle: '娃裝新朋友，陸續報到中',
        link: 'shop.html',
      },
      {
        image: 'images/uploads/cuddle-closeup.jpg',
        label_en: 'Handmade',
        title: '織女手作系列',
        subtitle: '請織女一針一線訂做的手作款',
        link: '/shop?cat=handmade',
      },
      {
        image: 'images/uploads/pearl-butterfly-detail.jpg',
        label_en: 'Accessories',
        title: '配件專區',
        subtitle: '帽帽、披肩與亮晶晶的小珠寶',
        link: '/shop?cat=accessory',
      },
    ],
  },
  story_page: {
    eyebrow: 'OUR STORY',
    title: '軟綿綿的｜小天地',
    lead: '還記得小時候，出門前總要幫娃寶們一個一個點名嗎？PluPlu Land 想守住的，就是那份最初的溫柔，一個療癒與陪伴的世界。',
    hero_image: 'images/uploads/gingham-overalls.jpg',
    timeline: [
      {
        year: '小時候',
        title: '「1、2、3、4……」',
        body: '出門前，我們總會認真地幫每一個娃寶點名；不小心掉到地上，會心疼地趕快撿起來呼呼。那是我們最初學會的照顧，也是最純粹的愛。',
      },
      {
        year: '長大後',
        title: '漸漸忘了對自己溫柔',
        body: '長大後的社會壓力，讓我們把溫柔都留給了工作與別人，漸漸忘了留一點給自己。直到某天，看見妹妹下班後依然細心地替她的狐獴小娃寶穿上小衣服、跟他碎碎念分享日常，才驚覺，那份純真從來沒有消失。',
      },
      {
        year: '相遇',
        title: '遇見圓滾滾的小傢伙',
        body: '後來，遇見了はむにぎり娃寶。圓滾滾的、有點呆又有點傲嬌，卻總是買不到合身的小衣服。於是我們開始四處尋找、認真挑選，也和合作的織女一起訂製，替這些小朋友張羅屬於他們的日常。PluPlu Land，就這樣開始了。',
      },
      {
        year: '現在',
        title: '留一個軟綿綿的小天地',
        body: '這個品牌的誕生，是為了在疲憊的世界裡，留下一個可以慢慢喘口氣的角落。PluPlu Land，軟綿綿的小天地。希望你也能在這裡，重新牽起小時候的自己，找回最初的溫柔與療癒。',
      },
    ],
  },
  contact: {
    instagram_handle: '@plupluland_tw',
    instagram_url: 'https://instagram.com/plupluland_tw',
    hours: '週一至週六 10:00–18:00',
  },
};

/** 讀取 content/site.json（後台可編輯的全站文案）。
 *  讀取失敗時保留預設文案，畫面不會空白。 */
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  readonly site = signal<SiteContent>(DEFAULT_SITE);

  constructor() {
    fetch('/content/site.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SiteContent | null) => {
        if (data) this.site.set({ ...DEFAULT_SITE, ...data });
      })
      .catch(() => {
        /* 保留預設文案 */
      });
  }
}
