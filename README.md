# 올케어치과 (ALLCARE Dental) — 공식 홈페이지

## 프로젝트 개요
- **이름**: 올케어치과 인터랙티브 풀스택 홈페이지
- **목표**: bdbddc.com(서울비디치과)에 준하거나 그 이상의 구조·SEO·퍼널·기능·내부링크를 갖추되, **클리닉 고유의 디자인/콘텐츠**(딥네이비+청록민트+웜베이지, 모던·따뜻·신뢰)로 차별화된 약수역 지역 대표 치과 홈페이지.
- **대표원장**: 권민수 원장 / 약수역(3·6호선 5번 출구), 서울 중구
- **핵심 철학**: 환자의 불편 포인트를 **인지 → 공감 → 해소 → 원칙**
- **디자인 시스템**: **Fable Story Layer v8** — 환자를 주인공으로 하는 챕터형 내러티브(Prologue → Chapter 00~05 → Epilogue), 책 메타포 스크롤텔링
- **의료광고법 §B 필터 적용**: 객단가/주매출 동기 제거, 약점·뾰족함·비선호환자 노출 차단, 자격/경력 사실은 원문 보존(허위 없음).

## 완료된 기능 (Currently Completed Features)
- ✅ **메인 페이지 (Fable v8 챕터 내러티브)**: Prologue(1인칭 서사 히어로 "Every smile has a story") → Ch.00 스토리 네비게이터 → Ch.01 공감(철학 핀드 시퀀스) → Ch.02 만남(핵심 진료) → Ch.03 사람들(의료진+차별점) → Ch.04 회복(통계) → Ch.05 일상(일반진료+안내) → Epilogue(Fin.)
- ✅ **스토리 네비게이터 (퍼널 장치)**: 증상 칩 8종(시림/결손/배열/앞니/턱/사랑니/잇몽/공포) 선택 → 공감 카피 + 진료/의료진/사례/예약 분기 — 증상→상담 전환 동선
- ✅ **챕터 레일**: 우측 고정 책갈피 네비 (스크롤스파이 + 다크섹션 자동 전환 + 앱커 스무딩)
- ✅ **진료 페이지**: 핵심 3종(임플란트/교정/심미) 1,500자+ 상세 + 보조 7종, 진료별 FAQ, `MedicalProcedure`/`MedicalWebPage`/`FAQPage` 스키마
- ✅ **의료진 페이지**: 목록 + 개별 SSR, `Person` 스키마, 학력/경력, 진료·케이스 인링크
- ✅ **비포애프터(케이스)**: 4장 업로드(파노라마·구강내 Before/After), 지역 자동완성, 비교 슬라이더, **의료법 3중 보호 로그인 게이팅**(After 사진은 회원 전용 — SSR 게이팅 + API 403 + 이미지 엔드포인트 로그인 체크). **미니 우화 타이틀**("지역 나이대 님의 기간" 포맷, §B 사실정보만 조합)
- ✅ **회원 인증**: 회원가입(개인정보+마케팅 동의), 이메일/전화, **Google OAuth**, HMAC 세션(회원 30일/관리자 24시간), PBKDF2 비밀번호 해싱
- ✅ **관리자 패널**: 대시보드, 예약 관리(상태 변경), 회원, 케이스(이미지 업로드/삭제), 칼럼, 공지, 조회수(`trackView`, 봇 제외)
- ✅ **원장 칼럼**: SEO 에디터, `Article`/`MedicalWebPage` 스키마, E-E-A-T 저자 박스, 조회수, 시드 3건
- ✅ **백과사전**: 실제 치과 용어 220개, 검색 + 초성 필터, `DefinedTermSet` 스키마, 진료·케이스 인링크
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
| `/encyclopedia` | 치과 백과사전 | `?q=&initial=` |
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
- ⏳ 백과사전 용어 **500+ 확장** (현재 실제 용어 220개 — 품질 우선, 추가 확장 가능)
- ⏳ 실제 Resend API 키 / Google OAuth 클라이언트 ID·시크릿 / 운영 R2 버킷 시크릿 주입 (`wrangler secret put`)
- ⏳ 관리자 칼럼 리치 에디터 고도화 (현재 SEO 메타 + 본문 입력)
- ⏳ 케이스 이미지 최적화(WebP 변환) 자동화
- ⏳ GitHub 푸시 / Cloudflare Pages 운영 배포 (사용자 확인 후 진행)

## 배포 (Deployment)
- **플랫폼**: Cloudflare Pages (Hono v4 + Workers)
- **상태**: ✅ 로컬 개발 서버 동작 중 (PM2 + wrangler pages dev :3000)
- **기술 스택**: Hono v4 (TypeScript, `hono/html` SSR) + Cloudflare Workers/Pages + R2 + Web Crypto(HMAC/PBKDF2) + Resend + Google OAuth + Vite
- **빌드**: `npm run build` → `dist/_worker.js`
- **시작**: `pm2 start ecosystem.config.cjs`
- **운영 배포 전 필요 시크릿**: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL`
- **최종 업데이트**: 2026-06-12 (Fable Story Layer v8)

## 스크립트
```bash
npm run build        # Vite 빌드 → dist
pm2 start ecosystem.config.cjs   # 로컬 서버 (port 3000)
pm2 logs --nostream  # 로그 확인
npm run deploy       # Cloudflare Pages 배포 (시크릿 설정 후)
```
