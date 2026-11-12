import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// 로그인 세션 없이 쓰는 클라이언트 (손님 권한). 캐시된 상품 조회와 손님 입력 저장에 쓴다.
export const publicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
