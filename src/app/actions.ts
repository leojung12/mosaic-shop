"use server";

import { publicClient } from "@/lib/supabase/public";
import { serverClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; message: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// 이메일 또는 휴대폰 번호만 받는다
function normalizeContact(raw: string) {
  const v = raw.replace(/\s/g, "");
  if (EMAIL.test(v)) return v.toLowerCase();
  if (PHONE.test(v)) return v.replace(/-/g, "").replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
  return null;
}

// 봇이 채우는 숨김 칸(website)이 차 있으면 성공한 척하고 버린다
const isBot = (fd: FormData) => text(fd, "website") !== "";

export async function joinWaitlist(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: "신청되었어요." };
  const contact = normalizeContact(text(fd, "contact"));
  if (!contact) return { ok: false, message: "이메일 또는 휴대폰 번호를 정확히 입력해 주세요." };
  if (fd.get("consent") !== "on") return { ok: false, message: "개인정보 수집에 동의해 주세요." };
  const productId = text(fd, "productId");

  const { error } = await publicClient()
    .from("waitlist")
    .insert({ contact, product_id: UUID.test(productId) ? productId : null });
  if (error?.code === "23505") return { ok: true, message: "이미 신청되어 있어요. 오픈하면 알려드릴게요." };
  if (error) return { ok: false, message: "잠시 후 다시 시도해 주세요." };
  return { ok: true, message: "신청되었어요. 오픈하면 알려드릴게요." };
}

export async function sendInquiry(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true, message: "문의가 접수되었어요." };
  const name = text(fd, "name");
  const contact = normalizeContact(text(fd, "contact"));
  const body = text(fd, "body");
  if (!name || name.length > 40) return { ok: false, message: "이름을 입력해 주세요." };
  if (!contact) return { ok: false, message: "답변 받을 이메일 또는 휴대폰 번호를 입력해 주세요." };
  if (body.length < 5 || body.length > 2000)
    return { ok: false, message: "문의 내용을 5자 이상 2000자 이하로 적어 주세요." };
  if (fd.get("consent") !== "on") return { ok: false, message: "개인정보 수집에 동의해 주세요." };
  const productId = text(fd, "productId");

  // 로그인한 회원이면 세션으로 저장해서 마이페이지에서 본인 문의를 볼 수 있게 한다
  const { error } = await (await serverClient())
    .from("inquiries")
    .insert({ name, contact, body, product_id: UUID.test(productId) ? productId : null });
  if (error) return { ok: false, message: "잠시 후 다시 시도해 주세요." };
  return { ok: true, message: "문의가 접수되었어요. 남겨주신 연락처로 답변드릴게요." };
}
