#!/usr/bin/env python3
"""칼럼 사진(PNG·JPG)을 WebP 로 바꿔 R2 에 새 이름으로 올리고, 칼럼 본문·대표 이미지 주소를 바꾼다.
2026-11-12 권민수 원장 요청 '칼럼 사진 용량 줄이기' — 칼럼 35편 사진 177장 91MB(한 장 최대 2.2MB).

사용(레포 루트에서):
  python3 scripts/column-images-webp.py <작업 폴더>            # 연습: 내려받아 변환·용량만 계산, 운영 변경 없음
  python3 scripts/column-images-webp.py <작업 폴더> --apply    # 실제: webp 업로드 → data/columns.json 주소 교체

- 원본 PNG·JPG 는 지우지 않는다(옛 주소가 캐시·외부에 남아 있어도 열리게). 되돌리려면 작업 폴더의
  columns.before-*.json 을 data/columns.json 으로 다시 올리면 된다.
- 150KB 미만이거나 WebP 가 30% 이상 작아지지 않는 사진은 그대로 둔다.
- columns.json 은 올리기 직전에 다시 받아 바꾼다(그 사이 관리자 저장을 덮어쓰지 않게).
"""
import io, json, os, re, subprocess, sys, time, urllib.request
from PIL import Image

BUCKET = 'allcare-dental'
SITE = 'https://allcaredc.kr'
UA = {'User-Agent': 'Mozilla/5.0 (PF column-images-webp)'}
REF = re.compile(r'/uploads/columns/((?:img|not|ev)_[a-z0-9]+)\.(png|jpe?g)', re.I)

work = sys.argv[1]
apply = '--apply' in sys.argv
os.makedirs(os.path.join(work, 'webp'), exist_ok=True)


def r2_get(key, dest):
    subprocess.run(['npx', 'wrangler', 'r2', 'object', 'get', f'{BUCKET}/{key}', '--remote', '--file', dest],
                   check=True, capture_output=True)


def r2_put(key, src, ctype):
    subprocess.run(['npx', 'wrangler', 'r2', 'object', 'put', f'{BUCKET}/{key}', '--remote', '--file', src,
                    '--content-type', ctype], check=True, capture_output=True)


def refs_of(cols):
    found = {}
    for c in cols:
        for field in ('body', 'thumbnail'):
            for m in REF.finditer(c.get(field) or ''):
                found[f'{m.group(1)}.{m.group(2)}'] = m.group(1)
    return found


cur = os.path.join(work, 'columns.current.json')
r2_get('data/columns.json', cur)
cols = json.load(open(cur, encoding='utf-8'))
refs = refs_of(cols)
plan, before, after = {}, 0, 0
for fname, stem in sorted(refs.items()):
    raw = urllib.request.urlopen(urllib.request.Request(f'{SITE}/uploads/columns/{fname}', headers=UA), timeout=60).read()
    if len(raw) < 150 * 1024:
        continue
    im = Image.open(io.BytesIO(raw))
    alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 255
    im = im.convert('RGBA' if alpha else 'RGB')
    if im.width > 1600:
        im.thumbnail((1600, 1600 * 4), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=80, method=6)
    if len(out.getvalue()) > len(raw) * 0.7:
        continue
    path = os.path.join(work, 'webp', f'{stem}.webp')
    open(path, 'wb').write(out.getvalue())
    plan[fname] = f'{stem}.webp'
    before += len(raw); after += len(out.getvalue())
print(f'칼럼 {len(cols)}편 · 사진 주소 {len(refs)}개 · 바꿀 사진 {len(plan)}장 · {before/1e6:.1f}MB → {after/1e6:.1f}MB')

if not apply:
    print('연습 실행 — 운영 변경 없음. 실제 반영은 --apply')
    sys.exit(0)

for fname, webp in plan.items():
    r2_put(f'uploads/columns/{webp}', os.path.join(work, 'webp', webp), 'image/webp')
print('webp 업로드', len(plan))

stamp = time.strftime('%Y%m%d-%H%M%S')
fresh = os.path.join(work, f'columns.before-{stamp}.json')
r2_get('data/columns.json', fresh)  # 올리기 직전 최신본
text = open(fresh, encoding='utf-8').read()
n = 0
for fname, webp in plan.items():
    stem, ext = fname.rsplit('.', 1)
    pat = re.compile(r'/uploads/columns/' + re.escape(stem) + r'\.' + re.escape(ext) + r'(\?v=[0-9a-z]+)?')
    text, k = pat.subn(f'/uploads/columns/{webp}', text)
    n += k
json.loads(text)  # 깨지지 않았는지
new = os.path.join(work, f'columns.after-{stamp}.json')
open(new, 'w', encoding='utf-8').write(text)
r2_put('data/columns.json', new, 'application/json')
print(f'columns.json 주소 {n}곳 교체 · 되돌리기: {fresh}')
