"""Core of the authorized web security scanner: scope guard, safe HTTP client, rule registry, scoring, reports."""
import csv, html, io, ipaddress, json, logging, re, socket, ssl, threading, time, urllib.parse as up
from dataclasses import dataclass, field
from http.client import HTTPConnection, HTTPSConnection
from html.parser import HTMLParser

SEVERITIES = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
WEIGHT = {'CRITICAL': 25, 'HIGH': 12, 'MEDIUM': 5, 'LOW': 2, 'INFO': 0}
CONF = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
log = logging.getLogger('scanner')

class ScanError(Exception): pass

# ---------- redaction (evidence AND logs) ----------
_RED = [(re.compile(r'(?i)(set-cookie|cookie|authorization)\s*[:=]\s*[^\r\n]+'), r'\1: [REDACTED]'),
        (re.compile(r'(?i)\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}'), lambda m: m.group(0)[:8] + '*' * 8),
        (re.compile(r'(?i)bearer\s+[A-Za-z0-9._\-]+'), 'Bearer [REDACTED]'),
        (re.compile(r'(?i)((?:secret|token|password|passwd|api[_-]?key)\w*\s*[=:]\s*)[^\s&"\']+'), r'\1[REDACTED]')]
def redact(s):
    for p, r in _RED: s = p.sub(r, str(s))
    return s
class _RedactFilter(logging.Filter):
    def filter(self, rec): rec.msg, rec.args = redact(rec.getMessage()), (); return True
log.addFilter(_RedactFilter())

# ---------- scope / SSRF guard ----------
class Scope:
    def __init__(self, domains, allow_private=False):
        self.domains = [d.lower().strip() for d in domains if d.strip()]
        if not self.domains: raise ScanError('At least one in-scope domain is required (e.g. example.com or *.example.com).')
        self.allow_private = allow_private
    def host_ok(self, host):
        host = (host or '').lower().rstrip('.')
        return any(host == d or (d.startswith('*.') and (host.endswith(d[1:]) or host == d[2:])) for d in self.domains)
    def check(self, url):
        p = up.urlsplit(url)
        if p.scheme not in ('http', 'https') or not p.hostname: raise ScanError('Only http/https URLs are allowed: ' + url)
        if not self.host_ok(p.hostname): raise ScanError('Out of scope: ' + p.hostname)
        try: ips = {i[4][0] for i in socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == 'https' else 80))}
        except socket.gaierror as e: raise ScanError('Cannot resolve ' + p.hostname) from e
        for ip in ips:
            a = ipaddress.ip_address(ip)
            if not self.allow_private and (a.is_private or a.is_loopback or a.is_link_local or a.is_reserved or a.is_multicast):
                raise ScanError('Blocked non-public address (%s) for %s' % (ip, p.hostname))
        return url

# ---------- safe HTTP client: rate limit, timeout, size + request caps, stop flag ----------
class Resp:
    def __init__(self, url, status, headers, body, cookies): self.url, self.status, self.headers, self.body, self.set_cookies = url, status, headers, body, cookies
class Client:
    def __init__(self, scope, rps=2.0, timeout=8, max_requests=200, max_bytes=300_000, stop=None):
        self.scope, self.gap, self.timeout, self.max_requests, self.max_bytes = scope, 1.0 / max(rps, 0.1), timeout, max_requests, max_bytes
        self.stop, self.count, self.last, self.requested = stop or threading.Event(), 0, 0.0, []
    def get(self, url, headers=None, follow=False, hops=4):
        for _ in range(hops + 1):
            r = self._one(url, headers)
            if follow and r.status in (301, 302, 303, 307, 308) and r.headers.get('location'):
                url = up.urljoin(url, r.headers['location']); continue
            break
        return r
    def _one(self, url, headers):
        if self.stop.is_set(): raise ScanError('Scan stopped')
        if self.count >= self.max_requests: raise ScanError('Request limit reached (%d)' % self.max_requests)
        self.scope.check(url)
        wait = self.gap - (time.time() - self.last)
        if wait > 0: time.sleep(wait)
        self.last, self.count = time.time(), self.count + 1
        p = up.urlsplit(url); self.requested.append(p.path)
        c = (HTTPSConnection if p.scheme == 'https' else HTTPConnection)(p.hostname, p.port, timeout=self.timeout)
        try:
            c.request('GET', (p.path or '/') + ('?' + p.query if p.query else ''), headers={'User-Agent': 'AuthorizedSecurityScanner/1.0', **(headers or {})})
            r = c.getresponse(); body = r.read(self.max_bytes).decode('utf-8', 'replace'); hl = r.getheaders()
            return Resp(url, r.status, {k.lower(): v for k, v in hl if k.lower() != 'set-cookie'}, body, [v for k, v in hl if k.lower() == 'set-cookie'])
        except (OSError, ssl.SSLError) as e: raise ScanError('Request failed: %s' % redact(e)) from e
        finally: c.close()

# ---------- findings + rule registry ----------
@dataclass
class Finding:
    rule_id: str; name: str; category: str; severity: str; confidence: str; status: str   # detected | potential | confirmed
    url: str; evidence: str; description: str; remediation: str
    cwe: str = ''; owasp: str = ''; references: list = field(default_factory=list); limitations: str = ''; state: str = 'open'
