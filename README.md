# 올케어치과 (ALLCARE Dental) — 공식 홈페이지

## 프로젝트 개요
- **이름**: 올케어치과 인터랙티브 풀스택 홈페이지
- **목표**: bdbddc.com(서울비디치과)에 준하거나 그 이상의 구조·SEO·퍼널·기능·내부링크를 갖춘 약수역 지역 대표 치과 홈페이지.
- **컴러 시스템 (2차 확정 2026.06)**: 딥네이비 `#062741` 단일 메인(로고·헤드라인·CTA) / 아이보리 `#FFFEEE` 기본 배경 / 웜베이지 `#F1E9DC` 섹션·카드 / 브라스골드 `#B08D57` 액센트(5% 이내, 네이비 배경 위 텍스트만) / **순백 #FFFFFF 전면 제거**
- **로고**: 신규 심볼 1차 시안 (`/static/img/logo-symbol.svg`, `logo-symbol-ivory.svg`, `logo-horizontal.svg`, `favicon.svg`) — "케어 링(미완성 원호) + 치아 실루엣 + 브라스 시작점"
- **대표원장**: 권민수 원장 / 약수역(3·6호선 5번 출구), 서울 중구
- **핵심 철학**: 환자의 불편 포인트를 **인지 → 공감 → 해소 → 원칙**
- **디자인 시스템**: **Heritage Private Clinic v9.5** (2026.06 디자인 슈퍼 업그레이드 + 벡터 모션) — 고급 프라이빗 클리닉/헤리티지 브랜드 문법. 아이보리·웜베이지의 면 분할 + 딥네이비 단일 잉크 + 브라스 헤어라인 장식(다이아 모티프 `.hh-diamond`, 오프셋 액자 프레임). 다크 시네마 히어로 → **라이트 스플릿 패널 히어로**(`hero--heritage`: 우측 44% 베이지 패널, 네이비 액자 사진, 클램프 타이포 3.2–7.6rem). 챕터형 내러티브(Prologue → Ch.00~05 → Epilogue) 골격은 v8에서 계승.
- **의료광고법 §B 필터 적용**: 객단가/주매출 동기 제거, 약점·비선호환자 노출 차단, 환자 경험담 직접인용·타원 비교·아버지 건강/폐업 사정·차등 수가 비노출. 자격/경력 사실은 원문 보존(허위 없음).
- **2차 전달문 반영 (2026.06)**: 뾰족함 = **고난도 임플란트 수술 역량**(치조골 소실·재수술·픽스처·상악동 거상) + 의식하진정법 병행 / 2대 부자 = 서브 컸셉(고려대 교수 30년 + 약수 13년 + 2026.4 합류, 진료 연속성 서사로 정정) / 3인 협진 = 통합진료 시스템 / 지역 커뮤니티(약수시장상인회·동주민센터·다온 봉사단·산악회) 섹션 신설

## 완료된 기능 (Currently Completed Features)
- ✅ **메인 페이지 (Heritage v9 + 챕터 내러티브)**: Prologue(라이트 헤리티지 스플릿 히어로, 베이지 패널 + 네이비 액자 사진 + 브라스 룰) → Ch.00 스토리 네비게이터 → Ch.01 공감(철학 핀드 시퀀스) → Ch.02 만남(핵심 진료) → Ch.03 사람들(의료진+차별점) → Ch.04 회복(통계) → Ch.05 일상(일반진료+안내) → Epilogue(Fin.)
- ✅ **스토리 네비게이터 (퍼널 장치)**: 증상 칩 8종(시림/결손/배열/앞니/턱/사랑니/잇몽/공포) 선택 → 공감 카피 + 진료/의료진/사례/예약 분기 — 증상→상담 전환 동선
- ✅ **챕터 레일**: 우측 고정 책갈피 네비 (스크롤스파이 + 다크섹션 자동 전환 + 앱커 스무딩)
- ✅ **진료 페이지**: 핵심 3종(임플란트/교정/심미) 1,500자+ 상세 + 보조 7종, 진료별 FAQ, `MedicalProcedure`/`MedicalWebPage`/`FAQPage` 스키마
- ✅ **의료진 페이지**: 목록 + 개별 SSR, `Person` 스키마, 학력/경력, 진료·케이스 인링크
- ✅ **비포애프터(케이스)**: 4장 업로드(파노라마·구강내 Before/After), 지역 자동완성, 비교 슬라이더, **의료법 3중 보호 로그인 게이팅**(After 사진은 회원 전용 — SSR 게이팅 + API 403 + 이미지 엔드포인트 로그인 체크). **미니 우화 타이틀**("지역 나이대 님의 기간" 포맷, §B 사실정보만 조합)
- ✅ **회원 인증**: 회원가입(개인정보+마케팅 동의), 이메일/전화, **Google OAuth**, HMAC 세션(회원 30일/관리자 24시간), PBKDF2 비밀번호 해싱
- ✅ **관리자 패널**: 대시보드, 예약 관리(상태 변경), 회원, 케이스(이미지 업로드/삭제), 칼럼, 공지, 조회수(`trackView`, 봇 제외)
- ✅ **원장 칼럼**: SEO 에디터, `Article`/`MedicalWebPage` 스키마, E-E-A-T 저자 박스, 조회수, 시드 3건
- ✅ **백과사전**: 실제 치과 용어 **533개**(검색 + 초성 필터, `DefinedTermSet` 스키마) + **선별 203개 용어별 상세페이지**(`/encyclopedia/:slug`, 평균 912자, 700자 미만 0개, 용어별 `DefinedTerm`/`MedicalWebPage`/`FAQPage`/`BreadcrumbList` 스키마, 리스트↔상세 상호링크)
- ✅ **공지사항**: 대표 고정, 이미지, 시드 2건
- ✅ **예약**: R2 저장 + Resend 이메일 알림 훅 + 관리자 상태 변경
- ✅ **정적 페이지**: 미션, 오시는 길(Google Maps 임베드), 비용 안내(비급여 "상담 시 안내")
- ✅ **SEO/AEO**: 전 종 JSON-LD, 지역 SEO `/area/[지역]-[진료]`, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, E-E-A-T
- ✅ **내부링크 구조**: 진료↔의료진↔케이스↔칼럼↔백과사전↔지역
- ✅ **푸터/법적**: 사업자정보, SNS, 의료광고법 고지, 개인정보처리방침, 이용약관, 플로팅 CTA

