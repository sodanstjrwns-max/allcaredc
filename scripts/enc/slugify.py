# 한글 용어 → 영문 slug 매핑 (수동 큐레이션: 검색친화 + 안정적 URL)
import json

# 용어별 영문 slug (en 필드 기반 + 보정). 사람이 읽기 좋고 SEO 친화적으로.
d = json.load(open('src/data/encyclopedia.json'))
sel = json.load(open('scripts/enc/selected_200.json'))
selected_terms = [t for v in sel.values() for t in v]
term_to_en = {t['term']: t['en'] for t in d}

import re
def to_slug(en):
    s = en.lower()
    s = re.sub(r'[()]', '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s

slugs = {}
used = set()
for term in selected_terms:
    en = term_to_en.get(term, term)
    base = to_slug(en) or 'term'
    slug = base
    i = 2
    while slug in used:
        slug = f"{base}-{i}"; i += 1
    used.add(slug)
    slugs[term] = slug

json.dump(slugs, open('scripts/enc/slugs.json','w'), ensure_ascii=False, indent=2)
print(f"{len(slugs)}개 slug 생성")
# 중복 체크
print("중복 slug:", len(slugs) - len(set(slugs.values())))
for t in selected_terms[:8]:
    print(f"  {t} -> {slugs[t]}")
