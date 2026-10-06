# -*- coding: utf-8 -*-
"""從 7-11 賣貨便賣場全量同步「價格／款式／現貨預購／庫存」到 plupluland_products.md。

用法：
    python scripts/sync-myship-specs.py                 # 連線抓最新賣場頁，只列出差異（不寫檔）
    python scripts/sync-myship-specs.py --write         # 確認差異後寫回 md
    python scripts/sync-myship-specs.py --html x.html   # 用已存檔的頁面（離線）

寫回後接著跑 python scripts/build-products-json.py 產生正式資料。

規則（主理人指定，2026-10-06：價格、款式、庫存全部跟賣場一致）：
- 款式清單與順序照賣場；賣場沒有的款式從官網移除，賣場新增的款式補上官網。
- 價格：賣場有特價就用特價（原價記在 original_price，官網卡片顯示特價後價格）。
- 庫存：賣場可售數量 0 → 該款式標「無庫存」；全部款式都無庫存 → 整項完售。
- 名稱：賣場與官網只差在標點、空格或「售完不補」字樣的，**沿用官網既有寫法**，
  款式專屬圖（variants/{編號}_{規格名}.jpg）才接得上；寫法差很多但其實是同一款的，
  登記在下面的 NAME_ALIAS。
- 商品名稱、主圖、官網文案都不動（文案要改另外改 docs/products/web-copy.md）。
- 瑕疵／出清款一律跳過（與照片同步腳本同一套 DEFECT_RE）。
"""

import argparse
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_MD = ROOT / "plupluland_products.md"


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


gallery = _load("sync_gallery", "sync-myship-gallery.py")
build = _load("build_products", "build-products-json.py")

# 官網手動整理、不跟賣場規格走的商品（主理人核准，2026-10-06）
# 66 手工訂製泰服：賣場只有一個「訂金」規格，官網依描述改成裙裝款／褲裝款兩款完售展示
KEEP_SITE = {"66"}

# 賣場規格名 → 官網款式名（寫法差很多但其實是同一款；比對用 variant_key 正規化後的鍵）
NAME_ALIAS = {
    "04": {"現貨": "單一規格"},
    "16": {"現貨": "單一規格"},
    "65": {"現貨": "草編包"},
    "20": {
        "加購蠟繩，需和官方Line確認顏色": "加購蠟繩（顏色請洽官方 LINE）",
        "【韓國直送】綠色汽水（吧?）": "【韓國直送】綠色汽水（吧？）",
    },
    "30": {"6cm黑框透片（請備註方框/圓框，沒寫將隨機出貨）": "眼鏡 - 6cm - 黑框透片（請備註方框或圓框）"},
    "54": {"小羊頭套+澎澎洋裝小羊配色 套裝優惠": "小羊頭套＋澎澎洋裝套裝優惠"},
    "57": {
        "相機顏色-現貨，黑,蠟繩顏色-黑色蠟繩": "黑相機・黑色蠟繩",
        "相機顏色-現貨，黑,蠟繩顏色-淺棕蠟繩": "黑相機・淺棕蠟繩",
        "相機顏色-現貨，黑,蠟繩顏色-深咖蠟繩": "黑相機・深咖蠟繩",
        "相機顏色-現貨，黑,蠟繩顏色-隨機出貨": "黑相機・蠟繩隨機出貨",
        "相機顏色-預購，棕,蠟繩顏色-黑色蠟繩": "棕相機・黑色蠟繩",
        "相機顏色-預購，棕,蠟繩顏色-淺棕蠟繩": "棕相機・淺棕蠟繩",
        "相機顏色-預購，棕,蠟繩顏色-深咖蠟繩": "棕相機・深咖蠟繩",
        "相機顏色-預購，棕,蠟繩顏色-隨機出貨": "棕相機・蠟繩隨機出貨",
    },
}


def store_products(page):
    """{官網編號: 賣場商品 JSON}"""
    import html as html_mod
    import json
    out = {}
    for raw in re.findall(r'data-product="([^"]*)"', page):
        try:
            obj = json.loads(html_mod.unescape(raw))
        except json.JSONDecodeError:
            continue
        pid = gallery.ID_MAP.get(obj["Cgdd_Id"])
        if pid and pid not in out:
            out[pid] = obj
    return out


