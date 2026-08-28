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

# 商品相簿（彈窗輪播用）：由 scripts/sync-myship-gallery.py 從賣貨便同步產出。
# items = {商品編號: [照片路徑, ...]}；aliases = {既有規格圖: 相簿裡的同一張照片}
GALLERY_MAP = ROOT / "docs" / "products" / "gallery-map.json"

# 瑕疵／出清款一律不上官網（主理人指定，2026-08-28）。
# 這裡再擋一次：就算來源 md 被貼進微瑕款，產出的 JSON 也不會有。
DEFECT_RE = re.compile(r"微瑕|瑕疵|出清|NG款|NG品|B品|福利品|格外品")


def variant_stem(pid, vname):
    """商品編號＋規格名稱 → 規格圖片的檔名主體（去空格、斜線改連字號）"""
    return f"{pid}_" + vname.replace(" ", "").replace("/", "-").replace("｜", "-")

# 主分類（2026-07-14 經主理人確認：一個主分類＋多個標籤）
CATEGORIES = [
    {"key": "doll", "label": "鼠鼠本體"},  # 2026-08-05 主理人指定改名
    {"key": "dress", "label": "洋裝・裙子"},  # 2026-07-17 洋裝與裙子合併為單一分類
    {"key": "top", "label": "上衣・毛衣"},
    {"key": "bottom", "label": "褲裝"},  # 2026-08-05 主理人指定改名
    {"key": "set", "label": "套裝"},
    {"key": "outerwear", "label": "外套・披肩"},
    {"key": "headwear", "label": "帽子・頭飾"},
    {"key": "bag", "label": "包包・提袋"},
    {"key": "accessory", "label": "配件小物"},
]
CATEGORY_OF = {
    "01": "doll",
    # 洋裝・裙子（原「洋裝」6 項＋原「裙子」5 項，共 11 項）
    "09": "dress", "21": "dress", "25": "dress", "34": "dress", "35": "dress", "45": "dress",
    "06": "dress", "22": "dress", "36": "dress", "46": "dress", "47": "dress",
    "05": "top", "24": "top", "37": "top",
    "11": "bottom",
    "03": "set", "04": "set", "17": "set", "33": "set",
    "23": "outerwear", "38": "outerwear", "41": "outerwear", "43": "outerwear",
    # （#12 花立鼠帽帽已於 2026-08-13 賣場下架並自官網移除，編號 12 缺號屬正常）
    "02": "headwear", "13": "headwear", "14": "headwear", "15": "headwear",
    "16": "headwear", "28": "headwear", "32": "headwear", "42": "headwear",
    "07": "bag", "18": "bag", "19": "bag", "39": "bag", "44": "bag",
    "08": "accessory", "10": "accessory", "20": "accessory", "26": "accessory", "27": "accessory",
    "29": "accessory", "30": "accessory", "31": "accessory", "40": "accessory",
    # 2026-08-13 全量同步新增（48–59）
    "48": "outerwear",  # 針織開襟小外套
    "49": "top",        # 完美版型條紋T
    "50": "dress",      # 甜美格紋蝴蝶結洋裝
    "51": "dress",      # 點點派對裙
    "52": "accessory",  # 游泳圈
    "53": "outerwear",  # 下班後放鬆浴袍
    "54": "headwear",   # 溫馴小羊頭套
    "55": "top",        # 范特西小鼠帽T
    "56": "bag",        # 魔術大空間帆布郵差包
    "57": "accessory",  # 迷你配件 - 有聲相機
    "58": "headwear",   # 雛菊小波浪寶寶髮帶
    "59": "headwear",   # 波浪花花帽
    # 2026-08-18 全量同步新增
    "60": "top",        # 活力素色T-shirt
    # 2026-08-25 全量同步新增
    "61": "set",        # 小胖蜂套裝（織女手工系列）
    "62": "dress",      # 貴族千鳥格裙
    "63": "top",        # 馬海毛質感毛衣
}
FESTIVE = {"33"}  # 節慶限定標籤

SALE_BADGE = "⚡開幕優惠6折⚡"


