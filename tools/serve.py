"""Preview the website on this computer.

Windows: double-click start-local.bat in the website folder.
Mac/Linux: run  python3 tools/serve.py

Opens the site in your browser. Edit files in public/ and refresh to see changes.
Forms and checkout need Cloudflare, so here they show a short message instead.

Options: --port 8000   --no-browser
"""
import http.server
import json
import os
import socket
import sys
import webbrowser

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


class Handler(http.server.SimpleHTTPRequestHandler):
    # Fixed types: Windows sometimes reports .js as text/plain, which stops the scripts loading.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".mp4": "video/mp4",
        ".webp": "image/webp",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        # Clean URLs like Cloudflare Pages: /products also serves products.html
        fs_path = super().translate_path(path)
        if not os.path.exists(fs_path) and os.path.isfile(fs_path + ".html"):
            return fs_path + ".html"
        return fs_path

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self.api_unavailable()
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self.api_unavailable()
        self.send_error(405)

    def api_unavailable(self):
        body = json.dumps({
            "error": "This is the local preview, so forms and checkout are switched off. "
                     "They work on the live site once the keys are set in Cloudflare."
        }).encode()
        self.send_response(503)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, "404.html")
        if code != 404 or not os.path.isfile(page):
            return super().send_error(code, message, explain)
        with open(page, "rb") as f:
            body = f.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # always show your latest edits
        super().end_headers()

    def log_message(self, format, *args):
        pass  # keep the window quiet


def free_port(preferred):
    with socket.socket() as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]


def main():
    args = sys.argv[1:]
    port = int(args[args.index("--port") + 1]) if "--port" in args else 8000
    port = free_port(port)
    url = f"http://localhost:{port}/"

    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print()
    print(f"  Website preview running at {url}")
    print("  Edit files in public/ and refresh the browser to see changes.")
    print("  Close this window (or press Ctrl+C) to stop.")
    print(flush=True)
    if "--no-browser" not in args:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
