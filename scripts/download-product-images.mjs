// 批次下載 7-11 賣貨便商品圖片到 assets/images/products/
// 用法：node scripts/download-product-images.mjs
// 下載完成後同時產出 docs/products/image-map.md（原 URL → 新檔名對照表）
// ⚠️ 重新執行會抓回「未壓縮」的原始檔（部分為 PNG），之後務必再跑：
//    python scripts/compress-product-images.py
// ⚠️ #30 首圖為主理人提供的本地照片（localOverride），不會從 CDN 下載

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'assets', 'images', 'products');
const MAP_FILE = path.join(ROOT, 'docs', 'products', 'image-map.md');
const CDN = 'https://myship.7-11.com.tw/i/cgdm/GM2605058795102/';

// id：商品編號（00 = 賣場主圖）；slug：檔名用英文描述；name：品名（供對照表核對用）
const CATALOG = [
  { id: '00', slug: 'storefront', name: '賣場主圖', file: 'GM2605058795102_3524556.jpg' },
  { id: '01', slug: 'livheart-hamster-plush', name: '【日本livheart正貨】捏捏倉鼠玩偶 はむにぎり療癒小勞贖🐹（售完不補）', file: '2605071158954380.jpg' },
  { id: '02', slug: 'knit-ear-hat', name: '【織女手工系列】毛茸茸訂做兔耳帽', file: '2607061247170280.jpg' },
  { id: '03', slug: 'sleep-set', name: '😴好眠套組（睡衣＆懶骨頭可拆買）', file: '2606271234034159.jpg' },
  { id: '04', slug: 'shirt-skirt-set', name: '元氣少女套裝（含鵝黃襯衫+氧氣感淺藍紗裙）', file: '2607111255068578.jpg' },
  { id: '05', slug: 'longline-top', name: '百搭打底長版上衣', file: '2607131257858764.jpg' },
  { id: '06', slug: 'tiered-jacquard-skirt', name: '雙層緹花蛋糕裙（超多顏色！）', file: '2607111255024181.jpg' },
  { id: '07', slug: 'handknit-horn-bag', name: '斜背牛角包', file: '2607131258185106.jpg' },
  { id: '08', slug: 'pearl-necklace', name: '【韓國直送】珍珠項鍊', file: '2607081250383860.jpg' },
  { id: '09', slug: 'tweed-dress', name: '小香風洋裝', file: '2607081250372913.jpg' },
  { id: '10', slug: 'work-apron', name: '工作圍兜兜', file: '2607061247587393.jpg' },
  { id: '11', slug: 'denim-overalls', name: '率性牛仔吊帶褲', file: '2607021242050673.jpg' },
  { id: '12', slug: 'chipmunk-hat', name: '【織女手工系列】花立鼠帽帽', file: '2607061247255522.jpg' },
  { id: '13', slug: 'fruit-earflap-hat', name: '【織女手工系列】水果露耳帽帽', file: '2607061247418001.jpg' },
  { id: '14', slug: 'strawberry-headband', name: '【韓國直送】🍎蘋果小波浪寶寶髮帶（露耳款）', file: '2606281235724127.jpg' },
  { id: '15', slug: 'elf-triangle-hat', name: '【韓國直送】小精靈三角針織帽（露耳款）', file: '2606241229985463.jpg' },
  { id: '16', slug: 'chick-headpiece', name: '【韓國直送】🐥小雞頭套（露耳款）', file: '2606241229992569.jpg' },
  { id: '17', slug: 'ski-set', name: '【韓國直送】探險寶寶套組：針織相機包/針織小棕帽', file: '2606281235696597.jpg' },
  { id: '18', slug: 'plaid-schoolbag', name: '格紋小布包', file: '2606281235536314.jpg' },
  { id: '19', slug: 'drink-bag', name: '【韓國直送】、【織女手工系列】飲料提袋', file: '2607091251609316.jpg' },
  { id: '20', slug: 'mini-drinks-candy', name: '迷你配件 - 飲料、糖果系列', file: '2607111255111317.jpg' },
  { id: '21', slug: 'velvet-dress-cape', name: '細閃燈芯絨洋裝/斗篷', file: '2606271234018577.jpg' },
  { id: '22', slug: 'floral-skirt', name: '田園碎花裙', file: '2606241230090427.jpg' },
  { id: '23', slug: 'lace-trim-cape', name: '蕾絲滾邊斗篷', file: '2606241230066497.jpg' },
  { id: '24', slug: 'cardigan', name: '文青鈕扣毛衣', file: '2606241230020240.jpg' },
  { id: '25', slug: 'princess-tweed-dress', name: '公主紗肩帶小香風洋裝', file: '2606241230011672.jpg' },
  { id: '26', slug: 'mini-boba-bottle', name: '迷你配件 - 珍珠奶茶🧋/水壺💧', file: '2606281235813445.jpg' },
  { id: '27', slug: 'mini-popcorn-console', name: '迷你配件 - 爆米花🍿、遊戲機🎮', file: '2606231228351985.jpg' },
  { id: '28', slug: 'elf-triangle-hat-blue', name: '【韓國直送】小精靈三角針織帽 - 藍', file: '2606231228369136.jpg' },
  { id: '29', slug: 'glasses-4-5cm', name: '眼鏡、墨鏡 4.5cm', file: '2606091207512335.jpg' },
  { id: '30', slug: 'glasses-6cm', name: '眼鏡、墨鏡 6cm', localOverride: '30-glasses-6cm.jpg', file: '2607061247195420.jpg' },
  { id: '31', slug: 'knit-bib', name: '針織口水巾', file: '2605071159063793.jpg' },
  { id: '32', slug: 'qing-headdress', name: '【織女手工系列】清宮頭飾 打造你的鼠鼠後宮', file: '2606111210324080.jpg' },
  { id: '33', slug: 'halloween-pumpkin-bag', name: '南瓜套裝萬聖節戰袍', file: '2606111210270334.jpg' },
  { id: '34', slug: 'lace-bow-dress', name: '蕾絲蝴蝶結洋裝', file: '2605271188599464.jpg' },
  { id: '35', slug: 'denim-fringe-dress', name: '流蘇牛仔洋裝☀️', file: '2605271188595592.jpg' },
  { id: '36', slug: 'lolita-flower-skirt', name: '粉嫩莫內花園裙', file: '2605271188579244.jpg' },
  { id: '37', slug: 'knit-sweater', name: '暖暖針織毛衣', file: '2605071159060134.jpg' },
  { id: '38', slug: 'tweed-shawl', name: '小香風披肩', file: '2605091162829824.jpg' },
  { id: '39', slug: 'mini-suitcase', name: '迷你行李箱🧳', file: '2605081160641577.jpg' },
  { id: '40', slug: 'plush-slippers', name: '軟Q毛毛圍脖', file: '2605071159290791.jpg' },
  { id: '41', slug: 'raincoat', name: '應該有防水的雨衣☔️', file: '2605071160046319.jpg' },
  { id: '42', slug: 'soft-headpiece', name: '超軟Q造型頭套', file: '2606111210307267.jpg' },
  { id: '43', slug: 'fluffy-cape', name: '⚡開幕優惠6折⚡毛絨絨斗篷披肩', file: '2605071159195482.jpg' },
  { id: '44', slug: 'strawberry-knit-bag', name: '【韓國直送】蘋果托特包，可斜背', file: '2607061247247447.jpg' },
  { id: '45', slug: 'gradient-tulle-dress', name: '夢幻渲染彩紗裙', file: '2605281189626012.jpg' },
  { id: '46', slug: 'flower-suspender-skirt', name: '花苞吊帶裙🌹', file: '2605071159294749.jpg' },
  { id: '47', slug: 'princess-puff-skirt', name: '仙氣公主澎澎裙', file: '2605071159196023.jpg' },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Referer': 'https://myship.7-11.com.tw/general/detail/GM2605058795102',
};

