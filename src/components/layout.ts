import { html, raw } from 'hono/html'
import { IMMERSIVE_HEAD } from '../lib/immersive-assets'
import { CLINIC, CORE_TREATMENTS, SUB_TREATMENTS, TREATMENTS, DOCTORS, SEO_AREAS } from '../data/clinic'
import { txIcon } from '../data/tx-icons'
import { footerHubLink } from '../lib/hub-link'

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
    image: [`${BASE}/static/img/og.jpg`, `${BASE}/static/og/home/main.jpg`],
    logo: `${BASE}/static/img/logo-horizontal.svg`,
    description: '약수역 5번 출구 1분, 구강악안면외과·보철과·교정과·통합치의학과 전문의가 진단부터 회복까지 살피는 동네 치과. 고난도 임플란트·수면치료(의식하진정법)·치아교정·심미보철·잇몸·사랑니·턱관절 진료.',
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
    // @id = 의료진 상세 페이지의 Physician 엔티티(/doctors/:slug#physician)와 같은 식별자 → 병원↔의료진 연결
    employee: (DOCTORS || []).map(d => ({
      '@type': ['Physician', 'Person'],
      '@id': `${BASE}/doctors/${d.slug}#physician`,
      name: d.name,
      jobTitle: d.role,
      medicalSpecialty: d.titleLine || d.role,
      url: `${BASE}/doctors/${d.slug}`,
    })),
    knowsAbout: ['임플란트', '치아교정', '심미보철', '충치치료', '신경치료', '잇몸치료', '사랑니발치', '턱관절치료', '수면치료'],
    sameAs: [CLINIC.sns.instagram, CLINIC.sns.blog, CLINIC.sns.kakao, CLINIC.sns.youtube].filter(Boolean),
    // 의료광고법(후기·평가 표시 민감) 고려 — AggregateRating/Review 스키마는 노출하지 않음.
  }
}

