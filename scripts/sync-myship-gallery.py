# -*- coding: utf-8 -*-
"""從 7-11 賣貨便賣場頁面全量同步「商品相簿照片」到官網。

用法：
    python scripts/sync-myship-gallery.py                 # 連線抓最新賣場頁
    python scripts/sync-myship-gallery.py --html x.html   # 用已存檔的頁面（離線）

做的事：
1. 解析賣場頁內嵌的商品 JSON（data-product 屬性），取得每項商品的完整相簿
   照片順序、各規格的對應照片。
2. **瑕疵品過濾**：規格名稱含「微瑕／瑕疵／出清／NG」的款式一律不進官網
   （主理人指定，2026-08-28）；只屬於這些款式的照片也不會下載。
3. **重複照片自動略過**：用影像內容指紋（dHash＋aHash＋色彩簽章）比對，賣場自己
   重複上傳的同一張照片只留一張；官網已經有的主圖與規格圖直接**沿用既有路徑**，
   不重複下載也不重複存檔。色彩簽章是必要的：娃衣常常「同一個構圖、只有顏色不同」，
   只看灰階會把不同顏色誤判成同一張。
4. 其餘新照片壓縮後存進 assets/images/products/gallery/，並替每張相簿照片產一份
   200px 小圖到 assets/images/products/thumbs/（彈窗縮圖列用，省手機流量）。
5. 產出 docs/products/gallery-map.json（給 build-products-json.py 讀）與
   docs/products/gallery-map.md（人看的對照表）。

⚠️ 相簿清單會被 build-products-json.py 寫進 content/products-store.json 的
   gallery 欄位，那個欄位是產出物，請勿手改。
"""

import argparse
import html as html_mod
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STORE_URL = "https://myship.7-11.com.tw/general/detail/GM2605058795102"
CDN = "https://myship.7-11.com.tw/i/cgdm/GM2605058795102/"
IMG_DIR = ROOT / "assets" / "images" / "products"
VARIANT_DIR = IMG_DIR / "variants"
GALLERY_DIR = IMG_DIR / "gallery"
THUMB_DIR = IMG_DIR / "thumbs"
OUT_JSON = ROOT / "docs" / "products" / "gallery-map.json"
OUT_MD = ROOT / "docs" / "products" / "gallery-map.md"

MAX_DIM = 1200
QUALITY = 82
# 彈窗縮圖列用的小圖（56x56 顯示，存 200px 就綽綽有餘）。
# 不做的話手機開一次彈窗要載 25 張 1200px 原圖，很吃流量。
THUMB_DIM = 200
THUMB_QUALITY = 70
CACHE_DIR = None   # --cache 指定時改讀本機已下載的 CDN 原始圖
IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# 瑕疵／出清款：不建立、不顯示在官網（主理人指定，2026-08-28）
DEFECT_RE = re.compile(r"微瑕|瑕疵|出清|NG款|NG品|B品|福利品|格外品")

# 同一張照片的判定門檻（dHash 64 bit ＋ aHash 64 bit 的漢明距離總和）
DUP_IN_GALLERY = 4   # 賣場自己重複上傳的同一張
DUP_VS_LOCAL = 6     # 與官網既有主圖／規格圖是同一張
# 兩張圖任一格的 RGB 差超過這個值就一定不是同一張（擋「同構圖不同色」被誤併）
MAX_COLOR_GAP = 24

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": STORE_URL,
}

