import { BRAND_NAME } from "@/config/site";

// 로고 (2026-11). 이름은 아직 임시라서 로고가 이름에 묶이지 않게 했다.
//  워드마크 — 이름을 Bodoni Moda 굵은 대문자로. config/site.ts 의 BRAND_NAME 만 바꾸면 따라 바뀜
//  동아리 로고 — 이름이 MOSAIC 일 때 시작 화면·왼쪽 위에는 동아리 로고 글씨체를 쓴다 (회장 지시 2026-11-01)
//  도장 — 이름 첫 글자 모노그램 둘레에 타자기 글씨가 도는 원형 씰 (빈티지 라벨 느낌)
type P = { className?: string; title?: string };

export function Wordmark({ className = "" }: P) {
  return (
    <span className={`font-brand leading-none font-bold tracking-[0.02em] uppercase ${className}`}>{BRAND_NAME}</span>
  );
}

// 동아리 로고 글씨체 워드마크 (public/brand/mosaic.svg — 동아리 로고를 벡터로 딴 것).
// 글자색을 따라가도록 SVG 를 마스크로 쓰고 current color 로 칠한다. 이름이 MOSAIC 이 아니면 글자 워드마크로 대신한다.
export function ClubWordmark({ className = "" }: P) {
  if (BRAND_NAME !== "MOSAIC") return <Wordmark className={className} />;
  return (
    <span
      role="img"
      aria-label={BRAND_NAME}
      className={`inline-block aspect-[520/168] bg-current [mask:url(/brand/mosaic.svg)_center/contain_no-repeat] ${className}`}
    />
  );
}

// 시작 화면 첫 장: 동아리 로고 + 아래 양옆 두 줄 문구 (가운데 가는 세로선)
export function Lockup({ className = "" }: P) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <ClubWordmark className="w-[min(72vw,330px)]" />
      <div className="mt-6 flex items-stretch gap-4 font-mono text-[10.5px] leading-[1.4] tracking-[0.06em] uppercase md:text-[11.5px]">
        <span className="text-right">
          Curated objects
          <br />
          Based in Seoul
        </span>
        <span aria-hidden className="w-px bg-current" />
        <span>
          One piece
          <br />
          at a time
        </span>
      </div>
    </div>
  );
}

// 원형 도장: 바깥 두 줄 원 사이로 문구가 돌고, 가운데 이름 첫 글자
export function Seal({ className, title = `${BRAND_NAME} — Objects kept for a long time` }: P) {
  const text = `${BRAND_NAME} · OBJECTS KEPT LONG · SEOUL · EST. 2026 · `;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className} fill="none">
      <defs>
        <path id="seal-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" />
      <text fill="currentColor" fontFamily="var(--font-courier), monospace" fontSize="12">
        <textPath href="#seal-ring" textLength="462" lengthAdjust="spacing">
          {text}
        </textPath>
      </text>
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="var(--font-brand), Didot, serif"
        fontWeight="700"
        fontSize="64"
      >
        {BRAND_NAME.charAt(0)}
      </text>
    </svg>
  );
}

export default Wordmark;
