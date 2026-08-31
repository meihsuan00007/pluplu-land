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

  it('新品上市只取最新上架的 5 件商品', () => {
    expect(coverPool(items, 'new').sort()).toEqual(
      ['m5.jpg', 'm6.jpg', 'm7.jpg', 'm8.jpg', 'm9.jpg'].sort(),
    );
  });

  it('織女手作系列依 tags 取、配件專區依分類取', () => {
    expect(coverPool(items, 'handmade')).toEqual(['m0.jpg']);
    expect(coverPool(items, 'accessory')).toEqual(['m1.jpg']);
  });

  it('只用主圖當封面，相簿裡的其他照片（白底單品照、細節特寫）不會被抽到', () => {
    // 每件商品的相簿都有 m*.jpg（主圖）與 g*.jpg（其他照片），照片庫只該收 m*
    expect(coverPool(items, 'new').some((src) => src.startsWith('g'))).toBe(false);
    expect(coverPool(items, 'accessory')).not.toContain('g1.jpg');
  });

  it('主圖沒填時退而用相簿第一張；重複照片只留一張', () => {
    const dup = [
      item({ id: '1', image: '', gallery: ['x.jpg', 'y.jpg'], tags: [HANDMADE_TAG] }),
      item({ id: '2', image: 'x.jpg', tags: [HANDMADE_TAG] }),
    ];
    expect(coverPool(dup, 'handmade')).toEqual(['x.jpg']);
  });

  it('先平均抽商品再抽照片：照片多的商品不會比較容易被抽中', () => {
    // #1 有 9 張相簿照、#2 只有 1 張。若是「所有照片平均抽」，#1 會佔 9/10；
    // 改成「先抽商品」之後兩件各佔一半，亂數落在前後半段就各自對應一件。
    const lopsided = [
      item({ id: '1', image: 'big.jpg', gallery: Array.from({ length: 9 }, (_, i) => `big${i}.jpg`), tags: [HANDMADE_TAG] }),
      item({ id: '2', image: 'small.jpg', tags: [HANDMADE_TAG] }),
    ];
    expect(pickCover(lopsided, 'handmade', () => 0)).toBe('big.jpg');
    expect(pickCover(lopsided, 'handmade', () => 0.75)).toBe('small.jpg');
  });

  it('抽出來的封面一定在照片庫裡（含亂數回傳 1 的邊界）', () => {
    for (const kind of ['new', 'handmade', 'accessory'] as CoverKind[]) {
      const pool = coverPool(items, kind);
      for (const r of [0, 0.5, 0.999, 1]) {
        expect(pool).toContain(pickCover(items, kind, () => r));
      }
    }
  });

  it('每件候選商品都抽得到（5 件新品曝光機會均等，不會有人永遠抽不到）', () => {
    const got = new Set<string | null>();
    for (let i = 0; i < 5; i++) got.add(pickCover(items, 'new', () => i / 5));
    expect(got).toEqual(new Set(['m5.jpg', 'm6.jpg', 'm7.jpg', 'm8.jpg', 'm9.jpg']));
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
