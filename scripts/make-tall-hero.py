# 16:9 리소 콜라주 → 9:16 세로판: 피사체 중심으로 잘라 아래에 두고, 위는 같은 사진의 빈 바탕 질감을 이어 붙인다
import sys
import numpy as np
from PIL import Image, ImageFilter
SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 1440, 2560
im = Image.open(SRC).convert("RGB")
# 원본 위아래 끝의 종이 자국 줄을 잘라 낸다
im = im.crop((0, int(im.height * 0.02), im.width, int(im.height * 0.97)))
a = np.asarray(im).astype(np.float32)
h, w, _ = a.shape
bg = np.median(a.reshape(-1, 3), axis=0)
diff = np.abs(a - bg).sum(2)
mask = np.asarray(Image.fromarray((diff > 110).astype(np.uint8) * 255).filter(ImageFilter.MedianFilter(9))) > 0
ys, xs = np.where(mask)
x0, x1 = np.percentile(xs, 1), np.percentile(xs, 99)
y0 = np.percentile(ys, 1)
subj_w = x1 - x0
# 피사체가 화면 폭의 ~85% 이하가 되게 확대 비율을 정한다
crop_w = int(min(w, max(subj_w / 0.85, w * 0.42)))
s = W / crop_w
strip_h = int(h * s)
if strip_h > H * 0.75:
    s = H * 0.75 / h; crop_w = int(W / s); strip_h = int(h * s)
cx = (x0 + x1) / 2
left = int(np.clip(cx - crop_w / 2, 0, w - crop_w))
strip = im.crop((left, 0, left + crop_w, h)).resize((W, strip_h), Image.LANCZOS)
# 빈 바탕 열 찾기 (피사체가 거의 없는 가장 넓은 구간)
col = mask.mean(0)
empty = col < 0.01
best, cur, start = (0, 0), 0, 0
for i, e in enumerate(list(empty) + [False]):
    if e:
        if cur == 0: start = i
        cur += 1
    else:
        if cur > best[1] - best[0]: best = (start, start + cur)
        cur = 0
ex0, ex1 = best
# 피사체 위쪽 빈 행 높이 (잘라 쓸 가로 구간 안에서, 점 하나라도 있으면 거기까지)
win = mask[:, left:left + crop_w].mean(1) > 0.0005
row_empty = (int(np.argmax(win)) if win.any() else h) - 30
if row_empty * w > (ex1 - ex0) * h and row_empty > 120:
    # 위쪽 빈 띠(전체 폭)를 질감으로: 피사체가 있는 가로 구간 그대로 잘라 폭을 맞춘다
    band = im.crop((left, 0, left + crop_w, row_empty)).resize((W, max(1, int(row_empty * s))), Image.LANCZOS)
    pa = np.asarray(band)
    block = pa
    rows, flip = [], False
    while sum(r.shape[0] for r in rows) < H:
        rows.append(block[::-1] if flip else block); flip = not flip
    canvas = np.concatenate(rows, 0)[:H].astype(np.float32)
    pa = None
elif ex1 - ex0 < 400:
    # 빈 바탕이 좁으면: 바탕색 + 종이 입자를 새로 만들어 채운다 (이어 붙인 줄무늬가 안 생기게)
    rng = np.random.default_rng(7)
    sample = a[:, ex0:ex1][~mask[:, ex0:ex1]]
    base = np.median(sample, 0)
    grain = rng.normal(0, sample.std(0).mean() * 0.6, (H, W, 1)).astype(np.float32)
    grain = np.asarray(Image.fromarray(((grain[..., 0] + 128).clip(0, 255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)[..., None] - 128
    low = np.asarray(Image.fromarray(rng.normal(128, 30, (H // 320, W // 320)).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32)[..., None] - 128
    canvas = (base[None, None, :] + grain + low * 0.05).astype(np.float32)
    pa = None
else:
    pw = max(60, min(ex1 - ex0, 600))
    patch = im.crop((ex0, 0, ex0 + pw, h)).resize((int(pw * s), strip_h), Image.LANCZOS)
    pa = np.asarray(patch)
if pa is not None:
    # 가로로 거울 이어붙여 폭 W 의 질감 블록 → 세로로 거울 이어붙여 캔버스 채우기
    tiles, flip = [], False
    while sum(t.shape[1] for t in tiles) < W:
        tiles.append(pa[:, ::-1] if flip else pa); flip = not flip
    block = np.concatenate(tiles, 1)[:, :W]
    rows, flip = [], False
    while sum(r.shape[0] for r in rows) < H:
        rows.append(block[::-1] if flip else block); flip = not flip
    canvas = np.concatenate(rows, 0)[:H].astype(np.float32)
# 피사체 띠를 화면 가운데(로고 뒤)에 두고, 위아래 경계는 부드럽게 섞는다
st = np.asarray(strip).astype(np.float32)
smask = mask[:, left:left + crop_w].astype(np.uint8) * 255
smask = np.asarray(Image.fromarray(smask).resize((W, strip_h)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
sy = np.where(smask[..., 0].max(1) > 0.5)[0]
subj_cy = (sy.min() + sy.max()) / 2 if len(sy) else strip_h / 2
CENTER = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5  # 피사체 중심을 화면 높이의 몇 % 에 둘지
top = int(round(H * CENTER - subj_cy))
top = max(min(top, H - strip_h), H - strip_h - int(strip_h)) if strip_h > H else top
# 화면 밖으로 나가는 부분은 잘라 낸다
s0, s1 = max(0, -top), min(strip_h, H - top)
c0, c1 = top + s0, top + s1
feather = min(220, strip_h // 3)
alpha = np.ones((strip_h, 1, 1), np.float32)
if top > 0:
    alpha[:feather, 0, 0] = np.minimum(alpha[:feather, 0, 0], np.linspace(0, 1, feather))
if top + strip_h < H:
    alpha[-feather:, 0, 0] = np.minimum(alpha[-feather:, 0, 0], np.linspace(1, 0, feather))
alpha = np.maximum(alpha, smask)
canvas[c0:c1] = canvas[c0:c1] * (1 - alpha[s0:s1]) + st[s0:s1] * alpha[s0:s1]
Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).save(OUT, quality=82)
print(OUT, "crop_w", crop_w, "strip_h", strip_h, "top", top)