// WebSite 엔티티 — 각 페이지 isPartOf(#website)가 가리키는 대상. 병원(#clinic)이 발행 주체.
export function websiteSchema() {
  const BASE = `https://${CLINIC.domain}`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE}/#website`,
    url: `${BASE}/`,
    name: CLINIC.name,
    alternateName: CLINIC.nameEn,
    inLanguage: 'ko-KR',
    publisher: { '@id': `${BASE}/#clinic` },
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[], id?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(id ? { '@id': id } : {}),
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
// 지금 진료 상태 엔진 (헤더 칩 · 히어로 LIVE · 상담 위젯 공용) — window.acHours
//  진료시간 = CLINIC.hours 기준: 월·화·목 09:30~20:30(야간) / 수·금 09:30~18:30 / 토·일·공휴일 09:30~14:00
//  평일 점심 12:30~14:00 · 저녁 17:30~18:00 (토·일·공휴일은 쉬는 시간 없음)
//  날짜별 상태(진료·야간·공휴일·휴진)는 /api/schedule (관리자 진료일정) → localStorage 10분 캐시
// ============================================================
const HOURS_CHIP_JS = `(function(){
var el=document.getElementById('hoursChip');if(!el||window.acHours)return;
var DAYS={},WK=['일','월','화','수','목','금','토'];
try{var c=JSON.parse(localStorage.getItem('ac_sched')||'null');if(c&&c.days)DAYS=c.days;}catch(e){}
function p2(n){return(n<10?'0':'')+n}
function kst(){var n=new Date();return new Date(n.getTime()+n.getTimezoneOffset()*60000+324e5)}
function ymd(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function hm(m){return p2(Math.floor(m/60))+':'+p2(m%60)}
function stateOf(d){var k=ymd(d);if(DAYS[k])return DAYS[k];var w=d.getDay();return(w==1||w==2||w==4)?'night':'open'}
function hours(d){var st=stateOf(d),w=d.getDay();if(st==='closed')return null;
if(st==='holiday'||w===0||w===6)return{o:570,c:840,br:[]};
return{o:570,c:st==='night'?1230:1110,br:[[750,840,'점심시간','점심'],[1050,1080,'저녁시간','저녁']]}}
function status(){var d=kst(),t=d.getHours()*60+d.getMinutes(),h=hours(d);
if(!h)return{s:'closed',long:'오늘 휴진',short:'오늘 휴진',mini:'오늘 휴진',open:false,today:null};
var r={o:h.o,c:h.c};
if(t<h.o)return{s:'closed',long:'진료 전 · 오늘 '+hm(h.o)+'부터',short:'진료 전 '+hm(h.o)+'~',mini:'진료 전',open:false,today:r};
if(t<h.c){for(var i=0;i<h.br.length;i++){var b=h.br[i];if(t>=b[0]&&t<b[1])return{s:'break',long:b[2]+' '+hm(b[1])+'까지',short:b[3]+' ~'+hm(b[1]),mini:b[2],open:false,today:r}}
return{s:'open',long:'진료중 '+hm(h.c)+'까지',short:'진료중 ~'+hm(h.c),mini:'진료중',open:true,today:r}}
for(var k=1;k<=14;k++){var n=new Date(d.getTime()+k*864e5),nh=hours(n);if(nh){var when=k===1?'내일':WK[n.getDay()]+'요일';
return{s:'closed',long:'진료 종료 · '+when+' '+hm(nh.o)+'부터',short:'진료 종료',mini:'진료 종료',open:false,today:r}}}
return{s:'closed',long:'진료 종료',short:'진료 종료',mini:'진료 종료',open:false,today:r}}
function paint(){var st=status();el.setAttribute('data-s',st.s);
el.querySelector('.hc-long').textContent=st.long;el.querySelector('.hc-short').textContent=st.short;var mi=el.querySelector('.hc-mini');if(mi)mi.textContent=st.mini||st.short;
el.setAttribute('aria-label','지금 진료 상태: '+st.long+' — 진료일정 보기');
try{document.dispatchEvent(new CustomEvent('ac:hours',{detail:st}))}catch(e){}}
window.acHours={status:status,paint:paint};
paint();setInterval(paint,30000);
var fresh=false;try{var c2=JSON.parse(localStorage.getItem('ac_sched')||'null');fresh=c2&&Date.now()-c2.at<6e5}catch(e){}
if(!fresh&&window.fetch)fetch('/api/schedule').then(function(r){return r.json()}).then(function(j){if(j&&j.days){DAYS=j.days;try{localStorage.setItem('ac_sched',JSON.stringify({at:Date.now(),days:j.days}))}catch(e){}paint()}}).catch(function(){});
})();`

