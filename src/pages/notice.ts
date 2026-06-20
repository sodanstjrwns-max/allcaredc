import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC } from '../data/clinic'

export type Notice = {
  id: string
  title: string
  body: string
  pinned: boolean
  image?: string
  createdAt: number
  /** 홈 히어로 위에 팝업으로 노출할지 여부 */
  popup?: boolean
  /** 팝업 노출 종료일(YYYY-MM-DD). 비우면 무기한 */
  popupUntil?: string
}

/** 현재 활성 팝업 공지 1건 반환 (popup=true, 만료 전, 최신 우선) */
export function activePopupNotice(notices: Notice[]): Notice | null {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC 기준 충분)
  const live = notices.filter(n => n.popup && (!n.popupUntil || n.popupUntil >= today))
  if (live.length === 0) return null
  live.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
  return live[0]
}

export function NoticeIndex(notices: Notice[]) {
  const sorted = [...notices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '공지사항', url: '/notice' }],
    title: '공지사항',
    desc: '올케어치과의 진료 안내와 소식을 전해드립니다.',
  })}
  <section class="section">
    <div class="container" style="max-width:860px">
      ${sorted.length === 0 ? html`
        <div class="reveal" style="text-align:center;padding:80px 0;color:var(--gray-600)">
          <i class="fa-solid fa-bullhorn" style="font-size:48px;color:var(--gray-200);margin-bottom:16px"></i>
          <p>등록된 공지사항이 없습니다.</p>
        </div>
      ` : html`
        <div class="notice-list reveal">
          ${raw(sorted.map(n => `
            <a href="/notice/${n.id}">
              <span style="flex:1;display:flex;align-items:center">${n.pinned ? '<span class="pin">중요</span>' : ''}<span style="font-weight:600">${n.title}</span></span>
              <span class="date">${new Date(n.createdAt).toLocaleDateString('ko-KR')}</span>
            </a>`).join(''))}
        </div>
      `}
    </div>
  </section>`
  return Page({
    title: '공지사항 | 올케어치과',
    description: '약수역 올케어치과 공지사항. 진료 안내, 휴진 안내 등 병원 소식을 확인하세요.',
    path: '/notice',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '공지사항', url: '/notice' }])],
  }, body)
}

export function NoticeDetail(n: Notice) {
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '공지사항', url: '/notice' }, { name: n.title, url: `/notice/${n.id}` }],
    title: n.title,
  })}
  <section class="section">
    <div class="container" style="max-width:780px">
      <article class="reveal">
        <p style="color:var(--gray-400);font-size:14px;margin-bottom:24px">${new Date(n.createdAt).toLocaleDateString('ko-KR')}</p>
        ${n.image ? html`<img src="${n.image}" alt="${n.title}" style="border-radius:var(--radius);margin-bottom:24px" loading="lazy">` : ''}
        <div class="prose">${raw(n.body.replace(/\n/g, '<br>'))}</div>
        <a href="/notice" class="btn btn-outline" style="margin-top:36px">목록으로 <i class="fa-solid fa-list"></i></a>
      </article>
    </div>
  </section>`
  return Page({
    title: `${n.title} | 공지사항 | 올케어치과`,
    description: n.body.slice(0, 150),
    path: `/notice/${n.id}`,
  }, body)
}

export const SEED_NOTICES: Notice[] = [
  { id: 'n_seed1', title: '올케어치과 야간진료 안내 (월·화·목 오후 8시 30분까지)', body: '직장인 환자분들을 위해 매주 월·화·목요일 오후 8시 30분까지 야간진료를 운영하고 있습니다.\n\n바쁜 일정으로 낮 시간 내원이 어려우신 분들께서는 야간진료를 이용해 주세요. 야간 시간대는 예약이 빠르게 마감될 수 있으니 미리 예약해 주시면 감사하겠습니다.', pinned: true, createdAt: Date.now() - 86400000 * 5 },
  { id: 'n_seed2', title: '주말·공휴일 진료 안내', body: '올케어치과는 토요일, 일요일, 공휴일에도 오전 9시 30분부터 오후 2시까지 진료합니다. (일요일은 격주 진료)\n\n주말 내원을 원하시는 분은 일요일 진료 여부를 전화로 미리 확인해 주시기 바랍니다.', pinned: false, createdAt: Date.now() - 86400000 * 12 },
]
