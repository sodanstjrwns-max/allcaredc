import { html, raw } from 'hono/html'
import { CLINIC, TREATMENTS, DOCTORS, COLUMN_CATEGORIES, columnCategoryName } from '../data/clinic'
import { eventStatus } from './event'

// 관리자 셸 (사이드바)
function adminShell(active: string, title: string, content: any) {
  const nav = [
    ['dashboard', '대시보드', 'gauge-high', '/admin'],
    ['stats', '사이트 통계', 'chart-line', '/admin/stats'],
    ['reservations', '예약 관리', 'calendar-check', '/admin/reservations'],
    ['cases', '비포애프터', 'images', '/admin/cases'],
    ['columns', '원장 칼럼', 'pen-nib', '/admin/columns'],
    ['notices', '공지사항', 'bullhorn', '/admin/notices'],
    ['events', '이벤트', 'gift', '/admin/events'],
    ['members', '회원 관리', 'users', '/admin/members'],
  ]
  return html`<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | 365올케어치과 관리자</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css">
<link rel="stylesheet" href="/static/style.css">
<style>
  body{background:var(--gray-100)}
  .admin-wrap{display:grid;grid-template-columns:250px 1fr;min-height:100vh}
  .admin-side{background:var(--brand-deep);color:#fffeee;padding:24px 0}
  .admin-side .brand{padding:0 24px 24px;font-weight:800;font-size:20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:16px}
  .admin-side a{display:flex;align-items:center;gap:12px;padding:13px 24px;color:rgba(255,255,255,.7);font-weight:600;transition:.25s}
  .admin-side a:hover,.admin-side a.active{background:rgba(255,255,255,.07);color:#fffeee;border-right:3px solid var(--brand-accent)}
  .admin-main{padding:36px 40px}
  .admin-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}
  .admin-head h1{font-size:1.8rem}
  .admin-card{background:#fffeee;border-radius:16px;padding:28px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);margin-bottom:24px}
  .stat-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:30px}
  .stat-box{background:#fffeee;border-radius:16px;padding:24px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100)}
  .stat-box .n{font-size:2.2rem;font-weight:800;color:var(--brand)}
  .stat-box .l{color:var(--gray-600);font-size:14px}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--gray-100);font-size:14px}
  th{color:var(--gray-600);font-weight:700;font-size:12px;text-transform:uppercase}
  .badge{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}
  .badge.new{background:#e6f7f5;color:#0d8174}
  .badge.done{background:var(--gray-100);color:var(--gray-600)}
  .btn-sm{padding:7px 14px;font-size:13px;border-radius:8px;font-weight:600}
  @media(max-width:768px){.admin-wrap{grid-template-columns:1fr}.admin-side{display:none}.stat-cards{grid-template-columns:1fr 1fr}.admin-main{padding:20px}}

  /* ===== 슈퍼 칼럼 에디터 ===== */
  .editor-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start}
  @media(max-width:1100px){.editor-layout{grid-template-columns:1fr}}
  .editor-side .admin-card{margin-bottom:18px}
  /* 리치 툴바 */
  .rte-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:8px 14px;border-top:1px solid var(--gray-100);border-bottom:1px solid var(--gray-100);background:#fbf8f0;position:sticky;top:0;z-index:5}
  .rte-group{display:flex;gap:2px}
  .rte-toolbar button{width:34px;height:34px;border:1px solid transparent;border-radius:7px;background:transparent;cursor:pointer;font-size:14px;color:var(--brand-deep,#062741);display:flex;align-items:center;justify-content:center;transition:.15s}
  .rte-toolbar button:hover{background:#fff;border-color:var(--gray-100);color:var(--brand-accent,#b08d57)}
  .rte-sep{width:1px;height:22px;background:var(--gray-100);margin:0 4px}
  .rte-spacer{flex:1}
  .rte-count{font-size:12px;color:var(--gray-600);white-space:nowrap}
  /* 편집 영역 */
  .rte-editor{min-height:420px;padding:26px;outline:none;font-size:1rem;line-height:1.85;transition:background .2s}
  .rte-editor:empty:before{content:attr(data-placeholder);color:var(--gray-400)}
  .rte-editor.rte-dragover{background:rgba(176,141,87,.07);box-shadow:inset 0 0 0 2px var(--brand-accent,#b08d57)}
  .rte-editor h2{font-size:1.5rem;margin:1.2em 0 .5em}
  .rte-editor h3{font-size:1.2rem;margin:1em 0 .4em}
  .rte-editor blockquote{border-left:3px solid var(--brand-accent,#b08d57);padding-left:16px;color:var(--gray-600);font-style:italic;margin:1em 0}
  .rte-editor .answer-box{background:#fbf3e6;border:1px solid #e7d5b6;border-radius:10px;padding:16px 18px;margin:1em 0;font-weight:600}
  .rte-editor figure.column-figure{margin:1.2em 0;text-align:center}
  .rte-editor figure.column-figure img{max-width:100%;border-radius:10px;cursor:pointer}
  .rte-editor figure.column-figure figcaption{font-size:13px;color:var(--gray-600);margin-top:6px}
  .rte-editor img{max-width:100%}
  .rte-statusbar{padding:10px 16px;border-top:1px solid var(--gray-100);font-size:12.5px;color:var(--gray-600);background:#fbf8f0}
  /* SEO 카드 */
  .seo-card .field{margin-bottom:14px}
  .seo-score{margin-left:auto;font-size:14px;font-weight:800;min-width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;background:#aaa}
  .seo-score.good{background:#1f7a4d}.seo-score.mid{background:#d49a16}.seo-score.low{background:#c0392b}
  .seo-score:after{content:''}
  .serp-preview{background:#fff;border:1px solid var(--gray-100);border-radius:10px;padding:12px 14px;margin-bottom:16px}
  .serp-url{font-size:12px;color:#5f6368}
  .serp-title{color:#1a0dab;font-size:16px;line-height:1.3;margin:2px 0;font-weight:500}
  .serp-desc{color:#4d5156;font-size:12.5px;line-height:1.5}
  .ch-count{font-size:11px;font-weight:600;color:var(--gray-400);margin-left:6px}
  .ch-count.ok{color:#1f7a4d}.ch-count.over{color:#c0392b}
  .seo-checklist{margin-top:8px;border-top:1px solid var(--gray-100);padding-top:12px}
  .seo-chk{font-size:12.5px;padding:4px 0;display:flex;align-items:center;gap:7px}
  .seo-chk.on{color:#1f7a4d}.seo-chk.off{color:var(--gray-400)}
  .seo-chk i{font-size:12px}
  /* FAQ */
  .faq-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed var(--gray-100)}
  .faq-row .faq-q{grid-column:1/2}
  .faq-row .faq-a{grid-column:1/2;min-height:60px}
  .faq-row .faq-del{grid-row:1/3;grid-column:2/3;align-self:center}
  /* 미리보기 모달 */
  .preview-modal[hidden]{display:none}
  .preview-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px}
  .pm-backdrop{position:absolute;inset:0;background:rgba(6,39,65,.6)}
  .pm-card{position:relative;background:#fffeee;border-radius:14px;max-width:760px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.3)}
  .pm-head{position:sticky;top:0;background:#fffeee;display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid var(--gray-100);font-weight:700}
  .pm-card .prose{padding:24px 32px}
</style>
</head><body>
<div class="admin-wrap">
  <aside class="admin-side">
    <div class="brand"><i class="fa-solid fa-tooth text-mint"></i> 올케어 관리자</div>
    ${raw(nav.map(([k, label, ico, url]) => `<a href="${url}" class="${active === k ? 'active' : ''}"><i class="fa-solid fa-${ico}"></i> ${label}</a>`).join(''))}
    <a href="/" style="margin-top:20px"><i class="fa-solid fa-house"></i> 사이트 보기</a>
    <form method="POST" action="/admin/logout" style="padding:0 24px;margin-top:8px"><button type="submit" style="color:rgba(255,255,255,.6);font-weight:600;display:flex;align-items:center;gap:12px"><i class="fa-solid fa-right-from-bracket"></i> 로그아웃</button></form>
  </aside>
  <main class="admin-main">${content}</main>
</div>
<script src="/static/app.js"></script>
</body></html>`
}