// ============================================================
// HEADER (GNB + 메가드롭다운)
// ============================================================
export function Header() {
  return html`
  <header class="site-header" id="siteHeader">
    <div class="header-inner">
      <div class="brand-wrap">
      <a href="/" class="logo" aria-label="${CLINIC.name} 홈">
        <span class="mark"><img src="/static/img/logo-symbol-ivory.png" alt="365올케어치과 로고" class="mark-img mark-ivory" width="32" height="32"/><img src="/static/img/logo-symbol.png" alt="365올케어치과 로고" class="mark-img mark-navy" width="32" height="32"/></span>
        <span>365올케어치과</span>
      </a>
      <!-- 지금 진료 상태 (2026-11-09 원장 요청) — 요일별 진료시간 + 관리자 진료일정(휴진·공휴일) 기준, KST. 폭 고정 → 글자가 바뀌어도 레이아웃 이동 없음 -->
      <a href="/schedule" class="hours-chip" id="hoursChip" data-s="wait" title="진료일정 보기"><span class="hc-dot" aria-hidden="true"></span><span class="hc-long">진료시간 안내</span><span class="hc-short">진료시간</span><span class="hc-mini">진료시간</span></a>
      <script>${raw(HOURS_CHIP_JS)}</script>
      </div>
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
                    <span class="ico">${txIcon(t.slug, t.icon)}</span>
                    <span><strong>${t.name}</strong><span>${t.hero}</span></span>
                  </a>`).join(''))}
                <span class="mega-col-title">일반 진료</span>
                ${raw(SUB_TREATMENTS.map(t => `
                  <a href="/treatments/${t.slug}">
                    <span class="ico">${txIcon(t.slug, t.icon)}</span>
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
                <a href="/encyclopedia"><span class="ico"><i class="fa-solid fa-book-open"></i></span><span><strong>치과 백과사전</strong><span>치과 용어 사전</span></span></a>
                <a href="/casebook/" target="_blank" rel="noopener"><span class="ico"><i class="fa-solid fa-book"></i></span><span><strong>치료사례집 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.6"></i></strong><span>실제 치료 사례 모음</span></span></a>
              </div>
            </div>
          </li>
          <!-- §S5: 원장칼럼 별도 최상위 카테고리로 분리 -->
          <li><a href="/column">원장칼럼</a></li>
          <li>
            <a href="/directions">안내 <i class="fa-solid fa-chevron-down" style="font-size:11px"></i></a>
            <div class="mega" style="min-width:340px">
              <div class="mega-grid" style="grid-template-columns:1fr">
                <a href="/directions"><span class="ico"><i class="fa-solid fa-location-dot"></i></span><span><strong>오시는 길</strong><span>약수역 5번 출구</span></span></a>
                <a href="/pricing"><span class="ico"><i class="fa-solid fa-won-sign"></i></span><span><strong>비급여 비용 안내</strong></span></a>
                <a href="/faq"><span class="ico"><i class="fa-solid fa-circle-question"></i></span><span><strong>자주 묻는 질문</strong></span></a>
                <a href="/schedule"><span class="ico"><i class="fa-solid fa-calendar-days"></i></span><span><strong>진료일정</strong><span>휴진·야간진료 달력</span></span></a>
                <a href="/notice"><span class="ico"><i class="fa-solid fa-bullhorn"></i></span><span><strong>공지사항</strong></span></a>
                <a href="/events"><span class="ico"><i class="fa-solid fa-gift"></i></span><span><strong>이벤트</strong><span>진행 중인 혜택</span></span></a>
                <a href="https://allcare-oral-check.netlify.app/" target="_blank" rel="noopener"><span class="ico"><i class="fa-solid fa-tooth"></i></span><span><strong>셀프 구강 체크 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.6"></i></strong><span>1분 구강나이 스캔</span></span></a>
                <a href="https://blog.allcaredc.kr/" target="_blank" rel="noopener"><span class="ico"><i class="fa-solid fa-blog"></i></span><span><strong>블로그 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.6"></i></strong><span>올케어치과 소식·치아 이야기</span></span></a>
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
    <p class="m-drawer-title">진료안내</p>
    <div class="m-sub">
      ${raw(TREATMENTS.map(t => `<a href="/treatments/${t.slug}">${t.name}</a>`).join(''))}
    </div>
    <a href="/column">원장칼럼</a>
    <p class="m-drawer-title">콘텐츠</p>
    <div class="m-sub">
      <a href="/cases">비포/애프터</a>
      <a href="/encyclopedia">치과 백과사전</a>
      <a href="/casebook/" target="_blank" rel="noopener">치료사례집 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;opacity:.6"></i></a>
    </div>
    <p class="m-drawer-title">안내</p>
    <div class="m-sub">
      <a href="/directions">오시는 길</a>
      <a href="/pricing">비용 안내</a>
      <a href="/faq">자주 묻는 질문</a>
      <a href="/schedule">진료일정</a>
      <a href="/notice">공지사항</a>
      <a href="/events">이벤트</a>
      <a href="https://allcare-oral-check.netlify.app/" target="_blank" rel="noopener">셀프 구강 체크 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;opacity:.6"></i></a>
      <a href="https://blog.allcaredc.kr/" target="_blank" rel="noopener">블로그 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;opacity:.6"></i></a>
    </div>
    <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">예약 문의</a>
    <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:10px">${CLINIC.phone}</a>
  </div>
  `
}

// ============================================================
// FOOTER (§H 필수 정보)
// ============================================================
export function Footer(path = '') {
  return html`
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo"><span class="mark"><img src="/static/img/logo-symbol-ivory.png" alt="365올케어치과 로고" width="30" height="30" style="display:block"/></span> 365올케어치과</div>
          <p style="line-height:1.7">${CLINIC.philosophy}<br>약수역에서 오래도록 곁을 지키는 치과를 만듭니다.</p>
          <div class="footer-sns">
            ${CLINIC.sns.instagram ? raw(`<a href="${CLINIC.sns.instagram}" aria-label="인스타그램" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>`) : ''}
            ${CLINIC.sns.blog ? raw(`<a href="${CLINIC.sns.blog}" aria-label="네이버 블로그" target="_blank" rel="noopener"><i class="fa-solid fa-blog"></i></a>`) : ''}
            ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" aria-label="카카오톡 상담" target="_blank" rel="noopener"><i class="fa-solid fa-comment"></i></a>`) : ''}
            ${CLINIC.sns.youtube ? raw(`<a href="${CLINIC.sns.youtube}" aria-label="유튜브" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>`) : ''}
          </div>
        </div>
        <div>
          <p class="footer-col-title">진료안내</p>
          <ul class="footer-links">
            ${raw(CORE_TREATMENTS.map(t => `<li><a href="/treatments/${t.slug}">${t.name}</a></li>`).join(''))}
            <li><a href="/treatments">전체 진료보기</a></li>
            <li><a href="/doctors">의료진 소개</a></li>
            <li><a href="https://blog.allcaredc.kr/" target="_blank" rel="noopener">블로그 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.7"></i></a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">바로가기</p>
          <ul class="footer-links">
            ${footerHubLink(path) ? raw('<li><a href="/">약수역 치과</a></li>') : ''}
            <li><a href="/mission">병원소개</a></li>
            <li><a href="/cases">비포/애프터</a></li>
            <li><a href="/casebook/" target="_blank" rel="noopener">치료사례집 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.7"></i></a></li>
            <li><a href="/column">원장 칼럼</a></li>
            <li><a href="/encyclopedia">치과 백과사전</a></li>
            <li><a href="/reservation">예약 문의</a></li>
            <li><a href="https://allcare-oral-check.netlify.app/" target="_blank" rel="noopener">셀프 구강 체크 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.7"></i></a></li>
            ${CLINIC.sns.naverBooking ? raw(`<li><a href="${CLINIC.sns.naverBooking}" target="_blank" rel="noopener">네이버 예약 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;opacity:.7"></i></a></li>`) : ''}
          </ul>
        </div>
        <div>
          <p class="footer-col-title">오시는 길 · 연락처</p>
          <ul class="footer-contact">
            <li><span class="ico"><i class="fa-solid fa-location-dot"></i></span><span>${CLINIC.address}<br><small style="color:var(--brand-accent-2)">${CLINIC.directions}</small></span></li>
            <li><span class="ico"><i class="fa-solid fa-phone"></i></span><a href="tel:${CLINIC.phoneRaw}">${CLINIC.phone}</a></li>
            <li><span class="ico"><i class="fa-solid fa-clock"></i></span><span>평일 09:30~20:30 (월·화·목 야간)<br>${CLINIC.hoursNote}</span></li>
            <li><span class="ico"><i class="fa-solid fa-bolt"></i></span><span>문의 응답: ${CLINIC.responseTime.short}</span></li>
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

  <!-- 모바일 하단 고정 상담바 (모바일 전용) — 전화·네이버예약·카카오톡·오시는길 4개 -->
  <nav class="mobile-cta-bar" aria-label="빠른 상담">
    <a href="tel:${CLINIC.phoneRaw}" class="mcb-item"><i class="fa-solid fa-phone"></i><span>전화</span></a>
    ${CLINIC.sns.naverBooking ? raw(`<a href="${CLINIC.sns.naverBooking}" class="mcb-item mcb-primary" target="_blank" rel="noopener"><i class="fa-solid fa-calendar-check"></i><span>네이버 예약</span></a>`) : ''}
    ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" class="mcb-item" target="_blank" rel="noopener"><i class="fa-solid fa-comment"></i><span>카카오톡</span></a>`) : ''}
    <a href="/directions" class="mcb-item"><i class="fa-solid fa-location-dot"></i><span>오시는 길</span></a>
  </nav>

  <!-- §E2 상시 원탭 전화 버튼 (데스크톱·태블릿 전용, 모바일은 하단 CTA바가 대체) -->
  <a href="tel:${CLINIC.phoneRaw}" class="floating-tel" id="floatingTel" aria-label="전화 걸기 ${CLINIC.phone}">
    <span class="ft-ic"><i class="fa-solid fa-phone"></i></span>
    <span class="ft-txt"><span class="ft-label">전화 상담</span><span class="ft-num">${CLINIC.phone}</span></span>
  </a>

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
      <p class="cw-response"><i class="fa-solid fa-bolt"></i> ${CLINIC.responseTime.short}</p>
    </div>
    <button type="button" class="cw-fab" id="cwToggle" aria-label="상담 메뉴 열기" aria-expanded="false">
      <i class="fa-solid fa-headset cw-ic-open"></i><i class="fa-solid fa-xmark cw-ic-close"></i>
      <span class="cw-pulse" aria-hidden="true"></span>
    </button>
  </div>

  <div class="toast" id="toast"></div>
  <script src="/static/app.js?v=8dab5638a3"></script>
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
  isDetail?: boolean     // §Meta픽셀: 시술/진료 세부페이지 여부 → Lead_custom 이벤트 추가 (미지정 시 path로 자동 판별)
  article?: { published?: string; modified?: string; section?: string }  // og:type=article 일 때 article:* 메타
  immersive?: boolean   // 메인 스크롤 몰입 연출(static/immersive.*) — 홈만
  lang?: 'ko' | 'en'    // 페이지 언어(기본 ko). 영어 칼럼은 en → html lang·hreflang·og:locale·inLanguage
  alternates?: { lang: 'ko' | 'en'; path: string }[]  // 같은 글의 다른 언어판(hreflang 상호 연결)
}

