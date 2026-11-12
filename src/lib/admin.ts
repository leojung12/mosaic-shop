import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";

// 관리자 페이지·액션 맨 앞에서 호출. 로그인 + admin_users 등록 여부를 확인한다.
// (admin_users는 RLS로 본인 행만 보이므로, 한 줄이라도 읽히면 관리자다)
export async function requireAdmin() {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("admin_users").select("user_id").limit(1);
  if (!data?.length) redirect("/admin/login?denied=1");
  return { supabase, email: user.email ?? "" };
}
