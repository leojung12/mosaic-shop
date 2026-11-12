"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// 관리자 화면에서 이미지 업로드에 쓰는 브라우저 클라이언트 (로그인 쿠키 공유)
export const browserClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