// ── 로그인 ──
export function AdminLogin(error?: string) {
  return html`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>관리자 로그인</title><meta name="robots" content="noindex"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><link rel="stylesheet" href="/static/style.css"></head>
<body style="background:var(--brand-deep);display:grid;place-items:center;min-height:100vh">
  <div class="form-card" style="width:90%;max-width:400px">
    <h1 style="font-size:1.4rem;text-align:center;margin-bottom:24px"><i class="fa-solid fa-lock text-mint"></i> 관리자 로그인</h1>
    ${error ? html`<div style="background:#fdeaea;color:#c0392b;padding:12px;border-radius:10px;margin-bottom:16px;font-size:14px;text-align:center">${error}</div>` : ''}
    <form method="POST" action="/admin/login">
      <div class="field"><label>비밀번호</label><input type="password" name="password" required autofocus></div>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">로그인</button>
    </form>
  </div>
</body></html>`
}

// ── 대시보드 ──
export function AdminDashboard(stats: {
  reservations: number; newReservations: number; weekReservations: number;
  cases: number; columns: number; members: number; notices: number; totalViews: number;
  recentReservations: any[]; topContent: { title: string; type: string; url: string; v: number }[];
}) {
  const e = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return adminShell('dashboard', '대시보드', html`
    <div class="admin-head"><h1>대시보드</h1><span style="color:var(--gray-600)">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' })}</span></div>

    ${stats.newReservations > 0 ? html`<div class="admin-card" style="background:linear-gradient(135deg,#062741,#0a3a5c);color:#fffeee;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div><i class="fa-solid fa-bell text-mint" style="margin-right:8px"></i><strong style="font-size:1.1rem">확인하지 않은 신규 예약 ${stats.newReservations}건</strong><p style="color:rgba(255,255,255,.7);font-size:13px;margin-top:4px">고객이 기다리고 있어요. 빠르게 연락드리면 전환율이 올라갑니다.</p></div>
      <a href="/admin/reservations" class="btn btn-sm" style="background:#b08d57;color:#fff">지금 확인 <i class="fa-solid fa-arrow-right"></i></a>
    </div>` : ''}

    <div class="stat-cards" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-box"><div class="n" data-count="${stats.newReservations}">${stats.newReservations}</div><div class="l">신규 예약</div></div>
      <div class="stat-box"><div class="n" data-count="${stats.weekReservations}">${stats.weekReservations}</div><div class="l">최근 7일 예약</div></div>
      <div class="stat-box"><div class="n" data-count="${stats.reservations}">${stats.reservations}</div><div class="l">전체 예약</div></div>
      <div class="stat-box"><div class="n" data-count="${stats.totalViews}">${stats.totalViews}</div><div class="l">콘텐츠 조회수</div></div>
      <div class="stat-box"><div class="n" data-count="${stats.members}">${stats.members}</div><div class="l">회원 수</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:start">
      <div class="admin-card">
        <h2 style="font-size:1.2rem;margin-bottom:16px"><i class="fa-solid fa-calendar-check" style="color:var(--brand-accent)"></i> 최근 예약</h2>
        ${stats.recentReservations.length === 0
          ? html`<p style="color:var(--gray-600);font-size:14px;padding:20px 0;text-align:center">아직 접수된 예약이 없습니다.</p>`
          : html`<table><tbody>
            ${raw(stats.recentReservations.map(r => `<tr>
              <td style="white-space:nowrap"><span class="badge ${r.status === '신규' ? 'new' : 'done'}">${e(r.status)}</span></td>
              <td><strong>${e(r.name)}</strong> · ${e(r.treatment)}</td>
              <td style="color:var(--gray-600);font-size:13px">${e(r.phone)}</td>
              <td style="color:var(--gray-400);font-size:12px;white-space:nowrap">${new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul' })}</td>
            </tr>`).join(''))}
          </tbody></table>
          <div style="text-align:right;margin-top:12px"><a href="/admin/reservations" style="font-size:13px;color:var(--brand-accent);font-weight:600">전체 예약 보기 →</a></div>`}
      </div>

      <div class="admin-card">
        <h2 style="font-size:1.2rem;margin-bottom:16px"><i class="fa-solid fa-fire" style="color:var(--brand-accent)"></i> 인기 콘텐츠</h2>
        ${stats.topContent.length === 0 || stats.topContent.every(t => t.v === 0)
          ? html`<p style="color:var(--gray-600);font-size:14px;padding:20px 0;text-align:center">조회 데이터가 쌓이면 표시됩니다.</p>`
          : html`<ol style="list-style:none;padding:0;margin:0">
            ${raw(stats.topContent.filter(t => t.v > 0).map((t, i) => `<li style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
              <span style="font-weight:800;color:var(--brand-accent);width:20px">${i + 1}</span>
              <a href="${t.url}" style="flex:1;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(t.title)}</a>
              <span style="font-size:11px;color:var(--gray-400)">${e(t.type)}</span>
              <span style="font-size:13px;color:var(--gray-600);white-space:nowrap"><i class="fa-regular fa-eye" style="font-size:11px"></i> ${t.v}</span>
            </li>`).join(''))}
          </ol>`}
      </div>
    </div>

    <div class="admin-card">
      <h2 style="font-size:1.2rem;margin-bottom:16px">빠른 작업</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="/admin/cases/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 비포애프터 등록</a>
        <a href="/admin/columns/new" class="btn btn-outline btn-sm"><i class="fa-solid fa-pen"></i> 칼럼 작성</a>
        <a href="/admin/notices/new" class="btn btn-outline btn-sm"><i class="fa-solid fa-bullhorn"></i> 공지 작성</a>
        <a href="/admin/events/new" class="btn btn-outline btn-sm"><i class="fa-solid fa-gift"></i> 이벤트 작성</a>
        <a href="/admin/reservations" class="btn btn-outline btn-sm"><i class="fa-solid fa-calendar"></i> 예약 확인</a>
      </div>
      <p style="color:var(--gray-600);font-size:13px;margin-top:16px">콘텐츠 현황 · 칼럼 ${stats.columns}개 · 공지 ${stats.notices}개 · 진료사례 ${stats.cases}개</p>
    </div>

    <script>
      // 카운트업 애니메이션
      (function(){
        var nums=document.querySelectorAll('.stat-box .n[data-count]');
        nums.forEach(function(el){
          var target=parseInt(el.getAttribute('data-count'),10)||0;
          if(target===0){el.textContent='0';return;}
          var dur=900,start=null;
          function step(ts){if(!start)start=ts;var p=Math.min((ts-start)/dur,1);
            el.textContent=Math.floor((1-Math.pow(1-p,3))*target).toLocaleString();
            if(p<1)requestAnimationFrame(step);}
          requestAnimationFrame(step);
        });
      })();
    </script>
  `)
}

// ── 예약 관리 ──
const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// 예약 상태 5단계 (권민수 대표원장 요청)
export const RES_STATUSES = ['신규', '연락시도1', '연락시도2', '예약확정', '종결'] as const
// 진행중(미종결) 상태 = 경과시간 카운트 대상
const RES_OPEN = new Set(['신규', '연락시도1', '연락시도2'])
function resStatusClass(s: string) {
  if (s === '신규') return 'new'
  if (s === '예약확정') return 'confirm'
  if (s === '종결') return 'done'
  return 'trying' // 연락시도1/2
}

