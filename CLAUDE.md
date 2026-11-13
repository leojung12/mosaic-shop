@AGENTS.md

# MOSAIC Shop — 팀 작업 규칙

이 파일은 팀원 모두의 Claude Code·Codex가 작업 전에 읽는 규칙이다. 규칙과 다른 요청을 받으면 바로 실행하지 말고 먼저 사용자에게 확인한다.

## 프로젝트

- 꽃·오브제 소품(화병 등)을 파는 MOSAIC 편집숍 사이트 (운영 주소: https://mosaic-objects.vercel.app)
- Next.js 16 + Tailwind CSS v4 + Supabase(DB·로그인) + 토스페이먼츠(결제)
- 위 `AGENTS.md` 경고대로 이 Next.js는 버전이 새로워 예전 지식과 다를 수 있다. 코드를 쓰기 전 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.
- 새 npm 패키지 추가는 백엔드 담당(정태두) 확인 후에만 한다.
- 분위기: 미니멀, 여백 많이. 모바일 화면 우선

## 처음 실행

```
npm install          # 처음 한 번 (package.json이 바뀌었을 때도)
npm run dev          # http://localhost:3000 에서 확인
```

- `.env.local`(비밀 키 파일)은 GitHub에 올라가지 않는다. 팀장에게 따로 받아 프로젝트 폴더 맨 위에 둔다. 절대 커밋·공유 금지.

## 폴더 구조

```
src/app/(site)/page.tsx            홈
src/app/(site)/shop/               상품 목록 (/shop, /shop/화병 등 카테고리)
src/app/(site)/product/[slug]/     상품 상세 (/product/상품주소)
src/app/(site)/info/               안내 — 배송·교환·환불, 문의처
src/app/(site)/terms, privacy/     약관·개인정보처리방침
src/app/(site)/login, signup, account, orders, checkout/   회원·주문·결제
src/app/admin/                     관리자 페이지 (상품·주문·문의·쿠폰 관리)
src/components/                    화면 조각 (home/, product/, shop/, cart/ …)
src/lib/                           데이터 불러오기·Supabase·결제 등 공통 로직
src/config/                        사이트 이름, 사업자 정보, 카테고리
src/app/globals.css                공통 스타일
supabase/migrations/               DB 구조 (SQL)
public/                            이미지 (products/, home/, brand/ …)
```

## 파일 담당

같은 파일을 여러 명이 동시에 고치면 충돌이 난다. 자기 담당 파일만 수정한다.

### 김민주 (팀장) — 홈·공통 (첫 화면 + 모든 페이지에 걸리는 것)
- 화면: 사이트 첫 화면 `/` (전체 화면 슬라이드 사진, 가운데 로고, 카테고리 바로가기), 모든 페이지의 헤더(로고·시계·메뉴)와 푸터, 페이지 전환 효과
- 하는 일: 첫인상 디자인(슬라이드 사진·문구·순서, 카테고리 입구 배치), 사이트 전체 글꼴·색·여백(공통 스타일), 메뉴 구성, 사이트 이름·카테고리 목록 설정
- 파일: `src/app/(site)/page.tsx`, `src/components/home/`, `public/home/`, `public/brand/`, `src/app/layout.tsx`, `src/app/(site)/layout.tsx`, `src/app/globals.css`, `src/app/fonts.ts`, `src/components/` 바로 아래 파일들(Header, Footer, Logo 등), `src/config/site.ts`·`categories.ts`
- 팀장 역할: 아래 담당 어디에도 없는 파일도 맡고, 담당이 애매한 요청은 누가 할지 정해준다

### 김시현 — 목록·상세 (손님이 상품을 고르는 화면)
- 화면: 상품 목록 `/shop`, 카테고리별 목록 `/shop/vase` 등, 검색 `/search`, 상품 상세 `/product/상품주소`
- 하는 일: 상품 격자(칸 배치·사진 크기·배지), Best·MD Pick 구역, 상세 페이지 레이아웃(큰 이름+누끼 첫 화면, 가격·설명·사이즈 접이식, 디테일 사진), 구매 후기 표시
- 파일: `src/app/(site)/shop/`, `src/app/(site)/search/`, `src/app/(site)/product/`, `src/components/shop/`, `src/components/product/`, `src/components/review/`
- 안 하는 것: 상품 데이터 자체(이름·가격·사진 등록)는 `/admin`에서 입력. 장바구니 담기·결제 동작은 정태두

### 정태두 — 백엔드 (데이터·로그인·주문·결제)
- 화면: 로그인·회원가입·비밀번호 찾기 `/login` `/signup` `/forgot-password`, 마이페이지 `/account`, 주문 조회 `/orders`, 주문서·결제 `/checkout`, 장바구니 서랍(헤더 BAG), 관리자 `/admin` 전체
- 하는 일: Supabase DB 구조·데이터, 로그인, 장바구니·주문·토스 결제, 관리자 기능(상품·주문·문의·쿠폰 관리), 다른 담당이 필요한 데이터를 불러오는 함수 만들어주기
- 파일: `src/lib/`, `supabase/`, `src/proxy.ts`, `src/app/` 바로 아래 `*actions.ts`, `src/app/admin/`, `src/components/admin/`, `src/components/member/`, `src/components/cart/`, 위 화면들의 `src/app/(site)/login`·`signup`·`forgot-password`·`account`·`orders`·`checkout/`, `src/config/business.ts`(배송비·사업자 정보), `package.json`
- 비밀 키(`.env.local`, Vercel 환경변수)는 회장(정민규)과 함께 관리

### 최현민 — 안내 (손님이 읽는 글 페이지)
- 화면: 안내 `/info`(배송·교환·환불·문의처), 이용약관 `/terms`, 개인정보처리방침 `/privacy`, 없는 주소로 갔을 때 나오는 404 페이지
- 하는 일: 안내·약관 페이지의 문구와 읽기 좋은 배치, 배송·교환·환불 정책 정리(기획팀 결정 반영), 404 페이지 디자인
- 파일: `src/app/(site)/info/`, `src/app/(site)/terms/`, `src/app/(site)/privacy/`, `src/components/LegalPage.tsx`, `src/config/legal.ts`, `src/app/not-found.tsx`
- 안 하는 것: 배송비 금액·사업자 정보 값(`src/config/business.ts`)은 정태두, 헤더·푸터는 김민주

담당이 아닌 파일을 고쳐야 할 것 같으면 수정하지 말고, 어떤 파일의 무엇을 바꿔야 하는지 사용자에게 알려준다. 사용자가 담당자에게 요청한다.

내 페이지에만 필요한 스타일은 내 파일 안에서 Tailwind 클래스로 작성한다. 여러 페이지에 공통으로 필요할 때만 `globals.css` 담당에게 요청한다.

## Git 규칙

- 작업 시작 전 항상 `git pull`로 최신 버전을 받는다.
- 작업 단위마다 커밋한다. 커밋 메시지는 한국어로, 앞에 파트를 붙인다. 파트 이름은 `[홈]` `[목록·상세]` `[백엔드]` `[공통]` `[안내]` 중 하나 (김민주는 작업에 따라 `[홈]` 또는 `[공통]`). 예: `[홈] 슬라이드 사진 교체`, `[목록·상세] 상품 격자 모바일 2열로 변경`, `[백엔드] 쿠폰 만료일 추가`, `[공통] 헤더 메뉴 정리`
- 푸시 전에 `npm run build`가 에러 없이 끝나는지 확인하고, 다시 `git pull` 후 푸시한다.
- 충돌(conflict)이 나면 절대 임의로 덮어쓰거나 `--force` 하지 않는다. 어느 파일 어느 부분이 겹쳤는지 사용자에게 쉽게 설명하고, 어떻게 할지 물어본다.
- main 브랜치에 직접 작업한다 (이번 프로젝트는 브랜치·PR 없이 파일 분담으로 진행).

## 상품 데이터

- 상품 정보(이름, 가격, 설명, 이미지 등)는 Supabase DB에 있다. 코드에 상품명·가격을 직접 적지 않는다.
- 상품 추가·수정은 사이트의 `/admin` 관리자 페이지에서 한다. 화면에서는 `src/lib/products.ts`의 함수로 불러온다.
- 가격은 숫자로 저장하고, 화면에 보여줄 때 `18,000원` 형식으로 바꾼다.
- DB 구조를 바꿔야 하면 직접 하지 말고 백엔드 담당(정태두)에게 요청한다.

## 이미지

- `public/` 아래 저장, 파일명은 영문 소문자와 하이픈만 사용 (예: `vase-01.png`)
- 상품 이미지는 배경 제거(누끼)된 PNG. 누끼 도구는 `scripts/` 참고

## 공유 메모리 (MOSAIC)

- 작업 시작 전에 노션 페이지 "MOSAIC 공유 메모리"를 먼저 읽는다.
  https://app.notion.com/p/40a5f4a55ddc813c9e7acfd503684502
- 결정사항이 바뀌면 그 페이지의 "현재 결정사항"을 수정하고, 작업을 마치면 "작업 로그"에 날짜와 함께 한 줄 추가한다. (예: 2026-11-02 (Code): 상품 그리드 완성)
- 기존 내용을 지울 때는 먼저 사용자에게 확인한다.

## 설명 방식

팀원 대부분이 코딩 초보다. 작업 후에는 무엇을 바꿨는지, 브라우저에서 어떻게 확인하는지 짧고 쉽게 알려준다. 에러가 나면 원인을 한 줄로 설명한 뒤 고친다.
