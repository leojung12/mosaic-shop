"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

// 상단 바: 로그인 전 LOGIN, 로그인 후 ACCOUNT. 페이지가 바뀔 때마다 세션을 다시 본다.
// (서버에서 세션을 읽으면 모든 페이지가 요청마다 그려져야 해서, 브라우저에서 확인한다)
export default function AccountLink() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = browserClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, [pathname]);

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className={`label hover-line transition-opacity ${signedIn === null ? "opacity-0" : ""}`}
    >
      {signedIn ? "Account" : "Login"}
    </Link>
  );
}
