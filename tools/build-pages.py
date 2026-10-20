#!/usr/bin/env python3
"""מחולל עמודים סטטיים לכל נתיב באתר — מקור יחיד: index.html.

האתר הוא SPA בקובץ אחד (index.html). כדי שגוגל יראה כל עמוד כ-URL נפרד, נוצר לכל נתיב
קובץ <slug>.html בשורש (GitHub Pages מגיש ‎/קורס מתוך ‎קורס.html), עם:
  - <title>, description, canonical, og/twitter משל העמוד (מ-data-title / data-desc ב-index.html)
  - העמוד הנכון מסומן active כבר ב-HTML (גם בלי JS), ניווט aria-current, טאב רגולציה פעיל
וכן 404.html (noindex) ו-sitemap.xml.

אסור לערוך את הקבצים שנוצרים — עורכים את index.html ומריצים שוב:
    python3 tools/build-pages.py           # בנייה
    python3 tools/build-pages.py --check   # נכשל אם קובץ שנוצר לא מעודכן (לפני קומיט)
"""
import datetime
import html
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'index.html')
SITE = 'https://' + open(os.path.join(ROOT, 'CNAME'), encoding='utf-8').read().strip()
MARK = '<!-- נוצר אוטומטית ע"י tools/build-pages.py מתוך index.html — לא לערוך ידנית -->\n'


def url(path):
    return SITE + urllib.parse.quote(path)


def sub1(pattern, repl, s):
    out, n = re.subn(pattern, repl, s, count=1)
    if n != 1:
        raise SystemExit(f'build-pages: pattern not found: {pattern}')
    return out


def set_meta(s, path, title, desc, canonical=True):
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    s = sub1(r'<title>[^<]*</title>', f'<title>{t}</title>', s)
    s = sub1(r'(<meta name="description" content=")[^"]*', r'\g<1>' + d, s)
    for prop in ('og:title', 'og:description'):
        val = t if prop.endswith('title') else d
        s = sub1(rf'(<meta property="{prop}" content=")[^"]*', r'\g<1>' + val, s)
    for name in ('twitter:title', 'twitter:description'):
        val = t if name.endswith('title') else d
        s = sub1(rf'(<meta name="{name}" content=")[^"]*', r'\g<1>' + val, s)
    if canonical:
        s = sub1(r'(<link rel="canonical" href=")[^"]*', r'\g<1>' + url(path), s)
        s = sub1(r'(<meta property="og:url" content=")[^"]*', r'\g<1>' + url(path), s)
    else:
        s = sub1(r'\s*<link rel="canonical" href="[^"]*">', '', s)
        s = sub1(r'(<meta name="robots" content=")[^"]*', r'\g<1>noindex, follow', s)
    return s


def strip_faq(s):
    # FAQPage שייך לדף הבית בלבד (שם מופיעות השאלות)
    return sub1(r'(?s)\s*<script type="application/ld\+json">\s*\{\s*"@context": "https://schema.org",\s*"@type": "FAQPage".*?</script>', '', s) if '"FAQPage"' in s else s


def activate(s, page_path, nav_path, reg_doc=None):
    s = s.replace('<article class="page active" ', '<article class="page" ', 1)
    s = sub1(rf'<article class="page" (data-page="{re.escape(page_path)}")', r'<article class="page active" \1', s)
    if nav_path:  # aria-current רק בתפריטי הניווט (עליון + סטיקי), לא בכל קישור לעמוד
        s = re.sub(r'(?s)<ul class="nav-links".*?</ul>',
                   lambda m: m.group(0).replace(f'<a href="{nav_path}" data-link>', f'<a href="{nav_path}" data-link aria-current="page">'), s)
    if reg_doc:
        s = s.replace('<a class="tab active" role="tab" aria-selected="true"', '<a class="tab" role="tab" aria-selected="false"', 1)
        s = sub1(rf'<a class="tab" role="tab" aria-selected="false" (data-doc="{re.escape(reg_doc)}")',
                 r'<a class="tab active" role="tab" aria-selected="true" \1', s)
        s = s.replace('<div class="tab-panel active" role="tabpanel"', '<div class="tab-panel" role="tabpanel"', 1)
        s = sub1(rf'<div class="tab-panel" role="tabpanel" (data-doc="{re.escape(reg_doc)}")',
                 r'<div class="tab-panel active" role="tabpanel" \1', s)
    return s


