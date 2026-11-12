// 클라이언트 컴포넌트에서도 쓰는 값만 둔다 (서버 전용 조회는 shop-settings.ts)
// 주문 상태 (DB orders.status) — 손님·관리자 화면 공통 표기
export const ORDER_STATUS = {
  pending: "결제 대기",
  paid: "결제 완료",
  preparing: "상품 준비 중",
  shipped: "배송 중",
  delivered: "배송 완료",
  canceled: "주문 취소",
  refunded: "환불 완료",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS;

export type OrderItem = {
  id: string;
  product_id: string | null;
  slug: string;
  name: string;
  color: string;
  cutout: string;
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  items_amount: number;
  shipping_fee: number;
  total_amount: number;
  order_name: string;
  orderer_name: string;
  orderer_phone: string;
  orderer_email: string;
  recipient_name: string;
  recipient_phone: string;
  zipcode: string;
  address1: string;
  address2: string;
  delivery_memo: string;
  payment_method: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  coupon_code: string | null;
  discount_amount: number;
  refunded_amount: number;
  items: OrderItem[];
  returns?: ReturnRequest[];
};

export type ReturnRequest = {
  id?: string;
  kind: "exchange" | "return";
  status: "requested" | "approved" | "rejected" | "done";
  reason: string;
  admin_note?: string;
  created_at: string;
};
export const RETURN_KIND = { exchange: "교환", return: "반품" } as const;
export const RETURN_STATUS = { requested: "신청됨", approved: "승인", rejected: "거절", done: "처리 완료" } as const;

// 배송비 설정 값 (불러오기는 lib/shop-settings.ts — 서버 전용)
export type ShopSettings = { shippingFee: number; freeShippingOver: number };

export const shippingFor = (itemsAmount: number, s: ShopSettings) =>
  itemsAmount === 0 || itemsAmount >= s.freeShippingOver ? 0 : s.shippingFee;

// 손님이 결제 취소를 직접 할 수 있는 상태 (공급처 발주 전까지)
export const customerCancelable = (status: OrderStatus) => status === "paid";

// 택배사별 배송 조회 링크 (관리자가 고른 택배사 이름 기준)
export const COURIERS: Record<string, (no: string) => string> = {
  CJ대한통운: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}`,
  롯데택배: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}`,
  한진택배: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${n}`,
  우체국택배: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}`,
  로젠택배: (n) => `https://www.ilogen.com/web/personal/trace/${n}`,
};
export const trackingUrl = (courier: string | null, no: string | null) =>
  courier && no && COURIERS[courier] ? COURIERS[courier](no.replace(/\D/g, "")) : null;
