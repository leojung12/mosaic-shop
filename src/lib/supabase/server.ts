import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// 관리자 세션 쿠키를 읽는 서버용 클라이언트. 요청 시점에만 쓸 수 있다 (<Suspense> 안).
export async function serverClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 못 쓴다. 세션 갱신은 proxy가 맡는다.
        }
      },
    },
  });
}
