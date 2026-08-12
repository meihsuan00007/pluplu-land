import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../core/reveal.directive';
import { SectionHead } from './section-head';

/** 「出貨前的驗貨與手工整理」三步驟流程（全站唯一一份）。
 *  三個步驟的內容固定共用：嚴格驗貨 → 細緻剪線頭 → 手工打結收尾，
 *  改一次、每個使用的頁面都更新；標題與開場白由各頁自行傳入
 *（品牌故事頁與娃衣選品頁都用「出貨前的小小儀式」這組）。 */
@Component({
  selector: 'pl-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, SectionHead],
  template: `
    <section class="section">
      <div class="wrap">
        <pl-section-head eyebrow="BEFORE IT SHIPS" [title]="title()" [lead]="lead()" />
        <div class="steps reveal">
          <div class="step">
            <div class="step-figure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.3 15.3 5.2 5.2"></path><path d="m7.9 10.7 1.8 1.8 3.4-3.6"></path></svg>
              <span class="step-num">1</span>
            </div>
            <h3>嚴格驗貨</h3>
            <p>鈕釦、縫線、配件小零件逐一檢查過才放行，先替你和寶寶把關一次。</p>
          </div>
          <div class="step">
            <div class="step-figure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.6"></circle><circle cx="6" cy="18" r="2.6"></circle><path d="M8.2 7.7 20 19.2"></path><path d="M8.2 16.3 20 4.8"></path></svg>
              <span class="step-num">2</span>
            </div>
            <h3>細緻剪線頭</h3>
            <p>把多餘的線頭一一修剪乾淨，讓每件衣裳整整齊齊地出門見你。</p>
          </div>
          <div class="step">
            <div class="step-figure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 10.5 5.6 7.7a2.2 2.2 0 0 0-3.2 2v2.6a2.2 2.2 0 0 0 3.2 2L11 11.5"></path><path d="m13 10.5 5.4-2.8a2.2 2.2 0 0 1 3.2 2v2.6a2.2 2.2 0 0 1-3.2 2L13 11.5"></path><circle cx="12" cy="11" r="1.7"></circle><path d="m10.8 12.9-1.6 5.3"></path><path d="m13.2 12.9 1.6 5.3"></path></svg>
              <span class="step-num">3</span>
            </div>
            <h3>手工打結收尾</h3>
            <p>針織綁帶手工多打一個結收尾，避免使用時開花、散掉。是小事，但我們很在意。</p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Steps {
  readonly title = input.required<string>();
  readonly lead = input.required<string>();
}
