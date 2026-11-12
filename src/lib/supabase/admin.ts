import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

// 서버 전용 관리자 클라이언트 (service_role). 네이버 로그인처럼 Supabase가 직접 지원하지 않는
// 로그인을 연결할 때만 쓴다. 키가 없으면 null — 브라우저 코드에서 절대 import 하지 않는다.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
