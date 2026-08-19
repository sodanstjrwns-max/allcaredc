import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC } from '../data/clinic'

export type EventItem = {
  id: string
  title: string
  body: string
  /** 카드/목록 노출용 한 줄 요약 */
  summary?: string
  image?: string
  /** 진행 기간 시작일 YYYY-MM-DD (비우면 상시) */
  startDate?: string
  /** 진행 기간 종료일 YYYY-MM-DD (비우면 상시) */
  endDate?: string
  pinned: boolean
  createdAt: number
}

/** 이벤트 상태 계산 */
export function eventStatus(e: EventItem): { key: 'upcoming' | 'ongoing' | 'ended'; label: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (e.startDate && e.startDate > today) return { key: 'upcoming', label: '진행 예정' }
  if (e.endDate && e.endDate < today) return { key: 'ended', label: '종료' }
  return { key: 'ongoing', label: '진행중' }
}

/** 진행중/예정 이벤트만, 고정·최신 우선 정렬 */
export function liveEvents(events: EventItem[]): EventItem[] {
  return [...events]
    .filter(e => eventStatus(e).key !== 'ended')
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
}

function periodText(e: EventItem): string {
  if (e.startDate && e.endDate) return `${e.startDate.replace(/-/g, '.')} ~ ${e.endDate.replace(/-/g, '.')}`
  if (e.endDate) return `~ ${e.endDate.replace(/-/g, '.')}`
  if (e.startDate) return `${e.startDate.replace(/-/g, '.')} ~`
  return '상시 진행'
}

export function EventIndex(events: EventItem[]) {
  const sorted = [...events].sort((a, b) => {
    // 진행중/예정 먼저, 그 안에서 고정·최신 우선, 종료는 맨 뒤
    const ea = eventStatus(a).key === 'ended' ? 1 : 0
    const eb = eventStatus(b).key === 'ended' ? 1 : 0
    if (ea !== eb) return ea - eb
    return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt
  })
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '이벤트', url: '/events' }],
    title: '이벤트',
    desc: '365올케어치과의 진행 중인 이벤트와 혜택 안내입니다.',
  })}
  <section class="section">
    <div class="container" style="max-width:1040px">
      ${sorted.length === 0 ? html`
        <div class="reveal" style="text-align:center;padding:80px 0;color:var(--gray-600)">
          <i class="fa-solid fa-gift" style="font-size:48px;color:var(--gray-200);margin-bottom:16px"></i>
          <p>진행 중인 이벤트가 없습니다.</p>
        </div>
      ` : html`
        <div class="event-grid reveal">
          ${raw(sorted.map(e => {
            const st = eventStatus(e)
            return `
            <a href="/events/${e.id}" class="event-card${st.key === 'ended' ? ' is-ended' : ''}">
              <div class="ev-thumb">
                ${e.image ? `<img src="${e.image}" alt="${e.title.replace(/"/g, '&quot;')}" loading="lazy">` : `<span class="ev-ph"><i class="fa-solid fa-gift"></i></span>`}
                <span class="ev-status ev-${st.key}">${st.label}</span>
                ${e.pinned ? '<span class="ev-pin">진행 중</span>' : ''}
              </div>
              <div class="ev-info">
                <h2 class="ev-title">${e.title}</h2>
                ${e.summary ? `<p>${e.summary}</p>` : ''}
                <span class="ev-period"><i class="fa-regular fa-calendar"></i> ${periodText(e)}</span>
              </div>
            </a>`
          }).join(''))}
        </div>
      `}
      <p class="reveal" style="margin-top:36px;font-size:13px;color:var(--gray-400);text-align:center">
        ※ 의료광고법에 따라 비급여 진료비는 변동될 수 있으며, 자세한 사항은 내원 상담 시 안내드립니다.
      </p>
    </div>
  </section>`
  return Page({
    title: '이벤트 | 365올케어치과',
    description: '약수역 365올케어치과 진행 중인 이벤트·혜택 안내. 정확한 비용과 진료 내용은 상담 시 안내드립니다.',
    path: '/events',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '이벤트', url: '/events' }])],
  }, body)
}

export function EventDetail(e: EventItem) {
  const st = eventStatus(e)
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '이벤트', url: '/events' }, { name: e.title, url: `/events/${e.id}` }],
    title: e.title,
  })}
  <section class="section">
    <div class="container" style="max-width:780px">
      <article class="reveal">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap">
          <span class="ev-status ev-${st.key}" style="position:static">${st.label}</span>
          <span style="color:var(--gray-600);font-size:14px"><i class="fa-regular fa-calendar"></i> ${periodText(e)}</span>
        </div>
        ${e.image ? html`<img src="${e.image}" alt="${e.title}" style="border-radius:var(--radius);margin-bottom:24px;width:100%" loading="lazy">` : ''}
        <div class="prose">${raw(e.body.replace(/\n/g, '<br>'))}</div>
        <p style="margin-top:28px;font-size:13px;color:var(--gray-400);border-top:1px solid var(--gray-100);padding-top:18px">
          ※ 본 안내는 의료광고법을 준수하며, 진료 결과는 개인에 따라 차이가 있을 수 있습니다. 정확한 비용·진료 내용은 내원 상담 시 안내드립니다.
        </p>
        <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap">
          <a href="/reservation" class="btn btn-primary"><i class="fa-solid fa-calendar-check"></i> 상담·예약 문의</a>
          <a href="/events" class="btn btn-outline">이벤트 목록 <i class="fa-solid fa-list"></i></a>
        </div>
      </article>
    </div>
  </section>`
  return Page({
    title: `${e.title} | 이벤트 | 365올케어치과`,
    description: (e.summary || e.body).slice(0, 150),
    path: `/events/${e.id}`,
  }, body)
}

export const SEED_EVENTS: EventItem[] = [
  {
    id: 'ev_seed1',
    title: '구강검진 + 파노라마 촬영 안내',
    summary: '내원 시 구강 상태를 정확히 진단해 드립니다.',
    body: '365올케어치과에서는 첫 내원 시 충분한 상담과 함께 구강 상태를 꼼꼼히 진단해 드립니다.\n\n오래 미뤄두셨던 치아 고민, 어렵다고 들으셨던 케이스도 먼저 정확하게 진단받아 보세요. 진료 계획과 비용은 진단 후 상담을 통해 투명하게 안내드립니다.\n\n※ 진료 결과는 개인의 구강 상태에 따라 차이가 있을 수 있습니다.',
    pinned: true,
    startDate: '',
    endDate: '',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'ev_seed2',
    title: '제로페이 · 고유가 피해지원금 사용 안내',
    summary: '제로페이 간편결제와 고유가 피해지원금(소상공인) 사용이 가능합니다.',
    body: '365올케어치과는 제로페이 간편결제와 고유가 피해지원금(소상공인) 사용이 가능합니다.\n\n결제 관련 자세한 사항은 데스크에서 안내해 드리며, 사용 가능 여부는 결제 수단·정책에 따라 달라질 수 있습니다.',
    pinned: false,
    startDate: '',
    endDate: '',
    createdAt: Date.now() - 86400000 * 8,
  },
]