// CDN 副檔名不可信（.jpg 可能實為 PNG），以檔頭判斷真實格式
function sniffExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

async function download(item, attempt = 1) {
  if (item.localOverride) {
    return { ...item, url: '（主理人提供之本地照片）', filename: item.localOverride, bytes: 0, ok: true };
  }
  const url = CDN + item.file;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = buf.length >= 1024 ? sniffExt(buf) : null;
    if (!ext) throw new Error(`無法辨識的內容（${buf.length} bytes）`);
    const filename = `${item.id}-${item.slug}.${ext}`;
    const dest = path.join(OUT_DIR, filename);
    await writeFile(dest, buf);
    return { ...item, url, dest, filename, bytes: buf.length, ok: true };
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return download(item, attempt + 1);
    }
    return { ...item, url, ok: false, error: String(err) };
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MAP_FILE), { recursive: true });

  const results = [];
  const queue = [...CATALOG];
  const CONCURRENCY = 5;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const item = queue.shift();
        const r = await download(item);
        results.push(r);
        console.log(r.ok ? `✓ ${r.filename} (${r.bytes} bytes)` : `✗ ${item.id} 失敗：${r.error}`);
      }
    })
  );

  results.sort((a, b) => a.id.localeCompare(b.id));
  const failed = results.filter((r) => !r.ok);

  const rows = results.map((r) =>
    `| ${r.id} | ${r.name} | ${r.ok ? `\`assets/images/products/${r.filename}\`` : '—'} | ${r.url} | ${r.ok ? '✅' : '❌ 失敗'} |`
  );
  const map = [
    '# 商品圖片對照表（原 URL → 官網本地檔名）',
    '',
    `> 由 \`scripts/download-product-images.mjs\` 產出。共 ${results.length} 張（含賣場主圖 00），成功 ${results.length - failed.length} 張。`,
    '> 品名標示「待校對」者，是因原始資料檔中文編碼損毀、由 Claude 還原，請比對賣貨便原文。',
    '',
    '| 編號 | 品名 | 新檔名 | 原 URL | 狀態 |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
  await writeFile(MAP_FILE, map, 'utf8');

  console.log(`\n完成：${results.length - failed.length}/${results.length} 張成功`);
  console.log(`對照表：${MAP_FILE}`);
  if (failed.length) process.exit(1);
}

main();
