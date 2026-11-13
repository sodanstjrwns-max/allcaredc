import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC } from '../data/clinic'
import { isLive } from '../lib/store'

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
  /** 팝업 노출 시작일(YYYY-MM-DD). 비우면 바로 노출 (2026-11-04 원장 요청: 다음 달 일정 미리 등록) */
  popupStart?: string
  /** 팝업 노출 순서(작을수록 앞). 비우면 고정→최신순 뒤에 */
  popupOrder?: number
  /** 게시 상태: draft(임시저장)·private(비공개)·없음(게시) */
  status?: 'draft' | 'private'
  /** 예약 발행 시각(ms) */
  publishAt?: number
  /** 미리보기 주소용 임시 토큰 (2026-11-13 권민수 원장 Figma 3번) — /notice/preview/:token */
  previewToken?: string
}

/** 미리보기 토큰: 추측할 수 없는 24자(16진수) */
export function newPreviewToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('')
}
export const PREVIEW_TOKEN_RE = /^[0-9a-f]{24}$/
/** 아직 공개되지 않은 이유 (미리보기 띠·관리자 안내용) */
export function unpublishedReason(n: Notice): string {
  if (n.status === 'draft') return '임시저장'
  if (n.status === 'private') return '비공개'
  if (n.publishAt && Number(n.publishAt) > Date.now()) return `예약 발행 (${new Date(Number(n.publishAt)).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })})`
  return '게시'
}

/** 홈 팝업 동시 노출 최대 개수 */
export const POPUP_MAX = 5

/** 한국 시간(KST) 기준 오늘 YYYY-MM-DD — 홈 팝업 스크립트와 동일 계산 */
export function kstToday(): string {
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
}

/** 노출 조건을 만족하는 팝업 공지 전체 (popup=true, 종료일 미경과) — 고정 우선 → 최신순 */
export function allActivePopupNotices(notices: Notice[], today = kstToday()): Notice[] {
  const ord = (n: Notice) => (typeof n.popupOrder === 'number' && isFinite(n.popupOrder) ? n.popupOrder : 9999)
  return notices
    .filter(n => n.popup && isLive(n) && (!n.popupStart || n.popupStart <= today) && (!n.popupUntil || n.popupUntil >= today))
    .sort((a, b) => ord(a) - ord(b) || (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
}

/** 홈에 실제로 띄울 팝업 공지 (최대 POPUP_MAX건) */
export function activePopupNotices(notices: Notice[]): Notice[] {
  return allActivePopupNotices(notices).slice(0, POPUP_MAX)
}

export function NoticeIndex(notices: Notice[]) {
  const sorted = [...notices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '공지사항', url: '/notice' }],
    title: '공지사항',
    desc: '365올케어치과의 진료 안내와 소식을 전해드립니다.',
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
              <span style="flex:1;display:flex;align-items:center">${n.pinned ? '<span class="pin">※중요</span>' : ''}<span style="font-weight:${n.pinned ? '800' : '600'};letter-spacing:${n.pinned ? '-.2px' : 'normal'};color:${n.pinned ? 'var(--navy-900,#062741)' : 'inherit'}">${n.title}</span></span>
              <span class="date">${new Date(n.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
            </a>`).join(''))}
        </div>
      `}
    </div>
  </section>`
  return Page({
    title: '공지사항 | 365올케어치과',
    description: '약수역 365올케어치과 공지사항. 진료 안내, 휴진 안내 등 병원 소식을 확인하세요.',
    path: '/notice',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '공지사항', url: '/notice' }])],
  }, body)
}

export function NoticeDetail(n: Notice, opts: { preview?: boolean } = {}) {
  // 미리보기(2026-11-13): 실제 게시 화면과 똑같이 그리고 맨 위에 안내 띠만 얹는다. 검색엔진 제외(noindex + X-Robots-Tag), 목록·사이트맵에 없음
  //  띠는 화면 맨 위 40px 에 고정하고 헤더를 그만큼 내린다(본문·헤더를 가리지 않게)
  const pvBar = opts.preview ? html`<style>.site-header{top:40px}</style><div role="note" style="position:fixed;top:0;left:0;right:0;height:40px;z-index:1000;background:#8a3b2e;color:#fff;font-size:13px;line-height:40px;padding:0 12px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><strong>미리보기</strong> · ${unpublishedReason(n)} 상태 — 공지 목록·검색엔진에 나오지 않는 확인용 주소입니다</div>` : ''
  const body = html`
  ${pvBar}
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
    title: `${opts.preview ? '[미리보기] ' : ''}${n.title} | 공지사항 | 365올케어치과`,
    description: n.body.slice(0, 150),
    path: opts.preview ? `/notice/preview/${n.previewToken}` : `/notice/${n.id}`,
    ...(opts.preview ? { noindex: true, isDetail: false } : {}),
  }, body)
}

export const SEED_NOTICES: Notice[] = [
  { id: 'n_seed1', title: '365올케어치과 야간진료 안내 (월·화·목 오후 8시 30분까지)', body: '직장인 환자분들을 위해 매주 월·화·목요일 오후 8시 30분까지 야간진료를 운영하고 있습니다.\n\n바쁜 일정으로 낮 시간 내원이 어려우신 분들께서는 야간진료를 이용해 주세요. 야간 시간대는 예약이 빠르게 마감될 수 있으니 미리 예약해 주시면 감사하겠습니다.', pinned: true, createdAt: Date.now() - 86400000 * 5 },
  { id: 'n_seed2', title: '주말·공휴일 진료 안내', body: '365올케어치과는 토요일, 일요일, 공휴일에도 오전 9시 30분부터 오후 2시까지 진료합니다. (일요일은 격주 진료)\n\n주말 내원을 원하시는 분은 일요일 진료 여부를 전화로 미리 확인해 주시기 바랍니다.', pinned: false, createdAt: Date.now() - 86400000 * 12 },
]
