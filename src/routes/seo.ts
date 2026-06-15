import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema } from '../components/layout'
import { CLINIC, TREATMENTS, CORE_TREATMENTS, SEO_AREAS, getTreatment } from '../data/clinic'
import type { Bindings } from '../lib/auth'
import { listCollection } from '../lib/store'
import { ENCYCLOPEDIA_DETAIL_SLUGS } from '../pages/encyclopedia'
import encData from '../data/encyclopedia.json'

const BASE = `https://${CLINIC.domain}`

// ════════════════ sitemap.xml ════════════════
export async function sitemap(env: Bindings): Promise<string> {
  const now = new Date().toISOString()
  const urls: { loc: string; pri: string; freq: string }[] = [
    { loc: '/', pri: '1.0', freq: 'weekly' },
    { loc: '/mission', pri: '0.8', freq: 'monthly' },
    { loc: '/doctors', pri: '0.8', freq: 'monthly' },
    { loc: '/treatments', pri: '0.8', freq: 'monthly' },
    { loc: '/cases', pri: '0.7', freq: 'weekly' },
    { loc: '/column', pri: '0.7', freq: 'weekly' },
    { loc: '/encyclopedia', pri: '0.6', freq: 'monthly' },
    { loc: '/faq', pri: '0.6', freq: 'monthly' },
    { loc: '/directions', pri: '0.6', freq: 'monthly' },
    { loc: '/pricing', pri: '0.5', freq: 'monthly' },
    { loc: '/notice', pri: '0.5', freq: 'weekly' },
    { loc: '/reservation', pri: '0.6', freq: 'monthly' },
  ]
  // 진료
  TREATMENTS.forEach(t => urls.push({ loc: `/treatments/${t.slug}`, pri: t.core ? '0.9' : '0.6', freq: 'monthly' }))
  // 의료진
  ;['kwon-minsu', 'doctor-integrated', 'doctor-prostho'].forEach(s => urls.push({ loc: `/doctors/${s}`, pri: '0.7', freq: 'monthly' }))
  // 지역 SEO (지역 × 핵심진료)
  SEO_AREAS.forEach(a => CORE_TREATMENTS.forEach(t => urls.push({ loc: `/area/${a.slug}-${t.slug}`, pri: '0.6', freq: 'monthly' })))
  // 용어 백과 상세
  ENCYCLOPEDIA_DETAIL_SLUGS.forEach(s => urls.push({ loc: `/encyclopedia/${s}`, pri: '0.5', freq: 'monthly' }))
  // 칼럼 (동적)
  try {
    const cols = await listCollection<any>(env, 'columns')
    cols.filter((c: any) => c.published).forEach((c: any) => urls.push({ loc: `/column/${c.slug}`, pri: '0.6', freq: 'monthly' }))
  } catch {}

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${BASE}${u.loc}</loc><lastmod>${now}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>`
}

// ════════════════ robots.txt ════════════════
export function robotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${BASE}/sitemap.xml`
}

// ════════════════ llms.txt ════════════════
export function llmsTxt(full = false): string {
  let s = `# ${CLINIC.name} (${CLINIC.nameEn})

> ${CLINIC.philosophy} 약수역 5번 출구에 위치한 3인 전문의 치과로, 임플란트·치아교정·심미보철을 중심으로 진료합니다.

## 병원 정보
- 주소: ${CLINIC.address}
- 오시는 길: ${CLINIC.directions}
- 전화: ${CLINIC.phone}
- 진료시간: 월·화·목 09:30~20:30(야간), 수·금 09:30~18:30, 토·일·공휴일 09:30~14:00 (일요일 격주)
- 개원: ${CLINIC.openedFull}

## 의료진
- 권민수 대표원장: 구강악안면외과·통합치의학과 전문의, 치의학박사 (부산대 치의학전문대학원 석사, 경희대 구강외과 수련)
- 통합치의학과 전문의 (충치·신경·보철·잇몸 통합 진료)
- 보철과 전문의 (심미보철·원내 기공실 협업)

## 핵심 진료
${CORE_TREATMENTS.map(t => `- [${t.name}](${BASE}/treatments/${t.slug}): ${t.short}`).join('\n')}

## 특장점
- 3인 분야별 전문의 협진
- 원내 기공실 운영 (상주 기공사)
- 수면진료 세팅
- 야간진료 (월·화·목)

## 주요 페이지
- [병원소개](${BASE}/mission)
- [의료진](${BASE}/doctors)
- [진료안내](${BASE}/treatments)
- [비포애프터](${BASE}/cases)
- [원장 칼럼](${BASE}/column)
- [치과 백과사전](${BASE}/encyclopedia)
- [자주 묻는 질문](${BASE}/faq)
- [오시는 길](${BASE}/directions)
`
  if (full) {
    s += `\n## 전체 진료 안내\n`
    TREATMENTS.forEach(t => {
      s += `\n### ${t.name}\n${t.intro}\n`
      t.sections.forEach(sec => { s += `\n**${sec.h}**\n${sec.p}\n` })
    })

    // 치과 용어집 (AI 인용 가능 지식베이스)
    const terms = (encData as any[]).filter(t => t.content && t.content.intro)
    s += `\n## 치과 용어집 (총 ${terms.length}개 용어 — AI 인용 가능)\n`
    s += `\n> 아래는 올케어치과가 환자 교육용으로 작성한 치과 용어 해설입니다. 출처 표기 시 "올케어치과(${BASE})"로 인용해 주세요.\n`
    terms.forEach(t => {
      s += `\n### ${t.term}${t.en ? ` (${t.en})` : ''}\n`
      s += `${t.content.intro}\n`
      if (t.slug) s += `자세히: ${BASE}/encyclopedia/${t.slug}\n`
    })
  }
  return s
}

