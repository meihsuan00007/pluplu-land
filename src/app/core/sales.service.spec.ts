import { normalizeName } from './sales.service';

/** 銷量名稱對照：忽略空格與全半形差異，讓試算表手打的品名對得上官網商品 */
describe('normalizeName 商品名稱正規化', () => {
  it('忽略空格、全形字元與大小寫差異', () => {
    expect(normalizeName('雙層緹花 蛋糕裙')).toBe(normalizeName('雙層緹花蛋糕裙'));
    expect(normalizeName('眼鏡 4.5cm')).toBe(normalizeName('眼鏡４.５ＣＭ'));
    expect(normalizeName('  遮陽草帽  ')).toBe(normalizeName('遮陽草帽'));
  });

  it('不同商品仍然分得開', () => {
    expect(normalizeName('遮陽草帽')).not.toBe(normalizeName('遮陽草帽（鼠鼠尺寸）'));
  });
});
