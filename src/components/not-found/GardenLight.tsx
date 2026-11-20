"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";

// 404 정원 사진에 서울의 햇빛·그림자·날씨를 다시 그린다 (WebGL).
//  - height.webp: 사진에서 뽑은 높이 지도 (흰색 = 높음: 돔 > 덤불 > 산울타리 > 돌길)
//  - 해 위치: 날짜·시각으로 서울의 실제 태양 고도·방위를 계산한다 → 계절마다 일출·일몰 시각과 그림자 길이가 달라진다.
//    (사진 위쪽 = 북쪽으로 본다. 아침엔 동쪽(오른쪽)에서 비춰 그림자가 왼쪽으로, 한낮엔 남쪽(아래)에서 비춰 위로, 저녁엔 오른쪽으로.)
//  - 날씨: 서버가 받아 준 서울 현재 날씨 → 흐림(그림자 흐려짐)·안개·비(젖은 땅 + 빗줄기)·눈(쌓인 눈 + 내리는 눈)
//  - 해가 지면 푸른 달빛 + 가운데 돔의 등불.
//  - WebGL이 안 되는 기기는 그냥 사진이 보인다.
// 미리보기 (주소 뒤에 붙이기):
//   ?garden=dawn|morning|noon|afternoon|golden|dusk|night 또는 ?garden=14.5 (14시 30분)
//   ?date=2026-07-01 (그 날짜의 해 위치)
//   ?weather=clear|cloudy|fog|rain|heavyrain|snow|heavysnow

// 사진 2벌. 둘 다 그림자 없는 흐린 날 사진이고, 빛·그림자는 아래에서 새로 그린다.
// 사진을 바꾸면 파일 이름 숫자를 올린다(캐시 무효화).
//  - landscape: 가로로 긴 화면 (PC 등)
//  - portrait: 세로로 긴 화면 (휴대폰, 세로로 든 태블릿). 가운데 404 부분은 가로 사진을 그대로 쓰고
//    위·아래만 세로 사진에서 가져와 이어붙였다 → 가로·세로 화면의 404가 똑같다. 픽셀 크기도 가로 사진과 1:1.
type Scene = {
  img: string;
  height: string; // 높이 지도 (사진의 절반 크기, 흰색 = 높음)
  w: number;
  h: number;
  text: { w: number; h: number; cy: number }; // 사진 속 "404"가 차지하는 영역 (사진 크기 대비 비율)
  lamp: [number, number]; // 가운데 돔(등불) 위치 (사진 크기 대비 비율)
};
const SCENES: Record<"landscape" | "portrait", Scene> = {
  landscape: {
    img: "/not-found/garden-v3.webp",
    height: "/not-found/height-v2.webp",
    w: 2000,
    h: 876,
    text: { w: 0.67, h: 0.58, cy: 0.505 },
    lamp: [0.5, 0.496],
  },
  portrait: {
    img: "/not-found/garden-portrait-v1.webp",
    height: "/not-found/height-portrait-v1.webp",
    w: 1384,
    h: 3064,
    text: { w: 0.954, h: 0.163, cy: 0.499 },
    lamp: [0.5, 0.496],
  },
};
const PORTRAIT_QUERY = "(orientation: portrait)";

const SEOUL = { lat: 37.5665, lon: 126.978 };

const PREVIEW_HOURS: Record<string, number> = {
  dawn: 6.4,
  morning: 9,
  noon: 12.5,
  afternoon: 15.5,
  golden: 16.8,
  dusk: 17.8,
  night: 23,
};

export type GardenWeather = { code: number; cloud: number };
type Sky = { cloud: number; fog: number; rain: number; snow: number };

