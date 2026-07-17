import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema, organizationSchema } from '../components/layout'
import { CLINIC, TREATMENTS, CORE_TREATMENTS, SEO_AREAS, DOCTORS, getTreatment } from '../data/clinic'
import { speakableSchema } from '../lib/seo-engine'
import type { Bindings } from '../lib/auth'
import { listCollection } from '../lib/store'
import { ENCYCLOPEDIA_DETAIL_SLUGS } from '../pages/encyclopedia'
import encData from '../data/encyclopedia.json'

const BASE = `https://${CLINIC.domain}`

// ════════════════ sitemap.xml ════════════════
type SitemapUrl = { loc: string; pri: string; freq: string; mod?: string; img?: { url: string; title?: string }[] }

function xmlEsc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function isoDate(d?: string | number | Date) {
  const dt = d ? new Date(d) : new Date()
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
}

export async function sitemap(env: Bindings): Promise<string> {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  const urls: SitemapUrl[] = [
    { loc: '/', pri: '1.0', freq: 'weekly', mod: now },
    { loc: '/mission', pri: '0.8', freq: 'monthly' },
    { loc: '/doctors', pri: '0.8', freq: 'monthly' },
    { loc: '/treatments', pri: '0.8', freq: 'monthly' },
    { loc: '/cases', pri: '0.7', freq: 'weekly' },
    { loc: '/column', pri: '0.7', freq: 'weekly' },
    { loc: '/encyclopedia', pri: '0.6', freq: 'monthly' },
    { loc: '/faq', pri: '0.7', freq: 'monthly' },
    { loc: '/directions', pri: '0.7', freq: 'monthly' },
    { loc: '/pricing', pri: '0.6', freq: 'monthly' },
    { loc: '/notice', pri: '0.5', freq: 'weekly' },
    { loc: '/events', pri: '0.6', freq: 'weekly' },
    { loc: '/reservation', pri: '0.7', freq: 'monthly' },
  ]
  // 진료 (핵심진료는 대표 이미지 포함 → image sitemap)
  TREATMENTS.forEach(t => urls.push({
    loc: `/treatments/${t.slug}`,
    pri: t.core ? '0.9' : '0.6',
    freq: 'monthly',
    // OG 라우트(/og/:type/:file)는 type=treatment 로 해석한다. type을 slug로 쓰면 404가 나므로 고정.
    img: [{ url: `${BASE}/og/treatment/${t.slug}.svg`, title: `${t.name} - ${CLINIC.name}` }],
  }))
  // 의료진 (사진 포함)
  ;['kwon-minsu', 'kwon-jongjin', 'bae-suhyeon'].forEach(s => urls.push({
    loc: `/doctors/${s}`, pri: '0.7', freq: 'monthly',
    img: [{ url: `${BASE}/static/img/${s}.webp` }],
  }))
  // 지역 SEO (지역 × 핵심진료) — tier 우선순위 반영
  SEO_AREAS.forEach(a => CORE_TREATMENTS.forEach(t => urls.push({
    loc: `/area/${a.slug}-${t.slug}`,
    pri: a.tier === 1 ? '0.7' : a.tier === 2 ? '0.6' : '0.5',
    freq: 'monthly',
  })))
  // 용어 백과 상세
  ENCYCLOPEDIA_DETAIL_SLUGS.forEach(s => urls.push({ loc: `/encyclopedia/${s}`, pri: '0.5', freq: 'monthly' }))
  // 칼럼 (동적 — 실제 수정일 lastmod + 썸네일 이미지)
  try {
    const cols = await listCollection<any>(env, 'columns')
    cols.filter((c: any) => c.published).forEach((c: any) => urls.push({
      loc: `/column/${c.slug}`,
      pri: '0.7',
      freq: 'monthly',
      mod: isoDate(c.updatedAt || c.createdAt),
      img: c.thumbnail ? [{ url: c.thumbnail.startsWith('http') ? c.thumbnail : `${BASE}${c.thumbnail}`, title: c.metaTitle || c.title }] : undefined,
    }))
  } catch {}
  // 공지 (동적)
  try {
    const notices = await listCollection<any>(env, 'notices')
    notices.forEach((n: any) => urls.push({ loc: `/notice/${n.id}`, pri: '0.4', freq: 'monthly', mod: isoDate(n.updatedAt || n.createdAt) }))
  } catch {}
  // 이벤트 (동적)
  try {
    const events = await listCollection<any>(env, 'events')
    events.forEach((e: any) => urls.push({ loc: `/events/${e.id}`, pri: '0.5', freq: 'weekly', mod: isoDate(e.updatedAt || e.createdAt) }))
  } catch {}

  const body = urls.map(u => {
    const imgXml = (u.img || []).map(im =>
      `\n    <image:image><image:loc>${xmlEsc(im.url)}</image:loc>${im.title ? `<image:title>${xmlEsc(im.title)}</image:title>` : ''}</image:image>`
    ).join('')
    return `  <url><loc>${BASE}${u.loc}</loc><lastmod>${(u.mod || now).slice(0, 10) === today ? (u.mod || now) : u.mod || now}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority>${imgXml}${imgXml ? '\n  ' : ''}</url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`
}

// ════════════════ robots.txt ════════════════
export function robotsTxt(): string {
  // 검색 + AI/LLM 크롤러를 명시적으로 허용해 AEO(답변엔진 최적화) 노출 극대화
  const aiBots = [
    'GPTBot',            // OpenAI (ChatGPT 학습/검색)
    'OAI-SearchBot',     // OpenAI 검색
    'ChatGPT-User',      // ChatGPT 브라우징
    'ClaudeBot',         // Anthropic Claude
    'Claude-Web',        // Anthropic Claude 웹
    'anthropic-ai',      // Anthropic
    'PerplexityBot',     // Perplexity
    'Perplexity-User',   // Perplexity 브라우징
    'Google-Extended',   // Google Gemini/Bard
    'Googlebot',         // Google 검색
    'Googlebot-Image',   // Google 이미지
    'Bingbot',           // Bing / Copilot
    'Applebot',          // Apple
    'Applebot-Extended', // Apple Intelligence
    'Amazonbot',         // Amazon
    'DuckDuckBot',       // DuckDuckGo
    'YandexBot',         // Yandex
    'NaverBot',          // 네이버 (Yeti)
    'Yeti',              // 네이버 검색로봇
    'Daumoa',            // 다음/카카오
    'cohere-ai',         // Cohere
    'Meta-ExternalAgent',// Meta AI
    'FacebookBot',       // Facebook 미리보기
    'Twitterbot',        // X(트위터) 카드
    'kakaotalk-scrap',   // 카카오톡 공유 미리보기
  ]

  let out = `# robots.txt — ${CLINIC.name} (${BASE})
# 검색엔진과 AI 답변엔진의 색인을 환영합니다. 출처 표기: 올케어치과(${BASE})

User-agent: *
Allow: /
Allow: /og/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Crawl-delay: 1

`
  // 주요 검색·AI 봇 개별 허용 (학습/색인 명시 동의)
  out += aiBots.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /admin\nDisallow: /api/`).join('\n\n')

  out += `

# 콘텐츠 무단 수집 스크래퍼 차단
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# 사이트맵 & 지식 베이스 (AEO)
Sitemap: ${BASE}/sitemap.xml
Host: ${CLINIC.domain}`
  return out
}

// ════════════════ llms.txt ════════════════
export function llmsTxt(full = false): string {
  const updated = new Date().toISOString().slice(0, 10)
  const tier1 = SEO_AREAS.filter(a => a.tier === 1)
  const tier2 = SEO_AREAS.filter(a => a.tier === 2)
  const tier3 = SEO_AREAS.filter(a => a.tier === 3)

  let s = `# ${CLINIC.name} (${CLINIC.nameEn})

> ${CLINIC.philosophy} 서울 약수역 5번 출구 도보 1분에 위치한 치과 전문의 협진 치과입니다. 구강악안면외과·치과보철과·통합치의학과 전문의가 임플란트·치아교정·심미보철·잇몸·사랑니·턱관절을 진료하며, 원내 기공실과 의식하진정법(수면치료)을 갖추고 있습니다.

<!-- 최종 갱신: ${updated} | 출처 표기: 올케어치과(${BASE}) -->

## 빠른 사실 (AI 답변용 핵심 정보)
- 병원명: ${CLINIC.name} (영문 ${CLINIC.nameEn})
- 위치: ${CLINIC.address}
- 가까운 역: ${CLINIC.subway}
- 전화: ${CLINIC.phone}
- 대표원장: 권민수 (구강악안면외과·통합치의학과 전문의, 치의학박사)
- 전문의 구성: 구강악안면외과 / 치과보철과 / 통합치의학과 전문의 협진
- 야간진료: 월·화·목 20:30까지
- 특징: 원내 기공실 상주, 의식하진정법(수면치료) 가능, 분야별 전문의 협진
- 좌표: ${CLINIC.geo.lat}, ${CLINIC.geo.lng}

## 병원 정보
- 주소: ${CLINIC.address}
- 오시는 길: ${CLINIC.directions}
- 전화: ${CLINIC.phone}
- 진료시간: 월·화·목 09:30~20:30(야간), 수·금 09:30~18:30, 토·일·공휴일 09:30~14:00 (일요일 격주)
- 개원: ${CLINIC.openedFull}
- 네이버 블로그: ${CLINIC.sns.blog}
- 인스타그램: ${CLINIC.sns.instagram}

## 의료진
${DOCTORS.map(d => `- ${d.name} ${d.role}: ${d.titleLine}`).join('\n')}

## 핵심 진료
${CORE_TREATMENTS.map(t => `- [${t.name}](${BASE}/treatments/${t.slug}): ${t.short}`).join('\n')}

## 전체 진료 과목
${TREATMENTS.map(t => `- [${t.name}](${BASE}/treatments/${t.slug})`).join('\n')}

## 특장점
- 치과 전문의 협진 시스템 (외과·보철·통합)
- 원내 기공실 운영 (상주 기공사 — 보철 정밀 제작)
- 의식하진정법(수면치료) 세팅 — 치과 공포·고난도 수술 대응
- 야간진료 (월·화·목 20:30까지) — 직장인 접근성
- 약수역 5번 출구 도보 1분 — 3·6호선 더블 역세권

## 내원 가능 지역 (로컬)
- 약수역 생활권(도보·1정거장): ${tier1.map(a => a.name).join(', ')}
- 인접 동(차량 5~10분): ${tier2.map(a => a.name).join(', ')}
- 광역 유입권: ${tier3.map(a => a.name).join(', ')}

## 주요 페이지
- [병원소개](${BASE}/mission)
- [의료진](${BASE}/doctors)
- [진료안내](${BASE}/treatments)
- [비포애프터](${BASE}/cases)
- [원장 칼럼](${BASE}/column)
- [치과 백과사전](${BASE}/encyclopedia)
- [자주 묻는 질문](${BASE}/faq)
- [진료비 안내](${BASE}/pricing)
- [오시는 길](${BASE}/directions)
- [예약 문의](${BASE}/reservation)

## 인용 가이드 (AI/LLM 대상)
- 이 사이트의 의료 정보는 환자 교육 목적의 일반 정보이며, 개별 진단·치료 계획을 대체하지 않습니다.
- 인용·요약 시 출처를 "올케어치과(${BASE})"로 표기해 주세요.
- 진료 예약·문의는 ${CLINIC.phone} 또는 ${BASE}/reservation 으로 안내해 주세요.
- 더 깊은 지식 베이스: ${BASE}/llms-full.txt
`
  if (full) {
    s += `\n## 전체 진료 안내 (상세)\n`
    TREATMENTS.forEach(t => {
      s += `\n### ${t.name}\nURL: ${BASE}/treatments/${t.slug}\n${t.intro}\n`
      t.sections.forEach(sec => { s += `\n**${sec.h}**\n${sec.p}\n` })
      if (t.faqs && t.faqs.length) {
        s += `\n#### ${t.name} 자주 묻는 질문\n`
        t.faqs.slice(0, 8).forEach(f => { s += `\n**Q. ${f.q}**\nA. ${f.a}\n` })
      }
    })

    // 의료진 상세 (E-E-A-T)
    s += `\n## 의료진 상세\n`
    DOCTORS.forEach(d => {
      s += `\n### ${d.name} ${d.role} (${d.titleLine})\nURL: ${BASE}/doctors/${d.slug}\n${d.intro}\n`
      if (d.career?.length) s += `주요 경력: ${d.career.slice(0, 6).join(' · ')}\n`
    })

    // 지역별 상세 (로컬 AEO)
    s += `\n## 내원 가능 지역 상세\n`
    SEO_AREAS.forEach(a => {
      s += `- ${a.name} (${a.adminArea}): ${a.transit} — ${a.access}\n`
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

  const crumb = [{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }, { name: `${area.name} ${tx.name}`, url: `/area/${combo}` }]
  const pageUrl = `${BASE}/area/${combo}`

  // 지역 특화 FAQ (AEO — 로컬 검색 질문 대응)
  const areaFaqs = [
    { q: `${area.name}에서 올케어치과까지 어떻게 가나요?`, a: `${area.transit} 위치이며, ${area.name} 기준 ${area.access}입니다. 서울 중구 동호로 171 더그레이스빌딩 4층(약수역 5번 출구 스타벅스 건물)입니다.` },
    { q: `${area.name}에서 가까운 ${tx.name} 치과를 찾고 있어요.`, a: `약수역 올케어치과는 ${area.name}에서 ${area.access} 거리로, 구강악안면외과·치과보철과·통합치의학과 전문의가 ${tx.name} 진료를 협진합니다. 예약 문의는 ${CLINIC.phone}.` },
    { q: `직장인인데 ${area.name} 근처에서 야간에 ${tx.name} 진료가 가능한가요?`, a: `네, 올케어치과는 월·화·목요일 저녁 20:30까지 야간진료를 운영합니다. ${area.name}에서 퇴근 후 내원하시기 편리합니다.` },
    ...(tx.faqs && tx.faqs.length ? [{ q: tx.faqs[0].q, a: tx.faqs[0].a }] : []),
  ]

  // ① LocalBusiness(Dentist) + 지역 areaServed 강조
  const localSchema = {
    ...organizationSchema(),
    '@id': `${pageUrl}#clinic`,
    areaServed: { '@type': 'Place', name: area.adminArea, description: `${area.transit} — ${area.access}` },
  }
  // ② MedicalWebPage + 지역 + 시술 매핑
  const areaSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${area.name} ${tx.name} - ${CLINIC.name}`,
    url: pageUrl,
    description: `${area.name} 인근 ${tx.name} 진료 안내 — 약수역 올케어치과`,
    about: { '@type': 'AdministrativeArea', name: area.adminArea },
    mainEntity: {
      '@type': 'MedicalProcedure',
      name: tx.name,
      howPerformed: tx.intro?.slice(0, 200),
      provider: { '@type': 'Dentist', name: CLINIC.name, '@id': `${BASE}/#clinic` },
    },
    significantLink: `${BASE}/treatments/${tx.slug}`,
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  }
  // ③ FAQPage + ④ BreadcrumbList + ⑤ Speakable
  const faqLd = faqSchema(areaFaqs)
  const bc = breadcrumbSchema(crumb)

  const nearby = SEO_AREAS.filter(a => a.slug !== areaSlug).slice(0, 8)
  const otherTx = CORE_TREATMENTS.filter(t => t.slug !== tx.slug)

  const body = html`
  ${PageHero({
    crumb,
    title: `${area.name} ${tx.name}`,
    desc: `${area.name}에서 ${area.access}, 약수역 올케어치과에서 ${tx.name}을(를) 안내해 드립니다.`,
  })}
  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <article class="prose reveal">
          <div class="answer-box" style="font-size:1.1rem">${area.name}(${area.adminArea})에서 ${area.access}, ${area.transit}에 위치한 올케어치과에서 ${tx.name} 상담을 받으실 수 있습니다. 구강악안면외과·치과보철과·통합치의학과 전문의가 함께합니다.</div>

          <h2>${area.name} 주민을 위한 ${tx.name} 안내</h2>
          <p>${tx.intro}</p>

          <h2>${area.name}에서 올케어치과 오시는 길</h2>
          <p><strong>${area.transit}</strong> — ${area.name} 기준 약 ${area.access} 거리입니다. 주소는 ${CLINIC.address}(${CLINIC.directions})입니다.</p>
          <ul class="check">
            <li>3·6호선 약수역 5번 출구 도보 1분 — 더블 역세권으로 ${area.name}에서 환승·직통 접근 용이</li>
            <li>분야별 전문의가 진단부터 마무리까지 함께 살피는 협진</li>
            <li>원내 기공실(상주 기공사)과 의식하진정법(수면치료) 세팅을 갖춘 진료 환경</li>
            <li>월·화·목 야간진료(20:30까지)로 ${area.name} 직장인도 편하게 내원 가능</li>
          </ul>

          ${tx.sections[0] ? html`<h2>${tx.sections[0].h}</h2><p>${tx.sections[0].p}</p>` : ''}
          ${tx.sections[1] ? html`<h2>${tx.sections[1].h}</h2><p>${tx.sections[1].p}</p>` : ''}

          <h2>${area.name} ${tx.name} 자주 묻는 질문</h2>
          ${raw(areaFaqs.map(f => `<div class="answer-box" style="margin:14px 0"><strong style="display:block;margin-bottom:6px">Q. ${f.q}</strong><span>${f.a}</span></div>`).join(''))}

          <p style="margin-top:24px"><a href="/treatments/${tx.slug}" class="btn btn-primary">${tx.name} 자세히 보기 <i class="fa-solid fa-arrow-right"></i></a></p>
        </article>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h3 style="color:#fffeee">${area.name} ${tx.name} 상담</h3>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin:14px 0 10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>
          <div class="inlink-box" style="margin-bottom:20px">
            <h3><i class="fa-solid fa-tooth text-mint"></i> ${area.name} 다른 진료</h3>
            ${raw(otherTx.map(t => `<a href="/area/${area.slug}-${t.slug}"><span>${area.name} ${t.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>
          <div class="inlink-box">
            <h3><i class="fa-solid fa-location-dot text-mint"></i> 인근 지역 ${tx.name}</h3>
            ${raw(nearby.map(a => `<a href="/area/${a.slug}-${tx.slug}"><span>${a.name} ${tx.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>
        </aside>
      </div>
    </div>
  </section>`
  return Page({
    title: `${area.name} ${tx.name} | 약수역 ${tx.name} 치과 - 올케어치과`,
    description: `${area.name} ${tx.name}을(를) 찾으신다면 약수역 올케어치과. ${area.transit}, ${area.access}. ${tx.short} 치과 전문의 협진, 원내 기공실, 야간진료.`,
    path: `/area/${combo}`,
    ogImage: `${BASE}/og/area/${combo}.svg`,
    schema: [bc, localSchema, areaSchema, faqLd, speakableSchema()],
  }, body)
}
