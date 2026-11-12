// 사업자·법적 표시 정보 (전자상거래법 제10조, 제13조). 사업자등록·통신판매업 신고 후 TBD를 실제 값으로 바꾼다.
// footer 한 줄과 /info 페이지가 모두 이 값을 쓴다.
const TBD = "TBD";

export const BUSINESS = {
  companyName: TBD, // 상호
  ceo: TBD, // 대표자
  address: TBD, // 사업장 소재지
  phone: TBD,
  email: TBD,
  bizNumber: TBD, // 사업자등록번호 (숫자만 또는 000-00-00000)
  mailOrderNumber: TBD, // 통신판매업 신고번호
  privacyOfficer: TBD, // 개인정보보호책임자
  hosting: "Vercel Inc.", // 호스팅 서비스 제공자
  csHours: "평일 10:00–17:00 (주말·공휴일 휴무)",
} as const;

export const isTBD = (v: string) => v === TBD;

// 공정거래위원회 사업자정보 공개 페이지 (사업자등록번호가 있어야 열린다)
export const bizInfoUrl = (bizNumber: string) =>
  `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${bizNumber.replace(/\D/g, "")}`;

// 배송·교환·반품 정책 값. 공급처 조건이 정해지면 여기만 고친다.
export const POLICY = {
  courier: TBD, // 택배사 (공급처별로 다를 수 있음)
  shippingFee: TBD, // 기본 배송비
  freeShippingOver: TBD, // 무료배송 기준 금액
  returnShippingFee: TBD, // 단순 변심 반품 왕복 배송비
} as const;