def build():
    src = open(SRC, encoding='utf-8').read()
    out = {}
    pages = re.findall(r'<article class="page(?: active)?" data-page="([^"]+)"[^>]*?data-title="([^"]+)" data-desc="([^"]+)"', src)
    docs = re.findall(r'<div class="tab-panel(?: active)?" role="tabpanel" data-doc="([^"]+)" data-title="([^"]+)" data-desc="([^"]+)"', src)
    routes = []  # (path, page_path, reg_doc, title, desc)
    for path, title, desc in pages:
        if path in ('/', '/404', '/רגולציה'):
            continue
        routes.append((path, path, None, html.unescape(title), html.unescape(desc)))
    for doc, title, desc in docs:
        routes.append(('/' + doc, '/רגולציה', doc, html.unescape(title), html.unescape(desc)))

    for path, page_path, reg_doc, title, desc in routes:
        s = set_meta(src, path, title, desc)
        s = strip_faq(s)
        s = activate(s, page_path, path if not reg_doc else None, reg_doc)
        s = s.replace('<html lang="he" dir="rtl">', MARK + '<html lang="he" dir="rtl">', 1)
        out[path.lstrip('/') + '.html'] = s

    # 404 — מוגש ע"י GitHub Pages בכל עומק נתיב, לכן base="/" כדי שנכסים יחסיים ייטענו
    nf = re.search(r'<article class="page" data-page="/404"[^>]*?data-title="([^"]+)" data-desc="([^"]+)"', src)
    s = set_meta(src, '/404', html.unescape(nf.group(1)), html.unescape(nf.group(2)), canonical=False)
    s = strip_faq(s)
    s = activate(s, '/404', None)
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <base href="/">', 1)
    s = s.replace('<html lang="he" dir="rtl">', MARK + '<html lang="he" dir="rtl">', 1)
    out['404.html'] = s

    # sitemap — אותן כתובות בדיוק כמו ה-canonical
    today = datetime.date.today().isoformat()
    urls = [('/', '1.0')] + [(r[0], '0.8' if not r[2] else '0.3') for r in routes]
    lastmod = today
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, prio in urls:
        sm.append(f'  <url><loc>{url(path)}</loc><lastmod>{lastmod}</lastmod><priority>{prio}</priority></url>')
    sm.append('</urlset>')
    out['sitemap.xml'] = '\n'.join(sm) + '\n'
    return out


def main():
    check = '--check' in sys.argv
    out = build()
    stale = []
    for name, content in out.items():
        fp = os.path.join(ROOT, name)
        cur = open(fp, encoding='utf-8').read() if os.path.exists(fp) else None
        if name == 'sitemap.xml' and cur is not None:
            # lastmod משתנה מיום ליום — משווים בלעדיו
            norm = lambda x: re.sub(r'<lastmod>[^<]*</lastmod>', '', x)
            if norm(cur) == norm(content):
                continue
        if cur != content:
            stale.append(name)
            if not check:
                open(fp, 'w', encoding='utf-8').write(content)
    if check:
        if stale:
            print('build-pages: לא מעודכנים (הריצו python3 tools/build-pages.py):', ', '.join(stale))
            sys.exit(1)
        print('build-pages: כל העמודים מעודכנים')
    else:
        print('build-pages: נכתבו', len(stale), 'קבצים' + (': ' + ', '.join(stale) if stale else ''))


if __name__ == '__main__':
    main()
