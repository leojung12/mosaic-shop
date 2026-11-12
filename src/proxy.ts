import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// 로그인 세션을 갱신하고, 로그인이 필요한 화면에서 로그인 안 했으면 로그인 화면으로 보낸다.
// - /admin/*   → /admin/login (관리자 여부 최종 확인은 requireAdmin()과 DB RLS)
// - /account/* → /login?next=...
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const { pathname, search } = request.nextUrl;
  if (!data?.claims) {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // 비밀번호 재설정 화면은 메일 링크로 받은 세션이 있어야 한다 → 없으면 로그인으로
    if (pathname.startsWith("/account")) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/login", "/signup"] };
