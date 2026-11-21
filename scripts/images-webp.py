#!/usr/bin/env python3
"""운영 R2 의 PNG·JPG 사진을 WebP 로 바꿔 새 이름으로 올리고, 데이터(JSON)의 주소를 바꾼다.
2026-11-17 권민수 원장 11/16 재점검 'WebP 미변환 72개' — column-images-webp.py(11/12, 칼럼만·150KB 이상만)를 넓힌 판.

대상
  - 칼럼·공지·이벤트(data/columns.json·notices.json·events.json) 안의 /uploads/columns/{img|not|ev}_*.png|jpg 주소 전부
  - 비포애프터(data/cases.json) 사진 필드 panoBefore·panoAfter·intraBefore·intraAfter 의 R2 키(cases/<id>/<field>.png|jpg)

사용(레포 루트에서):
  python3 scripts/images-webp.py <작업 폴더>            # 연습: 내려받아 변환·용량만 계산, 운영 변경 없음
  python3 scripts/images-webp.py <작업 폴더> --apply    # 실제: webp 업로드 → JSON 주소 교체

- 원본은 지우지 않는다(옛 주소가 캐시·외부에 남아 있어도 열리게).
  되돌리려면 작업 폴더의 <이름>.before-*.json 을 data/<이름>.json 으로 다시 올리면 된다.
- 가로 1600px 넘는 사진은 1600px 로 줄인다. WebP 가 원본보다 크면 그대로 둔다(목록에 표시).
- JSON 은 올리기 직전에 다시 받아 바꾼다(그 사이 관리자 저장을 덮어쓰지 않게).
"""
import io, json, os, re, subprocess, sys, time
from PIL import Image

BUCKET = 'allcare-dental'
MAX_W = 1600
REF = re.compile(r'/uploads/columns/((?:img|not|ev)_[a-z0-9]+(?:-[a-z0-9]+)*)\.(png|jpe?g)(\?v=[0-9a-z]+)?', re.I)  # not_xxx-s.jpg 같은 접미사 포함
CASE_FIELDS = ('panoBefore', 'panoAfter', 'intraBefore', 'intraAfter')
COLLECTIONS = ('columns', 'notices', 'events')

work = sys.argv[1]
apply = '--apply' in sys.argv
os.makedirs(os.path.join(work, 'orig'), exist_ok=True)
os.makedirs(os.path.join(work, 'webp'), exist_ok=True)


def r2_get(key, dest):
    subprocess.run(['npx', 'wrangler', 'r2', 'object', 'get', f'{BUCKET}/{key}', '--remote', '--file', dest],
                   check=True, capture_output=True)


def r2_put(key, src, ctype):
    subprocess.run(['npx', 'wrangler', 'r2', 'object', 'put', f'{BUCKET}/{key}', '--remote', '--file', src,
                    '--content-type', ctype], check=True, capture_output=True)


def to_webp(raw):
    im = Image.open(io.BytesIO(raw))
    im.load()
    alpha = im.mode in ('RGBA', 'LA', 'PA') or (im.mode == 'P' and 'transparency' in im.info)
    if alpha:
        im = im.convert('RGBA')
        alpha = im.getchannel('A').getextrema()[0] < 255
    im = im.convert('RGBA' if alpha else 'RGB')
    if im.width > MAX_W:
        im.thumbnail((MAX_W, MAX_W * 6), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=82, method=6)
    best = out.getvalue()
    if len(best) >= len(raw):  # 작은 그림·단색 PNG 는 무손실 WebP 가 더 작다
        out = io.BytesIO()
        im.save(out, 'WEBP', lossless=True, method=6)
        best = min(best, out.getvalue(), key=len)
    return best


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


rows, plan_up, plan_case = [], {}, {}
before = after = 0

# 1) 업로드 사진(/uploads/columns/*) — 칼럼·공지·이벤트 데이터에서 주소 수집
refs = {}
for name in COLLECTIONS:
    cur = os.path.join(work, f'{name}.current.json')
    r2_get(f'data/{name}.json', cur)
    for s in strings(json.load(open(cur, encoding='utf-8'))):
        for m in REF.finditer(s):
            refs.setdefault(f'{m.group(1)}.{m.group(2)}', set()).add(name)
