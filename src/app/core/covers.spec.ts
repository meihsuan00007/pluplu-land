import { HANDMADE_TAG } from './brand';
import { CoverKind, coverKindOf, coverPool, pickCover } from './covers';
import { StoreItem } from './products.service';

/** 首頁三大方塊的隨機封面：取樣範圍正確、照片去重、抽到的一定在照片庫裡、沒資料時不爆掉 */
describe('首頁分類方塊的隨機封面', () => {
  const item = (over: Partial<StoreItem>): StoreItem =>
    ({
      id: '1',
      name: '品項',
      category: 'dress',
      price: 100,
      original_price: 100,
      on_sale: false,
      sale_label: null,
      status: 'available',
      body_included: false,
      image: 'a.jpg',
      variants: [],
      ...over,
    }) as StoreItem;

  // 10 件商品：最後 5 件才算「新品」；#0 是織女手作、#1 是配件小物
  const items: StoreItem[] = Array.from({ length: 10 }, (_, i) =>
    item({
      id: String(i),
      image: `m${i}.jpg`,
      gallery: [`m${i}.jpg`, `g${i}.jpg`],
      tags: i === 0 ? [HANDMADE_TAG] : [],
      category: i === 1 ? 'accessory' : 'dress',
    }),
  );

  it('新品上市只取最新上架的 5 件商品的照片', () => {
    expect(coverPool(items, 'new').sort()).toEqual(
      ['m5.jpg', 'g5.jpg', 'm6.jpg', 'g6.jpg', 'm7.jpg', 'g7.jpg', 'm8.jpg', 'g8.jpg', 'm9.jpg', 'g9.jpg'].sort(),
    );
  });

  it('織女手作系列依 tags 取、配件專區依分類取', () => {
    expect(coverPool(items, 'handmade')).toEqual(['m0.jpg', 'g0.jpg']);
    expect(coverPool(items, 'accessory')).toEqual(['m1.jpg', 'g1.jpg']);
  });

  it('沒有相簿的品項用主圖，重複照片只留一張', () => {
    const dup = [
      item({ id: '1', image: 'x.jpg', gallery: ['x.jpg', 'y.jpg'], tags: [HANDMADE_TAG] }),
      item({ id: '2', image: 'y.jpg', tags: [HANDMADE_TAG] }),
    ];
    expect(coverPool(dup, 'handmade')).toEqual(['x.jpg', 'y.jpg']);
  });

  it('抽出來的封面一定在照片庫裡（含亂數回傳 1 的邊界）', () => {
    for (const kind of ['new', 'handmade', 'accessory'] as CoverKind[]) {
      const pool = coverPool(items, kind);
      for (const r of [0, 0.5, 0.999, 1]) {
        expect(pool).toContain(pickCover(items, kind, () => r));
      }
    }
  });

  it('照片庫是空的時候回傳 null（讓呼叫端沿用後台預設封面）', () => {
    expect(pickCover([], 'new')).toBeNull();
    expect(pickCover(items.slice(2, 3), 'handmade')).toBeNull();
  });

  it('依方塊連結判斷取樣分類', () => {
    expect(coverKindOf('/shop?cat=handmade')).toBe('handmade');
    expect(coverKindOf('/shop?cat=accessory')).toBe('accessory');
    expect(coverKindOf('/shop?sort=new')).toBe('new');
    expect(coverKindOf(undefined)).toBe('new');
  });
});
