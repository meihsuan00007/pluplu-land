import { TestBed } from '@angular/core/testing';
import { CartService, MAX_QTY } from './cart.service';

/** 購物袋純邏輯測試：合併累加、數量上限、歸零移除、明細文字格式、壞資料防禦 */
describe('CartService 購物袋', () => {
  const line = (over: Partial<Parameters<CartService['add']>[0]> = {}) => ({
    pid: '09',
    name: '小香風洋裝',
    variant: '長版藍',
    price: 140,
    image: 'assets/images/products/09.jpg',
    ...over,
  });

  let cart: CartService;

  beforeEach(() => {
    localStorage.removeItem('pluplu-cart-v1');
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
    cart.clear();
  });

  it('同商品同款式重複加入會合併數量；件數與總額正確', () => {
    cart.add(line(), 2);
    cart.add(line(), 1);
    cart.add(line({ variant: '短版綠', price: 120 }), 1);
    expect(cart.lines().length).toBe(2);
    expect(cart.count()).toBe(4);
    expect(cart.total()).toBe(140 * 3 + 120);
  });

  it('數量不會超過上限，也不接受 0 以下或小數的加入數量', () => {
    cart.add(line(), MAX_QTY + 50);
    expect(cart.lines()[0].qty).toBe(MAX_QTY);
    cart.clear();
    cart.add(line(), 0);
    expect(cart.lines()[0].qty).toBe(1);
    cart.clear();
    cart.add(line(), 2.6);
    expect(cart.lines()[0].qty).toBe(3);
  });

  it('數量減到 0 時整列移除', () => {
    cart.add(line(), 1);
    cart.changeQty('09', '長版藍', -1);
    expect(cart.lines().length).toBe(0);
  });

  it('明細文字格式正確：編號、款式、小計、總額、單一規格不顯示款式', () => {
    cart.add(line(), 2);
    cart.add(line({ pid: '51', name: '點點派對裙', variant: '單一規格', price: 140 }), 1);
    const text = cart.orderText();
    const rows = text.split('\n');
    expect(rows[0]).toBe('【PluPlu Land 訂單確認清單】');
    expect(rows[1]).toBe('1. 小香風洋裝（款式：長版藍） x 2 - NT$ 280');
    expect(rows[2]).toBe('2. 點點派對裙 x 1 - NT$ 140');
    expect(rows[3]).toBe('----------------------------');
    expect(rows[4]).toBe('共 3 件商品｜預估總金額：NT$ 420');
    // 全站禁用破折號（——）
    expect(text.includes('——')).toBe(false);
  });

  it('localStorage 壞資料不會弄壞購物袋（缺欄位、負數量、非陣列都被擋掉）', () => {
    localStorage.setItem(
      'pluplu-cart-v1',
      JSON.stringify({
        lines: [
          { ...line(), qty: 2 },
          { ...line({ variant: '短版綠' }), qty: 1000, price: -50 }, // 超量與負價會被收斂
          { pid: '11' }, // 缺欄位
          { ...line(), qty: -3 }, // 負數量
          'garbage',
          null,
        ],
      }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(CartService);
    expect(fresh.lines().length).toBe(2);
    expect(fresh.lines()[0].qty).toBe(2);
    expect(fresh.lines()[1].qty).toBe(MAX_QTY); // 1000 → 99
    expect(fresh.lines()[1].price).toBe(0); // 負價 → 0
    expect(fresh.count()).toBe(2 + MAX_QTY);

    localStorage.setItem('pluplu-cart-v1', '{"lines": "not-an-array"}');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CartService).lines()).toEqual([]);

    localStorage.setItem('pluplu-cart-v1', 'not-json{{{');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CartService).lines()).toEqual([]);
  });
});
