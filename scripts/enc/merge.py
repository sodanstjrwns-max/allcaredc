#!/usr/bin/env python3
"""encyclopedia.json에 slug와 content(intro/sections/faq) 병합"""
import json, glob, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(BASE, '..', '..'))

enc_path = os.path.join(ROOT, 'src', 'data', 'encyclopedia.json')
terms = json.load(open(enc_path, encoding='utf-8'))
slugs = json.load(open(os.path.join(BASE, 'slugs.json'), encoding='utf-8'))

# content 병합
content = {}
for f in glob.glob(os.path.join(BASE, 'content', '*.json')):
    for k, v in json.load(open(f, encoding='utf-8')).items():
        content[k] = v

# 전체 용어에 slug 부여 (선정 200개는 slugs.json, 나머지는 en 기반 생성)
def slugify(en, term):
    s = (en or term).lower().strip()
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'[^a-z0-9가-힣\s-]', '', s)
    s = re.sub(r'\s+', '-', s).strip('-')
    if not s:
        s = re.sub(r'\s+', '-', term)
    return s

used = set(slugs.values())
merged = 0
slugged = 0
for t in terms:
    name = t['term']
    if name in slugs:
        t['slug'] = slugs[name]
    else:
        base = slugify(t.get('en', ''), name)
        sl = base
        i = 2
        while sl in used:
            sl = f'{base}-{i}'; i += 1
        used.add(sl)
        t['slug'] = sl
    slugged += 1
    if name in content:
        t['content'] = content[name]
        merged += 1

# slug 중복 검사
all_slugs = [t['slug'] for t in terms]
dup = [s for s in set(all_slugs) if all_slugs.count(s) > 1]
print('총 용어:', len(terms))
print('slug 부여:', slugged, '/ content 병합:', merged)
print('slug 중복:', dup if dup else '없음')

json.dump(terms, open(enc_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('저장 완료:', enc_path)
