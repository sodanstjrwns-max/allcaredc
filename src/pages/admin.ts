import { html, raw } from 'hono/html'
import { CLINIC, TREATMENTS, DOCTORS } from '../data/clinic'

// 관리자 셸 (사이드바)
function adminShell(active: string, title: string, content: any) {
  const nav = [
    ['dashboard', '대시보드', 'gauge-high', '/admin'],
    ['reservations', '예약 관리', 'calendar-check', '/admin/reservations'],
    ['cases', '비포애프터', 'images', '/admin/cases'],
    ['columns', '원장 칼럼', 'pen-nib', '/admin/columns'],
    ['notices', '공지사항', 'bullhorn', '/admin/notices'],
    ['members', '회원 관리', 'users', '/admin/members'],
  ]
  return html`<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | 올케어치과 관리자</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css">
<link rel="stylesheet" href="/static/style.css">
<style>
  body{background:var(--gray-100)}
  .admin-wrap{display:grid;grid-template-columns:250px 1fr;min-height:100vh}
  .admin-side{background:var(--brand-deep);color:#fff;padding:24px 0}
  .admin-side .brand{padding:0 24px 24px;font-weight:800;font-size:20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:16px}
  .admin-side a{display:flex;align-items:center;gap:12px;padding:13px 24px;color:rgba(255,255,255,.7);font-weight:600;transition:.25s}
  .admin-side a:hover,.admin-side a.active{background:rgba(255,255,255,.07);color:#fff;border-right:3px solid var(--brand-accent)}
  .admin-main{padding:36px 40px}
  .admin-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}
  .admin-head h1{font-size:1.8rem}
  .admin-card{background:#fff;border-radius:16px;padding:28px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);margin-bottom:24px}
  .stat-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:30px}
  .stat-box{background:#fff;border-radius:16px;padding:24px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100)}
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
export function AdminDashboard(stats: { reservations: number; newReservations: number; cases: number; columns: number; members: number; notices: number }) {
  return adminShell('dashboard', '대시보드', html`
    <div class="admin-head"><h1>대시보드</h1><span style="color:var(--gray-600)">${new Date().toLocaleDateString('ko-KR')}</span></div>
    <div class="stat-cards">
      <div class="stat-box"><div class="n">${stats.newReservations}</div><div class="l">신규 예약</div></div>
      <div class="stat-box"><div class="n">${stats.reservations}</div><div class="l">전체 예약</div></div>
      <div class="stat-box"><div class="n">${stats.members}</div><div class="l">회원 수</div></div>
      <div class="stat-box"><div class="n">${stats.cases}</div><div class="l">진료사례</div></div>
    </div>
    <div class="admin-card">
      <h2 style="font-size:1.2rem;margin-bottom:16px">빠른 작업</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="/admin/cases/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 비포애프터 등록</a>
        <a href="/admin/columns/new" class="btn btn-outline btn-sm"><i class="fa-solid fa-pen"></i> 칼럼 작성</a>
        <a href="/admin/notices/new" class="btn btn-outline btn-sm"><i class="fa-solid fa-bullhorn"></i> 공지 작성</a>
        <a href="/admin/reservations" class="btn btn-outline btn-sm"><i class="fa-solid fa-calendar"></i> 예약 확인</a>
      </div>
    </div>
    <div class="admin-card">
      <h2 style="font-size:1.2rem;margin-bottom:8px">콘텐츠 현황</h2>
      <p style="color:var(--gray-600);font-size:14px">칼럼 ${stats.columns}개 · 공지 ${stats.notices}개 · 진료사례 ${stats.cases}개가 등록되어 있습니다.</p>
    </div>
  `)
}

// ── 예약 관리 ──
export function AdminReservations(items: any[]) {
  return adminShell('reservations', '예약 관리', html`
    <div class="admin-head"><h1>예약 관리</h1></div>
    <div class="admin-card">
      ${items.length === 0 ? html`<p style="color:var(--gray-600);text-align:center;padding:40px">접수된 예약이 없습니다.</p>` : html`
      <table><thead><tr><th>접수일</th><th>이름</th><th>연락처</th><th>진료</th><th>희망일시</th><th>상태</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(r => `<tr>
        <td>${new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
        <td><strong>${r.name}</strong></td>
        <td>${r.phone}</td>
        <td>${r.treatment}</td>
        <td>${r.date || '-'} ${r.timeslot || ''}</td>
        <td><span class="badge ${r.status === '신규' ? 'new' : 'done'}">${r.status}</span></td>
        <td>
          <form method="POST" action="/admin/reservations/${r.id}/status" style="display:inline"><button class="btn-sm btn-outline" name="status" value="${r.status === '신규' ? '완료' : '신규'}">${r.status === '신규' ? '완료처리' : '되돌리기'}</button></form>
        </td></tr>`).join(''))}
      </tbody></table>`}
    </div>
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
        <td>${new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
        <td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.phone || '-'}</td>
        <td><span class="badge done">${u.provider === 'google' ? 'Google' : '이메일'}</span></td>
        <td>${u.marketing ? '동의' : '-'}</td></tr>`).join(''))}
      </tbody></table>`}
    </div>
  `)
}

// ── 비포애프터 관리 ──
export function AdminCases(items: any[]) {
  return adminShell('cases', '비포애프터', html`
    <div class="admin-head"><h1>비포애프터</h1><a href="/admin/cases/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 사례</a></div>
    <div class="admin-card">
      ${items.length === 0 ? html`<p style="color:var(--gray-600);text-align:center;padding:40px">등록된 사례가 없습니다.</p>` : html`
      <table><thead><tr><th>등록일</th><th>제목</th><th>진료</th><th>나이/성별</th><th>담당</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(c => `<tr>
        <td>${new Date(c.createdAt).toLocaleDateString('ko-KR')}</td>
        <td><strong>${c.title}</strong></td><td>${TREATMENTS.find(t=>t.slug===c.category)?.name||c.category}</td>
        <td>${c.ageGroup || '-'} ${c.gender || ''}</td><td>${DOCTORS.find(d=>d.slug===c.doctor)?.name||'-'}</td>
        <td><form method="POST" action="/admin/cases/${c.id}/delete" style="display:inline" onsubmit="return confirm('삭제하시겠습니까?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form></td></tr>`).join(''))}
      </tbody></table>`}
    </div>
  `)
}