export function AdminReservations(items: any[]) {
  const cnt = (s: string) => items.filter(r => (r.status || '신규') === s).length
  const openCount = items.filter(r => RES_OPEN.has(r.status || '신규')).length
  return adminShell('reservations', '예약 관리', html`
    <div class="admin-head"><h1>예약 관리</h1><span style="color:var(--gray-600)">진행중 ${openCount}건 · 전체 ${items.length}건</span></div>
    ${items.length === 0 ? html`<div class="admin-card"><p style="color:var(--gray-600);text-align:center;padding:40px">접수된 예약이 없습니다.</p></div>` : html`
    <div class="admin-card" style="padding:0;overflow:hidden">
      <div style="display:flex;gap:6px;padding:14px 20px;border-bottom:1px solid var(--gray-100);flex-wrap:wrap">
        <button type="button" class="btn-sm btn-outline res-filter active" data-f="all">전체 (${items.length})</button>
        ${raw(RES_STATUSES.map(s => `<button type="button" class="btn-sm btn-outline res-filter" data-f="${s}">${s} (${cnt(s)})</button>`).join(''))}
      </div>
      <div style="overflow-x:auto"><table><thead><tr><th>접수 / 경과</th><th>이름·연락처</th><th>진료·희망</th><th>문의내용</th><th>상태·담당·메모</th></tr></thead><tbody>
      ${raw(items.map(r => {
        const status = r.status || '신규'
        const d = new Date(r.createdAt)
        const phoneDigits = String(r.phone || '').replace(/[^0-9]/g, '')
        const msg = esc(r.message)
        const isOpen = RES_OPEN.has(status)
        // 경과시간 배지 (진행중일 때만): 60분 초과 노랑, 4시간 초과 빨강
        const mins = Math.floor((Date.now() - (r.createdAt || Date.now())) / 60000)
        const elapsedTxt = mins < 60 ? `${mins}분 전` : mins < 1440 ? `${Math.floor(mins / 60)}시간 ${mins % 60}분 전` : `${Math.floor(mins / 1440)}일 전`
        const level = !isOpen ? '' : mins > 240 ? 'red' : mins > 60 ? 'yellow' : ''
        const elapsedBadge = isOpen
          ? `<span class="elapsed ${level}">${level === 'red' ? '<i class="fa-solid fa-triangle-exclamation"></i> ' : level === 'yellow' ? '<i class="fa-solid fa-clock"></i> ' : ''}${elapsedTxt}</span>`
          : `<span style="color:var(--gray-400);font-size:12px">${elapsedTxt}</span>`
        const statusOpts = RES_STATUSES.map(s => `<option value="${s}"${s === status ? ' selected' : ''}>${s}</option>`).join('')
        return `<tr data-status="${esc(status)}">
        <td style="white-space:nowrap">${d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}<br><span style="color:var(--gray-400);font-size:12px">${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}</span><br>${elapsedBadge}</td>
        <td><strong>${esc(r.name)}</strong>${r.email ? `<br><span style="color:var(--gray-400);font-size:12px">${esc(r.email)}</span>` : ''}<br><a href="tel:${phoneDigits}" style="color:var(--brand-accent);font-weight:600"><i class="fa-solid fa-phone" style="font-size:11px"></i> ${esc(r.phone)}</a></td>
        <td style="white-space:nowrap">${esc(r.treatment)}<br><span style="color:var(--gray-400);font-size:12px">${esc(r.date) || '희망일 무관'} ${esc(r.timeslot) || ''}</span></td>
        <td style="max-width:220px">${msg ? `<span title="${msg}" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;color:var(--gray-600)">${msg}</span>` : '<span style="color:var(--gray-400)">-</span>'}</td>
        <td style="min-width:230px">
          <form method="POST" action="/admin/reservations/${r.id}/note">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span class="badge ${resStatusClass(status)}">${esc(status)}</span>
              <select name="status" class="res-mini">${statusOpts}</select></div>
            <input name="assignee" class="res-mini" style="width:100%;margin-bottom:6px" placeholder="담당자" value="${esc(r.assignee) || ''}">
            <textarea name="memo" class="res-mini" style="width:100%;min-height:44px;margin-bottom:6px" placeholder="처리 메모">${esc(r.memo) || ''}</textarea>
            <button class="btn-sm btn-primary" style="width:100%"><i class="fa-solid fa-floppy-disk" style="font-size:11px"></i> 저장</button>
          </form>
          <form method="POST" action="/admin/reservations/${r.id}/delete" onsubmit="return confirm('이 예약을 삭제하시겠습니까?')" style="margin-top:4px"><button class="btn-sm" style="color:#c0392b;width:100%">삭제</button></form>
        </td></tr>`
      }).join(''))}
      </tbody></table></div>
    </div>
    <script>
      (function(){
        var btns=document.querySelectorAll('.res-filter');
        var rows=document.querySelectorAll('tbody tr[data-status]');
        btns.forEach(function(b){b.addEventListener('click',function(){
          btns.forEach(function(x){x.classList.remove('active')});b.classList.add('active');
          var f=b.getAttribute('data-f');
          rows.forEach(function(r){r.style.display=(f==='all'||r.getAttribute('data-status')===f)?'':'none'});
        })});
      })();
    </script>`}
  `)
}

// ── 회원 관리 ──
export function AdminMembers(users: any[]) {
  return adminShell('members', '회원 관리', html`
    <div class="admin-head"><h1>회원 관리</h1><span style="color:var(--gray-600)">총 ${users.length}명</span></div>
    <div class="admin-card">
      ${users.length === 0 ? html`<p style="color:var(--gray-600);text-align:center;padding:40px">가입한 회원이 없습니다.</p>` : html`
      <table><thead><tr><th>가입일</th><th>이름</th><th>이메일</th><th>전화</th><th>가입경로</th><th>마케팅</th></tr></thead><tbody>
      ${raw(users.map(u => `<tr>
        <td>${new Date(u.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
        <td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.phone || '-'}</td>
        <td><span class="badge done">${u.provider === 'google' ? 'Google' : '이메일'}</span></td>
        <td>${u.marketing ? '동의' : '-'}</td></tr>`).join(''))}
      </tbody></table>`}
    </div>
  `)
}

// ── 비포애프터 관리 ──
export function AdminCases(items: any[], views: Record<string, number> = {}) {
  return adminShell('cases', '비포애프터', html`
    <div class="admin-head"><h1>비포애프터</h1><a href="/admin/cases/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 사례</a></div>
    <div class="admin-card">
      ${items.length === 0 ? html`<p style="color:var(--gray-600);text-align:center;padding:40px">등록된 사례가 없습니다.</p>` : html`
      <table><thead><tr><th>등록일</th><th>제목</th><th>진료</th><th>나이/성별</th><th>담당</th><th>조회수</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(c => `<tr>
        <td>${new Date(c.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
        <td><strong>${c.title}</strong></td><td>${TREATMENTS.find(t=>t.slug===c.category)?.name||c.category}</td>
        <td>${c.ageGroup || '-'} ${c.gender || ''}</td><td>${DOCTORS.find(d=>d.slug===c.doctor)?.name||'-'}</td>
        <td><i class="fa-regular fa-eye" style="color:var(--gray-600);font-size:12px"></i> ${views[c.id] || 0}</td>
        <td style="white-space:nowrap"><a href="/admin/cases/${c.id}/edit" class="btn-sm" style="color:var(--gold-600);text-decoration:none">수정</a> <form method="POST" action="/admin/cases/${c.id}/delete" style="display:inline" onsubmit="return confirm('삭제하시겠습니까?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form></td></tr>`).join(''))}
      </tbody></table>`}
    </div>
  `)
}

// ── 비포애프터 등록/수정 폼 (item 있으면 수정 모드) ──
export function AdminCaseForm(item?: any) {
  const edit = !!item
  const it = item || {}
  const sel = (v: string, cur: any) => (String(cur || '') === v ? ' selected' : '')
  // 사진 필드: 수정 시 기존 파일 유무 안내 + 미리보기
  const photoField = (name: string, label: string) => {
    const has = !!it[name]
    return `<div class="field">
      <label>${label}${has ? ' <span style="color:var(--gold-600);font-size:12px;font-weight:600">· 등록됨</span>' : ''}</label>
      ${has ? `<div style="margin-bottom:8px"><img src="/admin/case-media/${it.id}/${name}" alt="${label}" style="max-width:140px;border-radius:6px;border:1px solid var(--gray-100)"></div>` : ''}
      <input type="file" name="${name}" accept="image/*">
      ${edit && has ? `<p style="font-size:12px;color:var(--gray-600);margin-top:4px">새 파일을 고르면 교체되고, 비워두면 기존 사진이 유지됩니다.</p>` : ''}
    </div>`
  }
  return adminShell('cases', edit ? '비포애프터 수정' : '비포애프터 등록', html`
    <div class="admin-head"><h1>${edit ? '비포애프터 수정' : '비포애프터 등록'}</h1></div>
    <div class="admin-card">
      <form method="POST" action="${edit ? `/admin/cases/${it.id}/edit` : '/admin/cases/new'}" enctype="multipart/form-data">
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required placeholder="예: 다수 치아 상실 임플란트 케이스" value="${raw(String(it.title || '').replace(/"/g, '&quot;'))}"></div>
          <div class="field"><label>진료 카테고리 <span class="req">*</span></label><select name="category" required><option value="">선택</option>${raw(TREATMENTS.map(t => `<option value="${t.slug}"${sel(t.slug, it.category)}>${t.name}</option>`).join(''))}</select></div>
        </div>
        <div class="field"><label>케이스 설명</label><textarea name="description" placeholder="치료 내용을 간단히 적어주세요.">${it.description || ''}</textarea></div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>환자 나이대</label><select name="ageGroup"><option value="">선택</option>${raw(['10대','20대','30대','40대','50대','60대','70대 이상'].map(a => `<option${sel(a, it.ageGroup)}>${a}</option>`).join(''))}</select></div>
          <div class="field"><label>성별</label><select name="gender"><option value="">선택</option><option${sel('남성', it.gender)}>남성</option><option${sel('여성', it.gender)}>여성</option></select></div>
        </div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>담당 원장</label><select name="doctor"><option value="">선택</option>${raw(DOCTORS.map(d => `<option value="${d.slug}"${sel(d.slug, it.doctor)}>${d.name} ${d.role}</option>`).join(''))}</select></div>
          <div class="field"><label>치료 기간</label><input name="period" placeholder="예: 약 6개월" value="${raw(String(it.period || '').replace(/"/g, '&quot;'))}"></div>
        </div>
        <div class="field autocomplete-wrap"><label>지역 카테고리</label><input id="regionInput" name="region" autocomplete="off" placeholder="예: 안산 입력 → 안산시" value="${raw(String(it.region || '').replace(/"/g, '&quot;'))}"><div class="autocomplete-list" id="regionList" style="display:none"></div></div>
        <hr style="border:none;border-top:1px solid var(--gray-100);margin:24px 0">
        <p style="font-weight:700;margin-bottom:14px">사진 업로드 (업로드한 사진만 표시됩니다)</p>
        <div class="grid-2" style="gap:18px;align-items:start">
          ${raw(photoField('panoBefore', '파노라마 — 치료 전'))}
          ${raw(photoField('panoAfter', '파노라마 — 치료 후'))}
          ${raw(photoField('intraBefore', '구내포토 — 치료 전'))}
          ${raw(photoField('intraAfter', '구내포토 — 치료 후'))}
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:14px"><i class="fa-solid fa-floppy-disk"></i> ${edit ? '수정 저장' : '저장'}</button>
        <a href="/admin/cases" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
    <script>document.addEventListener('DOMContentLoaded',function(){if(window.initRegionAutocomplete)window.initRegionAutocomplete('regionInput','regionList');});</script>
  `)
}

// ── 칼럼 관리 ──
export function AdminColumns(items: any[], views: Record<string, number> = {}) {
  return adminShell('columns', '원장 칼럼', html`
    <div class="admin-head"><h1>원장 칼럼</h1><a href="/admin/columns/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 칼럼</a></div>
    <div class="admin-card">
      <table><thead><tr><th>작성일</th><th>제목</th><th>진료</th><th>작성자</th><th>조회수</th><th>상태</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(c => `<tr>
        <td>${new Date(c.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
        <td><strong>${c.title}</strong></td><td>${columnCategoryName(c.category)}</td>
        <td>${DOCTORS.find(d=>d.slug===c.author)?.name||'-'}</td>
        <td><i class="fa-regular fa-eye" style="color:var(--gray-600);font-size:12px"></i> ${views[c.id] || 0}</td>
        <td><span class="badge ${c.published?'new':'done'}">${c.published?'게시':'임시'}</span></td>
        <td><a href="/admin/columns/${c.id}/edit" class="btn-sm btn-outline">수정</a> <form method="POST" action="/admin/columns/${c.id}/delete" style="display:inline" onsubmit="return confirm('삭제?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form></td></tr>`).join(''))}
      </tbody></table>
    </div>
  `)
}

// ── 칼럼 작성/수정 폼 ──
export function AdminColumnForm(col?: any, allColumns: any[] = []) {
  const c = col || {}
  const esc = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const keywordsStr = Array.isArray(c.keywords) ? c.keywords.join(', ') : (c.keywords || '')
  // §S20②: '함께 보면 좋은 글' 수동 지정 후보 (자기 자신 제외, 발행된 글만)
  const relCandidates = allColumns.filter((x: any) => x.published && x.id !== c.id)
  const relSelected: string[] = Array.isArray(c.relatedSlugs) ? c.relatedSlugs : []
  const faqsJson = JSON.stringify(c.faqs || [])
  const defaultBody = '<p>여기에 본문을 작성하세요. 상단 툴바로 제목·굵게·인용·목록 등을 적용하고, 사진은 본문으로 끌어다 놓으면 커서 위치에 바로 삽입됩니다.</p>'
  return adminShell('columns', col ? '칼럼 수정' : '칼럼 작성', html`
    <div class="admin-head">
      <h1>${col ? '칼럼 수정' : '칼럼 작성'}</h1>
      <div style="display:flex;gap:8px">
        <button type="button" id="previewBtn" class="btn btn-outline btn-sm"><i class="fa-regular fa-eye"></i> 미리보기</button>
        <button type="submit" form="columnForm" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
      </div>
    </div>

    <form method="POST" id="columnForm" action="${col ? `/admin/columns/${c.id}/edit` : '/admin/columns/new'}">
      <input type="hidden" name="body" id="bodyHidden">
      <input type="hidden" name="faqs" id="faqsHidden" value="${raw(esc(faqsJson))}">

      <div class="editor-layout">
        <!-- ───────── 좌: 메인 에디터 ───────── -->
        <div class="editor-main">
          <div class="admin-card" style="padding:0;overflow:visible">
            <input name="title" required value="${raw(esc(c.title))}" placeholder="칼럼 제목을 입력하세요"
              style="width:100%;border:none;padding:24px 26px 8px;font-family:'Nanum Myeongjo',serif;font-size:1.7rem;font-weight:800;background:transparent;outline:none">

            <!-- 리치 에디터 툴바 -->
            <div class="rte-toolbar" id="rteToolbar">
              <span class="rte-group">
                <button type="button" data-cmd="formatBlock" data-val="h2" title="대제목(H2)"><b>H2</b></button>
                <button type="button" data-cmd="formatBlock" data-val="h3" title="중제목(H3)"><b>H3</b></button>
                <button type="button" data-cmd="formatBlock" data-val="p" title="본문">¶</button>
              </span>
              <span class="rte-sep"></span>
              <span class="rte-group">
                <button type="button" data-cmd="bold" title="굵게"><b>B</b></button>
                <button type="button" data-cmd="italic" title="기울임"><i>I</i></button>
                <button type="button" data-cmd="underline" title="밑줄"><u>U</u></button>
              </span>
              <span class="rte-sep"></span>
              <span class="rte-group">
                <button type="button" data-cmd="insertUnorderedList" title="글머리 목록"><i class="fa-solid fa-list-ul"></i></button>
                <button type="button" data-cmd="insertOrderedList" title="번호 목록"><i class="fa-solid fa-list-ol"></i></button>
                <button type="button" data-cmd="formatBlock" data-val="blockquote" title="인용"><i class="fa-solid fa-quote-right"></i></button>
                <button type="button" data-act="answerbox" title="핵심 답변 박스 (AEO)"><i class="fa-solid fa-square-check"></i></button>
                <button type="button" data-act="hr" title="구분선"><i class="fa-solid fa-minus"></i></button>
              </span>
              <span class="rte-sep"></span>
              <span class="rte-group">
                <button type="button" data-act="link" title="링크"><i class="fa-solid fa-link"></i></button>
                <button type="button" data-act="image" title="사진 삽입"><i class="fa-solid fa-image"></i></button>
                <button type="button" data-cmd="removeFormat" title="서식 지우기"><i class="fa-solid fa-eraser"></i></button>
              </span>
              <span class="rte-spacer"></span>
              <span class="rte-count" id="rteCount">0자</span>
            </div>

            <!-- 본문 편집 영역 (contenteditable) -->
            <div id="rteEditor" class="rte-editor prose" contenteditable="true" data-placeholder="본문을 작성하세요...">${raw(c.body || defaultBody)}</div>

            <input type="file" id="imgPicker" accept="image/*" multiple style="display:none">
            <div class="rte-statusbar"><span id="upStatus"><i class="fa-solid fa-arrow-pointer"></i> 사진을 본문으로 끌어다 놓거나, 복사한 이미지를 붙여넣기(Ctrl+V) 하면 커서 위치에 삽입됩니다.</span></div>
          </div>

          <!-- FAQ 블록 (FAQPage 스키마 → 구글 리치결과) -->
          <div class="admin-card" style="margin-top:18px">
            <h3 style="margin:0 0 6px;font-size:1.05rem"><i class="fa-solid fa-circle-question" style="color:var(--gold,#b08d57)"></i> 자주 묻는 질문 (FAQ)</h3>
            <p style="margin:0 0 14px;font-size:13px;color:var(--gray-600,#777)">여기 적은 Q&A는 본문 하단에 노출되고, 구글에 <strong>FAQ 리치결과</strong>로 노출되도록 자동으로 구조화 데이터가 생성됩니다. (SEO 강력 추천)</p>
            <div id="faqList"></div>
            <button type="button" id="addFaq" class="btn btn-outline btn-sm" style="margin-top:6px"><i class="fa-solid fa-plus"></i> 질문 추가</button>
          </div>
        </div>

        <!-- ───────── 우: SEO / 발행 사이드바 ───────── -->
        <aside class="editor-side">
          <div class="admin-card seo-card">
            <h3 style="margin:0 0 14px;font-size:1.05rem;display:flex;align-items:center;gap:8px">
              <i class="fa-solid fa-magnifying-glass-chart" style="color:var(--gold,#b08d57)"></i> SEO 최적화
              <span id="seoScore" class="seo-score">0</span>
            </h3>

            <!-- 구글 검색결과 미리보기 -->
            <div class="serp-preview">
              <div class="serp-url">allcaredc.kr › column › <span id="serpSlug">slug</span></div>
              <div class="serp-title" id="serpTitle">제목 미리보기</div>
              <div class="serp-desc" id="serpDesc">메타 설명이 여기에 표시됩니다.</div>
            </div>

            <div class="field"><label>슬러그 (URL) <span style="font-weight:400;opacity:.6">— 영문 권장</span></label>
              <input name="slug" id="slugInput" value="${raw(esc(c.slug))}" placeholder="비우면 제목으로 자동 생성"></div>

            <div class="field"><label>요약 (목록 노출) <span class="req">*</span></label>
              <input name="excerpt" id="excerptInput" required value="${raw(esc(c.excerpt))}" placeholder="목록·검색결과에 보일 한 줄 요약"></div>

            <div class="field"><label>메타 타이틀 <span id="mtCount" class="ch-count">0</span></label>
              <input name="metaTitle" id="metaTitle" value="${raw(esc(c.metaTitle))}" placeholder="(비우면 제목 사용) 30~60자 권장"></div>

            <div class="field"><label>메타 설명 <span id="mdCount" class="ch-count">0</span></label>
              <textarea name="metaDesc" id="metaDesc" style="min-height:74px" placeholder="(비우면 요약 사용) 검색결과에 노출되는 설명. 70~155자 권장">${raw(esc(c.metaDesc))}</textarea></div>

            <div class="field"><label>키워드 <span style="font-weight:400;opacity:.6">— 쉼표로 구분</span></label>
              <input name="keywords" id="keywords" value="${raw(esc(keywordsStr))}" placeholder="예: 임플란트, 골이식, 약수역 치과"></div>

            <div class="seo-checklist" id="seoChecklist"></div>
          </div>

          <div class="admin-card">
            <h3 style="margin:0 0 14px;font-size:1.05rem"><i class="fa-solid fa-gear" style="color:var(--gold,#b08d57)"></i> 발행 설정</h3>
            <div class="field"><label>진료 카테고리 <span class="req">*</span></label>
              <select name="category" required>${raw(COLUMN_CATEGORIES.map(t => `<option value="${t.slug}" ${c.category === t.slug ? 'selected' : ''}>${t.name}</option>`).join(''))}</select></div>
            <div class="field"><label>작성자(원장) <span class="req">*</span></label>
              <select name="author" required>${raw(DOCTORS.map(d => `<option value="${d.slug}" ${c.author === d.slug ? 'selected' : ''}>${d.name} ${d.role}</option>`).join(''))}</select></div>
            <div class="field"><label>대표(썸네일) 이미지 <span style="font-weight:500;color:var(--gray-400);font-size:12px">권장 1200×630px (카드·카톡·SNS 공유 공통)</span></label>
              <div style="display:flex;gap:8px;align-items:center">
                <input name="thumbnail" id="thumbInput" value="${raw(esc(c.thumbnail))}" placeholder="URL 또는 업로드" style="flex:1">
                <label class="btn btn-outline btn-sm" style="cursor:pointer;margin:0;white-space:nowrap"><i class="fa-solid fa-upload"></i>
                  <input type="file" id="thumbPicker" accept="image/*" style="display:none"></label>
              </div>
              <div id="thumbPreview" style="margin-top:8px">${c.thumbnail ? `<img src="${esc(c.thumbnail)}" alt="" style="width:100%;aspect-ratio:1200/630;object-fit:cover;border-radius:8px;border:1px solid var(--line)">` : ''}</div>
            </div>
            <div class="field"><label>대표 이미지 대체텍스트(alt)</label>
              <input name="thumbnailAlt" value="${raw(esc(c.thumbnailAlt))}" placeholder="이미지 설명 (SEO·접근성)"></div>
            <div class="field"><label>함께 보면 좋은 글 <span style="font-weight:500;color:var(--gray-400);font-size:12px">미선택 시 같은 카테고리 최신순 자동 (최대 3개)</span></label>
              ${relCandidates.length ? html`
                <div style="max-height:180px;overflow-y:auto;border:1px solid var(--line);border-radius:8px;padding:10px 12px">
                  ${raw(relCandidates.map((x: any) => `
                    <label class="checkbox-row" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;cursor:pointer">
                      <input type="checkbox" name="relatedSlugs" value="${esc(x.slug)}" ${relSelected.includes(x.slug) ? 'checked' : ''} style="margin-top:3px">
                      <span>${esc(x.title)} <span style="color:var(--gray-400)">· ${columnCategoryName(x.category)}</span></span>
                    </label>`).join(''))}
                </div>
              ` : html`<p style="font-size:13px;color:var(--gray-400)">다른 발행 칼럼이 생기면 여기서 직접 선택할 수 있습니다.</p>`}
            </div>
            <div class="field"><label class="checkbox-row"><input type="checkbox" name="published" ${c.published !== false ? 'checked' : ''}> <span>즉시 게시</span></label></div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center"><i class="fa-solid fa-floppy-disk"></i> 저장하기</button>
            <a href="/admin/columns" class="btn btn-outline btn-sm" style="width:100%;justify-content:center;margin-top:8px">취소</a>
          </div>
        </aside>
      </div>
    </form>

    <!-- 미리보기 모달 -->
    <div id="previewModal" class="preview-modal" hidden>
      <div class="pm-backdrop"></div>
      <div class="pm-card">
        <div class="pm-head"><span>미리보기</span><button type="button" id="pmClose" class="btn-sm"><i class="fa-solid fa-xmark"></i> 닫기</button></div>
        <article class="prose" id="pmBody"></article>
      </div>
    </div>

    ${raw(columnEditorScript(faqsJson))}
  `)
}

// 에디터 클라이언트 스크립트 (별도 함수로 분리해 가독성 확보)
function columnEditorScript(faqsJson: string): string {
  return `<script>
(function(){
  var ed = document.getElementById('rteEditor');
  var hidden = document.getElementById('bodyHidden');
  var form = document.getElementById('columnForm');
  var status = document.getElementById('upStatus');
  var picker = document.getElementById('imgPicker');
  var count = document.getElementById('rteCount');
  if (!ed || !form) return;

  // ── 본문 → hidden 동기화 (저장 직전) ──
  function syncBody(){ hidden.value = ed.innerHTML; }
  function updateCount(){ var t = (ed.innerText||'').replace(/\\s+/g,' ').trim(); if(count) count.textContent = t.length + '자'; scoreSeo(); }
  ed.addEventListener('input', updateCount);

  // ── 툴바 명령 ──
  document.getElementById('rteToolbar').addEventListener('click', function(e){
    var btn = e.target.closest('button'); if(!btn) return;
    e.preventDefault(); ed.focus();
    var cmd = btn.getAttribute('data-cmd'), val = btn.getAttribute('data-val'), act = btn.getAttribute('data-act');
    if (cmd === 'formatBlock') { document.execCommand('formatBlock', false, val); }
    else if (cmd) { document.execCommand(cmd, false, null); }
    else if (act === 'answerbox') { document.execCommand('insertHTML', false, '<div class="answer-box">핵심 답변을 입력하세요.</div><p><br></p>'); }
    else if (act === 'hr') { document.execCommand('insertHTML', false, '<hr><p><br></p>'); }
    else if (act === 'link') { var u = prompt('링크 URL을 입력하세요 (예: /treatments/implant)', 'https://'); if(u) document.execCommand('createLink', false, u); }
    else if (act === 'image') { picker.click(); }
    setTimeout(updateCount, 0);
  });

  // ── 이미지 업로드 → 인라인 삽입 ──
  function insertImagesHtml(urls){
    var tags = (urls||[]).map(function(u){
      return '<figure class="column-figure"><img src="'+u+'" alt="이미지 설명을 입력하세요" loading="lazy"><figcaption>사진 설명 (선택)</figcaption></figure><p><br></p>';
    }).join('');
    ed.focus();
    document.execCommand('insertHTML', false, tags);
    updateCount();
  }
  function upload(files, target){
    var imgs = Array.prototype.filter.call(files, function(f){ return f && f.type && f.type.indexOf('image/')===0; });
    if (!imgs.length) return;
    if(status) status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 업로드 중... ('+imgs.length+'장)';
    var fd = new FormData(); imgs.forEach(function(f){ fd.append('files', f); });
    fetch('/admin/upload-image', { method:'POST', body:fd })
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(j){
        var urls = j.urls || [];
        if (target === 'thumb' && urls[0]) {
          document.getElementById('thumbInput').value = urls[0];
          document.getElementById('thumbPreview').innerHTML = '<img src="'+urls[0]+'" alt="" style="width:100%;border-radius:8px;border:1px solid var(--line)">';
          scoreSeo();
        } else {
          insertImagesHtml(urls);
        }
        if(status) status.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#1f7a4d"></i> '+urls.length+'장 삽입 완료 — 각 사진의 alt 텍스트를 꼭 채워주세요 (SEO).';
      })
      .catch(function(){ if(status) status.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#c0392b"></i> 업로드 실패 — 다시 시도해 주세요.'; });
  }
  // 드래그앤드롭
  ['dragenter','dragover'].forEach(function(ev){ ed.addEventListener(ev, function(e){ e.preventDefault(); ed.classList.add('rte-dragover'); }); });
  ['dragleave','drop'].forEach(function(ev){ ed.addEventListener(ev, function(e){ e.preventDefault(); ed.classList.remove('rte-dragover'); }); });
  ed.addEventListener('drop', function(e){ if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) upload(e.dataTransfer.files); });
  // 붙여넣기 이미지
  ed.addEventListener('paste', function(e){
    var items = e.clipboardData && e.clipboardData.items; if(!items) return;
    var files=[]; for(var i=0;i<items.length;i++){ if(items[i].kind==='file'){ var f=items[i].getAsFile(); if(f) files.push(f);} }
    if(files.length){ e.preventDefault(); upload(files); }
  });
  if (picker) picker.addEventListener('change', function(){ upload(picker.files); picker.value=''; });
  // 본문 이미지 클릭 → alt 텍스트 편집 (SEO)
  ed.addEventListener('click', function(e){
    var img = e.target.closest('img'); if(!img) return;
    var cur = img.getAttribute('alt')||'';
    if (cur==='이미지 설명을 입력하세요') cur='';
    var v = prompt('이 사진의 설명(alt 텍스트)을 입력하세요. 검색·접근성에 사용됩니다.', cur);
    if (v!==null){ img.setAttribute('alt', v); updateCount(); }
  });
  var thumbPicker = document.getElementById('thumbPicker');
  if (thumbPicker) thumbPicker.addEventListener('change', function(){ upload(thumbPicker.files, 'thumb'); thumbPicker.value=''; });

  // ── FAQ 동적 입력 ──
  var faqList = document.getElementById('faqList');
  var faqsHidden = document.getElementById('faqsHidden');
  var faqs = []; try { faqs = JSON.parse(${JSON.stringify(faqsJson)}) || []; } catch(e){ faqs = []; }
  function renderFaqs(){
    faqList.innerHTML = faqs.map(function(f, i){
      return '<div class="faq-row" data-i="'+i+'">'
        + '<input class="faq-q" placeholder="질문 (예: 임플란트 수술은 아픈가요?)" value="'+(f.q||'').replace(/"/g,"&quot;")+'">'
        + '<textarea class="faq-a" placeholder="답변">'+(f.a||'').replace(/</g,"&lt;")+'</textarea>'
        + '<button type="button" class="faq-del btn-sm" style="color:#c0392b"><i class="fa-solid fa-trash"></i></button>'
        + '</div>';
    }).join('');
  }
  function syncFaqs(){
    var rows = faqList.querySelectorAll('.faq-row');
    faqs = Array.prototype.map.call(rows, function(r){ return { q: r.querySelector('.faq-q').value, a: r.querySelector('.faq-a').value }; })
      .filter(function(f){ return f.q.trim() || f.a.trim(); });
    faqsHidden.value = JSON.stringify(faqs);
    scoreSeo();
  }
  document.getElementById('addFaq').addEventListener('click', function(){ faqs.push({q:'',a:''}); renderFaqs(); });
  faqList.addEventListener('input', syncFaqs);
  faqList.addEventListener('click', function(e){ var d = e.target.closest('.faq-del'); if(d){ d.closest('.faq-row').remove(); syncFaqs(); } });
  renderFaqs();

  // ── 슬러그 자동 생성 ──
  var titleInput = form.querySelector('input[name=title]');
  var slugInput = document.getElementById('slugInput');
  function autoSlug(s){ return s.toLowerCase().replace(/[^\\w가-힣]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60); }
  titleInput.addEventListener('input', scoreSeo);

  // ── SEO 점수 & 미리보기 ──
  var serpTitle = document.getElementById('serpTitle'), serpDesc = document.getElementById('serpDesc'), serpSlug = document.getElementById('serpSlug');
  var metaTitle = document.getElementById('metaTitle'), metaDesc = document.getElementById('metaDesc');
  var excerptInput = document.getElementById('excerptInput'), keywords = document.getElementById('keywords');
  var mtCount = document.getElementById('mtCount'), mdCount = document.getElementById('mdCount');
  var seoScoreEl = document.getElementById('seoScore'), checklist = document.getElementById('seoChecklist');
  function scoreSeo(){
    var title = titleInput.value.trim();
    var mt = (metaTitle.value.trim() || title);
    var md = (metaDesc.value.trim() || excerptInput.value.trim());
    var slug = (slugInput.value.trim() || autoSlug(title) || 'slug');
    var bodyText = (ed.innerText||'').replace(/\\s+/g,' ').trim();
    var kws = keywords.value.split(',').map(function(s){return s.trim();}).filter(Boolean);
    var imgCount = ed.querySelectorAll('img').length;
    var imgNoAlt = Array.prototype.filter.call(ed.querySelectorAll('img'), function(im){ var a=(im.getAttribute('alt')||'').trim(); return !a || a==='이미지 설명을 입력하세요'; }).length;
    var h2 = ed.querySelectorAll('h2,h3').length;
    // 미리보기
    serpTitle.textContent = (mt || '제목 미리보기').slice(0,60) + (mt.length>60?'…':'');
    serpDesc.textContent = (md || '메타 설명이 여기에 표시됩니다.').slice(0,155) + (md.length>155?'…':'');
    serpSlug.textContent = slug;
    mtCount.textContent = mt.length + '자'; mtCount.className = 'ch-count' + (mt.length>=30&&mt.length<=60?' ok':(mt.length>60?' over':''));
    mdCount.textContent = md.length + '자'; mdCount.className = 'ch-count' + (md.length>=70&&md.length<=155?' ok':(md.length>155?' over':''));
    // 체크리스트
    var kwInTitle = kws.length && kws.some(function(k){ return title.indexOf(k)>=0; });
    var kwInBody = kws.length && kws.some(function(k){ return bodyText.indexOf(k)>=0; });
    var checks = [
      { ok: title.length>=8 && title.length<=40, t: '제목 8~40자 (현재 '+title.length+'자)' },
      { ok: md.length>=70 && md.length<=155, t: '메타 설명 70~155자' },
      { ok: bodyText.length>=600, t: '본문 600자 이상 (현재 '+bodyText.length+'자)' },
      { ok: h2>=2, t: '소제목(H2/H3) 2개 이상 (현재 '+h2+'개)' },
      { ok: imgCount>=1, t: '이미지 1장 이상' },
      { ok: imgNoAlt===0, t: imgNoAlt>0 ? ('이미지 alt 미입력 '+imgNoAlt+'개 — 채워주세요') : '모든 이미지 alt 입력됨' },
      { ok: kws.length>=1, t: '키워드 1개 이상' },
      { ok: !!kwInTitle, t: '키워드가 제목에 포함' },
      { ok: !!kwInBody, t: '키워드가 본문에 포함' },
      { ok: faqs.length>=1, t: 'FAQ 1개 이상 (리치결과)' },
    ];
    var passed = checks.filter(function(c){return c.ok;}).length;
    var pct = Math.round(passed/checks.length*100);
    seoScoreEl.textContent = pct;
    seoScoreEl.className = 'seo-score ' + (pct>=80?'good':(pct>=50?'mid':'low'));
    checklist.innerHTML = checks.map(function(c){
      return '<div class="seo-chk '+(c.ok?'on':'off')+'"><i class="fa-solid fa-'+(c.ok?'circle-check':'circle')+'"></i> '+c.t+'</div>';
    }).join('');
  }
  [metaTitle, metaDesc, excerptInput, keywords, slugInput].forEach(function(el){ if(el) el.addEventListener('input', scoreSeo); });

  // ── 미리보기 모달 ──
  var pm = document.getElementById('previewModal');
  document.getElementById('previewBtn').addEventListener('click', function(){
    document.getElementById('pmBody').innerHTML = ed.innerHTML
      + (faqs.length ? '<h2 style="margin-top:2em">자주 묻는 질문</h2>' + faqs.map(function(f){ return '<p><strong>Q. '+f.q+'</strong><br>'+ (f.a||'').replace(/\\n/g,'<br>') +'</p>'; }).join('') : '');
    pm.hidden = false;
  });
  document.getElementById('pmClose').addEventListener('click', function(){ pm.hidden = true; });
  pm.querySelector('.pm-backdrop').addEventListener('click', function(){ pm.hidden = true; });

  // ── 저장 직전 동기화 + 검증 ──
  form.addEventListener('submit', function(e){
    syncBody(); syncFaqs();
    if (!(ed.innerText||'').trim()) { e.preventDefault(); alert('본문을 입력해 주세요.'); return; }
    var noAlt = Array.prototype.filter.call(ed.querySelectorAll('img'), function(im){ var a=(im.getAttribute('alt')||'').trim(); return !a || a==='이미지 설명을 입력하세요'; }).length;
    if (noAlt>0 && !confirm('alt 텍스트가 비어있는 이미지가 '+noAlt+'개 있습니다. SEO에 불리합니다. 그래도 저장할까요?')) { e.preventDefault(); }
  });

  updateCount(); scoreSeo();
})();
</script>`
}

// ── 공지 관리 ──
export function AdminNotices(items: any[], views: Record<string, number> = {}) {
  return adminShell('notices', '공지사항', html`
    <div class="admin-head"><h1>공지사항</h1><a href="/admin/notices/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 공지</a></div>
    <div class="admin-card">
      <table><thead><tr><th>작성일</th><th>제목</th><th>조회수</th><th>고정</th><th>팝업</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(n => {
        const today = new Date().toISOString().slice(0, 10)
        const popupLive = n.popup && (!n.popupUntil || n.popupUntil >= today)
        const popupExpired = n.popup && n.popupUntil && n.popupUntil < today
        const popupCell = popupLive
          ? `<span class="badge popup-live"><i class="fa-solid fa-bell" style="font-size:10px;margin-right:4px"></i>노출중${n.popupUntil ? ` <span style="opacity:.8;font-weight:600">~${n.popupUntil}</span>` : ''}</span>`
          : popupExpired ? `<span class="badge popup-expired">만료</span>` : '-'
        return `<tr>
        <td>${new Date(n.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td><td><strong>${n.title}</strong></td>
        <td><i class="fa-regular fa-eye" style="color:var(--gray-600);font-size:12px"></i> ${views[n.id] || 0}</td>
        <td>${n.pinned ? '<span class="badge new">고정</span>' : '-'}</td>
        <td>${popupCell}</td>
        <td>
          <a href="/admin/notices/${n.id}/edit" class="btn-sm" style="color:var(--gold,#b08d57)">수정</a>
          <form method="POST" action="/admin/notices/${n.id}/delete" style="display:inline" onsubmit="return confirm('삭제?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form>
        </td></tr>`
      }).join(''))}
      </tbody></table>
    </div>
  `)
}

export function AdminNoticeForm(n?: any) {
  const edit = !!n
  const action = edit ? `/admin/notices/${n.id}/edit` : '/admin/notices/new'
  const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return adminShell('notices', edit ? '공지 수정' : '공지 작성', html`
    <div class="admin-head"><h1>${edit ? '공지 수정' : '공지 작성'}</h1></div>
    <div class="admin-card">
      <form method="POST" action="${action}" enctype="multipart/form-data">
        <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required value="${raw(esc(n?.title))}"></div>
        <div class="field"><label>내용 <span class="req">*</span></label><textarea name="body" required style="min-height:200px">${raw(esc(n?.body))}</textarea></div>
        <div class="field"><label>이미지 업로드</label><input type="file" name="imageFile" accept="image/*">
          ${edit && n.image ? html`<div style="margin-top:8px"><img src="${n.image}" alt="" style="max-height:90px;border-radius:6px;border:1px solid var(--line)"></div>` : ''}
        </div>
        <div class="field"><label>또는 이미지 URL</label><input name="image" placeholder="(선택)" value="${raw(esc(n?.image))}"></div>
        <div class="field"><label class="checkbox-row"><input type="checkbox" name="pinned" ${n?.pinned ? 'checked' : ''}> <span>상단 고정 (대표 공지)</span></label></div>

        <div class="field popup-box" style="background:var(--ivory-2,#f6f1e8);border:1px solid var(--line);border-radius:8px;padding:18px 18px 14px;margin-top:6px">
          <label class="checkbox-row" style="font-weight:700">
            <input type="checkbox" name="popup" id="popupToggle" ${n?.popup ? 'checked' : ''}>
            <span><i class="fa-solid fa-bell" style="color:var(--gold,#b08d57);margin-right:6px"></i>홈 화면 팝업으로 띄우기</span>
          </label>
          <p style="margin:8px 0 12px;font-size:13px;color:var(--gray-600,#777)">체크하면 메인 페이지 방문 시 이 공지가 팝업 창으로 표시됩니다. (동시에 1건만 노출 — 여러 건이면 고정·최신 공지 우선)</p>
          <div id="popupOpts" style="${n?.popup ? '' : 'display:none'}">
            <label style="font-size:13px;color:var(--gray-600,#777)">팝업 종료일 <span style="opacity:.6">(비우면 무기한 노출)</span></label>
            <input type="date" name="popupUntil" value="${raw(esc(n?.popupUntil))}" style="margin-top:6px;max-width:220px">
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top:8px"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <a href="/admin/notices" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
    <script>
      (function(){
        var t = document.getElementById('popupToggle'), o = document.getElementById('popupOpts');
        if (t && o) t.addEventListener('change', function(){ o.style.display = t.checked ? '' : 'none'; });
      })();
    </script>
  `)
}

// ── 이벤트 관리 ──
export function AdminEvents(items: any[], views: Record<string, number> = {}) {
  return adminShell('events', '이벤트', html`
    <div class="admin-head"><h1>이벤트</h1><a href="/admin/events/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 이벤트</a></div>
    <div class="admin-card">
      ${items.length === 0 ? html`<p style="color:var(--gray-600);text-align:center;padding:40px">등록된 이벤트가 없습니다.</p>` : html`
      <table><thead><tr><th>등록일</th><th>제목</th><th>진행 기간</th><th>상태</th><th>조회수</th><th>고정</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(e => {
        const st = eventStatus(e)
        const period = (e.startDate || e.endDate)
          ? `${(e.startDate || '').replace(/-/g, '.') || '상시'} ~ ${(e.endDate || '').replace(/-/g, '.') || '상시'}`
          : '상시'
        const badge = st.key === 'ongoing' ? 'background:#1f7a4d;color:#fff' : st.key === 'upcoming' ? 'background:#b08d57;color:#fff' : 'background:#aaa;color:#fff'
        return `<tr>
        <td>${new Date(e.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
        <td><strong>${esc(e.title)}</strong></td>
        <td style="white-space:nowrap;font-size:13px;color:var(--gray-600)">${period}</td>
        <td><span class="badge" style="${badge}">${st.label}</span></td>
        <td><i class="fa-regular fa-eye" style="color:var(--gray-600);font-size:12px"></i> ${views[e.id] || 0}</td>
        <td>${e.pinned ? '<span class="badge new">고정</span>' : '-'}</td>
        <td style="white-space:nowrap">
          <a href="/admin/events/${e.id}/edit" class="btn-sm" style="color:var(--gold,#b08d57)">수정</a>
          <form method="POST" action="/admin/events/${e.id}/delete" style="display:inline" onsubmit="return confirm('삭제?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form>
        </td></tr>`
      }).join(''))}
      </tbody></table>`}
    </div>
  `)
}

export function AdminEventForm(ev?: any) {
  const edit = !!ev
  const action = edit ? `/admin/events/${ev.id}/edit` : '/admin/events/new'
  const e = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return adminShell('events', edit ? '이벤트 수정' : '이벤트 작성', html`
    <div class="admin-head"><h1>${edit ? '이벤트 수정' : '이벤트 작성'}</h1></div>
    <div class="admin-card">
      <form method="POST" action="${action}" enctype="multipart/form-data">
        <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required value="${raw(e(ev?.title))}" placeholder="예: 구강검진 + 파노라마 촬영 안내"></div>
        <div class="field"><label>한 줄 요약 <span style="font-weight:400;opacity:.6">(목록·카드 노출)</span></label><input name="summary" value="${raw(e(ev?.summary))}" placeholder="목록에 보일 짧은 설명"></div>
        <div class="field"><label>내용 <span class="req">*</span></label><textarea name="body" required style="min-height:200px" placeholder="이벤트 상세 내용을 적어주세요. 줄바꿈은 그대로 반영됩니다.">${raw(e(ev?.body))}</textarea></div>

        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>시작일 <span style="font-weight:400;opacity:.6">(비우면 상시)</span></label><input type="date" name="startDate" value="${raw(e(ev?.startDate))}"></div>
          <div class="field"><label>종료일 <span style="font-weight:400;opacity:.6">(비우면 상시)</span></label><input type="date" name="endDate" value="${raw(e(ev?.endDate))}"></div>
        </div>

        <div class="field"><label>대표 이미지 업로드</label><input type="file" name="imageFile" accept="image/*">
          ${edit && ev.image ? html`<div style="margin-top:8px"><img src="${ev.image}" alt="" style="max-height:120px;border-radius:6px;border:1px solid var(--line)"></div>` : ''}
        </div>
        <div class="field"><label>또는 이미지 URL</label><input name="image" placeholder="(선택)" value="${raw(e(ev?.image))}"></div>

        <div class="field"><label class="checkbox-row"><input type="checkbox" name="pinned" ${ev?.pinned ? 'checked' : ''}> <span>상단 고정 (대표 이벤트 · 진행중 우선 노출)</span></label></div>

        <div style="background:var(--ivory-2,#f6f1e8);border:1px solid var(--line);border-radius:8px;padding:14px 16px;font-size:13px;color:var(--gray-600,#777);margin-bottom:18px">
          <i class="fa-solid fa-circle-info" style="color:var(--gold,#b08d57);margin-right:6px"></i>
          의료광고법 준수를 위해 <strong>치료 결과 보장·과장 표현</strong>은 피해주세요. 비급여 비용은 “상담 시 안내” 형태를 권장합니다. (본문 하단에 면책 문구가 자동 표시됩니다.)
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top:4px"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <a href="/admin/events" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
  `)
}