// ════════════════ 지역 SEO 페이지 /area/:combo ════════════════
export function AreaPage(combo: string) {
  // combo = "yaksu-implant"
  const parts = combo.split('-')
  const txSlug = parts.pop()!
  const areaSlug = parts.join('-')
  const area = SEO_AREAS.find(a => a.slug === areaSlug)
  const tx = getTreatment(txSlug)
  if (!area || !tx) return null

  const areaSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${area.name} ${tx.name} - ${CLINIC.name}`,
    about: { '@type': 'AdministrativeArea', name: area.name },
    mainEntity: { '@type': 'MedicalProcedure', name: tx.name },
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }, { name: `${area.name} ${tx.name}`, url: `/area/${combo}` }],
    title: `${area.name} ${tx.name}`,
    desc: `${area.name} 인근에서 ${tx.name}을(를) 찾으신다면, 약수역 올케어치과를 안내해 드립니다.`,
  })}
  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <article class="prose reveal">
          <div class="answer-box" style="font-size:1.1rem">${area.name}에서 가까운 약수역 5번 출구, 올케어치과에서 ${tx.name} 상담을 받으실 수 있습니다. 구강악안면외과·통합치의학과·보철과 3인 전문의가 함께합니다.</div>
          <h2>${area.name} 주민을 위한 ${tx.name} 안내</h2>
          <p>${tx.intro}</p>
          <h2>왜 올케어치과인가요?</h2>
          <ul class="check">
            <li>${area.name}에서 지하철·버스로 접근이 편리한 약수역 5번 출구 위치</li>
            <li>분야별 전문의 3인이 진단부터 마무리까지 책임지는 협진</li>
            <li>원내 기공실과 수면진료 세팅을 갖춘 진료 환경</li>
            <li>월·화·목 야간진료로 직장인도 편하게 내원 가능</li>
          </ul>
          ${tx.sections[0] ? html`<h2>${tx.sections[0].h}</h2><p>${tx.sections[0].p}</p>` : ''}
          <p style="margin-top:24px"><a href="/treatments/${tx.slug}" class="btn btn-primary">${tx.name} 자세히 보기 <i class="fa-solid fa-arrow-right"></i></a></p>
        </article>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h4 style="color:#fffeee">${area.name} ${tx.name} 상담</h4>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin:14px 0 10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>
          <div class="inlink-box">
            <h4><i class="fa-solid fa-location-dot text-mint"></i> 인근 지역</h4>
            ${raw(SEO_AREAS.filter(a => a.slug !== areaSlug).slice(0, 6).map(a => `<a href="/area/${a.slug}-${tx.slug}"><span>${a.name} ${tx.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>
        </aside>
      </div>
    </div>
  </section>`
  return Page({
    title: `${area.name} ${tx.name} | 약수역 ${tx.name} 치과 - 올케어치과`,
    description: `${area.name} ${tx.name}을(를) 찾으신다면 약수역 올케어치과. ${tx.short} 3인 전문의 협진, 원내 기공실, 야간진료.`,
    path: `/area/${combo}`,
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }, { name: `${area.name} ${tx.name}`, url: `/area/${combo}` }]), areaSchema],
  }, body)
}