// ── 비포애프터 등록 폼 ──
export function AdminCaseForm() {
  return adminShell('cases', '비포애프터 등록', html`
    <div class="admin-head"><h1>비포애프터 등록</h1></div>
    <div class="admin-card">
      <form method="POST" action="/admin/cases/new" enctype="multipart/form-data">
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required placeholder="예: 다수 치아 상실 임플란트 케이스"></div>
          <div class="field"><label>진료 카테고리 <span class="req">*</span></label><select name="category" required><option value="">선택</option>${raw(TREATMENTS.map(t => `<option value="${t.slug}">${t.name}</option>`).join(''))}</select></div>
        </div>
        <div class="field"><label>케이스 설명</label><textarea name="description" placeholder="치료 내용을 간단히 적어주세요."></textarea></div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>환자 나이대</label><select name="ageGroup"><option value="">선택</option>${raw(['10대','20대','30대','40대','50대','60대','70대 이상'].map(a => `<option>${a}</option>`).join(''))}</select></div>
          <div class="field"><label>성별</label><select name="gender"><option value="">선택</option><option>남성</option><option>여성</option></select></div>
        </div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>담당 원장</label><select name="doctor"><option value="">선택</option>${raw(DOCTORS.map(d => `<option value="${d.slug}">${d.name} ${d.role}</option>`).join(''))}</select></div>
          <div class="field"><label>치료 기간</label><input name="period" placeholder="예: 약 6개월"></div>
        </div>
        <div class="field autocomplete-wrap"><label>지역 카테고리</label><input id="regionInput" name="region" autocomplete="off" placeholder="예: 안산 입력 → 안산시"><div class="autocomplete-list" id="regionList" style="display:none"></div></div>
        <hr style="border:none;border-top:1px solid var(--gray-100);margin:24px 0">
        <p style="font-weight:700;margin-bottom:14px">사진 업로드 (업로드한 사진만 표시됩니다)</p>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>파노라마 — 치료 전</label><input type="file" name="panoBefore" accept="image/*"></div>
          <div class="field"><label>파노라마 — 치료 후</label><input type="file" name="panoAfter" accept="image/*"></div>
          <div class="field"><label>구내포토 — 치료 전</label><input type="file" name="intraBefore" accept="image/*"></div>
          <div class="field"><label>구내포토 — 치료 후</label><input type="file" name="intraAfter" accept="image/*"></div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:14px"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <a href="/admin/cases" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
    <script>document.addEventListener('DOMContentLoaded',function(){if(window.initRegionAutocomplete)window.initRegionAutocomplete('regionInput','regionList');});</script>
  `)
}

