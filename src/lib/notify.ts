// ============================================================
// 예약 알림 (2026-11-04 원장 요청)
//  - 받는 사람: 관리자 '알림 설정'에서 지정(여러 명). 없으면 시크릿 NOTIFICATION_EMAIL
//  - 텔레그램: 봇 토큰·채팅 ID를 넣으면 메일과 함께 휴대폰 알림
//  - 미처리 재알림: '신규' 상태로 N시간 지난 예약을 한 번 더 알림 (외부 크론이 /api/cron/reservation-remind 호출)
// ============================================================
import type { Bindings } from './auth'
import { r2Get, r2Put, listCollection, saveCollection } from './store'

export type NotifySettings = {
  emails: string[]
  telegramToken?: string
  telegramChatId?: string
  remindOn: boolean
  remindHours: number
}
const KEY = 'data/settings-notify.json'

export async function getNotifySettings(env: Bindings): Promise<NotifySettings> {
  const saved = await r2Get<NotifySettings>(env, KEY).catch(() => null)
  const fallback = String(env.NOTIFICATION_EMAIL || '').split(/[,\s]+/).filter(Boolean)
  return {
    emails: saved?.emails?.length ? saved.emails : fallback,
    telegramToken: saved?.telegramToken || undefined,
    telegramChatId: saved?.telegramChatId || undefined,
    remindOn: saved ? saved.remindOn !== false : true,
    remindHours: saved?.remindHours && saved.remindHours > 0 ? saved.remindHours : 2,
  }
}
export async function saveNotifySettings(env: Bindings, s: NotifySettings) { await r2Put(env, KEY, s) }

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const base = (env: Bindings) => (env.SITE_URL || 'https://allcaredc.kr').replace(/\/$/, '')

