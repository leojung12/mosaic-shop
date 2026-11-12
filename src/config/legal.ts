// 회원가입 약관·동의 문구. 내용이 바뀌면 TERMS_VERSION을 올린다 (가입자별 동의 버전이 저장됨).
export const TERMS_VERSION = "2026-11-01";
// 개인정보처리방침 시행일 (/privacy)
export const PRIVACY_VERSION = "2026-11-01";

export const CONSENTS = {
  age: "[필수] 만 14세 이상입니다",
  terms: "[필수] 이용약관 동의",
  privacy: "[필수] 개인정보 수집·이용 동의",
  marketing: "[선택] 마케팅 정보 수신 동의",
} as const;

// 개인정보 수집·이용 동의 내용 (개인정보 보호법 제15조: 항목·목적·보유기간·거부권 고지)
export const PRIVACY_NOTICE = [
  { label: "수집 항목", value: "이메일, 비밀번호(암호화 저장), 이름, 휴대폰 번호" },
  { label: "수집 목적", value: "회원 식별, 주문·배송 안내, 문의 응대, 공지 전달" },
  { label: "보유 기간", value: "회원 탈퇴 시까지 (관계 법령에 따라 보존이 필요한 경우 해당 기간)" },
  {
    label: "동의 거부",
    value: "동의를 거부할 수 있으나, 거부 시 회원가입이 제한됩니다.",
  },
];

export const MARKETING_NOTICE =
  "신상품·이벤트 소식을 이메일 또는 문자로 받습니다. 동의하지 않아도 가입할 수 있으며, 마이페이지에서 언제든 바꿀 수 있습니다.";

// 비밀번호 규칙: 8~64자, 영문·숫자·특수문자 중 2가지 이상
export const PASSWORD_RULE = "8자 이상, 영문·숫자·특수문자 중 2가지 이상";
export function checkPassword(pw: string) {
  if (pw.length < 8 || pw.length > 64) return false;
  const kinds = [/[A-Za-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return kinds >= 2;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;
export const formatPhone = (v: string) =>
  v.replace(/\D/g, "").replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
