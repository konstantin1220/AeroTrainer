"""Kleiner Webserver für die Entwicklung: python3 tools/server.py [port]

Wie „python3 -m http.server“, schickt aber „nicht zwischenspeichern“ mit,
damit Änderungen im Browser sofort sichtbar sind.
"""
import http.server
import os
import sys


class OhneCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f'AeroTrainer läuft auf http://localhost:{port}')
    http.server.ThreadingHTTPServer(('', port), OhneCache).serve_forever()