def site_variants(block):
    """md 區塊 → [(供貨, 名稱, 價格, 有庫存)]"""
    rows = []
    for vm in re.finditer(r"^  - (.+)$", block, flags=re.M):
        parts = [p.strip() for p in vm.group(1).split("｜")]
        in_stock = parts[-1] != "無庫存"
        rest = parts[1:-1] if not in_stock else parts[1:]
        price = None
        if rest and re.fullmatch(r"\$\d+", rest[-1]):
            price = int(rest[-1][1:])
            rest = rest[:-1]
        rows.append(("預購" if parts[0].startswith("預購") else "現貨", "｜".join(rest), price, in_stock))
    return rows


def store_variants(pid, obj, old_rows):
    """賣場規格 → [(供貨, 官網款式名, 售價, 原價, 有庫存)]"""
    old_by_key = {build.variant_key(r[1]): r for r in old_rows}
    alias = NAME_ALIAS.get(pid, {})
    out = []
    for s in obj.get("Spec") or []:
        spec = (s.get("Cgds_Spec") or "").strip()
        if build.DEFECT_RE.search(spec):
            continue
        # 供貨方式只認開頭的「現貨，／預購，」或雙規格的「相機顏色-現貨，」，
        # 不從名稱中間亂抓（例：「XX（預購款）」不該被當成預購）
        sm = re.match(r"(?:[^，,]*-)?(現貨|預購)", spec)
        bare = re.sub(r"^(現貨|預購中?)\s*[，,]\s*", "", spec).strip()
        name = alias.get(spec) or alias.get(bare)
        if name is None:
            old = old_by_key.get(build.variant_key(spec))
            name = old[1] if old else bare
        if not name or name in ("現貨", "預購"):
            raise SystemExit("#%s 的賣場規格「%s」沒有款式名稱，請在 NAME_ALIAS 補一個官網名稱" % (pid, spec))
        # 賣場沒寫現貨／預購（例：#30 黑框透片）就沿用官網原本的供貨方式，新款式預設現貨
        if sm:
            supply = sm.group(1)
        else:
            old = old_by_key.get(build.variant_key(name))
            supply = old[0] if old else "現貨"
        price = int(s.get("Cgds_Price") or 0)
        sale = int(s.get("Cgds_SPrice") or 0)
        if not (sale or price):
            raise SystemExit("#%s 的賣場規格「%s」沒有價格，請到賣場確認後再同步" % (pid, spec))
        out.append((supply, name, sale or price, price, int(s.get("Inventory") or 0) > 0))
    names = [r[1] for r in out]
    dup = sorted({n for n in names if names.count(n) > 1})
    if dup:
        raise SystemExit("#%s 有兩個賣場規格對到同一個官網款式名稱：%s，請在 NAME_ALIAS 分開命名"
                         % (pid, "、".join(dup)))
    return out


def render(rows):
    lines = []
    for supply, name, price, _orig, in_stock in rows:
        line = "  - %s｜%s｜$%d" % (supply, name, price)
        if not in_stock:
            line += "｜無庫存"
        lines.append(line)
    return lines


def product_fields(rows):
    """商品層級的 price／price_max／original_price／status。
    卡片標的「最低價」只看還買得到的款式（全部完售才看全部），顧客看到的價格一定買得到。"""
    pool = [r for r in rows if r[4]] or rows
    low = min(r[2] for r in pool)
    high = max(r[2] for r in pool)
    original = min(r[3] for r in pool if r[2] == low)
    if not any(r[4] for r in rows):
        status = "無庫存"
    elif low < original:
        status = "販售中（特價）"
    else:
        status = "販售中"
    return low, (high if high != low else None), original, status


def rewrite_block(block, rows):
    low, high, original, status = product_fields(rows)
    head, _, _ = block.partition("- **variants**:")
    head = re.sub(r"^- \*\*price_max\*\*: .*\n", "", head, flags=re.M)
    head = re.sub(r"^- \*\*price\*\*: .*$",
                  "- **price**: %d" % low + ("\n- **price_max**: %d" % high if high else ""),
                  head, count=1, flags=re.M)
    head = re.sub(r"^- \*\*original_price\*\*: .*$", "- **original_price**: %d" % original, head, count=1, flags=re.M)
    head = re.sub(r"^- \*\*status\*\*: .*$", "- **status**: %s" % status, head, count=1, flags=re.M)
    tail = re.search(r"\n*\Z", block).group(0)
    return head + "- **variants**:\n" + "\n".join(render(rows)) + tail