def parse_webcopy():
    """回傳 {id: {"description": str, "reminder": str|None}}"""
    text = WEBCOPY_MD.read_text(encoding="utf-8")
    body = text.split("---", 1)[1]  # 跳過表頭（第一個 --- 之後才是內文）
    # 在商品清單結尾的分隔線截斷，避免檔尾的「品牌確認紀錄」等內部備註
    # 被吞進最後一項商品的 description（曾造成 #47/#59 彈窗顯示內部筆記）
    body = body.split("\n---")[0]
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
        # 多規格不同價的品項會多一個 price_max 欄位，官網顯示「NT$ 最低價 起」
        price_max_raw = field("price_max")
        price_max = int(price_max_raw) if price_max_raw else None
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
            # 瑕疵／出清款直接跳過，不進官網（主理人指定）
            if DEFECT_RE.search(vm.group(1)):
                continue
            parts = [p.strip() for p in vm.group(1).split("｜")]
            supply = "預購" if parts[0].startswith("預購") else "現貨"
            assert parts[0] in ("現貨", "預購", "預購中"), f"#{pid} 未知供貨方式：{parts[0]}"
            in_stock = parts[-1] != "無庫存"
            rest = parts[1:-1] if not in_stock else parts[1:]
            # 款式獨立價格：結尾的「$金額」欄位（彈窗款式切換連動顯示；舊格式沒有這欄，回傳 None）
            v_price = None
            if rest and re.fullmatch(r"\$\d+", rest[-1]):
                v_price = int(rest[-1][1:])
                rest = rest[:-1]
            vname = "｜".join(rest)
            variants.append({
                "supply": supply,
                "name": vname,
                "price": v_price,
                "in_stock": in_stock,
                "image": None,  # 由 link_variant_images() 依檔名自動填入
            })

        items.append({
            "id": pid,
            "name": name,
            "category": CATEGORY_OF[pid],
            "tags": tags,
            "price": price,
            "price_max": price_max,
            "original_price": original,
            "on_sale": on_sale,
            "sale_label": sale_label,
            "status": "sold_out" if "無庫存" in status_raw else "available",
            "body_included": body_included,
            "image": image,
            # 彈窗輪播用的完整相簿（第一張固定是主圖），由 link_gallery() 填入
            "gallery": [],
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


def variant_key(name):
    """規格名稱的比對鍵：拿掉供貨前綴、庫存註記與所有標點空白，
    讓官網整理過的寫法（例：「紫底白點」）能對上賣場原文（「紫底白點（售完不補）」）。"""
    n = re.sub(r"^(現貨|預購中?)[，,]\s*", "", name)
    n = re.sub(r"目前售完不補[，,]?斷貨中|售完不補|售完|無庫存", "", n)
    return re.sub(r"[\s（）()【】｜|，,、~～\-－・/]+", "", n).lower()


def fill_variant_images_from_store(items, store_map):
    """官網還沒有規格專屬圖的款式，改用賣場本來就綁在該規格上的照片
    （已由 sync 腳本換算成官網相簿路徑）。手動放進 variants/ 的圖優先，不會被蓋掉。"""
    filled = 0
    for item in items:
        table = store_map.get(item["id"])
        if not table:
            continue
        # 兩邊都先算比對鍵；鍵重複的一律跳過，寧可不接也不要接錯款
        by_key = {}
        for spec_name, path in table.items():
            by_key.setdefault(variant_key(spec_name), []).append(path)
        for v in item["variants"]:
            if v["image"]:
                continue
            hit = by_key.get(variant_key(v["name"]))
            if hit and len(hit) == 1:
                v["image"] = hit[0]
                filled += 1
    return filled


def link_gallery(items):
    """把 gallery-map.json 的相簿接到每個商品，並保證：
    1. 相簿第一張＝商品主圖（彈窗打開時與卡片同一張，不會換人）
    2. 每個規格的專屬圖都在相簿裡（彈窗點款式才跳得到對應照片）
       多顏色共用同一張合照的情況，用 aliases 改指到相簿裡的那一張。
    回傳 (有相簿的商品數, 相簿照片總數)。"""
    if not GALLERY_MAP.exists():
        print(f"提醒：找不到 {GALLERY_MAP.relative_to(ROOT)}，相簿留空（請先跑 sync-myship-gallery.py）")
        return 0, 0, 0
    data = json.loads(GALLERY_MAP.read_text(encoding="utf-8"))
    gmap, aliases = data.get("items", {}), data.get("aliases", {})
    for item in items:
        for v in item["variants"]:
            if v["image"]:
                v["image"] = aliases.get(v["image"], v["image"])
    filled = fill_variant_images_from_store(items, data.get("variant_images", {}))
    n_items = 0
    for item in items:
        gallery = list(gmap.get(item["id"], []))
        # 主圖擺第一張
        if item["image"] in gallery:
            gallery.remove(item["image"])
        gallery.insert(0, item["image"])
        # 規格圖若不在相簿裡（例如主理人手動放的覆蓋圖），補進相簿末尾
        for v in item["variants"]:
            if v["image"] and v["image"] not in gallery:
                gallery.append(v["image"])
        item["gallery"] = gallery
        if len(gallery) > 1:
            n_items += 1
    return n_items, sum(len(i["gallery"]) for i in items), filled


def main():
    items = parse_products()
    copy = parse_webcopy()
    for item in items:
        c = copy.get(item["id"], {})
        item["description"] = c.get("description", "")
        item["reminder"] = c.get("reminder")
    linked, orphans = link_variant_images(items)
    gal_items, gal_photos, gal_filled = link_gallery(items)

    # 驗證
    errors = []
    if len(items) != 62:
        errors.append(f"商品數 {len(items)} ≠ 62")
    for item in items:
        if not (ROOT / item["image"]).exists():
            errors.append(f"#{item['id']} 圖片不存在：{item['image']}")
        if not item["variants"]:
            errors.append(f"#{item['id']} 沒有任何規格")
        if not item["description"]:
            errors.append(f"#{item['id']} 缺官網文案")
        for v in item["variants"]:
            if DEFECT_RE.search(v["name"]):
                errors.append(f"#{item['id']} 出現瑕疵／出清款（官網不得顯示）：{v['name']}")
            if v["image"] and not (ROOT / v["image"]).exists():
                errors.append(f"#{item['id']} 規格圖不存在：{v['image']}")
            if v["image"] and v["image"] not in item["gallery"]:
                errors.append(f"#{item['id']} 規格圖不在相簿裡（彈窗會跳不到）：{v['image']}")
        for g in item["gallery"]:
            if not (ROOT / g).exists():
                errors.append(f"#{item['id']} 相簿照片不存在：{g}")
        if len(set(item["gallery"])) != len(item["gallery"]):
            errors.append(f"#{item['id']} 相簿有重複照片")
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
    print(f"  彈窗相簿：{gal_items} 項有多張照片，合計 {gal_photos} 張")
    print(f"  另從賣場補上 {gal_filled} 個款式的專屬照片")
    print(f"  整項無庫存：{'、'.join(sold_out)}；特價：{'、'.join(on_sale)}")
    by_cat = {}
    for i in items:
        by_cat.setdefault(i["category"], []).append(i["id"])
    for c in CATEGORIES:
        print(f"  {c['label']}: {'、'.join(by_cat.get(c['key'], []))}")


if __name__ == "__main__":
    main()
