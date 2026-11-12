"""누끼 PNG를 홈 화면용 cutout 이미지로 저장한다.

투명 여백을 가로·세로 모두 잘라내고(여백 0), 가장자리 1px을 다듬어
배경색 테두리(헤일로)를 없앤 뒤, 긴 변을 최대 3200px로 맞춰
public/products/{slug}/cutout.webp 로 저장하고 데이터에 넣을 크기를 출력한다.
원본 사진을 함께 주면 상세 페이지용으로 긴 변 3200px의 1.webp 도 만든다.

사용: python3 scripts/prepare-product-image.py <누끼.png> <slug> [원본사진.jpg]
누끼는 가능하면 scripts/rembg-cutout.py 로 바로 만든다 (cutout.swift 는 가장자리가 흐림).
"""

import sys
from pathlib import Path

from PIL import Image, ImageFilter

LONG_SIDE = 3200  # 원본 해상도 유지 (확대해도 선명하게). 작으면 키우지 않음
DETAIL_LONG_SIDE = 3200


def main():
    src, slug = Path(sys.argv[1]), sys.argv[2]
    photo = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    out = Path(__file__).resolve().parent.parent / "public" / "products" / slug
    out.mkdir(parents=True, exist_ok=True)

    im = Image.open(src).convert("RGBA")
    alpha = im.getchannel("A")
    # 가장자리 1px 깎고 살짝 부드럽게: 흰 배경 테두리 제거
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(alpha)
    im = im.crop(alpha.point(lambda a: 255 if a > 8 else 0).getbbox())
    im.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)  # 작으면 키우지 않음
    im.save(out / "cutout.webp", quality=92, method=6)
    print(out / "cutout.webp")
    print(f"cutoutSize: {{ w: {im.width}, h: {im.height} }}")

    if photo:
        ph = Image.open(photo).convert("RGB")
        ph.thumbnail((DETAIL_LONG_SIDE, DETAIL_LONG_SIDE), Image.LANCZOS)
        ph.save(out / "1.webp", quality=90, method=6)
        print(out / "1.webp", ph.size)


if __name__ == "__main__":
    main()
