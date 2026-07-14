# 解析 plupluland_products.md（商品資料）＋ docs/products/web-copy.md（官網文案定稿）
# 產出 content/products-store.json 供官網商品頁使用
# 用法：python scripts/build-products-json.py

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_MD = ROOT / "plupluland_products.md"
WEBCOPY_MD = ROOT / "docs" / "products" / "web-copy.md"
OUT = ROOT / "content" / "products-store.json"

# 規格專屬圖片資料夾：檔名照「{商品編號}_{規格名稱}.jpg」放進來，
# 重跑本腳本就會自動接到對應規格的 image 欄位（規格名稱中的空格移除、「/」改「-」）。
# 例：06_暖陽黃.jpg、30_眼鏡-6cm-透棕框.jpg
VARIANT_DIR = ROOT / "assets" / "images" / "products" / "variants"
VARIANT_EXTS = (".jpg", ".jpeg", ".png", ".webp")


def variant_stem(pid, vname):
    """商品編號＋規格名稱 → 規格圖片的檔名主體（去空格、斜線改連字號）"""
    return f"{pid}_" + vname.replace(" ", "").replace("/", "-").replace("｜", "-")

# 主分類（2026-07-14 經主理人確認：一個主分類＋多個標籤）
CATEGORIES = [
    {"key": "doll", "label": "玩偶本體"},
    {"key": "dress", "label": "洋裝"},
    {"key": "skirt", "label": "裙子"},
    {"key": "top", "label": "上衣・毛衣"},
    {"key": "bottom", "label": "褲裝・吊帶"},
    {"key": "set", "label": "套裝"},
    {"key": "outerwear", "label": "外套・披肩"},
    {"key": "headwear", "label": "帽子・頭飾"},
    {"key": "bag", "label": "包包・提袋"},
    {"key": "accessory", "label": "配件小物"},
]
CATEGORY_OF = {
    "01": "doll",
    "09": "dress", "21": "dress", "25": "dress", "34": "dress", "35": "dress", "45": "dress",
    "06": "skirt", "22": "skirt", "36": "skirt", "46": "skirt", "47": "skirt",
    "05": "top", "24": "top", "37": "top",
    "11": "bottom",
    "03": "set", "04": "set", "17": "set", "33": "set",
    "23": "outerwear", "38": "outerwear", "41": "outerwear", "43": "outerwear",
    "02": "headwear", "12": "headwear", "13": "headwear", "14": "headwear", "15": "headwear",
    "16": "headwear", "28": "headwear", "32": "headwear", "42": "headwear",
    "07": "bag", "18": "bag", "19": "bag", "39": "bag", "44": "bag",
    "08": "accessory", "10": "accessory", "20": "accessory", "26": "accessory", "27": "accessory",
    "29": "accessory", "30": "accessory", "31": "accessory", "40": "accessory",
}
FESTIVE = {"33"}  # 節慶限定標籤

SALE_BADGE = "⚡開幕優惠6折⚡"


def parse_webcopy():
    """回傳 {id: {"description": str, "reminder": str|None}}"""
    text = WEBCOPY_MD.read_text(encoding="utf-8")
    body = text.split("---", 1)[1]  # 跳過表頭（第一個 --- 之後才是內文）
    body = body.split("## 待品牌確認事項")[0]
    result = {}
    for m in re.finditer(r"^### (\d{2})\.[^\n]*\n(.*?)(?=^### |\Z)", body, flags=re.M | re.S):
        pid, block = m.group(1), m.group(2).strip()
        reminder = None
        desc_lines = []
        for line in block.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("**小提醒**："):
                reminder = line.removeprefix("**小提醒**：").strip()
            else:
                desc_lines.append(line)
        result[pid] = {"description": " ".join(desc_lines), "reminder": reminder}
    return result


