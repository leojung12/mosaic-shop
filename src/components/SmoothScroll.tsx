"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// 마우스 휠의 뚝뚝 끊기는 스크롤을 관성 있게 이어 준다 (터치는 기본 스크롤 유지)
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 0.9, syncTouch: false, anchors: { offset: -96 } }}>
      <ScrollReset />
      {children}
    </ReactLenis>
  );
}

// 페이지를 옮기면 맨 위에서 시작 (Lenis가 이전 위치로 끌고 가지 않게)
// 홈은 상세에서 돌아올 때 떠났던 위치를 스스로 복원하므로 건드리지 않는다
//
// 트랙패드는 손을 뗀 뒤에도 관성 휠 입력이 1초 넘게 이어진다. 스크롤하다 바로 상품을 누르면
// 그 남은 입력이 새 페이지를 중간까지 끌어내리므로, 관성 입력이 끊길 때까지 스크롤을 멈춰 둔다
// (Lenis stop = 문서 overflow clip 이라 휴대폰 손가락 관성도 여기서 끊긴다)
const SETTLE_MS = 160; // 이만큼 휠 입력이 없으면 관성이 끝난 것으로 본다
const MIN_LOCK_MS = 60;
const MAX_LOCK_MS = 1600;

function ScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    if (pathname === "/" || !lenis) return;
    const start = performance.now();
    let last = start;
    let raf = 0;
    const onWheel = () => {
      last = performance.now();
    };
    const release = () => {
      window.removeEventListener("wheel", onWheel, true);
      cancelAnimationFrame(raf);
      lenis.start();
    };
    const tick = () => {
      const now = performance.now();
      const settled = now - start > MIN_LOCK_MS && now - last > SETTLE_MS;
      if (settled || now - start > MAX_LOCK_MS) release();
      else raf = requestAnimationFrame(tick);
    };

    lenis.stop();
    lenis.resize();
    lenis.scrollTo(0, { immediate: true, force: true });
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    raf = requestAnimationFrame(tick);
    return release;
  }, [pathname, lenis]);
  return null;
}
