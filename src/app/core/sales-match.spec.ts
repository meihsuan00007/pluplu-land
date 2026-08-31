import { buildSalesById } from './sales-match';

/** 銷售紀錄品名歸戶：正式名、款式名、倒序款式、去簡稱款式、全名開頭、別名表、歧義不計 */
describe('buildSalesById 銷量歸戶到商品', () => {
  const items = [
    { id: '01', name: '【日本livheart正貨】捏捏倉鼠玩偶 はむにぎり療癒小勞贖🐹', variants: [v('黃豆米鼠仔'), v('麻糬白鼠仔')] },
    { id: '03', name: '😴好眠套組（睡衣＆懶骨頭可拆買）', variants: [v('粉藍天使睡衣（含小帽帽）')] },
    { id: '09', name: '小香風洋裝', variants: [v('小香風洋裝 - 長版紫')] },
    { id: '25', name: '公主紗肩帶小香風洋裝', variants: [v('黑'), v('白')] },
    { id: '26', name: '迷你配件 - 珍珠奶茶🧋/水壺💧', variants: [v('珍珠奶茶'), v('水壺 - 白')] },
    { id: '27', name: '迷你配件 - 爆米花🍿、遊戲機🎮', variants: [v('爆米花 - 咖🤎')] },
    { id: '29', name: '眼鏡、墨鏡 4.5cm', variants: [v('眼鏡 - 4.5cm - 透棕框'), v('墨鏡 - 4.5cm - 黑框')] },
    { id: '62', name: '貴族千鳥格裙', variants: [v('單一規格')] },
  ];
  function v(name: string) {
    return { supply: '現貨' as const, name, price: 100, in_stock: true, image: null };
  }
  const run = (record: Record<string, number>) => buildSalesById(new Map(Object.entries(record)), items);

  it('款式名一字不差（含表情符號差異）與倒序記法都對得上', () => {
    const got = run({
      '眼鏡 - 4.5cm - 透棕框': 10, // 款式名一字不差
      '鼠仔 - 黃豆米': 5, // 倒過來＝款式「黃豆米鼠仔」
      '迷你配件 - 爆米花 - 咖': 3, // 去掉第一段＝款式「爆米花 - 咖🤎」（表情符號忽略）
      '迷你配件 - 珍珠奶茶': 2,
    });
    expect(got.get('29')).toBe(10);
    expect(got.get('01')).toBe(5);
    expect(got.get('27')).toBe(3);
    expect(got.get('26')).toBe(2);
  });

  it('紀錄名以商品全名開頭時取最長的商品（公主紗不會被記到一般小香風）', () => {
    const got = run({ '公主紗肩帶小香風洋裝 - 黑': 4, '小香風洋裝 - 短版綠': 6 });
    expect(got.get('25')).toBe(4);
    expect(got.get('09')).toBe(6);
  });

  it('段落累進包含：已下架款式（不在款式清單裡）仍能靠「簡稱＋尺寸」對到唯一商品', () => {
    const got = run({ '眼鏡 - 4.5cm - 漸層粉黃': 9, '迷你配件 - 珍珠奶茶 - 白': 2 });
    expect(got.get('29')).toBe(9); // 「眼鏡」＋「4.5cm」只有 #29 同時包含
    expect(got.get('26')).toBe(2); // 「迷你配件」＋「珍珠奶茶」只有 #26 同時包含
  });

  it('手動別名表與簡稱唯一包含', () => {
    const got = run({ '天使睡衣套裝 - 粉藍': 7, 貴族千鳥格裙: 2 });
    expect(got.get('03')).toBe(7);
    expect(got.get('62')).toBe(2);
  });

  it('對不到與有歧義的品名安靜跳過、同商品多款式會加總', () => {
    const got = run({ 迷你配件: 99, '30折價券': 3, '鼠仔 - 黃豆米': 1, '鼠仔 - 麻糬白': 2 });
    expect(got.get('26')).toBeUndefined();
    expect(got.get('27')).toBeUndefined();
    expect(got.get('01')).toBe(3);
    expect([...got.values()].includes(99)).toBe(false);
  });
});