def parse_products():
    text = PRODUCTS_MD.read_text(encoding="utf-8")
    items = []
    for m in re.finditer(
        r"^### (\d{2})\.\s*(.+?)\n(.*?)(?=^### |^---)", text, flags=re.M | re.S
    ):
        pid, raw_name, block = m.group(1), m.group(2).strip(), m.group(3)

        def field(key):
            fm = re.search(rf"- \*\*{key}\*\*: (.+)", block)
            return fm.group(1).strip() if fm else None

        price = int(field("price"))
        original = int(field("original_price"))
        status_raw = field("status")
        image = field("image")

        name = raw_name.replace("（不含娃娃本體）", "").strip()
        body_included = "（不含娃娃本體）" not in raw_name
        sale_label = None
        if SALE_BADGE in name:
            name = name.replace(SALE_BADGE, "").strip()
            sale_label = "開幕優惠 6 折"

        tags = re.findall(r"【(.+?)】", name)
        on_sale = price < original
        if on_sale and "特價" not in tags:
            tags.append("特價")
        if pid in FESTIVE:
            tags.append("節慶限定")

        variants = []
        for vm in re.finditer(r"^  - (.+)$", block, flags=re.M):
            parts = [p.strip() for p in vm.group(1).split("｜")]
            supply = "預購" if parts[0].startswith("預購") else "現貨"
            assert parts[0] in ("現貨", "預購", "預購中"), f"#{pid} 未知供貨方式：{parts[0]}"
            in_stock = parts[-1] != "無庫存"
            vname = "｜".join(parts[1:-1] if not in_stock else parts[1:])
            variants.append({
                "supply": supply,
                "name": vname,
                "in_stock": in_stock,
                "image": None,  # 由 link_variant_images() 依檔名自動填入
            })

        items.append({
            "id": pid,
            "name": name,
            "category": CATEGORY_OF[pid],
            "tags": tags,
            "price": price,
            "original_price": original,
            "on_sale": on_sale,
            "sale_label": sale_label,
            "status": "sold_out" if "無庫存" in status_raw else "available",
            "body_included": body_included,
            "image": image,
            "variants": variants,
        })
    return items


def link_variant_images(items):
    """掃描 VARIANT_DIR，把檔名符合「{編號}_{規格名}」的圖片接到對應規格。
    回傳 (連結成功數, 對不到任何規格的檔案清單)。"""
    if not VARIANT_DIR.exists():
        return 0, []
    files = {}  # stem -> Path
    for f in VARIANT_DIR.iterdir():
        if f.suffix.lower() in VARIANT_EXTS:
            files[f.stem] = f
    linked = 0
    used = set()
    for item in items:
        for v in item["variants"]:
            stem = variant_stem(item["id"], v["name"])
            if stem in files:
                v["image"] = f"assets/images/products/variants/{files[stem].name}"
                used.add(stem)
                linked += 1
    orphans = [files[s].name for s in sorted(set(files) - used)]
    return linked, orphans


def main():
    items = parse_products()
    copy = parse_webcopy()
    for item in items:
        c = copy.get(item["id"], {})
        item["description"] = c.get("description", "")
        item["reminder"] = c.get("reminder")
    linked, orphans = link_variant_images(items)

    # 驗證
    errors = []
    if len(items) != 47:
        errors.append(f"商品數 {len(items)} ≠ 47")
    for item in items:
        if not (ROOT / item["image"]).exists():
            errors.append(f"#{item['id']} 圖片不存在：{item['image']}")
        if not item["variants"]:
            errors.append(f"#{item['id']} 沒有任何規格")
        if not item["description"]:
            errors.append(f"#{item['id']} 缺官網文案")
        for v in item["variants"]:
            if v["image"] and not (ROOT / v["image"]).exists():
                errors.append(f"#{item['id']} 規格圖不存在：{v['image']}")
    if orphans:
        errors.append("以下規格圖檔名對不到任何規格（請核對編號與規格名稱）：" + "、".join(orphans))
    if errors:
        print("驗證失敗：", *errors, sep="\n  ")
        sys.exit(1)

    OUT.write_text(
        json.dumps({"categories": CATEGORIES, "items": items}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8", newline="\n",
    )

    sold_out = [i["id"] for i in items if i["status"] == "sold_out"]
    on_sale = [i["id"] for i in items if i["on_sale"]]
    n_variants = sum(len(i["variants"]) for i in items)
    oos_variants = sum(1 for i in items for v in i["variants"] if not v["in_stock"])
    print(f"OK 已寫入 {OUT.relative_to(ROOT)}")
    print(f"  商品 {len(items)} 項、規格 {n_variants} 個（其中 {oos_variants} 個無庫存）")
    print(f"  規格專屬圖片：{linked} 個規格已連結")
    print(f"  整項無庫存：{'、'.join(sold_out)}；特價：{'、'.join(on_sale)}")
    by_cat = {}
    for i in items:
        by_cat.setdefault(i["category"], []).append(i["id"])
    for c in CATEGORIES:
        print(f"  {c['label']}: {'、'.join(by_cat.get(c['key'], []))}")


if __name__ == "__main__":
    main()