for fname in sorted(refs):
    stem = fname.rsplit('.', 1)[0]
    src = os.path.join(work, 'orig', fname)
    if not os.path.exists(src):
        r2_get(f'uploads/columns/{fname}', src)
    raw = open(src, 'rb').read()
    webp = to_webp(raw)
    ok = len(webp) < len(raw)
    rows.append((f'/uploads/columns/{fname}', len(raw), len(webp), ok, '·'.join(sorted(refs[fname]))))
    if ok:
        open(os.path.join(work, 'webp', f'{stem}.webp'), 'wb').write(webp)
        plan_up[fname] = f'{stem}.webp'
        before += len(raw); after += len(webp)

# 2) 비포애프터 사진(R2 키)
cur = os.path.join(work, 'cases.current.json')
r2_get('data/cases.json', cur)
for it in json.load(open(cur, encoding='utf-8')):
    for f in CASE_FIELDS:
        key = it.get(f) or ''
        if not re.search(r'\.(png|jpe?g)$', key, re.I):
            continue
        src = os.path.join(work, 'orig', key.replace('/', '__'))
        if not os.path.exists(src):
            r2_get(key, src)
        raw = open(src, 'rb').read()
        webp = to_webp(raw)
        ok = len(webp) < len(raw)
        rows.append((key, len(raw), len(webp), ok, 'cases'))
        if ok:
            nk = re.sub(r'\.(png|jpe?g)$', '.webp', key, flags=re.I)
            open(os.path.join(work, 'webp', nk.replace('/', '__')), 'wb').write(webp)
            plan_case[key] = nk
            before += len(raw); after += len(webp)

rows.sort(key=lambda r: -r[1])
with open(os.path.join(work, 'plan.tsv'), 'w', encoding='utf-8') as fh:
    fh.write('주소\t원본B\tWebP_B\t교체\t데이터\n')
    for r in rows:
        fh.write(f'{r[0]}\t{r[1]}\t{r[2]}\t{"예" if r[3] else "아니오(WebP가 더 큼)"}\t{r[4]}\n')
skip = [r for r in rows if not r[3]]
print(f'업로드 사진 {len(refs)}개 · 비포애프터 사진 {len([r for r in rows if r[4] == "cases"])}개 · '
      f'바꿀 사진 {len(plan_up) + len(plan_case)}장 · {before/1e6:.1f}MB → {after/1e6:.1f}MB · 그대로 {len(skip)}장')
for r in skip:
    print('  그대로:', r[0], r[1], '→', r[2])

if not apply:
    print('연습 실행 — 운영 변경 없음. 실제 반영은 --apply')
    sys.exit(0)

for fname, webp in plan_up.items():
    r2_put(f'uploads/columns/{webp}', os.path.join(work, 'webp', webp), 'image/webp')
for key, nk in plan_case.items():
    r2_put(nk, os.path.join(work, 'webp', nk.replace('/', '__')), 'image/webp')
print('webp 업로드', len(plan_up) + len(plan_case))

stamp = time.strftime('%Y%m%d-%H%M%S')
for name in COLLECTIONS:
    fresh = os.path.join(work, f'{name}.before-{stamp}.json')
    r2_get(f'data/{name}.json', fresh)  # 올리기 직전 최신본
    text = open(fresh, encoding='utf-8').read()
    n = 0
    for fname, webp in plan_up.items():
        stem, ext = fname.rsplit('.', 1)
        pat = re.compile(r'/uploads/columns/' + re.escape(stem) + r'\.' + re.escape(ext) + r'(\?v=[0-9a-z]+)?')
        text, k = pat.subn(f'/uploads/columns/{webp}', text)
        n += k
    if not n:
        continue
    json.loads(text)  # 깨지지 않았는지
    new = os.path.join(work, f'{name}.after-{stamp}.json')
    open(new, 'w', encoding='utf-8').write(text)
    r2_put(f'data/{name}.json', new, 'application/json')
    print(f'{name}.json 주소 {n}곳 교체 · 되돌리기: {fresh}')

if plan_case:
    fresh = os.path.join(work, f'cases.before-{stamp}.json')
    r2_get('data/cases.json', fresh)
    items = json.load(open(fresh, encoding='utf-8'))
    n = 0
    for it in items:
        for f in CASE_FIELDS:
            if it.get(f) in plan_case:
                it[f] = plan_case[it[f]]
                n += 1
    new = os.path.join(work, f'cases.after-{stamp}.json')
    json.dump(items, open(new, 'w', encoding='utf-8'), ensure_ascii=False)
    r2_put('data/cases.json', new, 'application/json')
    print(f'cases.json 사진 {n}곳 교체 · 되돌리기: {fresh}')
