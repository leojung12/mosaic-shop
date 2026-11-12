import { NextResponse, type NextRequest } from "next/server";
import { afterLogin, safeNext } from "@/lib/social";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";

type NaverMe = { resultcode: string; response?: { id: string; email?: string; name?: string; mobile?: string } };

// 네이버 로그인이 돌아오는 곳.
// 1) code → 네이버 토큰 → 회원 정보(이메일)
// 2) 그 이메일의 Supabase 회원을 찾거나 만든다 (service_role)
// 3) 일회용 로그인 토큰을 만들어 바로 검증 → 우리 사이트 로그인 쿠키가 생긴다
export async function GET(request: NextRequest) {
  const fail = (why: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${why}`, request.url));
    res.cookies.delete("naver_state");
    res.cookies.delete("naver_next");
    return res;
  };
  const p = request.nextUrl.searchParams;
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state || state !== request.cookies.get("naver_state")?.value) return fail("social");

  const admin = adminClient();
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!admin || !clientId || !clientSecret) return fail("naver-setup");

  const token = (await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, state }),
  })
    .then((r) => r.json())
    .catch(() => null)) as { access_token?: string } | null;
  if (!token?.access_token) return fail("social");

  const me = (await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
    .then((r) => r.json())
    .catch(() => null)) as NaverMe | null;
  const email = me?.response?.email?.toLowerCase();
  if (!email) return fail("naver-email"); // 네이버 동의 화면에서 이메일 제공을 거부한 경우

  // 처음이면 회원을 만든다 (이미 있으면 오류가 나지만 무시하고 로그인으로)
  await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { social: "naver", naver_id: me?.response?.id, full_name: me?.response?.name, mobile: me?.response?.mobile },
  });
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link.properties?.hashed_token) return fail("social");

  const supabase = await serverClient();
  const { error: otpError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (otpError) return fail("social");

  const next = safeNext(request.cookies.get("naver_next")?.value);
  const res = NextResponse.redirect(new URL(await afterLogin(next), request.url));
  res.cookies.delete("naver_state");
  res.cookies.delete("naver_next");
  return res;
}
