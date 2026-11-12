import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import PageMotion from "@/components/PageMotion";
import Reveal from "@/components/Reveal";
import { BUSINESS, POLICY, bizInfoUrl, isTBD } from "@/config/business";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `Info · ${BRAND_NAME}`,
  description: "배송, 교환·반품, 고객 문의, 사업자 정보",
};

const SECTIONS = [
  { id: "shipping", label: "Shipping", title: "배송 안내" },
  { id: "returns", label: "Returns", title: "교환·반품" },
  { id: "contact", label: "Contact", title: "고객 문의" },
  { id: "business", label: "Business", title: "사업자 정보" },
] as const;

// 배송·교환·반품 안내 + 사업자 정보 (명세 §5). 값은 config/business.ts
export default function InfoPage() {
  return (
    <PageMotion>
      <div className="mx-auto w-full max-w-[680px] px-5 pt-28 pb-24 md:pt-32">
        <Reveal className="text-center">
          <h1 className="font-serif text-[52px] leading-none md:text-[72px]">Info</h1>
          <p className="mx-auto mt-5 max-w-[520px] leading-relaxed text-muted">
            {BRAND_NAME}는 공급처에서 손님께 바로 보내드리는 방식으로 운영합니다. 그래서 출고까지 시간이 조금
            걸릴 수 있고, 여러 상품을 함께 주문하면 따로 도착할 수 있어요. 늦으면 늦다고 미리 알려드릴게요.
          </p>
        </Reveal>

        <div className="mt-12 md:mt-16">
          {/* 목차: 가운데 한 줄 */}
          <nav className="label mb-16 border-y border-current/15 py-4 md:mb-20">
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted transition-colors hover:text-current">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-20">
            <Section id="shipping" order={1}>
              <Rows
                rows={[
                  [
                    "출고",
                    "주문 후 영업일 기준 2~5일 안에 출고돼요. 상품마다 다르며 각 상품 페이지에 따로 적어 두었어요.",
                  ],
                  [
                    "배송",
                    "출고 후 보통 1~2일 안에 도착해요. 택배사 사정이나 명절·연휴에는 더 걸릴 수 있어요.",
                  ],
                  ["택배사", POLICY.courier],
                  [
                    "배송비",
                    isTBD(POLICY.shippingFee)
                      ? POLICY.shippingFee
                      : `${POLICY.shippingFee}${isTBD(POLICY.freeShippingOver) ? "" : ` (${POLICY.freeShippingOver} 이상 무료)`}`,
                  ],
                  ["추가 배송비", "제주·도서산간 지역은 추가 배송비가 붙을 수 있어요."],
                  ["따로 도착", "공급처가 다른 상품을 함께 주문하면 각각 출고되어 따로 도착할 수 있어요."],
                  ["송장 안내", "출고되면 송장번호를 문자 또는 이메일로 보내드려요."],
                ]}
              />
            </Section>

            <Section id="returns" order={2}>
              <Rows
                rows={[
                  ["신청 기간", "상품을 받은 날부터 7일 이내에 교환·반품을 신청할 수 있어요."],
                  [
                    "상품이 다를 때",
                    "받은 상품이 설명·사진과 다르거나 계약 내용과 다르게 이행된 경우, 받은 날부터 3개월 이내 또는 그 사실을 안 날부터 30일 이내에 신청할 수 있어요.",
                  ],
                  [
                    "신청 방법",
                    "상품 페이지의 '문의하기' 또는 아래 이메일로 주문 정보와 사유를 보내 주세요. 회수 방법을 안내해 드려요.",
                  ],
                  [
                    "반품 배송비",
                    `단순 변심은 왕복 배송비${isTBD(POLICY.returnShippingFee) ? "" : `(${POLICY.returnShippingFee})`}를 손님이, 불량·파손·오배송은 판매자가 부담해요.`,
                  ],
                  [
                    "불량·파손",
                    "받으신 날 상자와 상품 사진을 찍어 문의로 보내 주세요. 확인 후 교환 또는 전액 환불해 드려요.",
                  ],
                  [
                    "어려운 경우",
                    "손님 책임으로 상품이 훼손된 경우, 사용으로 가치가 크게 줄어든 경우, 시간이 지나 다시 판매하기 어려울 만큼 가치가 줄어든 경우에는 교환·반품이 어려워요.",
                  ],
                  ["환불", "반품 상품이 도착해 확인되면 3영업일 이내에 결제 수단으로 환불해 드려요."],
                ]}
              />
              <p className="mt-6 text-[12px] leading-relaxed text-muted">
                위 내용은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 청약철회 기준을 따릅니다.
              </p>
            </Section>

            <Section id="contact" order={3}>
              <Rows
                rows={[
                  ["이메일", BUSINESS.email],
                  ["전화", BUSINESS.phone],
                  ["운영 시간", BUSINESS.csHours],
                  [
                    "문의하기",
                    "각 상품 페이지 아래 '문의하기'에서 남겨 주시면 남긴 연락처로 답변드려요. 회원이면 마이페이지에서 답변을 볼 수 있어요.",
                  ],
                ]}
              />
            </Section>

            <Section id="business" order={4}>
              <Rows
                rows={[
                  ["상호", BUSINESS.companyName],
                  ["대표자", BUSINESS.ceo],
                  ["사업장 주소", BUSINESS.address],
                  ["전화", BUSINESS.phone],
                  ["이메일", BUSINESS.email],
                  [
                    "사업자등록번호",
                    isTBD(BUSINESS.bizNumber) ? (
                      BUSINESS.bizNumber
                    ) : (
                      <span key="biz">
                        {BUSINESS.bizNumber}
                        {
                          <a
                            href={bizInfoUrl(BUSINESS.bizNumber)}
                            target="_blank"
                            rel="noreferrer"
                            className="label ml-3 underline underline-offset-4 hover:opacity-60"
                          >
                            사업자정보확인
                          </a>
                        }
                      </span>
                    ),
                  ],
                  ["통신판매업 신고번호", BUSINESS.mailOrderNumber],
                  ["개인정보보호책임자", BUSINESS.privacyOfficer],
                  ["호스팅 제공자", BUSINESS.hosting],
                ]}
              />
              <p className="mt-8 flex gap-6 text-[13px]">
                <Link href="/terms" className="underline underline-offset-4 hover:opacity-60">
                  이용약관
                </Link>
                <Link href="/privacy" className="font-semibold underline underline-offset-4 hover:opacity-60">
                  개인정보처리방침
                </Link>
              </p>
            </Section>
          </div>
        </div>
      </div>
    </PageMotion>
  );
}

function Section({
  id,
  order,
  children,
}: {
  id: (typeof SECTIONS)[number]["id"];
  order: number;
  children: ReactNode;
}) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <Reveal order={order}>
      <section id={id} className="scroll-mt-28">
        {/* 영문은 세리프로 크게, 한글은 본문 글꼴로 (세리프 글꼴에 한글이 없다) */}
        <h2 className="flex items-baseline justify-center gap-3 border-b border-current/20 pb-3">
          <span className="font-serif text-[34px] leading-none">{s.label}</span>
          <span className="text-[13px] text-muted">{s.title}</span>
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-current/10 text-[14px]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
          <dt className="text-muted">{k}</dt>
          <dd className={`leading-relaxed ${v === "TBD" ? "label text-muted" : ""}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