async function sendMail(env: Bindings, to: string[], subject: string, html: string, replyTo?: string) {
  if (!env.RESEND_API_KEY || !to.length) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: '365올케어치과 <noreply@allcaredc.kr>', to, reply_to: replyTo || undefined, subject, html }),
  })
}
export async function sendTelegram(s: NotifySettings, text: string): Promise<boolean> {
  if (!s.telegramToken || !s.telegramChatId) return false
  const r = await fetch(`https://api.telegram.org/bot${s.telegramToken}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: s.telegramChatId, text, disable_web_page_preview: true }),
  }).catch(() => null)
  return !!r && r.ok
}

function row(label: string, val: string) {
  return `<tr><td style="padding:11px 16px;background:#faf9f2;width:110px;color:#b08d57;font-weight:600;vertical-align:top">${label}</td><td style="padding:11px 16px">${val}</td></tr>`
}

// 새 예약 접수 알림
export async function notifyNewReservation(env: Bindings, r: any) {
  try {
    const s = await getNotifySettings(env)
    const adminUrl = `${base(env)}/admin/reservations`
    const when = new Date(r.createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' })
    const phoneDigits = String(r.phone || '').replace(/[^0-9]/g, '')
    const html = `
      <div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;color:#062741">
        <div style="background:#062741;color:#fffeee;padding:18px 22px;border-radius:8px 8px 0 0">
          <div style="font-size:13px;letter-spacing:.08em;color:#b08d57">ALLCARE DENTAL · 새 예약문의</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">${esc(r.name)} 님의 예약 문의</div>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-top:none">
          ${row('접수일시', esc(when))}
          ${row('이름', `<strong>${esc(r.name)}</strong>`)}
          ${row('연락처', `<a href="tel:${phoneDigits}" style="color:#062741;font-weight:700">${esc(r.phone)}</a>`)}
          ${row('이메일', esc(r.email) || '-')}
          ${row('진료', esc(r.treatment))}
          ${row('희망일시', `${esc(r.date) || '-'} ${esc(r.timeslot) || ''}`)}
          ${row('유입 경로', esc(r.source) || '-')}
          ${row('문의내용', `<span style="white-space:pre-wrap">${esc(r.message) || '-'}</span>`)}
        </table>
        <div style="text-align:center;padding:20px 0">
          <a href="${adminUrl}" style="display:inline-block;background:#b08d57;color:#fff;text-decoration:none;padding:13px 30px;border-radius:6px;font-weight:700;font-size:15px">→ 관리자 화면에서 처리하기</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#999;margin:0 0 8px">${s.remindOn ? `${s.remindHours}시간 안에 상태를 바꾸지 않으면 한 번 더 알려 드립니다 · ` : ''}<a href="${adminUrl}" style="color:#b08d57">${adminUrl}</a></p>
      </div>`
    await Promise.all([
      sendMail(env, s.emails, `[예약문의] ${r.name} · ${r.treatment}`, html, r.email),
      sendTelegram(s, `🦷 새 예약문의\n${r.name} · ${r.treatment}\n연락처 ${r.phone}\n희망 ${r.date || '-'} ${r.timeslot || ''}\n${adminUrl}`),
    ])
  } catch {}
}

// 미처리 예약 재알림 — '신규' 상태로 remindHours 이상 지난 건 중 아직 재알림 안 한 건
export async function remindPendingReservations(env: Bindings, now = Date.now()): Promise<{ sent: number; pending: number; skipped?: string }> {
  const s = await getNotifySettings(env)
  if (!s.remindOn) return { sent: 0, pending: 0, skipped: 'off' }
  const hourKst = new Date(now + 9 * 3600000).getUTCHours()
  if (hourKst < 9 || hourKst >= 21) return { sent: 0, pending: 0, skipped: 'night' } // 밤에는 보내지 않고 아침에 몰아서
  const items = await listCollection<any>(env, 'reservations')
  const due = items.filter(r => (r.status || '신규') === '신규' && !r.remindedAt && now - (r.createdAt || now) >= s.remindHours * 3600000 && now - (r.createdAt || 0) < 14 * 86400000)
  if (!due.length) return { sent: 0, pending: 0 }
  const adminUrl = `${base(env)}/admin/reservations`
  const list = due.map(r => {
    const h = Math.floor((now - r.createdAt) / 3600000)
    return `<li style="margin-bottom:6px"><strong>${esc(r.name)}</strong> · ${esc(r.treatment)} · <a href="tel:${String(r.phone || '').replace(/[^0-9]/g, '')}">${esc(r.phone)}</a> <span style="color:#c0392b">(${h}시간 경과)</span></li>`
  }).join('')
  const html = `<div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;color:#062741">
    <div style="background:#c0392b;color:#fff;padding:16px 22px;border-radius:8px 8px 0 0;font-size:18px;font-weight:700">아직 연락하지 않은 예약 ${due.length}건</div>
    <div style="border:1px solid #eee;border-top:none;padding:18px 22px"><ul style="padding-left:18px;margin:0">${list}</ul>
    <p style="font-size:13px;color:#777;margin-top:14px">연락한 뒤 예약 관리에서 상태를 바꾸면 더 이상 알리지 않습니다.</p>
    <div style="text-align:center;padding-top:10px"><a href="${adminUrl}" style="display:inline-block;background:#b08d57;color:#fff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:700">예약 관리 열기</a></div></div></div>`
  await Promise.all([
    sendMail(env, s.emails, `[미처리 예약 ${due.length}건] 아직 연락 전입니다`, html),
    sendTelegram(s, `⏰ 아직 연락하지 않은 예약 ${due.length}건\n` + due.map(r => `· ${r.name} ${r.phone} (${Math.floor((now - r.createdAt) / 3600000)}시간)`).join('\n') + `\n${adminUrl}`),
  ])
  const ids = new Set(due.map(r => r.id))
  // 다시 읽어 덮어쓰기 경합 최소화
  const fresh = await listCollection<any>(env, 'reservations')
  await saveCollection(env, 'reservations', fresh.map(r => (ids.has(r.id) ? { ...r, remindedAt: now } : r)))
  return { sent: due.length, pending: due.length }
}
