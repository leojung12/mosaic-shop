import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UI } from "@/config/site";

// 기본 404 화면은 다크 모드에서 body를 검게 칠하는 스타일을 남겨서,
// 홈으로 돌아와도 배경이 어두워지는 문제가 있었다. 우리 톤으로 대체한다.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100svh-52px)] flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="font-serif text-[40px] leading-none">Not here.</p>
        <p className="text-muted">찾으시는 페이지가 없거나 아직 준비 중입니다.</p>
        <Link href="/" className="label mt-4 hover:opacity-60">
          {UI.back}
        </Link>
      </main>
      <Footer />
    </>
  );
}
