#!/usr/bin/env node
/**
 * merge-boost.cjs
 * scripts/enc/boost/{treatment}.json 의 보강 콘텐츠를
 * src/data/encyclopedia.json 의 매칭 slug content 필드에 덮어쓴다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ENC_PATH = path.join(ROOT, 'src/data/encyclopedia.json');
const BOOST_DIR = path.join(__dirname, 'boost');

function len(content) {
  let s = content.intro;
  content.sections.forEach(x => (s += x.h + x.p));
  content.faq.forEach(x => (s += x.q + x.a));
  return s.length;
}

const data = JSON.parse(fs.readFileSync(ENC_PATH, 'utf8'));
const bySlug = new Map();
data.forEach((t, i) => { if (t.slug) bySlug.set(t.slug, i); });

const boostFiles = fs.readdirSync(BOOST_DIR).filter(f => f.endsWith('.json'));
let applied = 0, missing = [];

boostFiles.forEach(file => {
  const boost = JSON.parse(fs.readFileSync(path.join(BOOST_DIR, file), 'utf8'));
  Object.entries(boost).forEach(([slug, content]) => {
    if (!bySlug.has(slug)) { missing.push(slug); return; }
    const idx = bySlug.get(slug);
    const before = data[idx].content ? len(data[idx].content) : 0;
    data[idx].content = content;
    const after = len(content);
    applied++;
    console.log(`✓ ${slug.padEnd(32)} ${String(before).padStart(4)} → ${after}`);
  });
});

if (missing.length) {
  console.error('\n⚠ slug not found in encyclopedia.json:', missing.join(', '));
}

fs.writeFileSync(ENC_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n적용 완료: ${applied}개 용어 보강, encyclopedia.json 저장됨.`);