## 주요 기능 진입 URI (Functional Entry URIs)
| 경로 | 설명 | 파라미터 |
|------|------|----------|
| `/` | 메인 | — |
| `/mission` | 병원 미션 | — |
| `/treatments` `/treatments/:slug` | 진료 목록/상세 | slug: implant, ortho, esthetic 등 |
| `/doctors` `/doctors/:slug` | 의료진 목록/상세 | slug |
| `/cases` | 비포애프터 (After 로그인 필요) | `?category=&region=` |
| `/column` `/column/:slug` | 원장 칼럼 | slug |
| `/notice` `/notice/:slug` | 공지 | slug |
| `/encyclopedia` | 치과 백과사전 목록 | `?q=&initial=` |
| `/encyclopedia/:slug` | 용어 상세(203개, 1000자급) | slug: dental-implant, bone-graft 등 |
| `/faq` | 통합/진료별 FAQ | — |
| `/reservation` | 예약 | — |
| `/directions` | 오시는 길 | — |
| `/pricing` | 비용 안내 | — |
| `/register` `/login` `/logout` `/mypage` | 회원 인증 | — |
| `/auth/google` `/auth/google/callback` | Google OAuth | — |
| `/area/:combo` | 지역 SEO (예: `yaksu-implant`) | combo |
| `/admin/*` | 관리자 패널 (기본 PW: `allcare2026`) | — |
| `/api/reservation` (POST) | 예약 접수 | JSON |
| `/api/case-image/:id/:type` | 케이스 이미지 (After는 로그인) | type: panoBefore/panoAfter/intraBefore/intraAfter |
| `/sitemap.xml` `/robots.txt` `/llms.txt` `/llms-full.txt` | SEO 파일 | — |
| `/privacy` `/terms` | 개인정보처리방침/이용약관 | — |