def diff_lines(pid, old_rows, new_rows):
    out = []
    old = {r[1]: r for r in old_rows}
    new = {r[1]: r for r in new_rows}
    for name, r in new.items():
        o = old.get(name)
        if not o:
            out.append("  ＋ 新增款式：%s（%s，NT$ %d%s）" % (name, r[0], r[2], "" if r[4] else "，無庫存"))
            continue
        if o[2] != r[2]:
            out.append("  ＄ %s：NT$ %s → %d" % (name, o[2], r[2]))
        if o[0] != r[0]:
            out.append("  ⇄ %s：%s → %s" % (name, o[0], r[0]))
        if o[3] != r[4]:
            out.append("  ● %s：%s → %s" % (name, "有貨" if o[3] else "無庫存", "有貨" if r[4] else "無庫存"))
    for name in old:
        if name not in new:
            out.append("  － 移除款式：%s（賣場已經沒有）" % name)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", help="改讀已存檔的賣場頁（離線用）")
    ap.add_argument("--write", action="store_true", help="把差異寫回 plupluland_products.md")
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")   # Windows 終端機預設 cp950，印不出「⇄」等符號
    store = store_products(gallery.fetch_html(args.html))
    if len(store) < gallery.MIN_PRODUCTS:
        print("只解析到 %d 項商品，可能是賣場頁面改版了，這次不寫任何檔案。" % len(store))
        sys.exit(1)
    # 賣場改了庫存欄位名稱的話，每個款式都會被誤判成無庫存、整站變完售：寫檔前先停手
    specs = [s for o in store.values() for s in o.get("Spec") or []]
    if sum(1 for s in specs if "Inventory" not in s) > len(specs) / 2:
        print("賣場資料裡大部分規格都找不到庫存欄位，可能是賣場頁面改版了，這次不寫任何檔案。")
        sys.exit(1)

    text = PRODUCTS_MD.read_text(encoding="utf-8")
    pattern = re.compile(r"^### (\d{2})\..*?\n(?=^### |^---|\Z)", flags=re.M | re.S)
    changed, report = 0, []

    def repl(m):
        nonlocal changed
        pid, block = m.group(1), m.group(0)
        if pid not in store or pid in KEEP_SITE:
            return block
        if not any(not build.DEFECT_RE.search(s.get("Cgds_Spec") or "") for s in store[pid].get("Spec") or []):
            report.append("#%s 賣場上沒有可用的規格（全是瑕疵款或空的），這項先不動，請人工確認" % pid)
            return block
        old_rows = site_variants(block.partition("- **variants**:")[2])
        new_rows = store_variants(pid, store[pid], old_rows)
        new_block = rewrite_block(block, new_rows)
        if new_block != block:
            changed += 1
            report.append("#%s %s" % (pid, block.splitlines()[0][4:].strip()))
            report.extend(diff_lines(pid, old_rows, new_rows) or ["  （款式排列順序，或「還買得到的款式」價格區間跟著賣場調整）"])
        return new_block

    new_text = pattern.sub(repl, text)
    gone = sorted(set(re.findall(r"^### (\d{2})\.", text, flags=re.M)) - set(store) - gallery.KEPT_OFFLINE)
    if gone:
        report.append("提醒：這幾項在賣場上找不到了（可能已下架），官網資料先不動：%s" % "、".join(gone))
    print("\n".join(report) if report else "官網價格、款式、庫存都已經跟賣場一致。")
    print("\n共 %d 項商品有差異。" % changed)
    if changed and args.write:
        PRODUCTS_MD.write_text(new_text, encoding="utf-8", newline="\n")
        print("已寫回 %s，接著請跑 python scripts/build-products-json.py" % PRODUCTS_MD.relative_to(ROOT))
    elif changed:
        print("（只列出差異，沒有寫檔；確認後加 --write 寫回）")


if __name__ == "__main__":
    main()
