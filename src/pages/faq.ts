import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema } from '../components/layout'
import { CLINIC, TREATMENTS } from '../data/clinic'

// 진료별 FAQ를 한 곳에 모은 통합 FAQ 페이지 (§E-6)
export function FaqPage() {
  // 공통 FAQ
  const general = [
    { q: '주차가 가능한가요?', a: '건물 주차장 이용이 가능하며, 자세한 주차 안내는 내원 전 전화로 문의해 주시면 안내해 드립니다.' },
    { q: '예약 없이 방문해도 진료받을 수 있나요?', a: '가능하지만, 대기 시간을 줄이기 위해 사전 예약을 권해드립니다. 온라인 예약 문의 또는 전화(02-2232-2911)로 예약하실 수 있습니다.' },
    { q: '진료 시간이 어떻게 되나요?', a: '월·화·목 09:30~20:30(야간진료), 수·금 09:30~18:30, 토·일·공휴일 09:30~14:00입니다. 일요일은 격주로 진료합니다.' },
    { q: '처음 방문하면 무엇을 하나요?', a: '문진과 구강 검사, 필요 시 엑스레이 촬영을 통해 현재 상태를 정확히 파악한 뒤, 환자분께 맞는 치료 계획을 충분히 설명드립니다.' },
    { q: '진료비는 어떻게 안내받나요?', a: '비급여 진료비는 진단 후 치료 계획과 함께 안내해 드립니다. 비급여 항목별 비용 안내는 비용 안내 페이지에서도 확인하실 수 있습니다.' },
  ]

  const allFaqs = [...general, ...TREATMENTS.flatMap(t => t.faqs)]

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '자주 묻는 질문', url: '/faq' }],
    chapter: 'Questions, Answered',
    title: '자주 묻는 질문',
    desc: '진료 전 궁금하신 점을 모았습니다. 더 궁금한 점은 언제든 문의해 주세요.',
  })}

  <section class="section">
    <div class="container" style="max-width:860px">
      <!-- 공통 -->
      <div class="reveal" style="margin-bottom:50px">
        <h2 style="font-size:1.6rem;margin-bottom:8px"><i class="fa-solid fa-circle-info text-mint"></i> 진료 안내</h2>
        <div class="faq">
          ${raw(general.map(f => faqItem(f)).join(''))}
        </div>
      </div>

      <!-- 진료별 -->
      ${raw(TREATMENTS.map(t => `
        <div class="reveal" style="margin-bottom:50px" id="faq-${t.slug}">
          <h2 style="font-size:1.6rem;margin-bottom:8px"><i class="fa-solid fa-${t.icon} text-mint"></i> ${t.name}</h2>
          <div class="faq">
            ${t.faqs.map(f => faqItem(f)).join('')}
          </div>
          <a href="/treatments/${t.slug}" style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-weight:700;color:var(--brand-accent)">${t.name} 자세히 보기 <i class="fa-solid fa-arrow-right"></i></a>
        </div>`).join(''))}
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal">
        <h2>찾으시는 답이 없으신가요?</h2>
        <p>전화 또는 온라인으로 편하게 문의해 주세요.</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 온라인 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>
  `

  return Page({
    title: '자주 묻는 질문(FAQ) | 올케어치과',
    description: '약수역 올케어치과 자주 묻는 질문. 임플란트, 교정, 심미보철, 진료시간, 예약, 진료비 등 자주 묻는 질문을 모았습니다.',
    path: '/faq',
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '자주 묻는 질문', url: '/faq' }]),
      faqSchema(allFaqs.slice(0, 40)),
    ],
  }, body)
}

function faqItem(f: { q: string; a: string }) {
  return `<div class="faq-item">
    <button class="faq-q">${f.q}<span class="pm"><i class="fa-solid fa-plus"></i></span></button>
    <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
  </div>`
}
