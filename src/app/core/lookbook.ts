/** 首頁「Lookbook 小基地」照片庫（2026-08-31 主理人指定）。
 *  每次重新整理網頁，從這裡隨機抽 6 張不重複的實拍照填進 6 格。
 *  新增照片：把檔案放進 images/uploads/，在這份清單加一筆（label 是角落小籤的文字，alt 給讀屏與圖片壞掉時用）。
 *  只收「有娃寶入鏡」的生活實拍；海報 Banner 與純道具照不放（Banner 是文案圖、道具照沒有娃寶）。
 *  全站堅持實拍，這裡一樣不放任何 AI 生成圖。 */
export interface LookbookPhoto {
  src: string;
  label: string;
  alt: string;
}

export const LOOKBOOK_POOL: readonly LookbookPhoto[] = [
  { src: 'images/uploads/wineglass-nightcap.jpg', label: '晚安時光', alt: '娃寶戴著藍色睡帽靠在酒杯旁' },
  { src: 'images/uploads/strawhat-trio.jpg', label: '野餐日', alt: '三隻娃寶戴著草帽野餐' },
  { src: 'images/uploads/capes-collection.jpg', label: '披肩收藏', alt: '娃寶披肩收藏陳列' },
  { src: 'images/uploads/sleepy-beanbags.jpg', label: '午睡角落', alt: '兩隻娃寶窩在豆袋裡睡覺' },
  { src: 'images/uploads/pearl-butterfly-detail.jpg', label: '珠寶細節', alt: '娃裝上的珍珠蝴蝶項鍊特寫' },
  { src: 'images/uploads/peach-strawhat.jpg', label: '水蜜桃季', alt: '娃寶戴草莓帽坐在水蜜桃旁' },
  { src: 'images/uploads/bunny-hood-duo.jpg', label: '森林兔兔', alt: '戴著白色兔耳帽、圍蕾絲蝴蝶結的娃寶在森林場景中' },
  { src: 'images/uploads/crochet-hat-closeup.jpg', label: '鉤織毛帽', alt: '娃寶戴著粉藍雙色鉤織毛帽特寫' },
  { src: 'images/uploads/cuddle-closeup.jpg', label: '依偎時刻', alt: '兩隻娃寶依偎在一起的特寫' },
  { src: 'images/uploads/dollhouse-group.jpg', label: '娃屋派對', alt: '多隻娃寶穿著不同針織裝聚在陳列場景中' },
  { src: 'images/uploads/denim-dress-hand.jpg', label: '掌心寶貝', alt: '白色娃寶穿著牛仔小洋裝窩在掌心' },
  { src: 'images/uploads/blue-floral-dress.jpg', label: '絲絨細節', alt: '娃寶紅色絲絨披肩的手縫細節特寫' },
  { src: 'images/uploads/couple-knit-coat.jpg', label: '老派約會', alt: '戴眼鏡穿黑色針織外套的娃寶，與穿格紋小洋裝、戴珍珠項鍊的娃寶並肩合照' },
  { src: 'images/uploads/cream-knit-vest.jpg', label: '紫色小帽', alt: '娃寶戴著紫色鉤織尖帽的特寫' },
  { src: 'images/uploads/gingham-overalls.jpg', label: '粉色夢境', alt: '娃寶穿著粉色睡帽與披肩窩在粉色抱枕裡' },
  { src: 'images/uploads/halloween-hood.jpg', label: '萬聖節', alt: '娃寶戴著黑色南瓜巫師帽與橘色毛球領巾' },
  { src: 'images/uploads/hamu-chick-hood.jpg', label: '小雞帽', alt: '娃寶戴著黃色小雞頭套躲在紙絲裡' },
  { src: 'images/uploads/red-velvet-duo.jpg', label: '聖誕紅', alt: '兩隻娃寶穿著紅色絲絨披肩的合照' },
  { src: 'images/uploads/strawberry-hat-bag.jpg', label: '野餐小包', alt: '灰色娃寶戴著粉色鉤織草帽、背著小包坐在木樁上' },
  { src: 'images/uploads/tweed-pearl-coat.jpg', label: '珍珠項鍊', alt: '娃寶穿著紅色絲絨披肩、戴珍珠愛心項鍊的特寫' },
];

/** 從照片庫隨機抽 count 張不重複的照片（Fisher-Yates 洗牌，只洗需要的前 count 格）。
 *  rand 可注入（測試用固定亂數），預設 Math.random。照片庫不足 count 張時回傳全部（順序仍隨機）。 */
export function pickLookbook(
  count = 6,
  pool: readonly LookbookPhoto[] = LOOKBOOK_POOL,
  rand: () => number = Math.random,
): LookbookPhoto[] {
  const deck = pool.slice();
  const n = Math.min(count, deck.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, n);
}
