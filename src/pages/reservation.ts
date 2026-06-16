import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, TREATMENTS } from '../data/clinic'
import { speakableSchema } from '../lib/seo-engine'

// 진료시간 → schema.org openingHours 코드 변환
const DAY_CODE: Record<string, string> = { '월': 'Mo', '화': 'Tu', '수': 'We', '목': 'Th', '금': 'Fr', '토': 'Sa', '일': 'Su' }

export function ReservationPage() {
  const BASE = `https://${CLINIC.domain}`
  const pageUrl = `${BASE}/reservation`

  // ── ReservationPage 부가티급: ReserveAction + Dentist + ContactPoint ──
  const reserveSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name: '예약 문의',
    description: `약수역 올케어치과 온라인 예약 문의. 원하시는 날짜·시간을 남겨주시면 진료시간에 맞춰 연락드립니다.`,
    url: pageUrl,
    inLanguage: 'ko',
    isPartOf: { '@type': 'WebSite', '@id': `${BASE}/#website` },
    about: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name },
    primaryImageOfPage: `${BASE}/og/home/home.svg`,
    potentialAction: {
      '@type': 'ReserveAction',
      name: '예약 문의하기',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: pageUrl,
        inLanguage: 'ko',
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
      },
      result: { '@type': 'Reservation', name: '치과 진료 예약 문의' },
      provider: {
        '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name, telephone: CLINIC.phone,
        url: `${BASE}/`,
        address: {
          '@type': 'PostalAddress', streetAddress: CLINIC.address,
          addressLocality: CLINIC.region.district, addressRegion: CLINIC.region.city, addressCountry: 'KR',
        },
      },
    },
  }

  const contactSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${BASE}/#clinic`,
    name: CLINIC.name,
    url: `${BASE}/`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CLINIC.phone,
      contactType: 'reservations',
      areaServed: 'KR',
      availableLanguage: ['ko'],
    },
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '예약 문의', url: '/reservation' }],
    chapter: 'Your First Page',
    title: '나의 이야기 시작하기',
    desc: '원하시는 날짜와 시간을 남겨주시면, 진료시간에 맞춰 확인 후 연락드리겠습니다.',
  })}
  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <div class="reveal">
          <div class="form-card">
            <form onsubmit="return submitReservation(event)">
              <div class="grid-2" style="gap:18px;align-items:start">
                <div class="field"><label>이름 <span class="req">*</span></label><input type="text" name="name" required></div>
                <div class="field"><label>연락처 <span class="req">*</span></label><input type="tel" name="phone" required placeholder="010-0000-0000"></div>
              </div>
              <div class="field"><label>이메일</label><input type="email" name="email" placeholder="연락 받으실 이메일 (선택)"></div>
              <div class="field">
                <label>희망 진료 <span class="req">*</span></label>
                <select name="treatment" required>
                  <option value="">선택해 주세요</option>
                  ${raw(TREATMENTS.map(t => `<option value="${t.name}">${t.name}</option>`).join(''))}
                  <option value="기타/상담">기타 / 종합 상담</option>
                </select>
              </div>
              <div class="grid-2" style="gap:18px;align-items:start">
                <div class="field"><label>희망 날짜</label><input type="date" name="date"></div>
                <div class="field">
                  <label>희망 시간대</label>
                  <select name="timeslot">
                    <option value="">상관없음</option>
                    <option>오전 (09:30~12:00)</option>
                    <option>오후 (13:00~18:00)</option>
                    <option>야간 (18:00~20:30, 월·화·목)</option>
                  </select>
                </div>
              </div>
              <div class="field"><label>문의 내용</label><textarea name="message" placeholder="불편하신 점이나 궁금하신 점을 자유롭게 적어주세요."></textarea></div>
              <div class="field">
                <label class="checkbox-row"><input type="checkbox" name="agree" required> <span>[필수] 예약 상담을 위한 개인정보(이름, 연락처) 수집·이용에 동의합니다.</span></label>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">예약 문의 보내기</button>
              <p style="text-align:center;margin-top:14px;font-size:13px;color:var(--gray-400)">접수 후 진료시간 내에 순차적으로 연락드립니다.</p>
            </form>
          </div>
        </div>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h4 style="color:#fffeee"><i class="fa-solid fa-phone text-mint"></i> 바로 전화 예약</h4>
            <a href="tel:${CLINIC.phoneRaw}" style="font-size:1.6rem;font-weight:800;color:#fffeee;display:block;margin:10px 0 6px">${CLINIC.phone}</a>
            <p style="font-size:13px;color:rgba(255,255,255,.75)">진료시간 내 전화 주시면 바로 안내해 드립니다.</p>
          </div>
          <div class="inlink-box">
            <h4><i class="fa-solid fa-clock text-mint"></i> 진료시간</h4>
            ${raw(CLINIC.hours.map(h => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span>${h.day}</span><span style="color:var(--gray-600)">${h.time}</span></div>`).join(''))}
            <p style="font-size:12.5px;color:var(--gray-400);margin-top:10px">${CLINIC.hoursNote}</p>
          </div>
        </aside>
      </div>
    </div>
  </section>`
  return Page({
    title: '예약 문의 | 약수역 올케어치과 온라인 예약',
    description: `약수역 올케어치과 온라인 예약 문의. 원하시는 날짜·시간을 남겨주시면 진료시간에 맞춰 연락드립니다. ${CLINIC.subway}. 전화 ${CLINIC.phone}.`,
    path: '/reservation',
    keywords: `약수역 치과 예약,올케어치과 예약,약수역 치과 야간진료,중구 치과 예약,온라인 예약`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '예약 문의', url: '/reservation' }]),
      reserveSchema,
      contactSchema,
      speakableSchema(['h1', '.form-card label', 'h4']),
    ],
  }, body)
}
