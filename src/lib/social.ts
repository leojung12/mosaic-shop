import { serverClient } from "@/lib/supabase/server";

// 로그인 후 돌아갈 주소는 우리 사이트 안의 경로만 허용
export const safeNext = (v: string | null | undefined) =>
  v && v.startsWith("/") && !v.startsWith("//") ? v : "/account";

// 소셜로 처음 들어온 회원은 약관 동의·회원 정보가 없다 → 가입 마무리 화면으로
export async function afterLogin(next: string) {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login?error=link";
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile && user.app_metadata?.provider !== "email") return `/signup/complete?next=${encodeURIComponent(next)}`;
  if (!profile && user.user_metadata?.social) return `/signup/complete?next=${encodeURIComponent(next)}`;
  return next;
}
