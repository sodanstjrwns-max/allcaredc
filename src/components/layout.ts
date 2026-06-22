import { html, raw } from 'hono/html'
import { CLINIC, CORE_TREATMENTS, SUB_TREATMENTS, TREATMENTS, DOCTORS, SEO_AREAS } from '../data/clinic'

// ============================================================
// JSON-LD 스키마 빌더 (§G-2)
// ============================================================
export function organizationSchema() {
  const BASE = `https://${CLINIC.domain}`
  return {
    '@context': 'https://schema.org',
    '@type': ['Dentist', 'LocalBusiness', 'MedicalBusiness'],
    '@id': `${BASE}/#clinic`,
    name: CLINIC.name,
    alternateName: CLINIC.nameEn,
    url: `${BASE}/`,
    telephone: CLINIC.phone,
    email: CLINIC.email,
    image: [`${BASE}/static/img/og.jpg`, `${BASE}/og/home/main.svg`],
    logo: `${BASE}/static/img/logo-horizontal.svg`,
    description: '약수역 5번 출구 1분, 구강악안면외과·보철과·통합치의학과 3인 전문의가 진단부터 회복까지 책임지는 동네 치과. 고난도 임플란트·수면치료(의식하진정법)·치아교정·심미보철·잇몸·사랑니·턱관절 진료.',
    slogan: CLINIC.tagline,
    priceRange: '₩₩',
    currenciesAccepted: 'KRW',
    paymentAccepted: '현금, 카드, 계좌이체',
    availableLanguage: ['ko'],
    publicAccess: true,
    foundingDate: '2023-07',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '동호로 171 더그레이스빌딩 4층',
      addressLocality: '중구',
      addressRegion: '서울특별시',
      postalCode: '04618',
      addressCountry: 'KR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: CLINIC.geo.lat, longitude: CLINIC.geo.lng },
    hasMap: `https://map.naver.com/p/search/${encodeURIComponent(CLINIC.name + ' ' + CLINIC.address)}`,
    // 서비스 반경 (로컬 SEO) — 약수역 중심 6km
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: CLINIC.geo.lat, longitude: CLINIC.geo.lng },
      geoRadius: '6000',
    },
    // 지역 타겟팅 (로컬 검색 강화) — 내원 가능 지역 전체
    areaServed: [
      { '@type': 'City', name: '서울특별시 중구' },
      { '@type': 'City', name: '서울특별시 성동구' },
      { '@type': 'City', name: '서울특별시 용산구' },
      { '@type': 'City', name: '서울특별시 동대문구' },
      ...SEO_AREAS.filter(a => a.tier <= 2).map(a => ({ '@type': 'Place', name: a.name })),
    ],
    // 대중교통 접근성 (로컬 SEO)
    publicTransportClosestTo: { '@type': 'TrainStation', name: '약수역 (3·6호선)', description: CLINIC.subway },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Thursday'], opens: '09:30', closes: '20:30', description: '야간진료' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Wednesday', 'Friday'], opens: '09:30', closes: '18:30' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:30', closes: '14:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '09:30', closes: '14:00', description: '격주 진료 — 내원 전 확인 권장' },
    ],
    medicalSpecialty: ['Dentistry', 'OralAndMaxillofacialSurgery', 'Orthodontic', 'Prosthodontics'],
    availableService: TREATMENTS.map(t => ({
      '@type': 'MedicalProcedure',
      name: t.name,
      url: `${BASE}/treatments/${t.slug}`,
    })),
    // 진료 의료진 (E-E-A-T 신뢰 신호)
    employee: (DOCTORS || []).map(d => ({
      '@type': 'Physician',
      name: d.name,
      medicalSpecialty: d.titleLine || d.role,
    })),
    knowsAbout: ['임플란트', '치아교정', '심미보철', '충치치료', '신경치료', '잇몸치료', '사랑니발치', '턱관절치료', '수면치료'],
    sameAs: [CLINIC.sns.instagram, CLINIC.sns.blog, CLINIC.sns.kakao, CLINIC.sns.youtube].filter(Boolean),
    // 환자 후기 → 별점(AggregateRating) + 개별 리뷰. 구글 검색결과 별점 리치스니펫 노출용.
    // @id(#clinic)가 동일하므로 별도 Review 스키마 대신 클리닉 엔티티에 직접 병합한다.
    ...reviewProps(),
  }
}

