"""원본 사진에서 고화질 누끼를 딴다 (rembg isnet-general-use 모델, 원본 해상도 그대로).

macOS Vision 누끼(cutout.swift)는 마스크 해상도가 낮아 확대하면 윤곽이 울퉁불퉁하고 흰 테두리가 남는다.
여기서는:
  1) rembg 로 원본 크기 알파를 만들고
  2) 경계 픽셀에서 주변 배경색을 빼내(색 분리) 흰 테두리 번짐을 없앤 뒤
  3) 투명 여백 없이 잘라 긴 변 최대 3200px webp 로 public/products/<slug>/cutout-hd.webp 에 저장한다.
원본 사진도 주면 상세용 1-hd.webp(긴 변 3200px)를 같이 만든다.

사용: python scripts/rembg-cutout.py <원본.jpg> <slug> [--detail]
필요: pip install "rembg[cpu]" scipy  (첫 실행 때 모델 약 180MB를 받는다)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy.ndimage import gaussian_filter

LONG_SIDE = 3200
_session = None


def cutout(photo: Path, slug: str, detail: bool):
    global _session
    _session = _session or new_session("isnet-general-use")
    src = Image.open(photo).convert("RGB")
    a = np.asarray(remove(src, session=_session, only_mask=True, post_process_mask=True), dtype=np.float32) / 255
    P = np.asarray(src, dtype=np.float32) / 255

    # 지역 배경색 (확실한 배경만 모아 크게 번져 물체 자리까지 채움, 1/8 크기에서 계산)
    h, w = a.shape
    sm = lambda x: np.asarray(Image.fromarray(x.astype(np.float32)).resize((w // 8, h // 8), Image.BILINEAR))
    up = lambda x: np.asarray(Image.fromarray(x.astype(np.float32)).resize((w, h), Image.BILINEAR))
    bgm = (gaussian_filter(sm(a), 2) < 0.02).astype(np.float32)
    wt = gaussian_filter(bgm, 6) + 1e-6
    B = np.stack([up(gaussian_filter(sm(P[..., c]) * bgm, 6) / wt) for c in range(3)], -1)

    # 경계 색 분리: P = a*F + (1-a)*B → F = B + (P-B)/a
    edge = (a > 0.02) & (a < 0.98)
    out = P.copy()
    out[edge] = np.clip(B[edge] + (P[edge] - B[edge]) / a[edge][:, None], 0, 1)

    im = Image.fromarray((np.dstack([out, a]) * 255).astype(np.uint8))
    im = im.crop(Image.fromarray(((a > 0.03) * 255).astype(np.uint8)).getbbox())
    im.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
    dst = Path(__file__).resolve().parent.parent / "public" / "products" / slug
    dst.mkdir(parents=True, exist_ok=True)
    im.save(dst / "cutout-hd.webp", quality=92, method=6)
    print(f"{slug} cutoutSize: {{ w: {im.width}, h: {im.height} }}")
    if detail:
        ph = src.copy()
        ph.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        ph.save(dst / "1-hd.webp", quality=90, method=6)


if __name__ == "__main__":
    cutout(Path(sys.argv[1]), sys.argv[2], "--detail" in sys.argv)
