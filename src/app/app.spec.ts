import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { routes } from './app.routes';
import { BUY_URL } from './core/brand';

describe('App 根版型', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('導覽列與頁尾全站唯一：品牌 LOGO、三個文字選單、三顆功能 icon、頁尾按鈕都在', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    // 導覽列
    expect(el.querySelector('.brand-mark span')?.textContent).toContain('首頁');
    const navLinks = Array.from(el.querySelectorAll('.nav-links a')).map((a) => a.textContent?.trim());
    expect(navLinks).toEqual(['娃衣選品', '品牌故事', '購物須知', '聯絡我們']);
    expect(el.querySelectorAll('.nav-icons .nav-icon').length).toBe(3);
    expect(el.querySelector('.nav-icon--cart')?.getAttribute('href')).toBe(BUY_URL);

    // 頁尾（順序：品牌故事 → 購物須知 → 聯絡我們，後接兩顆膠囊按鈕）
    const footerTexts = Array.from(el.querySelectorAll('.footer-links a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(footerTexts.slice(0, 3)).toEqual(['品牌故事', '購物須知', '聯絡我們']);
    expect(el.querySelector('.footer-links a.buy-btn')?.getAttribute('href')).toBe(BUY_URL);
    expect(el.querySelector('.footer-links a.line-btn')).toBeTruthy();

    // 全站共用商品詳情視窗存在且預設關閉
    const modal = el.querySelector('.shop-modal');
    expect(modal).toBeTruthy();
    expect(modal?.classList.contains('is-open')).toBe(false);
  });
});