# 賣場商品編號（Cgdd_Id）→ 官網商品編號。用這個對應，賣場換主圖或改品名都不受影響。
ID_MAP = {
    "2605071158964150": "01", "2607051246289319": "02", "2606271234037268": "03",
    "2607111255017373": "04", "2607131257869074": "05", "2607111255005699": "06",
    "2607131258194504": "07", "2607081250396664": "08", "2607081250380009": "09",
    "2607061247591774": "10", "2607021242058186": "11", "2607061247237663": "13",
    "2606281235727155": "14", "2606241229991383": "15", "2606241229998947": "16",
    "2606281235706848": "17", "2606281235544587": "18", "2606281235855590": "19",
    "2607111255129039": "20", "2606271234023005": "21", "2606241230092913": "22",
    "2606241230069118": "23", "2606241230041943": "24", "2606241230015905": "25",
    "2606281235815487": "26", "2606231228363361": "27", "2606231228389428": "28",
    "2605051156683747": "29", "2607061247195419": "30", "2605051156663071": "31",
    "2606111210329933": "32", "2606111210272814": "33", "2605271188588873": "34",
    "2605271188597622": "35", "2605071159060759": "37", "2605091162833021": "38",
    "2605081160646905": "39", "2605051156715516": "40", "2605071160056710": "41",
    "2606111210312055": "42", "2605051156705458": "43", "2605281189630081": "45",
    "2605071159018327": "46", "2608101298772824": "48", "2608101298762008": "49",
    "2607241273980223": "50", "2608051291508043": "51", "2607221271580099": "52",
    "2607291281682808": "53", "2608051291462297": "54", "2607301282023393": "55",
    "2607261276591242": "56", "2607301282765164": "57", "2607261276506251": "58",
    "2607301282787467": "59", "2608141305368095": "60", "2608221317091584": "61",
    "2608191312438228": "62", "2608191312410619": "63",
}

# 賣場已下架、官網保留展示的品項：沒有賣場相簿，只用官網既有照片組相簿
KEPT_OFFLINE = {"36", "44", "47"}

# 解析結果少於這個數字就視為賣場頁面改版、直接中止（避免把正確資料洗掉）
MIN_PRODUCTS = 40


# ---------- 影像指紋 ----------

def fingerprint(source):
    """回傳 (dhash, ahash, 色彩簽章)；同一張原始照片即使被重新壓縮縮圖過，指紋幾乎不變。
    dHash／aHash 只看灰階（構圖與明暗），**看不出顏色**；娃衣常常是「同一個構圖、
    只有顏色不同」的實拍照，光靠灰階會把不同色誤判成同一張，所以另外存一組
    8x8 的 RGB 簽章，比對時兩個條件都要通過。"""
    try:
        src = io.BytesIO(source) if isinstance(source, bytes) else source
        with Image.open(src) as im:
            rgb = im.convert("RGB")
            color = list(rgb.resize((8, 8), Image.LANCZOS).getdata())
            gray = rgb.convert("L")
            d = list(gray.resize((9, 8), Image.LANCZOS).getdata())
            a = list(gray.resize((8, 8), Image.LANCZOS).getdata())
    except Exception:
        return None
    dh = 0
    for r in range(8):
        for c in range(8):
            dh = (dh << 1) | (1 if d[r * 9 + c] > d[r * 9 + c + 1] else 0)
    avg = sum(a) / len(a)
    ah = 0
    for v in a:
        ah = (ah << 1) | (1 if v > avg else 0)
    return dh, ah, color


def distance(f1, f2):
    """灰階指紋距離；顏色差太多的話直接回傳一個大數字，不會被當成同一張。"""
    if not f1 or not f2:
        return 999
    color_gap = max(
        max(abs(p[c] - q[c]) for c in range(3)) for p, q in zip(f1[2], f2[2])
    )
    if color_gap > MAX_COLOR_GAP:
        return 999
    return bin(f1[0] ^ f2[0]).count("1") + bin(f1[1] ^ f2[1]).count("1")


# ---------- 賣場頁解析 ----------

