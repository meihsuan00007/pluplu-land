import { Routes } from '@angular/router';

/** 全站路由。每頁的 title 是瀏覽器分頁標題、data.description 是搜尋引擎描述。
 *  下方的 .html 轉址讓舊書籤（如 hamu.html）也能開到正確頁面
 *（線上另有 netlify.toml 的 301 轉址，這裡是保險）。 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
    title: 'PluPlu Land ｜ 軟綿綿的小天地',
    data: {
      description:
        'PluPlu Land，軟綿綿的小天地。軟綿綿的娃寶們與精心挑選的娃裝配件，全實拍、零 AI，陪你把日子過得慢一點、軟一點。',
    },
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop').then((m) => m.Shop),
    title: '娃衣選品 ｜ PluPlu Land',
    data: {
      description:
        'PluPlu Land 娃衣選品：娃寶的洋裝、裙子、帽帽與迷你配件，全實拍呈現。點進每一項看看規格與出貨時間，喜歡就到賣貨便帶回家。',
    },
  },
  {
    path: 'story',
    loadComponent: () => import('./pages/story').then((m) => m.Story),
    title: '品牌故事 ｜ PluPlu Land',
    data: {
      description:
        'PluPlu Land 品牌故事，從小時候幫娃寶點名的那份認真開始，在疲憊的世界裡，留下一個軟綿綿的小天地。',
    },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
    title: '聯絡我們 ｜ PluPlu Land',
    data: {
      description: '與 PluPlu Land 聯絡，關於娃寶、娃裝配件或合作提案，歡迎與我們聊聊。',
    },
  },
  {
    path: 'notice',
    loadComponent: () => import('./pages/notice').then((m) => m.Notice),
    title: '購物須知 ｜ PluPlu Land',
    data: {
      description:
        'PluPlu Land 娃衣選品購物須知：出貨時間、訂單規範、取貨說明與退換貨規則，下單前請先看看。',
    },
  },

  // 舊版 .html 網址的轉址保險（線上主要由 netlify.toml 處理 301）
  // 倉鼠娃頁（2026-07-17）與娃裝配件頁（2026-08-05）已移除：
  // 倉鼠娃舊連結回首頁、娃裝配件舊連結轉到娃衣選品
  { path: 'index.html', redirectTo: '' },
  { path: 'hamu', redirectTo: '' },
  { path: 'hamu.html', redirectTo: '' },
  { path: 'shop.html', redirectTo: 'shop' },
  { path: 'goods', redirectTo: 'shop' },
  { path: 'goods.html', redirectTo: 'shop' },
  { path: 'story.html', redirectTo: 'story' },
  { path: 'contact.html', redirectTo: 'contact' },
  { path: 'notice.html', redirectTo: 'notice' },

  { path: '**', redirectTo: '' },
];