// WMO 날씨 코드 → 하늘 상태
function skyFrom(w: GardenWeather | null): Sky {
  const sky: Sky = { cloud: w?.cloud ?? 0, fog: 0, rain: 0, snow: 0 };
  if (!w) return sky;
  const c = w.code;
  const rain: Record<number, number> = { 51: 0.25, 53: 0.3, 55: 0.4, 56: 0.3, 57: 0.4, 61: 0.4, 63: 0.65, 65: 0.9, 66: 0.5, 67: 0.8, 80: 0.4, 81: 0.65, 82: 0.9, 95: 0.85, 96: 0.9, 99: 0.95 };
  const snow: Record<number, number> = { 71: 0.35, 73: 0.6, 75: 0.9, 77: 0.3, 85: 0.5, 86: 0.85 };
  if (c === 45 || c === 48) sky.fog = 1;
  if (rain[c]) sky.rain = rain[c];
  if (snow[c]) sky.snow = snow[c];
  if (sky.rain || sky.snow) sky.cloud = Math.max(sky.cloud, 0.85);
  return sky;
}

function previewSky(q: string | null, base: Sky): Sky {
  switch (q) {
    case "clear":
      return { cloud: 0, fog: 0, rain: 0, snow: 0 };
    case "cloudy":
      return { cloud: 0.9, fog: 0, rain: 0, snow: 0 };
    case "fog":
      return { cloud: 0.7, fog: 1, rain: 0, snow: 0 };
    case "rain":
      return { cloud: 0.9, fog: 0, rain: 0.5, snow: 0 };
    case "heavyrain":
      return { cloud: 1, fog: 0, rain: 0.95, snow: 0 };
    case "snow":
      return { cloud: 0.9, fog: 0, rain: 0, snow: 0.5 };
    case "heavysnow":
      return { cloud: 1, fog: 0.2, rain: 0, snow: 0.95 };
    default:
      return base;
  }
}

type Vec3 = [number, number, number];
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const RAD = Math.PI / 180;

// 서울 기준 지금 날짜·시각 (미리보기 값이 있으면 그걸로)
function sceneDate(): Date {
  const sp = new URLSearchParams(window.location.search);
  const qDate = sp.get("date");
  const qHour = sp.get("garden");
  if (!qDate && !qHour) return new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  let [y, m, d] = [get("year"), get("month"), get("day")];
  let hour = get("hour") + get("minute") / 60;
  if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) [y, m, d] = qDate.split("-").map(Number);
  if (qHour) {
    if (qHour in PREVIEW_HOURS) hour = PREVIEW_HOURS[qHour];
    else if (Number.isFinite(Number(qHour))) hour = ((Number(qHour) % 24) + 24) % 24;
  }
  return new Date(Date.UTC(y, m - 1, d) + (hour - 9) * 3600_000); // 서울 = UTC+9
}

// 태양 고도·방위 (도). 방위는 북쪽 0°, 동쪽 90°, 남쪽 180°. 오차 1° 안쪽의 간단한 천문 계산.
function sunPosition(date: Date) {
  const d = date.getTime() / 86400000 - 10957.5; // 2000-01-01 12:00 UTC부터 지난 날
  const g = (357.529 + 0.98560028 * d) * RAD;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;
  const ha = (gmst * 15 + SEOUL.lon) * RAD - ra;
  const lat = SEOUL.lat * RAD;
  const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.cos(lat) * Math.tan(dec) - Math.sin(lat) * Math.cos(ha));
  return { elevation: el / RAD, azimuth: ((az / RAD) % 360 + 360) % 360 };
}