RULES = {}
def rule(id, name, category, severity, cwe='', owasp='', description='', remediation='', refs=(), false_positive='', active=False, tags=()):
    def deco(fn):
        RULES[id] = dict(id=id, name=name, category=category, severity=severity, cwe=cwe, owasp=owasp, description=description, remediation=remediation,
                         references=list(refs), false_positive=false_positive, active=active, tags=list(tags), enabled=True, fn=fn)
        return fn
    return deco
class Ctx:
    def __init__(self, target, client, mode): self.target, self.client, self.mode, self.findings, self.pages, self.sitemap = target, client, mode, [], {}, []
    def report(self, rid, url, evidence, status='detected', confidence='high', severity=None):
        m = RULES[rid]
        self.findings.append(Finding(rid, m['name'], m['category'], severity or m['severity'], confidence, status, url, redact(evidence)[:400],
                                     m['description'], m['remediation'], m['cwe'], m['owasp'], m['references'], m['false_positive']))

# ---------- discovery: safe, in-scope crawl ----------
class _P(HTMLParser):
    def __init__(self): super().__init__(); self.links = []
    def handle_starttag(self, t, a):
        a = dict(a)
        for k in ('href', 'src', 'action'):
            if a.get(k) and t in ('a', 'form', 'script', 'link'): self.links.append(a[k])
def discover(ctx, max_pages=15):
    queue, seen = [ctx.target], set()
    while queue and len(seen) < max_pages:
        u = queue.pop(0).split('#')[0]
        if u in seen: continue
        seen.add(u)
        try: r = ctx.client.get(u)
        except ScanError as e: log.info('skip %s: %s', u, e); continue
        ctx.pages[u] = r
        ctx.sitemap.append(dict(url=u, method='GET', status=r.status, content_type=r.headers.get('content-type', ''), size=len(r.body), source='crawl', params=list(up.parse_qs(up.urlsplit(u).query))))
        if 'html' in r.headers.get('content-type', ''):
            p = _P(); p.feed(r.body)
            queue += [n for n in (up.urljoin(u, h).split('#')[0] for h in p.links) if ctx.client.scope.host_ok(up.urlsplit(n).hostname) and n not in seen]

# ---------- scoring (transparent) ----------
def score(findings):
    per = {}
    for f in findings:
        if f.state != 'open': continue
        pts = WEIGHT[f.severity] * CONF[f.confidence] * (0.7 if f.status == 'potential' else 1)
        per[f.rule_id] = min(per.get(f.rule_id, 0) + pts, WEIGHT[f.severity] * 2)   # one noisy rule cannot sink the score
    s = max(0, round(100 - sum(per.values())))
    label = 'excellent' if s == 100 else 'very good' if s >= 90 else 'needs improvement' if s >= 75 else 'significant risk' if s >= 50 else 'high risk'
    return dict(score=s, label=label, calculation=['start at 100'] + ['%s: -%.1f' % kv for kv in per.items()], note='Heuristic indicator only. Not a guarantee of security.')

# ---------- reports ----------
def to_json(rep): return json.dumps(rep, indent=2, default=str)
def to_csv(rep):
    o = io.StringIO(); w = csv.writer(o); keys = ('rule_id', 'severity', 'confidence', 'status', 'category', 'url', 'name', 'evidence'); w.writerow(keys)
    for f in rep['findings']: w.writerow([f[k] for k in keys])
    return o.getvalue()
def to_html(rep):
    e, rows = html.escape, ''
    for f in sorted(rep['findings'], key=lambda f: -SEVERITIES.index(f['severity'])):
        rows += '<section><h3>[%s] %s</h3><p><b>%s</b> &middot; confidence %s &middot; %s &middot; %s %s</p><p>URL: %s</p><p>Evidence: %s</p><p>Why it matters: %s</p><p>Fix: %s</p><p><i>%s</i></p></section>' % (
            f['severity'], e(f['name']), e(f['status']), e(f['confidence']), e(f['category']), e(f['cwe']), e(f['owasp']), e(f['url']), e(f['evidence']), e(f['description']), e(f['remediation']), e(f['limitations']))
    sc = rep['score']
    return ('<!doctype html><meta charset=utf-8><title>Security report</title><style>body{font:15px system-ui;background:#0a0a0a;color:#eee;max-width:860px;margin:auto;padding:20px}section{border:1px solid #333;border-radius:12px;padding:12px 16px;margin:12px 0;background:#141414}h3{color:#ff4d4d}</style>'
            '<h1>Security assessment</h1><p>Target: %s &middot; Scope: %s &middot; %s &middot; mode %s</p><h2>Score: %s (%s)</h2><pre>%s</pre><p>%s</p>%s<h2>Limitations</h2><ul>%s</ul>') % (
        e(rep['target']), e(', '.join(rep['scope'])), e(rep['finished']), e(rep['mode']), sc['score'], e(sc['label']), e('\n'.join(sc['calculation'])), e(sc['note']), rows, ''.join('<li>%s</li>' % e(x) for x in rep['limitations']))