// CLINIC.reviews → AggregateRating + Review 속성 (organizationSchema에 병합)
function reviewProps() {
  const reviews = (CLINIC as any).reviews as { name: string; rating?: number; date: string; text: string }[] | undefined
  if (!reviews || !reviews.length) return {}
  const avg = (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avg,
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating || 5), bestRating: '5', worstRating: '1' },
      author: { '@type': 'Person', name: r.name },
      datePublished: r.date,
      reviewBody: r.text,
    })),
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name,
      item: `https://${CLINIC.domain}${it.url}`,
    })),
  }
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function schemaTag(obj: any) {
  return raw(`<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
}

// ============================================================
// HEADER (GNB + 메가드롭다운)
// ============================================================
export function Header() {
  return html`
  <header class="site-header" id="siteHeader">
    <div class="header-inner">
      <a href="/" class="logo" aria-label="${CLINIC.name} 홈">
        <span class="mark"><img src="/static/img/logo-symbol-ivory.png" alt="올케어치과 로고" class="mark-img mark-ivory" width="32" height="32"/><img src="/static/img/logo-symbol.png" alt="올케어치과 로고" class="mark-img mark-navy" width="32" height="32"/></span>
        <span>올케어치과</span>
      </a>
      <nav aria-label="주메뉴">
        <ul class="gnb">
          <li><a href="/mission">병원소개</a></li>
          <li><a href="/doctors">의료진</a></li>
          <li>
            <a href="/treatments">진료안내 <i class="fa-solid fa-chevron-down" style="font-size:11px"></i></a>
            <div class="mega">
              <div class="mega-grid">
                <span class="mega-col-title">핵심 진료</span>
                ${raw(CORE_TREATMENTS.map(t => `
                  <a href="/treatments/${t.slug}" class="core">
                    <span class="ico"><i class="fa-solid fa-${t.icon}"></i></span>
                    <span><strong>${t.name}</strong><span>${t.hero}</span></span>
                  </a>`).join(''))}
                <span class="mega-col-title">일반 진료</span>
                ${raw(SUB_TREATMENTS.map(t => `
                  <a href="/treatments/${t.slug}">
                    <span class="ico"><i class="fa-solid fa-${t.icon}"></i></span>
                    <span><strong>${t.name}</strong></span>
                  </a>`).join(''))}
              </div>
            </div>
          </li>
          <li>
            <a href="/cases">진료사례 <i class="fa-solid fa-chevron-down" style="font-size:11px"></i></a>
            <div class="mega" style="min-width:340px">
              <div class="mega-grid" style="grid-template-columns:1fr">
                <a href="/cases"><span class="ico"><i class="fa-solid fa-images"></i></span><span><strong>비포/애프터</strong><span>치료 전후 사례</span></span></a>
                <a href="/column"><span class="ico"><i class="fa-solid fa-pen-nib"></i></span><span><strong>원장 칼럼</strong><span>의료진이 직접 쓰는 글</span></span></a>
                <a href="/encyclopedia"><span class="ico"><i class="fa-solid fa-book-open"></i></span><span><strong>치과 백과사전</strong><span>치과 용어 사전</span></span></a>
              </div>
            </div>
          </li>
          <li>
            <a href="/directions">안내 <i class="fa-solid fa-chevron-down" style="font-size:11px"></i></a>
            <div class="mega" style="min-width:340px">
              <div class="mega-grid" style="grid-template-columns:1fr">
                <a href="/directions"><span class="ico"><i class="fa-solid fa-location-dot"></i></span><span><strong>오시는 길</strong><span>약수역 5번 출구</span></span></a>
                <a href="/pricing"><span class="ico"><i class="fa-solid fa-won-sign"></i></span><span><strong>비급여 비용 안내</strong></span></a>
                <a href="/faq"><span class="ico"><i class="fa-solid fa-circle-question"></i></span><span><strong>자주 묻는 질문</strong></span></a>
                <a href="/notice"><span class="ico"><i class="fa-solid fa-bullhorn"></i></span><span><strong>공지사항</strong></span></a>
                <a href="/events"><span class="ico"><i class="fa-solid fa-gift"></i></span><span><strong>이벤트</strong><span>진행 중인 혜택</span></span></a>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <div class="header-cta">
        <a href="tel:${CLINIC.phoneRaw}" class="header-tel"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        <a href="/reservation" class="btn btn-accent" style="padding:12px 22px;font-size:15px">예약하기</a>
        <button class="burger" id="burger" aria-label="메뉴 열기"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>

  <!-- mobile drawer -->
  <div class="m-drawer" id="mDrawer">
    <button class="m-close" id="mClose" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
    <a href="/mission">병원소개</a>
    <a href="/doctors">의료진</a>
    <h4>진료안내</h4>
    <div class="m-sub">
      ${raw(TREATMENTS.map(t => `<a href="/treatments/${t.slug}">${t.name}</a>`).join(''))}
    </div>
    <h4>콘텐츠</h4>
    <div class="m-sub">
      <a href="/cases">비포/애프터</a>
      <a href="/column">원장 칼럼</a>
      <a href="/encyclopedia">치과 백과사전</a>
    </div>
    <h4>안내</h4>
    <div class="m-sub">
      <a href="/directions">오시는 길</a>
      <a href="/pricing">비용 안내</a>
      <a href="/faq">자주 묻는 질문</a>
      <a href="/notice">공지사항</a>
      <a href="/events">이벤트</a>
    </div>
    <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">예약 문의</a>
    <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:10px">${CLINIC.phone}</a>
  </div>
  `
}

// ============================================================
// FOOTER (§H 필수 정보)
// ============================================================
export function Footer() {
  return html`
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo"><span class="mark"><img src="/static/img/logo-symbol-ivory.png" alt="올케어치과 로고" width="30" height="30" style="display:block"/></span> 올케어치과</div>
          <p style="line-height:1.7">${CLINIC.philosophy}<br>약수동에서 오래도록 곁을 지키는 치과를 만듭니다.</p>
          <div class="footer-sns">
            ${CLINIC.sns.instagram ? raw(`<a href="${CLINIC.sns.instagram}" aria-label="인스타그램" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>`) : ''}
            ${CLINIC.sns.blog ? raw(`<a href="${CLINIC.sns.blog}" aria-label="네이버 블로그" target="_blank" rel="noopener"><i class="fa-solid fa-blog"></i></a>`) : ''}
            ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" aria-label="카카오톡 상담" target="_blank" rel="noopener"><i class="fa-solid fa-comment"></i></a>`) : ''}
            ${CLINIC.sns.youtube ? raw(`<a href="${CLINIC.sns.youtube}" aria-label="유튜브" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>`) : ''}
          </div>
        </div>
        <div>
          <h5>진료안내</h5>
          <ul class="footer-links">
            ${raw(CORE_TREATMENTS.map(t => `<li><a href="/treatments/${t.slug}">${t.name}</a></li>`).join(''))}
            <li><a href="/treatments">전체 진료보기</a></li>
            <li><a href="/doctors">의료진 소개</a></li>
          </ul>
        </div>
        <div>
          <h5>바로가기</h5>
          <ul class="footer-links">
            <li><a href="/mission">병원소개</a></li>
            <li><a href="/cases">비포/애프터</a></li>
            <li><a href="/column">원장 칼럼</a></li>
            <li><a href="/encyclopedia">치과 백과사전</a></li>
            <li><a href="/reservation">예약 문의</a></li>
            ${CLINIC.sns.naverBooking ? raw(`<li><a href="${CLINIC.sns.naverBooking}" target="_blank" rel="noopener">네이버 예약 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.7"></i></a></li>`) : ''}
          </ul>
        </div>
        <div>
          <h5>오시는 길 · 연락처</h5>
          <ul class="footer-contact">
            <li><span class="ico"><i class="fa-solid fa-location-dot"></i></span><span>${CLINIC.address}<br><small style="color:var(--brand-accent-2)">${CLINIC.directions}</small></span></li>
            <li><span class="ico"><i class="fa-solid fa-phone"></i></span><a href="tel:${CLINIC.phoneRaw}">${CLINIC.phone}</a></li>
            <li><span class="ico"><i class="fa-solid fa-clock"></i></span><span>평일 09:30~20:30 (월·화·목 야간)<br>${CLINIC.hoursNote}</span></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="legal">
          <a href="/privacy">개인정보 처리방침</a>
          <a href="/terms">이용약관</a>
          <a href="/sitemap.xml">사이트맵</a>
        </div>
        <div>
          상호: ${CLINIC.business.bizName} · 대표자: ${CLINIC.business.owner} · 사업자등록번호: ${CLINIC.business.bizNumber} · 개업일: ${CLINIC.business.openDate}<br>
          주소: ${CLINIC.address} · 대표전화: ${CLINIC.phone}
        </div>
      </div>
    </div>
    <div class="compliance">
      <div class="container">
        ※ 본 사이트의 의료 정보는 일반적인 이해를 돕기 위한 것으로, 개인의 상태에 따라 진단 및 치료 결과가 다를 수 있습니다. 모든 의료행위는 전문 의료진과의 충분한 상담 후 결정하시기 바랍니다. 의료광고 사전심의 대상 콘텐츠는 관련 규정을 준수합니다.
      </div>
    </div>
  </footer>

  <!-- 모바일 하단 고정 상담바 (모바일 전용) -->
  <nav class="mobile-cta-bar" aria-label="빠른 상담">
    <a href="tel:${CLINIC.phoneRaw}" class="mcb-item"><i class="fa-solid fa-phone"></i><span>전화</span></a>
    ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" class="mcb-item" target="_blank" rel="noopener"><i class="fa-solid fa-comment"></i><span>카카오톡</span></a>`) : ''}
    <a href="/directions" class="mcb-item"><i class="fa-solid fa-location-dot"></i><span>오시는길</span></a>
    <a href="/reservation" class="mcb-item mcb-primary"><i class="fa-solid fa-calendar-check"></i><span>예약문의</span></a>
  </nav>

  <!-- floating consult widget (toggle + 영업상태) -->
  <div class="consult-widget" id="consultWidget">
    <div class="cw-panel" id="cwPanel" hidden>
      <div class="cw-head">
        <span class="cw-status" id="cwStatus"><span class="cw-dot"></span> <span class="cw-status-txt">진료시간 확인 중…</span></span>
        <button type="button" class="cw-close" id="cwClose" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="cw-sub" id="cwHoursToday">${raw(CLINIC.hours.map(h => `<span data-day="${h.day}" hidden>${h.day.replace('요일', '')} ${h.time}</span>`).join(''))}</p>
      <div class="cw-actions">
        ${CLINIC.sns.naverBooking ? raw(`<a href="${CLINIC.sns.naverBooking}" class="cw-btn naver" target="_blank" rel="noopener"><i class="fa-solid fa-calendar-check"></i> 네이버 예약</a>`) : ''}
        ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" class="cw-btn kakao" target="_blank" rel="noopener"><i class="fa-solid fa-comment"></i> 카카오톡 상담</a>`) : ''}
        <a href="tel:${CLINIC.phoneRaw}" class="cw-btn tel"><i class="fa-solid fa-phone"></i> 전화 상담 <span class="cw-phone">${CLINIC.phone}</span></a>
        <a href="/reservation" class="cw-btn book"><i class="fa-solid fa-calendar-check"></i> 온라인 예약 문의</a>
      </div>
    </div>
    <button type="button" class="cw-fab" id="cwToggle" aria-label="상담 메뉴 열기" aria-expanded="false">
      <i class="fa-solid fa-headset cw-ic-open"></i><i class="fa-solid fa-xmark cw-ic-close"></i>
      <span class="cw-pulse" aria-hidden="true"></span>
    </button>
  </div>

  <div class="toast" id="toast"></div>
  <script src="/static/app.js?v=20260622j"></script>
  `
}

// ============================================================
// 공통 <head> 메타
// ============================================================
export type Meta = {
  title: string
  description: string
  path: string
  ogImage?: string
  ogType?: string
  schema?: any[]
  noindex?: boolean
  keywords?: string
  preloadImage?: string  // LCP 이미지 preload (성능 최적화)
}

export function headTags(meta: Meta) {
  const url = `https://${CLINIC.domain}${meta.path}`
  const og = meta.ogImage || `https://${CLINIC.domain}/static/img/og.jpg`
  return html`
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    ${meta.keywords ? raw(`<meta name="keywords" content="${meta.keywords}" />`) : ''}
    ${meta.noindex ? raw('<meta name="robots" content="noindex, nofollow" />') : raw('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />')}
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="ko-KR" href="${url}" />
    <link rel="alternate" hreflang="x-default" href="${url}" />
    <meta property="og:type" content="${meta.ogType || 'website'}" />
    <meta property="og:site_name" content="${CLINIC.name}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${meta.title}" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta name="twitter:image" content="${og}" />
    <meta name="twitter:image:alt" content="${meta.title}" />
    <meta name="author" content="${CLINIC.name}" />
    <meta name="geo.region" content="KR-11" />
    <meta name="geo.placename" content="서울특별시 중구 약수동" />
    <meta name="geo.position" content="${CLINIC.geo.lat};${CLINIC.geo.lng}" />
    <meta name="ICBM" content="${CLINIC.geo.lat}, ${CLINIC.geo.lng}" />
    <meta name="theme-color" content="#062741" />
    ${CLINIC.siteVerification.google ? raw(`<meta name="google-site-verification" content="${CLINIC.siteVerification.google}" />`) : ''}
    ${CLINIC.siteVerification.naver ? raw(`<meta name="naver-site-verification" content="${CLINIC.siteVerification.naver}" />`) : ''}
    ${CLINIC.siteVerification.bing ? raw(`<meta name="msvalidate.01" content="${CLINIC.siteVerification.bing}" />`) : ''}
    <link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/static/img/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="icon" href="/static/img/favicon-64.png" sizes="64x64" type="image/png" />
    <link rel="apple-touch-icon" href="/static/img/apple-touch-icon.png" />
    <link rel="manifest" href="/static/manifest.json" />
    <meta name="apple-mobile-web-app-title" content="올케어치과" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    ${meta.preloadImage ? raw(`<link rel="preload" as="image" href="${meta.preloadImage}" fetchpriority="high" />`) : ''}
    <!-- 본문 CSS는 렌더 차단 없이 우선 적용 -->
    <link rel="stylesheet" href="/static/style.css?v=20260622j" />
    <!-- 한글 동적 서브셋(Pretendard): 실제 사용 글자만 로드 → 4MB→수십KB -->
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
    <!-- 디스플레이/명조/모노: display=swap 으로 FOIT 방지 -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..600&family=Nanum+Myeongjo:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap" />
    <!-- FontAwesome: 비동기 로드(렌더 차단 제거) -->
    <link rel="stylesheet" media="print" onload="this.media='all'" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" />
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" /></noscript>
    ${meta.schema ? raw(meta.schema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('')) : ''}
  `
}