// 해 위치 + 날씨 → 빛 설정
function lighting(date: Date, sky: Sky) {
  const { elevation, azimuth } = sunPosition(date);
  const day = smooth(-4, 10, elevation); // 0 밤 ~ 1 낮
  const warm = (1 - smooth(4, 28, elevation)) * (1 - sky.cloud * 0.8); // 해가 낮을수록 주황빛 (흐리면 덜)

  let light = mix3(mix3([0.22, 0.27, 0.42], [0.6, 0.58, 0.55], day), [0.62, 0.42, 0.26], warm * day);
  let ambient = mix3(mix3([0.12, 0.15, 0.25], [0.5, 0.52, 0.54], day), [0.44, 0.38, 0.4], warm * day);

  // 흐림: 직사광이 약해지고 하늘빛(회색)이 커진다. 구름 사이로 새는 빛이 있어 그림자는 연하게 남는다
  const c = sky.cloud;
  light = light.map((v) => v * (1 - 0.5 * c)) as Vec3;
  const grey = (ambient[0] + ambient[1] + ambient[2]) / 3;
  ambient = mix3(ambient, [grey * 1.18 + 0.02, grey * 1.2 + 0.03, grey * 1.24 + 0.05], c * 0.8);

  const useSun = elevation > -2;
  const el = (useSun ? Math.max(elevation, 3) : 38) * RAD;
  const az = azimuth * RAD;
  const dx = useSun ? Math.sin(az) : 0.55; // 동쪽 = 오른쪽(+x)
  const dy = useSun ? -Math.cos(az) : -0.83; // 북쪽 = 위(-y). 달은 오른쪽 위
  const dir: Vec3 = [Math.cos(el) * dx, Math.cos(el) * dy, Math.sin(el)];

  const bright = (0.42 + 0.68 * day) * (1 - 0.3 * c);
  return {
    dir,
    light,
    ambient,
    shadow: (0.5 + 0.25 * day) * (1 - 0.5 * c), // 흐려도 맑은 날의 절반쯤
    soft: c, // 흐릴수록 그림자 가장자리가 흐려진다
    lantern: 1 - smooth(-3, 6, elevation),
    wet: Math.min(1, sky.rain * 1.4),
    snow: sky.snow,
    fog: sky.fog,
    backdrop: `brightness(${bright.toFixed(2)}) saturate(${(0.55 + 0.5 * day - 0.3 * c).toFixed(2)}) sepia(${(0.35 * warm * day).toFixed(2)}) hue-rotate(${Math.round(18 * (1 - day))}deg)`,
  };
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){ v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5); gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D u_img;
uniform sampler2D u_h;
uniform vec2 u_res;
uniform vec3 u_dir;
uniform vec3 u_light;
uniform vec3 u_ambient;
uniform float u_shadow;
uniform float u_lantern;
uniform float u_hmax;
uniform float u_wet;
uniform float u_snow;
uniform float u_fog;
uniform vec2 u_lamp;
uniform vec2 u_size;
uniform float u_soft;
uniform float u_time;
varying vec2 v_uv;

