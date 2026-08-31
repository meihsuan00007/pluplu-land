/**
 * PluPlu Land 銷量統計 API（Google Apps Script）
 * ------------------------------------------------
 * 用途：讀取「私密」的銷售紀錄 Google 試算表，只統計並輸出
 *      「商品名稱: 累計售出數量」的純 JSON，給官網的「熱銷排行」排序用。
 *      例：{ "雙層緹花蛋糕裙": 25, "毛茸茸訂做兔耳帽": 18 }
 *
 * 安全原則（勿改壞）：
 * - 試算表本身完全不公開、不開「知道連結可檢視」；對外只有這支腳本的網址。
 * - 本腳本「只」讀取商品名稱與數量兩欄，嚴禁輸出客戶姓名、電話、地址、
 *   金額、訂單編號等任何其他欄位。要加新輸出前請先三思。
 *
 * 部署方式見官網專案的 docs/SALES-API-SETUP.md（一步一步的白話指南）。
 */

/* ===== 依你的試算表調整這一區 ===== */

/** 銷售紀錄所在的工作表名稱（試算表下方的分頁籤名稱）。
 *  找不到這個名稱時會自動改用第一個分頁。 */
const SHEET_NAME = '銷售紀錄';

/** 「商品名稱」那一欄的標題可能叫什麼（第一列的欄位名稱，任一個對上就算）。 */
const NAME_HEADERS = ['商品名稱', '品項', '品名', '商品'];

/** 「數量」那一欄的標題可能叫什麼。
 *  若整張表根本沒有數量欄（一列＝賣出一件），腳本會自動每列算 1 件。 */
const QTY_HEADERS = ['數量', '售出數量', '件數', '銷量'];

/** 試算表 ID（必填，2026-08-31 起改為一律用 ID 開啟）：
 *  把試算表網址中 /d/ 與 /edit 之間那一長串貼進來，例如 '1AbCdEfG...'。
 *  為什麼：網頁方式（doGet）被外部呼叫時，腳本不一定「站在試算表裡面」，
 *  getActiveSpreadsheet() 會報「指定的權限不足」；用 ID 直接開啟最穩定。
 *  （這份存在官網程式庫裡的範本刻意留空；實際的 ID 只貼在你 Google 帳號內的 Apps Script 專案裡） */
const SPREADSHEET_ID = '';

/** 統計結果快取秒數：期間內重複的請求直接回快取，不會一直重讀試算表。
 *  300 秒＝銷量最多延遲 5 分鐘更新，對熱銷排行綽綽有餘。 */
const CACHE_SECONDS = 300;

/* ===== 以下不需要動 ===== */

function doGet() {
  var cache = CacheService.getScriptCache();
  var json = cache.get('pluplu-sales-json');
  if (!json) {
    json = buildSalesJson_();
    cache.put('pluplu-sales-json', json, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** 在編輯器裡手動執行這個函式一次：完成 Google 帳號授權，並在下方「執行紀錄」預覽統計結果。
 *  部署前先跑這個，網頁版就不會遇到「指定的權限不足」。 */
function testSalesApi() {
  Logger.log(buildSalesJson_());
}

/** 讀表並統計成 {商品名稱: 累計數量} 的 JSON 字串（只碰名稱與數量兩欄） */
function buildSalesJson_() {
  if (!SPREADSHEET_ID) {
    throw new Error('請先在最上方的 SPREADSHEET_ID 填入試算表 ID（網址 /d/ 與 /edit 之間那串），見 docs/SALES-API-SETUP.md');
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) throw new Error('用這個 ID 打不開試算表，請確認 SPREADSHEET_ID 是否貼對');
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return '{}';

  var header = values[0].map(function (h) { return String(h).trim(); });
  var nameCol = findCol_(header, NAME_HEADERS);
  var qtyCol = findCol_(header, QTY_HEADERS);
  if (nameCol < 0) {
    throw new Error('第一列找不到商品名稱欄（找過：' + NAME_HEADERS.join('、') + '）。請把 NAME_HEADERS 加上你實際的欄位名稱。');
  }

  var totals = {};
  for (var r = 1; r < values.length; r++) {
    var name = String(values[r][nameCol] || '').trim();
    if (!name) continue;
    var qty = 1; // 沒有數量欄＝一列算一件
    if (qtyCol >= 0) {
      var n = Number(values[r][qtyCol]);
      qty = isFinite(n) && n > 0 ? n : 0;
    }
    if (qty > 0) totals[name] = (totals[name] || 0) + qty;
  }
  return JSON.stringify(totals);
}

function findCol_(header, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return -1;
}
