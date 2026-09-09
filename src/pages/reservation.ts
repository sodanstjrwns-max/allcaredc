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
    description: `약수역 365올케어치과 온라인 예약 문의. 원하시는 날짜·시간을 남겨주시면 진료시간에 맞춰 연락드립니다.`,
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
            <ol class="resv-steps" aria-label="예약 진행 단계">
              <li class="active" data-s="1"><span class="rs-dot">1</span><span class="rs-lbl">정보 입력</span></li>
              <li data-s="2"><span class="rs-dot">2</span><span class="rs-lbl">접수 확인</span></li>
              <li data-s="3"><span class="rs-dot">3</span><span class="rs-lbl">상담 연락</span></li>
            </ol>
            <form onsubmit="return submitReservation(event)">
              <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />
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
                  <select name="timeslot" id="rsv-timeslot">
                    <option value="">상관없음</option>
                    <option>오전 (09:30~12:30)</option>
                    <option>오후 (14:00~17:30)</option>
                    <option>야간 (18:00~20:30 · 월·화·목 / 수·금은 18:30까지)</option>
                  </select>
                </div>
              </div>
              <p class="rsv-hours-hint" style="font-size:12.5px;color:var(--gray-400);margin:-6px 0 14px;display:flex;gap:6px;align-items:flex-start"><i class="fa-regular fa-clock" style="margin-top:3px;color:var(--gold-600)"></i><span>월·화·목 09:30~20:30 · 수·금 09:30~18:30 · 토·일(격주)·공휴일 09:30~14:00<br>휴게: 점심 12:30~14:00 · 저녁 17:30~18:00 (토·일·공휴일은 점심시간 없이 진료)</span></p>
              <script>(function(){
                var d=document.querySelector('input[name=date]'),s=document.getElementById('rsv-timeslot');if(!d||!s)return;
                function opts(day){
                  var o=[['','상관없음']];
                  if(day===0||day===6){o.push(['am','오전 (09:30~14:00 · 점심시간 없이 진료)']);}
                  else{o.push(['am','오전 (09:30~12:30)'],['pm','오후 (14:00~17:30)']);
                    if(day===3||day===5)o.push(['ev','저녁 (18:00~18:30)']);
                    else if(day===1||day===2||day===4)o.push(['ev','야간 (18:00~20:30)']);
                    else o.push(['ev','야간 (18:00~20:30 · 월·화·목 / 수·금은 18:30까지)']);}
                  return o;}
                function render(){var day=-1;if(d.value){var dt=new Date(d.value+'T00:00:00');if(!isNaN(dt))day=dt.getDay();}
                  var cur=s.value;s.innerHTML='';opts(day).forEach(function(o){var op=document.createElement('option');op.value=o[0]?o[1]:'';op.textContent=o[1];s.appendChild(op);});
                  for(var i=0;i<s.options.length;i++){if(s.options[i].value===cur){s.value=cur;break;}}}
                d.addEventListener('change',render);d.addEventListener('input',render);
              })();</script>
              <div class="field"><label>문의 내용</label><textarea name="message" placeholder="불편하신 점이나 궁금하신 점을 자유롭게 적어주세요. (증상 등 건강 관련 내용을 적으실 경우 아래 민감정보 동의가 필요합니다)"></textarea></div>
              <div class="field">
                <label class="checkbox-row"><input type="checkbox" name="agree" required> <span>[필수] 예약 상담을 위한 개인정보(이름, 연락처) 수집·이용에 동의합니다.</span></label>
                <label class="checkbox-row"><input type="checkbox" name="agree_health"> <span>[선택] 문의 내용에 증상 등 건강정보를 기재하는 경우, 상담 목적의 민감정보 수집·이용에 동의합니다. (미동의 시에도 예약 문의는 가능하나 상담에 제한이 있을 수 있습니다)</span></label>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">예약 문의 보내기</button>
              <p style="text-align:center;margin-top:14px;font-size:13px;color:var(--gray-400)"><i class="fa-solid fa-bolt" style="color:var(--gold-600)"></i> ${CLINIC.responseTime.online}</p>
            </form>
          </div>
        </div>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:#03c75a;color:#fff;margin-bottom:20px">
            <h2 style="color:#fff;margin-bottom:6px;font-size:15px;display:flex;align-items:center;gap:9px"><i class="fa-solid fa-calendar-check"></i> 네이버 예약 (가장 빠름)</h2>
            <p style="font-size:13px;color:rgba(255,255,255,.85);margin-bottom:10px">네이버 예약으로 원하시는 시간을 직접 선택해 즉시 예약하실 수 있습니다.</p>
            <p style="font-size:12px;color:rgba(255,255,255,.8);margin:0 0 14px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-bolt"></i> ${CLINIC.responseTime.naver}</p>
            <a href="${CLINIC.sns.naverBooking}" target="_blank" rel="noopener" class="btn" style="width:100%;justify-content:center;background:#fff;color:#03c75a;font-weight:800"><i class="fa-solid fa-arrow-up-right-from-square"></i> 네이버 예약 바로가기</a>
          </div>
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h2 style="color:#fffeee;font-size:15px;display:flex;align-items:center;gap:9px"><i class="fa-solid fa-phone text-mint"></i> 바로 전화 예약</h2>
            <a href="tel:${CLINIC.phoneRaw}" style="font-size:1.6rem;font-weight:800;color:#fffeee;display:block;margin:10px 0 6px">${CLINIC.phone}</a>
            <p style="font-size:13px;color:rgba(255,255,255,.75)">진료시간 내 전화 주시면 바로 안내해 드립니다.</p>
            <p style="font-size:12px;color:var(--brand-accent-2,#d8c39c);margin:8px 0 0;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-bolt"></i> 응답: ${CLINIC.responseTime.phone}</p>
          </div>
          ${CLINIC.sns.kakao ? raw(`
          <div class="inlink-box" style="background:#fee500;color:#3c1e1e;margin-bottom:20px">
            <h2 style="color:#3c1e1e;font-size:15px;display:flex;align-items:center;gap:9px"><i class="fa-solid fa-comment"></i> 카카오톡 채팅 상담</h2>
            <p style="font-size:13px;color:#5a3d2b;margin:8px 0 6px">간단한 문의는 카카오톡 채널로 편하게 물어보세요.</p>
            <p style="font-size:12px;color:#7a5a3a;margin:0 0 12px;display:flex;align-items:flex-start;gap:6px"><i class="fa-solid fa-bolt" style="margin-top:3px"></i> <span>응답: ${CLINIC.responseTime.kakao}</span></p>
            <a href="${CLINIC.sns.kakao}" target="_blank" rel="noopener" class="btn" style="width:100%;justify-content:center;background:#3c1e1e;color:#fee500;font-weight:800"><i class="fa-solid fa-comment"></i> 카카오톡 상담하기</a>
          </div>` ) : ''}
          <div class="inlink-box">
            <h2 style="font-size:15px;display:flex;align-items:center;gap:9px"><i class="fa-solid fa-clock text-mint"></i> 진료시간</h2>
            ${raw(CLINIC.hours.map(h => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span>${h.day}</span><span style="color:var(--gray-600)">${h.time}</span></div>`).join(''))}
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="color:var(--gold-600)"><i class="fa-solid fa-mug-hot" style="font-size:12px"></i> 점심시간</span><span style="color:var(--gray-600)">${CLINIC.lunch}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="color:var(--gold-600)"><i class="fa-solid fa-mug-hot" style="font-size:12px"></i> 저녁시간</span><span style="color:var(--gray-600)">${CLINIC.dinner}</span></div>
            <p style="font-size:12.5px;color:var(--gray-400);margin-top:10px">토·일·공휴일은 점심시간 없이 진료합니다.<br>${CLINIC.hoursNote}</p>
          </div>
        </aside>
      </div>
    </div>
  </section>`
  return Page({
    title: '예약 문의 | 약수역 365올케어치과 온라인 예약',
    description: `약수역 365올케어치과 온라인 예약 문의. 원하시는 날짜·시간을 남겨주시면 진료시간에 맞춰 연락드립니다. ${CLINIC.subway}. 전화 ${CLINIC.phone}.`,
    path: '/reservation',
    keywords: `약수역 치과 예약,365올케어치과 예약,약수역 치과 야간진료,중구 치과 예약,온라인 예약`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '예약 문의', url: '/reservation' }]),
      reserveSchema,
      contactSchema,
      speakableSchema(['h1', '.form-card label', 'h4']),
    ],
  }, body)
}
