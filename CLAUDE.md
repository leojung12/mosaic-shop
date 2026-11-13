@AGENTS.md

# MOSAIC Shop — 팀 작업 규칙

이 파일은 팀원 모두의 Claude Code·Codex가 작업 전에 읽는 규칙이다. 규칙과 다른 요청을 받으면 바로 실행하지 말고 먼저 사용자에게 확인한다.

## 프로젝트

- 꽃·오브제 소품(화병 등)을 파는 MOSAIC 편집숍 사이트 (운영 주소: https://mosaic-objects.vercel.app)
- Next.js 16 + Tailwind CSS v4 + Supabase(DB·로그인) + 토스페이먼츠(결제)
- 위 `AGENTS.md` 경고대로 이 Next.js는 버전이 새로워 예전 지식과 다를 수 있다. 코드를 쓰기 전 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.
- 새 npm 패키지 추가는 김민주 팀장 확인 후에만 한다.
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

- 김민주 (팀장, 공통): 아래 담당에 없는 전부 — 공통 레이아웃·헤더·푸터, `globals.css`, `src/lib/`, `src/config/`, 회원·주문·결제, `admin/`, `supabase/`, `package.json`
- 김시현 (홈): `src/app/(site)/page.tsx`, `src/components/home/`
- 정민규 (목록): `src/app/(site)/shop/`, `src/app/(site)/search/`, `src/components/shop/`
- 정태두 (상세): `src/app/(site)/product/`, `src/components/product/`, `src/components/review/`
- 최현민 (안내): `src/app/(site)/info/`, `terms/`, `privacy/`, `src/config/legal.ts`

담당이 아닌 파일을 고쳐야 할 것 같으면 수정하지 말고, 어떤 파일의 무엇을 바꿔야 하는지 사용자에게 알려준다. 사용자가 담당자에게 요청한다.

내 페이지에만 필요한 스타일은 내 파일 안에서 Tailwind 클래스로 작성한다. 여러 페이지에 공통으로 필요할 때만 `globals.css` 담당에게 요청한다.

## Git 규칙

- 작업 시작 전 항상 `git pull`로 최신 버전을 받는다.
- 작업 단위마다 커밋한다. 커밋 메시지는 한국어로, 앞에 파트를 붙인다. 예: `[홈] 상품 그리드 모바일 2열로 변경`, `[상세] 주문 버튼 추가`, `[공통] 헤더 메뉴 정리`
- 푸시 전에 `npm run build`가 에러 없이 끝나는지 확인하고, 다시 `git pull` 후 푸시한다.
- 충돌(conflict)이 나면 절대 임의로 덮어쓰거나 `--force` 하지 않는다. 어느 파일 어느 부분이 겹쳤는지 사용자에게 쉽게 설명하고, 어떻게 할지 물어본다.
- main 브랜치에 직접 작업한다 (이번 프로젝트는 브랜치·PR 없이 파일 분담으로 진행).

## 상품 데이터

- 상품 정보(이름, 가격, 설명, 이미지 등)는 Supabase DB에 있다. 코드에 상품명·가격을 직접 적지 않는다.
- 상품 추가·수정은 사이트의 `/admin` 관리자 페이지에서 한다. 화면에서는 `src/lib/products.ts`의 함수로 불러온다.
- 가격은 숫자로 저장하고, 화면에 보여줄 때 `18,000원` 형식으로 바꾼다.
- DB 구조를 바꿔야 하면 직접 하지 말고 팀장에게 요청한다.

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
