import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/social";

// 네이버 로그인 시작: 네이버 동의 화면으로 보낸다.
// Supabase가 네이버를 직접 지원하지 않아서, 돌아오는 곳(/auth/naver/callback)에서 우리가 세션을 만든다.
export function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId || !process.env.NAVER_CLIENT_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.redirect(new URL("/login?error=naver-setup", request.url));

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/auth/naver/callback", request.url).toString();
  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.search = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state }).toString();

  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("naver_state", state, opts);
  res.cookies.set("naver_next", safeNext(request.nextUrl.searchParams.get("next")), opts);
  return res;
}
