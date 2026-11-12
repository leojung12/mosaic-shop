"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

// 홈·숍으로 가는 링크 (BACK, 로고). href 기본값은 홈.
// 상세 페이지에서 메인 이미지가 화면 밖이면, 먼저 부드럽게 올라가 이미지를 보여준 뒤 이동한다.
// 그래야 오브제가 상세 이미지에서 홈의 원래 자리로 날아가는 전환이 이어진다
// (화면 밖 요소는 공유 전환에서 빠지기 때문).
export default function HomeLink({ href = "/", ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href?: string }) {
  const router = useRouter();
  const lenis = useLenis();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    // 지나온 상세 페이지들이 숨겨진 채 문서에 남아 있으므로, 지금 보이는 것만 고른다
    const visible = <T extends HTMLElement>(sel: string) =>
      [...document.querySelectorAll<T>(sel)].find((el) => el.offsetParent !== null);
    const hero = visible<HTMLElement>("[data-hero]");
    const gallery = visible<HTMLElement>("[data-gallery]");
    if (!hero) return; // 상세 페이지가 아니면 보통 링크처럼

    // 갤러리를 다른 사진으로 넘겨 놨다면 누끼 장으로 되돌린다
    if (gallery && gallery.scrollLeft > 0) gallery.scrollTo({ left: 0 });

    // 대부분 보이면 바로 이동 (Link 기본 동작). 반쯤 잘려 있으면 올라간 뒤 이동한다
    const r = hero.getBoundingClientRect();
    const slack = r.height * 0.2;
    if (r.top > -slack && r.bottom < window.innerHeight + slack) return;

    e.preventDefault();
    const go = () => router.push(href, { scroll: false });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.scrollTo(0, 0);
      go();
    } else if (lenis) {
      lenis.scrollTo(0, { duration: 0.9, onComplete: go });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        go();
      };
      window.addEventListener("scrollend", finish, { once: true });
      setTimeout(finish, 900);
    }
  };

  // scroll={false}: 홈이 떠날 때의 스크롤 위치를 스스로 복원한다 (ObjectStage)
  return <Link {...props} href={href} scroll={false} onClick={onClick} />;
}
