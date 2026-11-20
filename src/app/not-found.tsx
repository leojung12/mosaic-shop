import type { CSSProperties } from "react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import GardenLight, { type GardenWeather } from "@/components/not-found/GardenLight";
import { CATEGORIES } from "@/config/categories";

// 404 — "Lost in the garden"
// 하늘에서 내려다본 정원 사진. 가운데 덩굴 덮인 돔이 0, 양옆 꽃 덤불이 4가 되어 404로 읽힌다.
// 햇빛·그림자·날씨는 <GardenLight>가 다시 그린다 (서울의 실제 해 위치 + 실시간 서울 날씨).
// 404 사진은 제목과 아래 버튼 사이 빈 공간(#g404-stage) 한가운데에 맞춰진다.
// 기본 404 화면은 다크 모드에서 body를 검게 칠하는 스타일을 남겨서 홈 배경이 어두워지는 문제가 있었다. 그래서 직접 만든 화면을 쓴다.

const CREAM = "#efe8d6";

// 서울 현재 날씨 (Open-Meteo, 무료·키 없음). 서버에서 15분마다 새로 받아 모든 방문자가 같은 값을 쓴다.
// 방문자 브라우저가 날씨 서비스에 직접 접속하지 않으므로 방문자 정보가 밖으로 나가지 않는다.
// 실패하면 null → 맑음으로 그린다.
async function getSeoulWeather(): Promise<GardenWeather | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.978&current=weather_code,cloud_cover&timezone=Asia%2FSeoul",
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { current?: { weather_code?: number; cloud_cover?: number } };
    const code = json.current?.weather_code;
    if (typeof code !== "number") return null;
    return { code, cloud: Math.min(1, Math.max(0, (json.current?.cloud_cover ?? 0) / 100)) };
  } catch {
    return null;
  }
}

// 어두운 정원 위에서는 헤더 글자를 크림색으로
const onGarden = {
  "--current-ink": CREAM,
  "--current-muted": "rgba(239, 232, 214, 0.7)",
  color: CREAM,
} as CSSProperties;

export default async function NotFound() {
  const weather = await getSeoulWeather();
  return (
    <>
      <div style={onGarden}>
        <Header />
      </div>
      <main
        style={onGarden}
        className="relative flex min-h-svh flex-1 flex-col items-center overflow-hidden bg-[#2b3524] px-5 pb-[calc(36px+env(safe-area-inset-bottom))] pt-[calc(84px+env(safe-area-inset-top))] text-center md:pt-24"
      >
        <GardenLight weather={weather} />
        {/* 글자가 잘 읽히도록 위아래를 살짝 어둡게 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,22,12,0.6),transparent_24%,transparent_70%,rgba(16,22,12,0.72))]" />

        {/* 제목은 가운데, 안내 문구는 제목 왼쪽 끝 바로 아래 */}
        <div className="relative inline-flex flex-col items-start">
          {/* 어떤 화면에서도 한 줄. 화면 폭에 맞춰 글자 크기가 줄어든다 → 제목 상자 = 글자 폭 → 문구가 L 바로 아래에 붙는다 */}
          <h1 className="whitespace-nowrap font-serif text-[clamp(22px,7.5vw,92px)] uppercase leading-[0.95] tracking-[0.01em] [text-shadow:0_2px_24px_rgba(0,0,0,0.4)]">
            <span className="sr-only">404 — </span>
            Lost in the garden
          </h1>
          <p className="mt-1 text-left text-[18px] leading-none md:mt-1.5 md:text-[40px] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
            정원에서 길을 잃으셨군요
          </p>
        </div>

        {/* 404 사진이 들어갈 빈 공간 */}
        <div id="g404-stage" aria-hidden className="min-h-[38svh] w-full flex-1" />

        <div className="relative flex flex-col items-center gap-5">
          <Link
            href="/"
            className="rounded-full px-7 py-3 text-[14px] transition-opacity hover:opacity-80"
            style={{ backgroundColor: CREAM, color: "#2a2a22" }}
          >
            돌아가기
          </Link>
          <nav aria-label="카테고리" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="label hover-line opacity-80 hover:opacity-100">
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
