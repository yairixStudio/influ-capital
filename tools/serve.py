#!/usr/bin/env python3
"""שרת פיתוח מקומי שמחקה את GitHub Pages.

- נתיב בלי סיומת (‎/קורס) מוגש מ-‎קורס.html, כמו ב-GitHub Pages.
- נתיב שלא קיים מוגש מ-404.html עם סטטוס 404.

שימוש:  python3 tools/serve.py [port]   (ברירת מחדל 4173, מגיש את שורש הפרויקט)
"""
import http.server
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        fs = os.path.join(ROOT, path.lstrip('/'))
        if not os.path.exists(fs) and os.path.isfile(fs.rstrip('/') + '.html'):
            self.path = urllib.parse.quote(path.rstrip('/') + '.html')
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


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    http.server.ThreadingHTTPServer(('127.0.0.1', port), PagesHandler).serve_forever()
