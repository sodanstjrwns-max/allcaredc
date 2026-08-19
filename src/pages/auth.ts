import { html } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { CLINIC } from '../data/clinic'

// 인증 폼 공통 셸
function authShell(title: string, inner: any) {
  return html`
  <section class="section" style="min-height:80vh;display:flex;align-items:center;background:var(--beige-soft)">
    <div class="container" style="max-width:480px">
      <div class="form-card reveal">
        <div style="text-align:center;margin-bottom:30px">
          <a href="/" class="logo" style="justify-content:center;color:var(--brand)"><span class="mark"><i class="fa-solid fa-tooth"></i></span> 365올케어치과</a>
          <h1 style="font-size:1.6rem;margin-top:18px">${title}</h1>
        </div>
        ${inner}
      </div>
    </div>
  </section>`
}

export function LoginPage(next = '/', error?: string) {
  const body = authShell('로그인', html`
    ${error ? html`<div style="background:#fdeaea;color:#c0392b;padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:14px">${error}</div>` : ''}
    <form method="POST" action="/auth/login">
      <input type="hidden" name="next" value="${next}">
      <div class="field"><label>이메일</label><input type="email" name="email" required placeholder="name@example.com"></div>
      <div class="field"><label>비밀번호</label><input type="password" name="password" required placeholder="비밀번호"></div>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">로그인</button>
    </form>
    <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--gray-600)">아직 회원이 아니신가요? <a href="/auth/register?next=${encodeURIComponent(next)}" style="color:var(--brand-accent);font-weight:700">회원가입</a></p>
  `)
  return Page({ title: '로그인 | 365올케어치과', description: '365올케어치과 회원 로그인', path: '/auth/login' }, body)
}

export function RegisterPage(next = '/', error?: string) {
  const body = authShell('회원가입', html`
    ${error ? html`<div style="background:#fdeaea;color:#c0392b;padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:14px">${error}</div>` : ''}
    <form method="POST" action="/auth/register">
      <input type="hidden" name="next" value="${next}">
      <div class="field"><label>이름 <span class="req">*</span></label><input type="text" name="name" required></div>
      <div class="field"><label>이메일 <span class="req">*</span></label><input type="email" name="email" required></div>
      <div class="field"><label>전화번호 <span class="req">*</span></label><input type="tel" name="phone" required placeholder="010-0000-0000"></div>
      <div class="field"><label>비밀번호 <span class="req">*</span></label><input type="password" name="password" required minlength="6" placeholder="6자 이상"></div>
      <div class="field">
        <label class="checkbox-row"><input type="checkbox" name="agree_terms" required> <span>[필수] <a href="/terms" target="_blank" style="color:var(--brand-accent);text-decoration:underline">이용약관</a>에 동의합니다.</span></label>
      </div>
      <div class="field">
        <label class="checkbox-row"><input type="checkbox" name="agree_privacy" required> <span>[필수] <a href="/privacy" target="_blank" style="color:var(--brand-accent);text-decoration:underline">개인정보 수집·이용</a>에 동의합니다. 수집 항목: 이름, 이메일, 전화번호 / 목적: 회원관리·진료사례 열람·예약 안내 / 보유기간: 회원 탈퇴 시까지</span></label>
      </div>
      <div class="field">
        <label class="checkbox-row"><input type="checkbox" name="agree_marketing"> <span>[선택] 마케팅 정보 수신(진료 안내, 이벤트 등)에 동의합니다.</span></label>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">회원가입</button>
    </form>
    <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--gray-600)">이미 회원이신가요? <a href="/auth/login?next=${encodeURIComponent(next)}" style="color:var(--brand-accent);font-weight:700">로그인</a></p>
  `)
  return Page({ title: '회원가입 | 365올케어치과', description: '365올케어치과 회원가입', path: '/auth/register' }, body)
}

export function MyPage(user: { email: string; name: string }) {
  const body = html`
  ${PageHero({ crumb: [{ name: '홈', url: '/' }, { name: '마이페이지', url: '/auth/mypage' }], title: '마이페이지', desc: `${user.name}님, 반갑습니다.` })}
  <section class="section">
    <div class="container" style="max-width:720px">
      <div class="form-card reveal">
        <h2 style="font-size:1.3rem;margin-bottom:20px">내 정보</h2>
        <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--gray-100)"><span style="color:var(--gray-600)">이름</span><strong>${user.name}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--gray-100)"><span style="color:var(--gray-600)">이메일</span><strong>${user.email}</strong></div>
        <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap">
          <a href="/cases" class="btn btn-primary" style="flex:1;justify-content:center;min-width:160px"><i class="fa-solid fa-images"></i> 진료사례 보기 (After 공개)</a>
          <a href="/reservation" class="btn btn-outline" style="flex:1;justify-content:center;min-width:160px"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
        </div>
        <form method="POST" action="/auth/logout" style="margin-top:20px">
          <button type="submit" class="btn" style="width:100%;justify-content:center;color:var(--gray-600)"><i class="fa-solid fa-right-from-bracket"></i> 로그아웃</button>
        </form>
      </div>
    </div>
  </section>`
  return Page({ title: '마이페이지 | 365올케어치과', description: '365올케어치과 마이페이지', path: '/auth/mypage' }, body)
}
