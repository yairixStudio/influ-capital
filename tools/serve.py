#!/usr/bin/env python3
"""שרת פיתוח מקומי שמחקה את GitHub Pages.

- נתיב בלי סיומת (‎/קורס) מוגש מ-‎קורס.html, כמו ב-GitHub Pages.
- נתיב שלא קיים מוגש מ-404.html עם סטטוס 404; גם ‎/_src/… (כמו Jekyll של GitHub Pages — לא מתפרסם).
- בנייה אוטומטית: כשקובץ מקור משתנה (‎_src/index.html, brand.css, site-chrome.css, js/site.js, fonts.css, המחולל)
  העמודים נבנים מחדש לפני הבקשה הבאה — עורכים, שומרים, מרעננים.

שימוש:  python3 tools/serve.py [port]   (ברירת מחדל 4173, מגיש את שורש הפרויקט)
"""
import http.server
import os
import subprocess
import sys
import threading
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = ['_src/index.html', 'brand.css', 'site-chrome.css', 'js/site.js', 'fonts/fonts.css', 'tools/build-pages.py', 'CNAME']
_lock, _built = threading.Lock(), [None]


def rebuild_if_changed():
    stamp = tuple(os.path.getmtime(os.path.join(ROOT, f)) for f in SOURCES)
    with _lock:
        if stamp != _built[0]:
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build-pages.py')], capture_output=True, text=True)
            print(r.stdout.strip() or r.stderr.strip(), file=sys.stderr)
            _built[0] = stamp


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        if path.endswith(('/', '.html')) or '.' not in os.path.basename(path):
            rebuild_if_changed()
        fs = os.path.join(ROOT, path.lstrip('/'))
        if any(part.startswith('_') for part in path.split('/')):
            fs = os.path.join(ROOT, '__not_published__')   # כמו GitHub Pages (Jekyll) — ‎_src/ לא מתפרסם
        if not os.path.exists(fs) and not path.endswith('/') and os.path.isfile(fs + '.html'):   # כמו GitHub Pages: ‎/קורס/ (עם לוכסן) → 404
            self.path = urllib.parse.quote(path + '.html')
        elif not os.path.exists(fs):
            try:
                f = open(os.path.join(ROOT, '404.html'), 'rb')
            except OSError:
                return super().send_head()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(os.fstat(f.fileno()).st_size))
            self.end_headers()
            return f
        return super().send_head()


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 256   # ברירת המחדל (5) מפילה חיבורים כש-Playwright מריץ כמה מכשירים במקביל
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    Server(('127.0.0.1', port), PagesHandler).serve_forever()
