import { ViewTransition, type ReactNode } from "react";

// 페이지 전환: 이전 화면은 빠르게 위로 빠지고, 새 화면은 아래에서 천천히 자리 잡는다 (globals.css)
// enter={false}: 안에서 요소별로 따로 등장시키는 페이지(상세)는 페이지 단위 등장을 끈다
export default function PageMotion({ children, enter = true }: { children: ReactNode; enter?: boolean }) {
  return (
    <ViewTransition enter={enter ? "page-enter" : "none"} exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
