# 批次壓縮 assets/images/products/（含 variants/ 規格圖）的商品圖片
# 規則：最長邊縮至 1600px、全部轉存為 JPEG（品質 85、漸進式），原 PNG 轉檔成功後刪除
# 注意：若壓縮後反而變大（原本已是小檔 JPG），會保留原檔不覆蓋
# 用法：python scripts/compress-product-images.py

import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "images" / "products"
VARIANT_DIR = IMG_DIR / "variants"
MAX_DIM = 1600
QUALITY = 85

def iter_images():
    for folder in (IMG_DIR, VARIANT_DIR):
        if not folder.exists():
            continue
        for f in sorted(folder.iterdir()):
            if f.is_file() and f.suffix.lower() in (".png", ".jpg", ".jpeg"):
                yield f

def main():
    total_before = 0
    total_after = 0
    failed = []
    for src in iter_images():
        before = src.stat().st_size
        total_before += before
        dest = src.with_suffix(".jpg")
        try:
            import io
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                if im.mode in ("RGBA", "LA", "P"):
                    # 攤平透明背景為白色
                    im = im.convert("RGBA")
                    bg = Image.new("RGB", im.size, (255, 255, 255))
                    bg.paste(im, mask=im.split()[-1])
                    im = bg
                elif im.mode != "RGB":
                    im = im.convert("RGB")
                im.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            data = buf.getvalue()
            if src.suffix.lower() == ".jpg" and len(data) >= before:
                total_after += before
                print(f"SKIP {src.name}: 已是小檔（{before:,} bytes），保留原檔")
                continue
            dest.write_bytes(data)
            if src != dest:
                src.unlink()
            after = len(data)
            total_after += after
            print(f"OK {dest.name}: {before:,} -> {after:,} bytes")
        except Exception as e:
            failed.append((src.name, str(e)))
            total_after += before
            print(f"FAIL {src.name}: {e}")

    print(f"\n合計：{total_before / 1024 / 1024:.1f} MB -> {total_after / 1024 / 1024:.1f} MB")
    if failed:
        sys.exit(1)

if __name__ == "__main__":
    main()
