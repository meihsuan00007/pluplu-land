import { Directive, ElementRef, Injectable, OnDestroy, OnInit, inject } from '@angular/core';

/** 全站共用一個 IntersectionObserver，負責滾動淡入（.reveal → 加上 .in） */
@Injectable({ providedIn: 'root' })
export class RevealObserver {
  private io: IntersectionObserver | null =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                (e.target as HTMLElement).classList.add('in');
                this.io!.unobserve(e.target);
              }
            }
          },
          { threshold: 0.15 },
        )
      : null;

  observe(el: HTMLElement): void {
    if (this.io) this.io.observe(el);
    else el.classList.add('in');
  }

  unobserve(el: HTMLElement): void {
    this.io?.unobserve(el);
  }
}

/** 掛在任何 class="reveal" 的元素上（selector 直接吃 class），
 *  進入視窗時加上 .in 觸發淡入。已帶 .in 的元素（如頁首）不處理。
 *  使用 .reveal 的元件記得 imports: [Reveal]。 */
@Directive({ selector: '.reveal' })
export class Reveal implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer = inject(RevealObserver);

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (!node.classList.contains('in')) this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer.unobserve(this.el.nativeElement);
  }
}