def fetch_html(offline):
    if offline:
        return Path(offline).read_text(encoding="utf-8")
    req = urllib.request.Request(STORE_URL, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        print("抓不到賣貨便賣場頁面，請確認網路後再試一次。")
        print("（技術細節：%s）" % e)
        sys.exit(1)


def parse_products(page):
    """回傳 [{cgdd_id, name, images, dropped_specs, dropped_images}]"""
    found = {}
    for raw in re.findall(r'data-product="([^"]*)"', page):
        try:
            obj = json.loads(html_mod.unescape(raw))
        except json.JSONDecodeError:
            continue
        found.setdefault(obj["Cgdd_Id"], obj)
    out = []
    for obj in sorted(found.values(), key=lambda o: o["Cgdd_Ordering"]):
        specs = obj.get("Spec") or []
        keep_imgs = {
            s.get("Cgds_CgimImagePath") for s in specs
            if not DEFECT_RE.search(s.get("Cgds_Spec") or "")
        }
        dropped_specs = [s.get("Cgds_Spec") for s in specs if DEFECT_RE.search(s.get("Cgds_Spec") or "")]
        defect_only = {
            s.get("Cgds_CgimImagePath") for s in specs
            if DEFECT_RE.search(s.get("Cgds_Spec") or "") and s.get("Cgds_CgimImagePath")
        } - keep_imgs
        images = [
            i["Cgim_Image_Path"]
            for i in sorted(obj.get("Images") or [], key=lambda x: x["Cgim_Ordering"])
            if i["Cgim_Image_Path"] not in defect_only
        ]
        spec_images = {}
        for sp in specs:
            name, img = sp.get("Cgds_Spec") or "", sp.get("Cgds_CgimImagePath")
            if img and not DEFECT_RE.search(name):
                spec_images[name] = img
        out.append({
            "cgdd_id": obj["Cgdd_Id"],
            "name": obj["Cgdd_Product_Name"],
            "images": images,
            "spec_images": spec_images,
            "dropped_specs": dropped_specs,
            "dropped_images": sorted(defect_only),
        })
    return out


def download(name):
    if CACHE_DIR:                       # --cache：改讀先前抓好的原始檔，不重連賣場
        cached = Path(CACHE_DIR) / name
        if cached.exists():
            return cached.read_bytes()
    req = urllib.request.Request(CDN + name, headers=HEADERS)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = resp.read()
            if len(data) >= 1024:
                return data
        except Exception:
            pass
    return None


def save_compressed(data, dest):
    """壓縮存檔；資料不是合法圖片時回傳 False，由呼叫端跳過這一張，不讓整批中斷。"""
    try:
        return _save_compressed(data, dest)
    except Exception as e:
        print("  x 這張圖存檔失敗（可能不是合法圖片）：%s／%s" % (dest.name, e))
        return False


def _save_compressed(data, dest):
    with Image.open(io.BytesIO(data)) as im:
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(buf.getvalue())
    return True


def thumb_path(rel_path):
    """相簿照片 → 對應的縮圖路徑（把 products/ 換成 products/thumbs/，子資料夾照舊）"""
    return THUMB_DIR / Path(rel_path).relative_to("assets/images/products")


def make_thumbs(gallery_map):
    """替相簿裡的每張照片產一份小圖給縮圖列用；已存在且比原圖新的就跳過。"""
    made = skipped = failed = 0
    for paths in gallery_map.values():
        for rp in paths:
            src = ROOT / rp
            dest = thumb_path(rp).with_suffix(".jpg")
            if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
                skipped += 1
                continue
            try:
                with Image.open(src) as im:
                    if im.mode != "RGB":
                        im = im.convert("RGB")
                    im.thumbnail((THUMB_DIM, THUMB_DIM), Image.LANCZOS)
                    buf = io.BytesIO()
                    im.save(buf, "JPEG", quality=THUMB_QUALITY, optimize=True, progressive=True)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(buf.getvalue())
                made += 1
            except Exception as e:
                print("  x 縮圖失敗：%s／%s" % (rp, e))
                failed += 1
    return made, skipped, failed


def local_files_of(pid):
    """該商品在官網既有的照片（主圖 ＋ 規格圖），用來沿用既有路徑。"""
    paths = []
    for f in sorted(IMG_DIR.glob(pid + "-*")):
        if f.is_file() and f.suffix.lower() in IMG_EXTS:
            paths.append(f)
    if VARIANT_DIR.exists():
        for f in sorted(VARIANT_DIR.glob(pid + "_*")):
            if f.is_file() and f.suffix.lower() in IMG_EXTS:
                paths.append(f)
    return paths


def rel(p):
    return str(p.relative_to(ROOT)).replace("\\", "/")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", help="改讀已存檔的賣場頁（離線用）")
    ap.add_argument("--cache", help="改讀先前抓好的 CDN 原始圖資料夾（離線用）")
    args = ap.parse_args()
    global CACHE_DIR
    CACHE_DIR = args.cache

    page = fetch_html(args.html)
    products = parse_products(page)
    print("賣場品項：%d 項" % len(products))

    # 賣場改版導致解析不到商品時，一定要在寫檔前停手，
    # 否則會把上一次正確的 gallery-map.json 洗成空的，所有商品的相簿悄悄退回只剩主圖
    if len(products) < MIN_PRODUCTS:
        print("只解析到 %d 項商品（正常應該有 %d 項以上），可能是賣場頁面改版了。"
              % (len(products), MIN_PRODUCTS))
        print("為了避免蓋掉上一次正確的相簿資料，這次不寫任何檔案。")
        sys.exit(1)

    unknown = [p for p in products if p["cgdd_id"] not in ID_MAP]
    if unknown:
        print("以下賣場品項還沒對應到官網編號，請補進 ID_MAP：")
        for p in unknown:
            print("  %s  %s" % (p["cgdd_id"], p["name"]))
        sys.exit(1)

    gallery_map = {}
    alias_map = {}   # 既有規格圖 → 相簿裡的同一張照片（多顏色共用合照時用）
    variant_images = {}   # {商品編號: {賣場規格名: 相簿路徑}}，補官網還沒有規格圖的款式
    rows = []
    stat = {"reuse": 0, "new": 0, "dup": 0, "cached": 0, "fail": 0}
    dropped_report = []

    for p in products:
        pid = ID_MAP[p["cgdd_id"]]
        if p["dropped_specs"]:
            dropped_report.append((pid, p["name"], p["dropped_specs"]))
        locals_ = [(f, fingerprint(f)) for f in local_files_of(pid)]
        entries = []          # [(官網路徑, 指紋)]
        cdn_to_path = {}      # 賣場 CDN 檔名 → 官網相簿路徑（用來接規格圖）
        for cdn_name in p["images"]:
            dest = GALLERY_DIR / ("%s-%s.jpg" % (pid, Path(cdn_name).stem))
            data = None
            if dest.exists():
                fingerprint_ = fingerprint(dest)
                stat["cached"] += 1
            else:
                data = download(cdn_name)
                if data is None:
                    print("  x #%s 下載失敗：%s" % (pid, cdn_name))
                    stat["fail"] += 1
                    continue
                fingerprint_ = fingerprint(data)
            # 1) 賣場自己重複上傳的同一張照片：略過
            if any(distance(fingerprint_, e[1]) <= DUP_IN_GALLERY for e in entries):
                stat["dup"] += 1
                same = next(e for e in entries if distance(fingerprint_, e[1]) <= DUP_IN_GALLERY)
                cdn_to_path[cdn_name] = same[0]
                if dest.exists():
                    dest.unlink()          # 之前誤存過的重複檔一併清掉
                    stat["cached"] -= 1
                continue
            # 2) 官網已經有這張（主圖或規格圖）：沿用既有路徑
            hit = min(locals_, key=lambda e: distance(fingerprint_, e[1])) if locals_ else None
            if hit and distance(fingerprint_, hit[1]) <= DUP_VS_LOCAL:
                entries.append((rel(hit[0]), fingerprint_))
                cdn_to_path[cdn_name] = rel(hit[0])
                stat["reuse"] += 1
                if dest.exists():
                    dest.unlink()
                    stat["cached"] -= 1
                continue
            # 3) 全新照片：壓縮後存進 gallery/
            if data is not None:
                if not save_compressed(data, dest):
                    stat["fail"] += 1
                    continue
                stat["new"] += 1
            entries.append((rel(dest), fingerprint_))
            cdn_to_path[cdn_name] = rel(dest)

        # 官網既有的規格圖要嘛本來就在相簿裡，要嘛：
        #  - 與相簿某張是同一張（例如多個顏色共用一張合照）→ 記進別名表，
        #    build 腳本會把該規格的圖改指到相簿裡那一張，彈窗才跳得到；
        #  - 相簿裡完全沒有（主理人自己拍的）→ 補進相簿末尾。
        for f, fingerprint_ in locals_:
            path = rel(f)
            if any(path == e[0] for e in entries):
                continue
            same = next((e for e in entries if distance(fingerprint_, e[1]) <= DUP_VS_LOCAL), None)
            if same:
                alias_map[path] = same[0]
            else:
                entries.append((path, fingerprint_))

        gallery_map[pid] = [e[0] for e in entries]
        # 賣場本來就替每個規格綁了照片，把它換算成官網相簿路徑交給 build 腳本，
        # 官網才不會有「點了顏色但照片不動」的款式（例如 #48 針織開襟小外套四色）
        vimgs = {}
        for spec_name, cdn_name in p["spec_images"].items():
            path = cdn_to_path.get(cdn_name)
            if path:
                vimgs[spec_name] = path
        if vimgs:
            variant_images[pid] = vimgs
        rows.append((pid, p["name"], len(p["images"]), len(entries)))

    # 賣場已下架、官網保留展示的品項：用官網既有照片組相簿
    for pid in sorted(KEPT_OFFLINE):
        kept, seen = [], []
        for f in local_files_of(pid):
            fingerprint_ = fingerprint(f)
            same = next((k for k, sf in zip(kept, seen) if distance(fingerprint_, sf) <= DUP_VS_LOCAL), None)
            if same:
                alias_map[rel(f)] = same
                continue
            seen.append(fingerprint_)
            kept.append(rel(f))
        if kept:
            gallery_map[pid] = kept
            rows.append((pid, "（賣場已下架，官網保留展示）", 0, len(kept)))

    t_made, t_skipped, t_failed = make_thumbs(gallery_map)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps({"source": STORE_URL,
                    "items": dict(sorted(gallery_map.items())),
                    "aliases": dict(sorted(alias_map.items())),
                    "variant_images": dict(sorted(variant_images.items()))},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8", newline="\n",
    )

    md = [
        "# 商品相簿對照表（賣貨便相簿 → 官網彈窗輪播）",
        "",
        "> 由 `scripts/sync-myship-gallery.py` 產出，**請勿手改**。",
        "> 「沿用」＝這張照片官網已經有（主圖或規格圖），直接用既有路徑，不重複存檔。",
        "",
        "- 賣場品項：%d 項" % len(products),
        "- 沿用既有照片 %d 張、新增照片 %d 張、沿用上次已下載 %d 張、略過賣場重複上傳 %d 張"
        % (stat["reuse"], stat["new"], stat["cached"], stat["dup"]),
        "",
        "## 各商品相簿張數",
        "",
        "| 編號 | 品名 | 賣場相簿 | 官網相簿（去重後） |",
        "|---|---|---|---|",
    ]
    for pid, name, n_src, n_out in sorted(rows):
        md.append("| %s | %s | %d | %d |" % (pid, name, n_src, n_out))
    md += ["", "## 已濾除的瑕疵／出清款（不會出現在官網）", ""]
    if dropped_report:
        for pid, name, specs in sorted(dropped_report):
            md.append("- **#%s %s**" % (pid, name))
            for s in specs:
                md.append("  - %s" % s)
    else:
        md.append("（本次沒有偵測到瑕疵／出清款）")
    md.append("")
    OUT_MD.write_text("\n".join(md), encoding="utf-8", newline="\n")

    vanished = sorted(set(ID_MAP.values()) - set(gallery_map) - KEPT_OFFLINE)
    if vanished:
        print("提醒：這幾項在賣場頁面上找不到了（可能已下架）：%s" % "、".join(vanished))
        print("      它們的相簿會退回只剩主圖。要保留完整展示的話，把編號加進 KEPT_OFFLINE。")

    print("OK 沿用 %d 張、新增 %d 張、沿用上次已下載 %d 張、略過重複 %d 張、失敗 %d 張"
          % (stat["reuse"], stat["new"], stat["cached"], stat["dup"], stat["fail"]))
    print("  賣場規格圖對應：%d 項商品、%d 個規格" % (len(variant_images), sum(len(v) for v in variant_images.values())))
    print("  縮圖列小圖：新產 %d 張、沿用 %d 張、失敗 %d 張" % (t_made, t_skipped, t_failed))
    print("  已濾除瑕疵／出清款：%d 個規格" % sum(len(d[2]) for d in dropped_report))
    print("  對照表：%s" % rel(OUT_MD))


if __name__ == "__main__":
    main()
