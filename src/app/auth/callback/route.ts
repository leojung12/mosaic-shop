import { NextResponse, type NextRequest } from "next/server";
import { afterLogin, safeNext } from "@/lib/social";
import { serverClient } from "@/lib/supabase/server";

// 인증 메일(가입 확인·비밀번호 재설정)과 구글·카카오 로그인이 돌아오는 곳.
// code를 세션으로 바꾸고, 소셜로 처음 온 회원이면 가입 마무리 화면으로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(await afterLogin(next), request.url));
  }
  // 소셜 로그인 쪽에서 취소·오류로 돌아온 경우
  if (searchParams.get("error")) return NextResponse.redirect(new URL("/login?error=social", request.url));
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
