"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  EMAIL_RE,
  PASSWORD_RULE,
  PHONE_RE,
  TERMS_VERSION,
  checkPassword,
  formatPhone,
} from "@/config/legal";
import { serverClient } from "@/lib/supabase/server";

export type MemberState = { ok: boolean; message: string; field?: string } | null;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const checked = (fd: FormData, key: string) => fd.get(key) === "on";

// 로그인 후 돌아갈 주소는 우리 사이트 안의 경로만 허용 (외부 주소로 튕기기 방지)
const safeNext = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : "/account");

async function origin() {
  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host")}`;
}

// 회원가입 ----------------------------------------------------------------
export async function signUp(_: MemberState, fd: FormData): Promise<MemberState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const name = text(fd, "name");
  const phoneRaw = text(fd, "phone");

  if (!EMAIL_RE.test(email)) return { ok: false, field: "email", message: "이메일 형식을 확인해 주세요." };
  if (!checkPassword(password)) return { ok: false, field: "password", message: `비밀번호는 ${PASSWORD_RULE}로 만들어 주세요.` };
  if (password !== String(fd.get("password2") ?? ""))
    return { ok: false, field: "password2", message: "비밀번호가 서로 다릅니다." };
  if (!name || name.length > 40) return { ok: false, field: "name", message: "이름을 입력해 주세요." };
  if (!PHONE_RE.test(phoneRaw)) return { ok: false, field: "phone", message: "휴대폰 번호를 확인해 주세요." };
  if (!checked(fd, "agree_age") || !checked(fd, "agree_terms") || !checked(fd, "agree_privacy"))
    return { ok: false, field: "agree", message: "필수 약관에 모두 동의해 주세요." };

  const supabase = await serverClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=/account`,
      // DB 트리거가 이 값으로 회원 정보(profiles)를 만든다
      data: {
        name,
        phone: formatPhone(phoneRaw),
        agree_age: true,
        agree_terms: true,
        agree_privacy: true,
        marketing_email: checked(fd, "marketing_email"),
        marketing_sms: checked(fd, "marketing_sms"),
        terms_version: TERMS_VERSION,
      },
    },
  });
  if (error) {
    if (error.code === "user_already_exists")
      return { ok: false, field: "email", message: "이미 가입된 이메일입니다." };
    if (error.code === "weak_password")
      return { ok: false, field: "password", message: "더 안전한 비밀번호를 써 주세요." };
    if (error.code === "over_email_send_rate_limit")
      return { ok: false, message: "인증 메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요." };
    return { ok: false, message: "가입하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  // 이미 가입된 이메일이면 Supabase는 보안상 오류 대신 빈 identities를 돌려준다
  if (data.user && data.user.identities?.length === 0)
    return { ok: false, field: "email", message: "이미 가입된 이메일입니다." };

  // 이메일 인증을 끈 프로젝트면 바로 로그인된다
  if (data.session) redirect("/account?welcome=1");
  return { ok: true, message: email };
}

// 소셜 가입 마무리: 구글·카카오·네이버로 처음 로그인한 회원의 약관 동의와 회원 정보 -------------
export async function completeProfile(_: MemberState, fd: FormData): Promise<MemberState> {
  const name = text(fd, "name");
  const phoneRaw = text(fd, "phone");
  if (!name || name.length > 40) return { ok: false, field: "name", message: "이름을 입력해 주세요." };
  if (!PHONE_RE.test(phoneRaw)) return { ok: false, field: "phone", message: "휴대폰 번호를 확인해 주세요." };
  if (!checked(fd, "agree_age") || !checked(fd, "agree_terms") || !checked(fd, "agree_privacy"))
    return { ok: false, field: "agree", message: "필수 약관에 모두 동의해 주세요." };

  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("complete_profile", {
    p_name: name,
    p_phone: formatPhone(phoneRaw),
    p_marketing_email: checked(fd, "marketing_email"),
    p_marketing_sms: checked(fd, "marketing_sms"),
    p_terms_version: TERMS_VERSION,
  });
  if (error) return { ok: false, message: "가입을 마치지 못했습니다. 잠시 후 다시 시도해 주세요." };
  redirect(safeNext(text(fd, "next")));
}

// 로그인 -----------------------------------------------------------------
export async function signIn(_: MemberState, fd: FormData): Promise<MemberState> {
  const email = text(fd, "email").toLowerCase();
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(fd.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed")
      return { ok: false, field: "unconfirmed", message: "이메일 인증이 아직 안 됐어요. 받은 메일의 링크를 눌러 주세요." };
    return { ok: false, message: "이메일 또는 비밀번호가 맞지 않습니다." };
  }
  redirect(safeNext(text(fd, "next")));
}

export async function resendConfirmation(_: MemberState, fd: FormData): Promise<MemberState> {
  const email = text(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "이메일을 입력해 주세요." };
  const supabase = await serverClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/account` },
  });
  return { ok: true, message: "인증 메일을 다시 보냈어요." };
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/");
}

// 비밀번호 찾기 / 변경 ------------------------------------------------------
export async function requestPasswordReset(_: MemberState, fd: FormData): Promise<MemberState> {
  const email = text(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "이메일 형식을 확인해 주세요." };
  const supabase = await serverClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/account/password`,
  });
  // 가입 여부를 알려주지 않는다 (계정 존재 여부 노출 방지)
  return { ok: true, message: "가입된 이메일이라면 비밀번호 재설정 링크를 보냈어요." };
}

export async function updatePassword(_: MemberState, fd: FormData): Promise<MemberState> {
  const password = String(fd.get("password") ?? "");
  if (!checkPassword(password)) return { ok: false, field: "password", message: `비밀번호는 ${PASSWORD_RULE}로 만들어 주세요.` };
  if (password !== String(fd.get("password2") ?? ""))
    return { ok: false, field: "password2", message: "비밀번호가 서로 다릅니다." };
  const supabase = await serverClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { ok: false, field: "password", message: "지금과 다른 비밀번호를 써 주세요." };
  if (error) return { ok: false, message: "바꾸지 못했습니다. 다시 로그인한 뒤 시도해 주세요." };
  return { ok: true, message: "비밀번호를 바꿨어요." };
}

// 회원 정보 수정 -------------------------------------------------------------
export async function updateProfile(_: MemberState, fd: FormData): Promise<MemberState> {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const name = text(fd, "name");
  const phoneRaw = text(fd, "phone");
  if (!name || name.length > 40) return { ok: false, field: "name", message: "이름을 입력해 주세요." };
  if (!PHONE_RE.test(phoneRaw)) return { ok: false, field: "phone", message: "휴대폰 번호를 확인해 주세요." };
  const marketing_email = checked(fd, "marketing_email");
  const marketing_sms = checked(fd, "marketing_sms");

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      phone: formatPhone(phoneRaw),
      marketing_email,
      marketing_sms,
      marketing_agreed_at: marketing_email || marketing_sms ? new Date().toISOString() : null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: "저장하지 못했습니다." };
  return { ok: true, message: "저장했어요." };
}

// 회원 탈퇴 ---------------------------------------------------------------
export async function deleteAccount(_: MemberState, fd: FormData): Promise<MemberState> {
  if (text(fd, "confirm") !== "탈퇴") return { ok: false, message: "확인란에 '탈퇴'라고 입력해 주세요." };
  const supabase = await serverClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: error.message || "탈퇴하지 못했습니다." };
  await supabase.auth.signOut();
  redirect("/?bye=1");
}
