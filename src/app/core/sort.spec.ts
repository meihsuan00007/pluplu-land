import { DEFAULT_SORT, SORT_OPTIONS, isSortKey, sortItems } from './sort';

/** 陳列架排序：上架順序正反、價格高低、未定價／完售一律墊底、穩定、不改原陣列 */
describe('sortItems 選品陳列架排序', () => {
  const items = [
    { id: '01', price: 550, status: 'available' },
    { id: '02', price: 60, status: 'available' },
    { id: '03', price: 60, status: 'available' },
    { id: '04', price: 999, status: 'sold_out' }, // 完售：比價時墊底
    { id: '05', price: null, status: 'available' }, // 未定價：比價時墊底
    { id: '06', price: 130, status: 'available' },
  ];
  const ids = (list: { id: string }[]) => list.map((it) => it.id).join(',');

  it('由舊到新＝目錄原始順序；由新到舊＝整個反過來', () => {
    expect(ids(sortItems(items, 'old'))).toBe('01,02,03,04,05,06');
    expect(ids(sortItems(items, 'new'))).toBe('06,05,04,03,02,01');
  });

  it('價格由低到高：只排有定價的販售中品項，完售與未定價排最後且維持原順序', () => {
    expect(ids(sortItems(items, 'price-asc'))).toBe('02,03,06,01,04,05');
  });

  it('價格由高到低：同樣把完售與未定價留在最後', () => {
    expect(ids(sortItems(items, 'price-desc'))).toBe('01,06,02,03,04,05');
  });

  it('同價位維持原本先後（穩定排序），且不會改動原陣列', () => {
    const snapshot = ids(items);
    const asc = sortItems(items, 'price-asc');
    expect(asc.findIndex((it) => it.id === '02')).toBeLessThan(asc.findIndex((it) => it.id === '03'));
    expect(ids(items)).toBe(snapshot);
  });

  it('熱銷排行：銷量由多到少，同銷量依上架新到舊，查不到銷量當 0', () => {
    const sales: Record<string, number> = { '02': 5, '06': 9, '04': 99 };
    const hot = sortItems(items, 'hot', (it) => sales[it.id] ?? 0);
    // 04 銷量最高（完售品也照排，熱銷榜是人氣紀錄）；01/03/05 都是 0，依上架新到舊
    expect(ids(hot)).toBe('04,06,02,05,03,01');
  });

  it('熱銷排行沒接銷量資料時，整體退化為上架新到舊', () => {
    expect(ids(sortItems(items, 'hot'))).toBe(ids(sortItems(items, 'new')));
  });

  it('排序鍵檢查：網址帶奇怪的值時不會被接受', () => {
    expect(isSortKey('price-asc')).toBe(true);
    expect(isSortKey('random')).toBe(false);
    expect(isSortKey(null)).toBe(false);
    expect(SORT_OPTIONS.some((o) => o.key === DEFAULT_SORT)).toBe(true);
  });
});
