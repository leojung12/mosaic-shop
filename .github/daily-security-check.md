# MOSAIC Shop 일일 보안 점검

GitHub Actions의 **Daily security check**가 기본 브랜치에서 매일 **09:17 한국 시간**에 실행되도록 예약되어 있습니다. GitHub 실행 대기열에 따라 시작 시각이 늦어질 수 있습니다. 첫 실행이나 재확인은 Actions에서 **Run workflow**를 눌러 기본 브랜치를 선택하면 됩니다.

| 점검 | 확인 범위 |
| --- | --- |
| 공개 홈 HTTPS | 공개 홈페이지에 일반 HEAD 요청을 한 번 보내 TLS 검증과 2xx 응답 확인 |
| HSTS 및 nosniff | HTTPS 홈이 응답하면 HSTS max-age와 X-Content-Type-Options 확인 |
| 민감한 파일명 | Git에 추가된 환경 파일과 개인 키로 추정되는 파일명 확인 |
| 브라우저 공개 변수 | 소스와 예시 설정에서 비밀 값으로 추정되는 NEXT_PUBLIC_ 변수 이름 확인 |
| npm 의존성 | 잠금 파일을 기반으로 운영 의존성에 알려진 High/Critical 항목이 있는지 확인 |

**PASS**는 해당 검사가 통과했다는 뜻입니다. **REVIEW**는 사람이 확인할 항목, **ERROR**는 검사 실패, **SKIP**은 선행 조건 때문에 실행을 건너뛴 항목입니다. npm 레지스트리 장애나 웹사이트 연결 장애도 통과 대신 ERROR로 기록합니다. 개인정보, 주문 소유권, Supabase RLS 및 실제 관리자 권한은 테스트 환경에서 별도 검증합니다.

[날짜별 CSV 열기](https://github.com/leojung12/mosaic-shop/blob/security-reports/daily-security-check.csv)

첫 실행 시 `security-reports` 브랜치에 이 파일이 만들어집니다. Excel에서 CSV를 열면 한국 날짜 기준 하루 한 줄을 볼 수 있습니다. 같은 날짜에 다시 실행하면 최신 결과로 갱신합니다. 이 브랜치는 보고서와 Vercel 자동 배포 제외 설정만 저장합니다. 메인 브랜치의 앱은 CSV를 읽지 않습니다.

저장소가 공개되어 있으므로 보고서에는 항목별 상태, 검사 시각, 커밋, Actions 실행 링크만 기록합니다. 고객 데이터, 비밀 키, 후보 파일 경로, 의존성 보안 경고 원문은 내부에서 확인합니다.
