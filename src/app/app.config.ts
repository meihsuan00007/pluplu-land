import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 明確宣告 zoneless（本專案未安裝 zone.js，畫面更新全靠 signals）
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // 換頁時回到頁面頂端、返回時回到原捲動位置（模擬傳統多頁網站的行為）；
      // anchorScrolling：讓 #picnic-plan 這類錨點連結能捲動到對應區塊
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
