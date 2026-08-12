import { Pipe, PipeTransform } from '@angular/core';

const NBSP = String.fromCharCode(160); // 不斷行空格 U+00A0

/** 品牌名稱「PluPlu Land」不可被斷行：把中間空格換成不斷行空格。
 *  後台編輯者照常輸入一般空格即可，顯示時自動處理。 */
export function keepBrand(value: string): string {
  return value.replace(/PluPlu Land/g, 'PluPlu' + NBSP + 'Land');
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** 一般文字：保護品牌名不斷行。用法：{{ 文字 | keepBrand }} */
@Pipe({ name: 'keepBrand' })
export class KeepBrandPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value == null ? '' : keepBrand(String(value));
  }
}

/** 標題專用：支援用全形「｜」手動指定換行點（轉成 <br>），
 *  避免「療癒系」這類詞彙被瀏覽器自動斷在詞中間。
 *  內容先 escape 再轉換，需搭配 [innerHTML] 使用。 */
@Pipe({ name: 'titleBreak' })
export class TitleBreakPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value == null) return '';
    return esc(keepBrand(String(value))).replace(/｜/g, '<br>');
  }
}