// §Meta픽셀: 세부페이지(상세) 판별 — slug가 붙는 상세 URL이면 Lead_custom 대상
// /treatments/xxx, /encyclopedia/xxx, /doctors/xxx, /column/xxx, /cases 등
function isDetailPath(path: string): boolean {
  return /^\/(treatments|encyclopedia|doctors|column|events|notice)\/[^/]+/.test(path)
}

// hreflang: 기본은 한국어 자기 자신 + x-default. 다른 언어판이 있으면 서로 가리키고, x-default 는 한국어판.
function hreflangTags(meta: Meta, url: string): string {
  const abs = (p: string) => `https://${CLINIC.domain}${p}`
  const self = { lang: meta.lang || 'ko', path: meta.path }
  const all = [self, ...(meta.alternates || []).filter(a => a.path !== meta.path)]
  const code = (l: string) => (l === 'en' ? 'en' : 'ko-KR')
  const xDefault = all.find(a => a.lang === 'ko') || self
  return [
    ...all.map(a => `<link rel="alternate" hreflang="${code(a.lang)}" href="${a.path === meta.path ? url : abs(a.path)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${xDefault.path === meta.path ? url : abs(xDefault.path)}" />`,
  ].join('\n    ')
}

export function headTags(meta: Meta) {
  const url = `https://${CLINIC.domain}${meta.path}`
  const og = meta.ogImage || `https://${CLINIC.domain}/static/img/og.jpg`
  const pixelId = (CLINIC as any).analytics?.metaPixel as string | undefined
  const isDetail = meta.isDetail ?? isDetailPath(meta.path)
  return html`
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    ${meta.keywords ? raw(`<meta name="keywords" content="${meta.keywords}" />`) : ''}
    ${meta.noindex ? raw('<meta name="robots" content="noindex, nofollow" />') : raw('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />')}
    <link rel="canonical" href="${url}" />
    <link rel="alternate" type="application/rss+xml" title="${CLINIC.name} 원장 칼럼·소식" href="https://${CLINIC.domain}/rss.xml" />
    ${raw(hreflangTags(meta, url))}
    <meta property="og:type" content="${meta.ogType || 'website'}" />
    ${meta.ogType === 'article' && meta.article ? raw([
      meta.article.published ? `<meta property="article:published_time" content="${meta.article.published}" />` : '',
      meta.article.modified ? `<meta property="article:modified_time" content="${meta.article.modified}" />` : '',
      meta.article.section ? `<meta property="article:section" content="${meta.article.section.replace(/"/g, '&quot;')}" />` : '',
    ].filter(Boolean).join('\n    ')) : ''}
    <meta property="og:site_name" content="${CLINIC.name}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${meta.title}" />
    <meta property="og:locale" content="${meta.lang === 'en' ? 'en_US' : 'ko_KR'}" />
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
    ${(CLINIC.siteVerification as any).naver2 ? raw(`<meta name="naver-site-verification" content="${(CLINIC.siteVerification as any).naver2}" />`) : ''}
    ${CLINIC.siteVerification.bing ? raw(`<meta name="msvalidate.01" content="${CLINIC.siteVerification.bing}" />`) : ''}
    ${(CLINIC.siteVerification as any).facebook ? raw(`<meta name="facebook-domain-verification" content="${(CLINIC.siteVerification as any).facebook}" />`) : ''}
    <link rel="icon" href="/favicon.ico?v=fav20261014" sizes="any" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=fav20261014" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png?v=fav20261014" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png?v=fav20261014" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=fav20261014" />
    <link rel="manifest" href="/static/manifest.json" />
    <meta name="apple-mobile-web-app-title" content="365올케어치과" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    ${meta.preloadImage ? raw(`<link rel="preload" as="image" href="${meta.preloadImage}" fetchpriority="high" />`) : ''}
    <!-- 본문 CSS는 렌더 차단 없이 우선 적용 -->
    <link rel="stylesheet" href="/static/style.css?v=20261112" />
    ${meta.immersive ? raw(IMMERSIVE_HEAD) : ''}
    <!-- 한글 동적 서브셋(Pretendard): 실제 사용 글자만 로드 → 4MB→수십KB -->
    <!-- 2026-11-12: 글꼴 CSS 는 화면을 막지 않게 비동기(print→all). 글꼴이 오기 전 잠깐 시스템 글꼴로 보였다가 바뀐다 -->
    <link rel="stylesheet" crossorigin media="print" onload="this.media='all'" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
    <noscript><link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" /></noscript>
    <!-- 2026-10-15 원장 요청 폰트 통일: 제목·본문·숫자 모두 Pretendard. 명조는 메인 첫 화면 제목('믿고 찾는 약수역 365올케어치과')에만 →
         그 글자만 서브셋(text=)으로 받는다. 영문 세리프(Fraunces)·타자기(DM Mono) 로드 제거 -->
    ${meta.immersive ? raw(`<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap&text=%EB%AF%BF%EA%B3%A0%EC%B0%BE%EB%8A%94%EC%95%BD%EC%88%98%EC%97%AD365%EC%98%AC%EC%BC%80%EC%96%B4%EC%B9%98%EA%B3%BC" />`) : ''}
    <!-- FontAwesome: 비동기 로드(렌더 차단 제거) -->
    <link rel="stylesheet" media="print" onload="this.media='all'" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" />
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" /></noscript>
    ${meta.schema ? raw(meta.schema.map(s => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('')) : ''}
    ${(CLINIC as any).analytics?.ga4 ? raw(`<script async src="https://www.googletagmanager.com/gtag/js?id=${(CLINIC as any).analytics.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${(CLINIC as any).analytics.ga4}');</script>`) : ''}
    <script defer src="https://pf-dashboard-2nt.pages.dev/beacon.js"></script>
    <!-- 네이버 애널리틱스 공통 스크립트는 page.ts의 광고 전환 공통 스크립트(wa s_248ae32299dd)와 중복이라 제거 (2026-09-19). wcs_do 이중 호출·키 충돌 방지 -->
    ${pixelId ? raw(`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');${isDetail ? `\nfbq('track', 'Lead_custom');` : ''}
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`) : ''}
  `
}