// ── 칼럼 관리 ──
export function AdminColumns(items: any[]) {
  return adminShell('columns', '원장 칼럼', html`
    <div class="admin-head"><h1>원장 칼럼</h1><a href="/admin/columns/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 칼럼</a></div>
    <div class="admin-card">
      <table><thead><tr><th>작성일</th><th>제목</th><th>진료</th><th>작성자</th><th>상태</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(c => `<tr>
        <td>${new Date(c.createdAt).toLocaleDateString('ko-KR')}</td>
        <td><strong>${c.title}</strong></td><td>${TREATMENTS.find(t=>t.slug===c.category)?.name||'-'}</td>
        <td>${DOCTORS.find(d=>d.slug===c.author)?.name||'-'}</td>
        <td><span class="badge ${c.published?'new':'done'}">${c.published?'게시':'임시'}</span></td>
        <td><a href="/admin/columns/${c.id}/edit" class="btn-sm btn-outline">수정</a> <form method="POST" action="/admin/columns/${c.id}/delete" style="display:inline" onsubmit="return confirm('삭제?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form></td></tr>`).join(''))}
      </tbody></table>
    </div>
  `)
}

// ── 칼럼 작성/수정 폼 ──
export function AdminColumnForm(col?: any) {
  const c = col || {}
  return adminShell('columns', col ? '칼럼 수정' : '칼럼 작성', html`
    <div class="admin-head"><h1>${col ? '칼럼 수정' : '칼럼 작성'}</h1></div>
    <div class="admin-card">
      <form method="POST" action="${col ? `/admin/columns/${c.id}/edit` : '/admin/columns/new'}">
        <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required value="${c.title || ''}"></div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>슬러그(URL)</label><input name="slug" value="${c.slug || ''}" placeholder="비우면 자동 생성"></div>
          <div class="field"><label>진료 카테고리 <span class="req">*</span></label><select name="category" required>${raw(TREATMENTS.map(t => `<option value="${t.slug}" ${c.category === t.slug ? 'selected' : ''}>${t.name}</option>`).join(''))}</select></div>
        </div>
        <div class="grid-2" style="gap:18px;align-items:start">
          <div class="field"><label>작성자(원장) <span class="req">*</span></label><select name="author" required>${raw(DOCTORS.map(d => `<option value="${d.slug}" ${c.author === d.slug ? 'selected' : ''}>${d.name} ${d.role}</option>`).join(''))}</select></div>
          <div class="field"><label>썸네일 이미지 URL</label><input name="thumbnail" value="${c.thumbnail || ''}" placeholder="(선택)"></div>
        </div>
        <div class="field"><label>요약</label><input name="excerpt" value="${c.excerpt || ''}" placeholder="목록에 표시될 한 줄 요약"></div>
        <div class="field"><label>본문 (HTML — H2/H3, &lt;p&gt;, &lt;div class="answer-box"&gt; 등 사용 가능) <span class="req">*</span></label><textarea name="body" required style="min-height:300px;font-family:monospace;font-size:13px">${c.body || '<p>여기에 본문을 작성하세요.</p>\n<h2>소제목</h2>\n<p>내용...</p>\n<div class="answer-box">핵심 답변 박스</div>'}</textarea></div>
        <div class="field"><label class="checkbox-row"><input type="checkbox" name="published" ${c.published !== false ? 'checked' : ''}> <span>즉시 게시</span></label></div>
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <a href="/admin/columns" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
  `)
}

// ── 공지 관리 ──
export function AdminNotices(items: any[]) {
  return adminShell('notices', '공지사항', html`
    <div class="admin-head"><h1>공지사항</h1><a href="/admin/notices/new" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> 새 공지</a></div>
    <div class="admin-card">
      <table><thead><tr><th>작성일</th><th>제목</th><th>고정</th><th>관리</th></tr></thead><tbody>
      ${raw(items.map(n => `<tr>
        <td>${new Date(n.createdAt).toLocaleDateString('ko-KR')}</td><td><strong>${n.title}</strong></td>
        <td>${n.pinned ? '<span class="badge new">고정</span>' : '-'}</td>
        <td><form method="POST" action="/admin/notices/${n.id}/delete" style="display:inline" onsubmit="return confirm('삭제?')"><button class="btn-sm" style="color:#c0392b">삭제</button></form></td></tr>`).join(''))}
      </tbody></table>
    </div>
  `)
}

export function AdminNoticeForm() {
  return adminShell('notices', '공지 작성', html`
    <div class="admin-head"><h1>공지 작성</h1></div>
    <div class="admin-card">
      <form method="POST" action="/admin/notices/new">
        <div class="field"><label>제목 <span class="req">*</span></label><input name="title" required></div>
        <div class="field"><label>내용 <span class="req">*</span></label><textarea name="body" required style="min-height:200px"></textarea></div>
        <div class="field"><label>이미지 URL</label><input name="image" placeholder="(선택)"></div>
        <div class="field"><label class="checkbox-row"><input type="checkbox" name="pinned"> <span>상단 고정 (대표 공지)</span></label></div>
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <a href="/admin/notices" class="btn btn-outline" style="margin-left:8px">취소</a>
      </form>
    </div>
  `)
}