float H(vec2 uv){ return texture2D(u_h, uv).r; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// 부드러운 잡음 (안개 덩어리용)
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = v_uv;
  vec3 albedo = texture2D(u_img, uv).rgb;
  vec2 px = 1.0 / u_res;
  float hRaw = H(uv);
  float h0 = hRaw * u_hmax;

  // 경사(입체감)
  float hx = (H(uv + vec2(px.x, 0.0)) - H(uv - vec2(px.x, 0.0))) * u_hmax * 0.5;
  float hy = (H(uv + vec2(0.0, px.y)) - H(uv - vec2(0.0, px.y))) * u_hmax * 0.5;
  vec3 n = normalize(vec3(-hx, -hy, 1.0));
  vec3 L = normalize(u_dir);
  float diff = max(dot(n, L), 0.0) / max(L.z, 0.08);
  float relief = mix(1.0, clamp(diff, 0.0, 1.6), 0.2);

  // 해 쪽으로 걸어가며 더 높은 것이 빛을 가리는지 확인 → 그림자
  vec2 dir = normalize(L.xy + vec2(1e-5));
  float tanE = L.z / max(length(L.xy), 1e-3);
  float shadow = 0.0;
  for (int i = 1; i <= 64; i++) {
    float d = float(i) * 3.5;
    vec2 s = uv + dir * d * px;
    if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) break;
    float over = H(s) * u_hmax - (h0 + d * tanE);
    shadow = max(shadow, smoothstep(0.0, 5.0 + 22.0 * u_soft, over) * (1.0 - float(i) / 90.0));
  }
  vec3 lit = u_ambient + u_light * relief * (1.0 - shadow * u_shadow);

  // 비: 젖은 땅은 어둡고 진해진다
  vec3 base = albedo * (1.0 - 0.24 * u_wet);
  base = mix(base, base * base * 1.6, 0.25 * u_wet);

  vec3 col = base * lit;

  // 눈: 높은 곳 윗면에 먼저 쌓이고, 많이 오면 땅도 하얘진다
  //   (404 글자가 묻히지 않게 땅은 옅게, 밝은 돌길에 더 잘 붙게)
  float top = smoothstep(0.12, 0.35, hRaw) * smoothstep(0.6, 0.95, n.z);
  float lum = dot(albedo, vec3(0.3, 0.59, 0.11));
  float speck = 0.85 + 0.15 * hash(floor(uv * u_res));
  float ground = smoothstep(0.3, 0.95, u_snow) * 0.42 * (0.5 + 0.8 * lum) * speck;
  float cover = clamp(u_snow * 0.9 * top + ground * (1.0 - top), 0.0, 0.78);
  col = mix(col, vec3(0.93, 0.95, 0.99) * lit, cover);

  // 가운데 돔 등불 (사진 픽셀 기준 반경 약 117px)
  vec2 dp = (uv - u_lamp) * u_size;
  float g = exp(-dot(dp, dp) / 13700.0);
  col += u_lantern * vec3(1.0, 0.66, 0.36) * g * (0.22 + base * 0.9);

  // 안개: 길·잔디 같은 낮은 곳에 짙게 깔리고, 울타리·돔 윗면은 살짝 드러난다. 덩어리가 천천히 흘러간다
  if (u_fog > 0.0) {
    vec2 fp = uv * u_size / 380.0; // 사진 픽셀 기준 크기 (가로·세로 사진에서 같은 크기)
    float t = u_time * 0.035;
    float mist = fbm(fp + vec2(t, t * 0.4)) * 0.65 + fbm(fp * 2.3 - vec2(t * 1.6, t * 0.7)) * 0.35;
    mist = smoothstep(0.32, 0.72, mist);
    // 높이를 넓게 뭉개서 본다 → 안개 경계가 울타리 테두리를 칼같이 따라가지 않게
    float hb = 0.0;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.785;
      hb += H(uv + vec2(cos(a), sin(a)) * px * 9.0) + H(uv + vec2(cos(a + 0.39), sin(a + 0.39)) * px * 18.0);
    }
    hb = (hb / 16.0) * 0.6 + hRaw * 0.4;
    float low = 1.0 - smoothstep(0.05, 0.6, hb);
    float density = u_fog * (0.3 + 0.45 * low) * (0.2 + 0.8 * mist);
    vec3 fogCol = clamp(u_ambient * 1.2 + u_light * 0.35, 0.0, 1.0);
    col = mix(col, fogCol, clamp(density, 0.0, 0.7));
  }

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 404가 #g404-stage(제목과 버튼 사이 빈 공간) 한가운데에 오도록 사진 띠의 위치·크기를 맞춘다
//  - 가로 화면: 404가 빈 공간에 꽉 차게 (사진 가장자리는 흐린 배경에 녹아든다)
//  - 세로 화면: 사진이 화면을 꽉 채우게 하고, 그 안에서 404를 빈 공간 가운데로
function placeBand(root: HTMLElement, band: HTMLElement, scene: Scene, portrait: boolean) {
  const stage = document.getElementById("g404-stage");
  if (!stage) return;
  const r = root.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  if (!s.width || !s.height) return;
  const ratio = scene.w / scene.h;
  const width = portrait
    ? Math.max(r.width, r.height * ratio)
    : Math.min((s.width * 0.96) / scene.text.w, (s.height * 0.94 * ratio) / scene.text.h);
  const height = width / ratio;
  const cx = s.left - r.left + s.width / 2;
  const cy = s.top - r.top + s.height / 2;
  let top = cy - scene.text.cy * height;
  if (portrait) top = Math.min(0, Math.max(r.height - height, top)); // 화면 밖으로 빈틈이 생기지 않게
  Object.assign(band.style, {
    width: `${width}px`,
    left: `${cx - width / 2}px`,
    top: `${top}px`,
    translate: "none", // Tailwind의 -translate-x-1/2 등을 끈다
    transform: "none",
  });
}