## 데이터 아키텍처 (Data Architecture)
- **데이터 모델**: `CLINIC`(병원 정보), `DOCTORS`(의료진), `TREATMENTS`(진료), `CaseItem`(비포애프터), `Column`(칼럼), `Notice`(공지), 회원/예약/조회수
- **스토리지**: **Cloudflare R2**(JSON 데이터 + 케이스 이미지). 로컬 개발 시 in-memory Map fallback. 진료/의료진/백과사전 등 정적 콘텐츠는 코드 내 SSOT(`src/data/`)
- **세션**: HttpOnly Secure 쿠키 + Web Crypto HMAC 서명 (Node crypto 미사용 — Workers 호환)
- **데이터 흐름**: SSR(Hono `html``) → R2 read/write → 관리자 패널에서 CRUD

## 사용 가이드 (User Guide)
1. **방문자**: 메인에서 진료/의료진/케이스 탐색 → `/reservation`으로 예약. 비포애프터 After 사진은 회원가입/로그인 후 열람.
2. **회원**: `/register`에서 가입(동의) 또는 Google 로그인 → `/mypage`에서 내 정보 확인, 케이스 After 열람.
3. **관리자**: `/admin/login` (기본 PW `allcare2026`) → 예약/회원/케이스/칼럼/공지 관리, 조회수 확인.

## 미구현 / 향후 과제 (Not Yet Implemented & Next Steps)
- ✅ 백과사전 용어 **533개** + 선별 **203개 상세페이지**(1000자급) 완성
- ✅ 진료과목별 FAQ **전 과목 20개+** (implant 24 / ortho 23 / esthetic 22 / 나머지 20)
- ✅ 칼럼 에디터: 다중 이미지 업로드 + 드래그&드롭/붙여넣기 삽입 (R2 `uploads/columns/`)
- ✅ 관리자 목록(칼럼·공지·케이스) 조회수 컬럼 (봇 제외 휴먼 카운트)
- ✅ Genspark 호스팅 Cloudflare Workers 운영 배포
- ⏳ 실제 Resend API 키 / Google OAuth 클라이언트 ID·시크릿 주입
- ⏳ 케이스 이미지 최적화(WebP 변환) 자동화
- ✅ GitHub 푸시 완료 (https://github.com/sodanstjrwns-max/allcaredc)
- ✅ 실도메인 **allcaredc.kr** 연결 완료 (가비아 도메인 + Cloudflare NS, 라이브 확인)
- ⏳ GA4/서치콘솔/네이버 서치어드바이저 등록

## 배포 (Deployment)
- **플랫폼**: Cloudflare Pages (원장님 본인 Cloudflare 계정 / BYOK)
- **운영 URL(실도메인)**: https://allcaredc.kr ✅ 라이브
- **운영 URL(Pages)**: https://allcare-dental.pages.dev
- **Cloudflare 프로젝트명**: `allcare-dental`
- **R2 버킷**: `allcare-dental` (예약/회원/케이스/칼럼/공지 JSON + 이미지 바이너리)
- **상태**: ✅ 운영 배포 완료 — R2 쓰기 검증 통과(예약 접수 → R2 영속 확인) + 로컬 개발 서버(PM2 :3000)
- **기술 스택**: Hono v4 (TypeScript, `hono/html` SSR) + Cloudflare Pages/Workers + R2 + Web Crypto(HMAC/PBKDF2) + Resend + Google OAuth + Vite
- **빌드**: `npm run build` → `dist/_worker.js`
- **시작(로컬)**: `pm2 start ecosystem.config.cjs`
- **배포**: `npm run build && npx wrangler pages deploy dist --project-name allcare-dental`
- **운영 시크릿(미설정, 추후 주입 예정)**: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL` → `wrangler pages secret put <KEY> --project-name allcare-dental`
- **남은 작업**: 운영 시크릿 주입(ADMIN_PASSWORD 등), GA4/서치콘솔/네이버 등록
- **트래킹/통계**: GA4 `G-GW5BCWPZZ4` / 네이버 애널리틱스 `25670873e0f56c0`(wcs.pstatic.net) / 네이버 소유확인 2건(`549621…`+`8904bf63…`) / **Meta 픽셀 `918552201020610`** — 공통 `PageView`, 세부페이지(`/treatments|encyclopedia|doctors|column|events|notice/:slug`) 자동 `Lead_custom`, 예약·문의 버튼 클릭 이벤트 위임(`Contact_custom`+`Contact_tel|kakao|naver`, 폼 제출 시 `Contact_custom`). 값은 모두 `clinic.ts`의 `analytics`/`siteVerification`에서 관리.
- **최종 업데이트**: 2026-08-15 (N4 완료: 02 CONTINUITY '두 세대 진료' 사진 — 기존 1200×900 소프트 이미지를 AI clarity 업스케일(2400×1800, 얼굴·로고·건물사인 선명하게 복원, 아티팩트 없음) 후 교체 + `/mission` 페이지 `.continuity-grid` 이미지 컬럼을 텍스트보다 넓게(1.28:1) 확대. → N4는 '별도 건물배경 원본 필요'가 아니라 '기존 사진 확대+고화질화' 요청으로 확정·완료. 미완 잔여: N5 기공실 교체 사진(파일 수령 대기)) / 2026-08-15 (6차 수정 M1~M4: ①M1 3인 프로필 사진 비율 통일 — OpenCV 얼굴검출로 눈높이·얼굴크기(캔버스 대비 ~18%)·헤드룸 정렬, 배수현 기준 800×1200(2:3) 재크롭 후 교체(kwon-jongjin/kwon-minsu-profile/bae-suhyeon.webp), imgPos 전부 `object-position:center top` 공통값 단순화 ②M2 권종진 명예원장 사진 이마 잘림 해결 — 상반신 원본 배경 패딩 + 얼굴크기 축소 재크롭(PC·모바일 공통), 카드 object-fit:cover가 하단 여백 크롭 ③M3 모바일 원장 3인 카드 짤림/과압축 해결 — 반응형 그리드 재정비(≤1080 2열 / ≤850 2열 / ≤820 1열 max-width 460px 센터정렬 + 폰 사진비율 4/4) ④M4 브랜드 서브색 도입 — 블루 #4A9CD6·그린 #67BE8D·화이트 #FFFFFF를 CSS 변수(--brand-blue/green/white)로 추가, 태그·칩(.doc-tags·.tag-pill·.tag-green·.collab-chip)에 블루/그린/골드/네이비 순환 적용) / 2026-08-14 (N8 수면치료 문구 보수화: hero \"편안한 가수면 상태에서 진료를 진행합니다\" + 사전문진·전신 스크리닝·응급대응장비(AED·응급키트)·전문의 직접확인 강조) / 2026-08-14 (5차 재검증 + 미세조정: N1~N3·N7은 4차에서 이미 반영·프로덕션 정상 확인(권종진 서울대졸업/박사·고려대의대명예교수 · 권민수 사진 파일/경로 200 OK · 상세 경력·수련→학력 순서 · 칼럼 카테고리). ⑤N5 기공실 첫 셀 캡션 "CAD 보철 설계 — 디지털 디자인"→"디지털 디자인" 단순화. ⑥N6 공지 팝업 배지 재개편 — "노출중"=초록(#1f7a3d, 활성상태 직관화)+벨아이콘 / "만료"=톤다운 베이지(기존 골드+크림 저대비 개선). ▶️미완: N4 02 CONTINUITY '건물 배경 두 원장 사진' + N5 기공실 교체 사진 — 업로드 자료(PPT 1~3)에 해당 원본 없음, 사용자에게 이미지 파일 별도 수령 필요) / 2026-08-13 (4차 수정: ①권민수 대표원장 프로필 사진 안보임 버그 해결 — `photo:` 필드 누락 복구(카드 빈칸 렌더링 원인) ②의료진 상세 순서 변경 — 경력·수련을 학력 위로, "레지던트 수련"→"레지던트" 표기 통일 ③권종진 명예원장 카드 3번째 줄 "서울대학교 치의학박사 · 고려대학교 의과대학 명예교수"로 갱신(cardLine) ④02 CONTINUITY OF CARE — 요청 본문 반영 + 사진을 인물+건물배경 버전으로 교체 ⑤원내 디지털 기공실 — CAD설계·디지털스캔 사진 교체(3Shape/구강스캔) ⑥공지사항 팝업 "노출중" 배지 색상 초록→브랜드 골드 ⑦칼럼 진료 카테고리 개편 — 심미보철→심미치료, "레진·인레이"·"올케어 소식" 신설(칼럼 전용 카테고리 분리)) / 2026-08-13 (3차 수정: ①이벤트 팝업 이미지 A4잘림 해결(cover→contain, 세로포스터 전체노출) ②권민수 대표원장 프로필 사진 깨짐 해결(transform:scale 제거→object-position만) ③홈 타이틀 "수면치료" 추가 ④S6 CONTINUITY 사진 반영 완료 — 권종진·권민수 두 세대 진료 이미지(구글드라이브 수령), 약력 잘림방지 contain) / 2026-08-11 (Meta 픽셀 설치 + GA4·네이버 애널리틱스·네이버 소유확인 추가 태그 반영) / 2026-08-10 (PPTX 3차 S2~S11 반영: 히어로 행간·여백 확대(S2) / 의료진 프로필 사진 배수현 기준 사이즈 통일 — `imgPos` scale(S3) / 문단 줄바꿈 헬퍼 `br-pc`·`br-mo` + `word-break:keep-all`(S4) / 진료시간·휴게시간 점심12:30-14:00·저녁17:30-18:00·토일공휴일 점심X(S5·S11) / 예약완료 '전화하기' 골드 버튼(S7) / 공지 ※중요 강조(S8) / "남성 환자분" 표기(S9) / sitemap 점검 OK(S10))
  - ✅ **S6 CONTINUITY OF CARE**: 문구 + 사진 모두 반영 완료 (사진: `continuity-two-doctors.webp`, `/mission` 페이지 02 Continuity of Care 섹션)
- **이전 업데이트**: 2026-06-24 (상호 정리 / 서체 명조 절제 / 병원소개 재구성 / 섹션 번호 재정렬)
  - ⚠️ **미해결**: SNS 핸들 `365allcare`(인스타)·`365allcaredc`(블로그)는 실제 계정 주소라 미변경 — 새 계정 주소 확정 시 `src/data/clinic.ts`의 `sns.instagram`/`sns.blog` 교체 필요

## 스크립트
```bash
npm run build        # Vite 빌드 → dist
pm2 start ecosystem.config.cjs   # 로컬 서버 (port 3000)
pm2 logs --nostream  # 로그 확인
npm run deploy       # Cloudflare Pages 배포 (시크릿 설정 후)
```
