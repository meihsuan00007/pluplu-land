import { LOOKBOOK_POOL, LookbookPhoto, pickLookbook } from './lookbook';

/** Lookbook 隨機抽樣：張數正確、不重複、每張都來自照片庫、亂數不同結果不同、照片庫不足時不爆掉 */
describe('pickLookbook 隨機抽 6 張', () => {
  const pool: LookbookPhoto[] = Array.from({ length: 10 }, (_, i) => ({
    src: `p${i}.jpg`,
    label: `L${i}`,
    alt: `A${i}`,
  }));

  /** 可預測的假亂數：依序吐出固定序列 */
  const seq = (values: number[]) => {
    let k = 0;
    return () => values[k++ % values.length];
  };

  it('抽出 6 張、彼此不重複、全部來自照片庫', () => {
    const picked = pickLookbook(6, pool);
    expect(picked).toHaveLength(6);
    expect(new Set(picked.map((p) => p.src)).size).toBe(6);
    for (const p of picked) expect(pool).toContain(p);
  });

  it('正式照片庫至少 6 張，且路徑不重複', () => {
    expect(LOOKBOOK_POOL.length).toBeGreaterThanOrEqual(6);
    expect(new Set(LOOKBOOK_POOL.map((p) => p.src)).size).toBe(LOOKBOOK_POOL.length);
    expect(pickLookbook()).toHaveLength(6);
  });

  it('亂數序列不同，抽到的組合／順序也不同（真的有在洗牌）', () => {
    const a = pickLookbook(6, pool, seq([0, 0, 0, 0, 0, 0]));
    const b = pickLookbook(6, pool, seq([0.99, 0.99, 0.99, 0.99, 0.99, 0.99]));
    expect(a.map((p) => p.src)).toEqual(['p0.jpg', 'p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg']);
    expect(b.map((p) => p.src)).not.toEqual(a.map((p) => p.src));
    expect(new Set(b.map((p) => p.src)).size).toBe(6);
  });

  it('照片庫不足 6 張時回傳全部、不重複，也不會改到原本的清單', () => {
    const small = pool.slice(0, 4);
    const snapshot = small.map((p) => p.src);
    const picked = pickLookbook(6, small);
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((p) => p.src)).size).toBe(4);
    expect(small.map((p) => p.src)).toEqual(snapshot);
  });
});