// 지금 화면이 세로로 긴지 (돌리면 바뀐다)
const subscribeOrientation = (cb: () => void) => {
  const m = window.matchMedia(PORTRAIT_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const isPortrait = () => window.matchMedia(PORTRAIT_QUERY).matches;

// 내리는 비·눈 (2D 캔버스). 동작 줄이기 설정이면 멈춘 한 장면만 그린다.
function startPrecipitation(canvas: HTMLCanvasElement, sky: Sky) {
  const ctx = canvas.getContext("2d");
  const kind = sky.snow > 0 ? "snow" : sky.rain > 0 ? "rain" : null;
  if (!ctx || !kind) {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    return () => {};
  }
  const amount = kind === "snow" ? sky.snow : sky.rain;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  type P = { x: number; y: number; v: number; s: number; p: number };
  let drops: P[] = [];
  let w = 0;
  let h = 0;

  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(((w * h) / (kind === "rain" ? 2600 : 3800)) * amount);
    drops = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      v: kind === "rain" ? 900 + Math.random() * 500 : 25 + Math.random() * 55,
      s: kind === "rain" ? 12 + Math.random() * 12 : 0.8 + Math.random() * 1.8,
      p: Math.random() * Math.PI * 2,
    }));
  };

  const paint = (dt: number, t: number) => {
    ctx.clearRect(0, 0, w, h);
    if (kind === "rain") {
      ctx.strokeStyle = "rgba(215, 225, 235, 0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.v * dt;
        d.x += d.v * 0.12 * dt;
        if (d.y > h) {
          d.y = -d.s;
          d.x = Math.random() * w;
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.s * 0.12, d.y - d.s);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (const d of drops) {
        d.y += d.v * dt;
        const x = d.x + Math.sin(t * 0.8 + d.p) * 12;
        if (d.y > h + 4) {
          d.y = -4;
          d.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(x, d.y, d.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  if (still) {
    paint(0, 0);
    return () => ro.disconnect();
  }
  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    paint(dt, now / 1000);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}

export default function GardenLight({ weather }: { weather: GardenWeather | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const precipRef = useRef<HTMLCanvasElement>(null);
  // 서버에서는 가로로 그리고, 브라우저에서 세로 화면이면 세로 사진으로 바꾼다 (사진 자체는 <picture>가 처음부터 맞게 고른다)
  const portrait = useSyncExternalStore(subscribeOrientation, isPortrait, () => false);
  const scene = SCENES[portrait ? "portrait" : "landscape"];

  // 사진 띠 위치 맞추기
  useEffect(() => {
    const root = rootRef.current;
    const band = bandRef.current;
    const stage = document.getElementById("g404-stage");
    if (!root || !band) return;
    const place = () => placeBand(root, band, scene, portrait);
    place();
    const ro = new ResizeObserver(place);
    ro.observe(root);
    if (stage) ro.observe(stage);
    return () => ro.disconnect();
  }, [scene, portrait]);

  // 빛·그림자·날씨
  useEffect(() => {
    const canvas = canvasRef.current;
    const precip = precipRef.current;
    if (!canvas) return;
    const sp = new URLSearchParams(window.location.search);
    const sky = previewSky(sp.get("weather"), skyFrom(weather));
    const stopPrecip = precip ? startPrecipitation(precip, sky) : () => {};
    // 미리보기 주소일 때만 화면 캡처가 가능하게 그린 결과를 남겨 둔다
    const preview = sp.has("garden") || sp.has("weather") || sp.has("date");

    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: preview });
    if (!gl) return stopPrecip; // WebGL이 없으면 사진만

    let disposed = false;
    let timer = 0;
    let observer: ResizeObserver | null = null;

    const program = gl.createProgram()!;
    try {
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
    } catch (e) {
      console.warn("[404 garden] WebGL 준비 실패, 사진만 보여요", e);
      return stopPrecip;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const texture = (img: HTMLImageElement, unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    };

    const draw = () => {
      if (disposed || gl.isContextLost()) return;
      const w = Math.min(2000, Math.round(canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1)));
      const h = Math.round((w * scene.h) / scene.w);
      if (!w) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      const l = lighting(sceneDate(), sky);
      gl.uniform3fv(u("u_dir"), l.dir);
      gl.uniform3fv(u("u_light"), l.light);
      gl.uniform3fv(u("u_ambient"), l.ambient);
      gl.uniform1f(u("u_shadow"), l.shadow);
      gl.uniform1f(u("u_lantern"), l.lantern);
      gl.uniform1f(u("u_wet"), l.wet);
      gl.uniform1f(u("u_snow"), l.snow);
      gl.uniform1f(u("u_fog"), l.fog);
      gl.uniform1f(u("u_soft"), l.soft);
      gl.uniform1f(u("u_time"), performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (backdropRef.current) backdropRef.current.style.filter = l.backdrop;
      canvas.style.opacity = "1";
    };

    Promise.all([loadImage(scene.img), loadImage(scene.height)])
      .then(([img, height]) => {
        if (disposed) return;
        texture(img, 0);
        texture(height, 1);
        gl.uniform1i(u("u_img"), 0);
        gl.uniform1i(u("u_h"), 1);
        gl.uniform2f(u("u_res"), height.width, height.height);
        gl.uniform2f(u("u_size"), scene.w, scene.h);
        gl.uniform2f(u("u_lamp"), scene.lamp[0], scene.lamp[1]);
        gl.uniform1f(u("u_hmax"), 40); // 높이 배율: 클수록 그림자가 길다
        draw();
        // 1분마다 해가 조금씩 움직인다. 안개가 있으면 흘러가도록 초당 15번 (동작 줄이기 설정이면 멈춤)
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        timer = window.setInterval(draw, sky.fog > 0 && !still ? 66 : 60_000);
        observer = new ResizeObserver(draw);
        observer.observe(canvas);
      })
      .catch((e) => console.warn("[404 garden] 이미지 불러오기 실패", e));

    const onLost = (e: Event) => {
      e.preventDefault();
      canvas.style.opacity = "0";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      observer?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      stopPrecip();
    };
  }, [weather, scene]);

  // 사진: 세로 화면이면 처음부터 세로 사진을 받도록 <picture>로 고른다
  const L = SCENES.landscape;
  const P = SCENES.portrait;
  const {
    props: { srcSet: landSet },
  } = getImageProps({ alt: "", src: L.img, width: L.w, height: L.h, sizes: "118vw" });
  const {
    props: { srcSet: portSet, ...imgProps },
  } = getImageProps({ alt: "", src: P.img, width: P.w, height: P.h, sizes: "100vw", fetchPriority: "high" });
  const photo = (className: string) => (
    <picture>
      <source media={PORTRAIT_QUERY} srcSet={portSet} />
      <source srcSet={landSet} />
      {/* getImageProps로 만든 최적화 이미지 */}
      <img {...imgProps} alt="" className={className} />
    </picture>
  );

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0">
      {/* 사진 밖 빈 곳을 채우는 흐린 배경 */}
      <div ref={backdropRef} className="absolute inset-0 transition-[filter] duration-1000">
        {photo("absolute inset-0 h-full w-full scale-110 object-cover blur-2xl")}
      </div>
      {/* 사진 띠: 처음엔 가운데, 스크립트가 빈 공간에 맞춰 옮긴다.
          가로 화면: 가장자리를 흐린 배경에 녹인다 / 세로 화면: 화면을 꽉 채운다 */}
      <div
        ref={bandRef}
        className="absolute left-1/2 top-1/2 aspect-[2000/876] w-[150vw] -translate-x-1/2 -translate-y-1/2 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent),linear-gradient(transparent,#000_9%,#000_91%,transparent)] md:w-[min(max(100vw,calc(100svh*2000/876)),118vw)] portrait:aspect-[1384/3064] portrait:w-[max(100vw,calc(100svh*1384/3064))] portrait:[mask-image:none]"
      >
        {photo("absolute inset-0 h-full w-full object-cover")}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" />
      </div>
      {/* 내리는 비·눈 */}
      <canvas ref={precipRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
