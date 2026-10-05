"""Built-in rules. Each rule is independent: @rule(...) registers metadata, the function calls ctx.report(...)."""
import datetime, re, socket, ssl, urllib.parse as up
from .core import rule, ScanError

OWASP_MIS, MARK = 'A05:2021 Security Misconfiguration', 'zq8xv7'
def home(ctx): return ctx.pages.get(ctx.target) or ctx.client.get(ctx.target, follow=True)

@rule('HDR-001', 'Missing security header', 'headers', 'LOW', 'CWE-693', OWASP_MIS, tags=['passive'],
      description='A browser-side protection is not enabled, so an attack that the header would block is easier.',
      remediation='Send the header from your server or CDN. Static hosts such as GitHub Pages cannot set headers; put a CDN or proxy in front.',
      false_positive='Headers set only on some routes or by an edge layer may not appear on this URL.')
def missing_headers(ctx):
    r, h, https = home(ctx), home(ctx).headers, ctx.target.startswith('https')
    csp = h.get('content-security-policy', '')
    checks = [('content-security-policy', 'MEDIUM', not csp), ('strict-transport-security', 'MEDIUM', https and 'strict-transport-security' not in h),
              ('x-content-type-options', 'LOW', 'nosniff' not in h.get('x-content-type-options', '').lower()),
              ('x-frame-options / CSP frame-ancestors (clickjacking)', 'LOW', 'x-frame-options' not in h and 'frame-ancestors' not in csp),
              ('referrer-policy', 'INFO', 'referrer-policy' not in h), ('permissions-policy', 'INFO', 'permissions-policy' not in h)]
    for name, sev, bad in checks:
        if bad: ctx.report('HDR-001', ctx.target, 'Header not present in the response: ' + name, severity=sev)

@rule('HDR-002', 'Weak Content-Security-Policy', 'headers', 'MEDIUM', 'CWE-1021', OWASP_MIS, tags=['passive'],
      description='The CSP allows inline or wildcard script sources, which weakens its protection against XSS.',
      remediation="Remove 'unsafe-inline' and wildcard script sources; use nonces or hashes.")
def weak_csp(ctx):
    csp = home(ctx).headers.get('content-security-policy', '')
    for d in csp.split(';'):
        p = d.split()
        if p and p[0] in ('script-src', 'default-src'):
            if "'unsafe-inline'" in p and not any(x.startswith("'nonce-") or x.startswith("'sha") for x in p): ctx.report('HDR-002', ctx.target, p[0] + " allows 'unsafe-inline'")
            if '*' in p: ctx.report('HDR-002', ctx.target, p[0] + ' allows any origin (*)')

@rule('HDR-003', 'Server version disclosed', 'information-disclosure', 'LOW', 'CWE-200', OWASP_MIS, tags=['passive'],
      description='The server announces software and version, which helps attackers pick known exploits.', remediation='Hide version details in the server configuration.')
def version_headers(ctx):
    for k in ('server', 'x-powered-by'):
        v = home(ctx).headers.get(k, '')
        if re.search(r'\d+\.\d+', v): ctx.report('HDR-003', ctx.target, '%s: %s' % (k, v))

@rule('CK-001', 'Cookie missing a security attribute', 'cookies', 'LOW', 'CWE-614', 'A05:2021 Security Misconfiguration', tags=['passive'],
      description='Without Secure, HttpOnly and SameSite a cookie is easier to steal or send cross-site.',
      remediation='Set Secure, HttpOnly and SameSite=Lax (or Strict) on session cookies.',
      false_positive='Cookies that hold no sensitive data (for example a theme choice) can be left as they are.')
def cookies(ctx):
    for c in home(ctx).set_cookies:
        parts = [x.strip() for x in c.split(';')]; name = parts[0].split('=')[0]; flags = {x.split('=')[0].lower() for x in parts[1:]}
        missing = [f for f, bad in (('Secure', ctx.target.startswith('https') and 'secure' not in flags), ('HttpOnly', 'httponly' not in flags), ('SameSite', 'samesite' not in flags)) if bad]
        if missing: ctx.report('CK-001', ctx.target, 'Cookie "%s" is missing: %s (value not recorded)' % (name, ', '.join(missing)),
                               severity='MEDIUM' if re.search(r'(?i)sess|auth|token|sid', name) and 'HttpOnly' in missing else 'LOW')

@rule('TLS-001', 'HTTPS / certificate problem', 'tls', 'HIGH', 'CWE-295', 'A02:2021 Cryptographic Failures', tags=['passive'],
      description='Visitors may see warnings or traffic may be exposed.', remediation='Renew or correct the certificate and disable TLS older than 1.2.')
def tls(ctx):
    p = up.urlsplit(ctx.target)
    if p.scheme != 'https':
        r = ctx.client.get(ctx.target)
        if not r.headers.get('location', '').startswith('https://'): ctx.report('TLS-001', ctx.target, 'Plain HTTP does not redirect to HTTPS', severity='MEDIUM')
        return
    try:
        with socket.create_connection((p.hostname, p.port or 443), timeout=8) as s, ssl.create_default_context().wrap_socket(s, server_hostname=p.hostname) as t:
            cert, ver = t.getpeercert(), t.version()
        days = (datetime.datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z') - datetime.datetime.utcnow()).days
        if days < 30: ctx.report('TLS-001', ctx.target, 'Certificate expires in %d days' % days, severity='HIGH' if days < 0 else 'MEDIUM')
        if ver in ('TLSv1', 'TLSv1.1'): ctx.report('TLS-001', ctx.target, 'Negotiated obsolete protocol ' + ver, severity='MEDIUM')
    except ssl.SSLCertVerificationError as e: ctx.report('TLS-001', ctx.target, 'Certificate validation failed: ' + e.verify_message)
    except OSError as e: ctx.report('TLS-001', ctx.target, 'HTTPS connection failed: %s' % e, severity='INFO', confidence='low')

@rule('DISC-001', 'No security.txt', 'configuration', 'INFO', '', '', tags=['passive'], description='There is no published security contact, so researchers cannot report issues easily.',
      remediation='Publish /.well-known/security.txt (see securitytxt.org).')
def discovery_files(ctx):
    root = ctx.target.rstrip('/')
    for path in ('/robots.txt', '/sitemap.xml', '/.well-known/security.txt'):
        try: r = ctx.client.get(root + path)
        except ScanError: continue
        ctx.sitemap.append(dict(url=root + path, method='GET', status=r.status, content_type=r.headers.get('content-type', ''), size=len(r.body), source='well-known', params=[]))
        if path.endswith('security.txt') and not (r.status == 200 and 'contact' in r.body.lower()): ctx.report('DISC-001', root + path, 'Not found (HTTP %d)' % r.status)

@rule('CORS-001', 'Permissive CORS policy', 'cors', 'HIGH', 'CWE-942', 'A05:2021 Security Misconfiguration', active=True, tags=['standard'],
      description='A foreign website can read responses from this site in a visitor\'s browser.', remediation='Allow only an explicit list of trusted origins; never reflect the Origin header together with credentials.',
      false_positive='Harmless if the endpoint returns only public data.')
def cors(ctx):
    o = 'https://cors-probe.invalid'; r = ctx.client.get(ctx.target, headers={'Origin': o}); a, c = r.headers.get('access-control-allow-origin', ''), r.headers.get('access-control-allow-credentials', '').lower()
    if a == o and c == 'true': ctx.report('CORS-001', ctx.target, 'Arbitrary Origin reflected with credentials allowed', status='confirmed')
    elif a == o: ctx.report('CORS-001', ctx.target, 'Arbitrary Origin reflected (no credentials)', status='potential', severity='LOW', confidence='medium')
    elif a == '*': ctx.report('CORS-001', ctx.target, 'Access-Control-Allow-Origin: *', severity='LOW')

SENSITIVE = [('/.env', r'(?m)^[A-Z_]{3,}=.+'), ('/.git/config', r'\[core\]'), ('/backup.sql', r'(?i)CREATE TABLE|INSERT INTO'), ('/backup.zip', r'^PK'), ('/phpinfo.php', r'(?i)phpinfo\(\)|PHP Version')]
@rule('INFO-001', 'Sensitive file publicly accessible', 'information-disclosure', 'HIGH', 'CWE-538', 'A05:2021 Security Misconfiguration', active=True, tags=['standard'],
      description='A file that should be private can be downloaded by anyone.', remediation='Remove the file from the web root and rotate any secrets it contained.',
      false_positive='Pages that return 200 for every path are excluded by the content signature check.')
def sensitive_files(ctx):
    root = ctx.target.rstrip('/')
    for path, sig in SENSITIVE:
        try: r = ctx.client.get(root + path)
        except ScanError: continue
        if r.status == 200 and re.search(sig, r.body[:2000]): ctx.report('INFO-001', root + path, 'File signature matched (HTTP 200, %d bytes). Contents deliberately not stored.' % len(r.body), status='confirmed')

@rule('INFO-002', 'Directory listing enabled', 'information-disclosure', 'MEDIUM', 'CWE-548', OWASP_MIS, active=True, tags=['standard'],
      description='File names are listed publicly and may reveal private files.', remediation='Disable directory indexing.')
def dir_listing(ctx):
    root = ctx.target.rstrip('/')
    for path in ('/', '/files/', '/uploads/', '/static/', '/backup/'):
        try: r = ctx.client.get(root + path)
        except ScanError: continue
        if re.search(r'(?i)<title>Index of /|Directory listing for', r.body): ctx.report('INFO-002', root + path, 'Directory index page returned', status='confirmed')

DBERR = r'(?i)SQL syntax|SQLSTATE|ORA-\d{5}|sqlite3\.OperationalError|psycopg2|Unclosed quotation mark'
TRACE = r'Traceback \(most recent call last\)|Stack trace:|at [\w.$]+\([\w.]+\.java:\d+\)|Fatal error:.+on line \d+'
@rule('ERR-001', 'Verbose error / stack trace', 'information-disclosure', 'MEDIUM', 'CWE-209', 'A05:2021 Security Misconfiguration', active=True, tags=['standard'],
      description='Error pages reveal internal paths, code or database details.', remediation='Show a generic error page and log details privately.')
def errors(ctx):
    for e in ctx.sitemap:
        if e['status'] >= 500 and e['url'] in ctx.pages and re.search(TRACE, ctx.pages[e['url']].body): ctx.report('ERR-001', e['url'], 'Stack trace pattern in HTTP %d response' % e['status'])

def _params(ctx):
    out = []
    for e in ctx.sitemap:
        for name in e['params']: out.append((e['url'], name))
    return out[:8]
def _with(url, name, value):
    p = up.urlsplit(url); q = dict(up.parse_qsl(p.query)); q[name] = value
    return up.urlunsplit(p._replace(query=up.urlencode(q)))

@rule('XSS-001', 'Possible reflected XSS', 'xss', 'MEDIUM', 'CWE-79', 'A03:2021 Injection', active=True, tags=['standard'],
      description='User input comes back in the page without HTML encoding, which may allow script injection.', remediation='HTML-encode output for the correct context and add a strict CSP.',
      false_positive='Reflection inside a non-HTML response or an already-encoded context is not exploitable. Verify manually.')
def xss(ctx):
    for url, name in _params(ctx):
        r = ctx.client.get(_with(url, name, MARK + '<q>"'))   # inert marker, never a script
        if (MARK + '<q>') in r.body and 'html' in r.headers.get('content-type', ''):
            ctx.report('XSS-001', url, 'Parameter "%s" reflected with < > unencoded (inert marker, nothing executed)' % name, status='potential', confidence='medium')

@rule('INJ-001', 'Possible SQL injection indicator', 'injection', 'MEDIUM', 'CWE-89', 'A03:2021 Injection', active=True, tags=['standard'],
      description='A single quote caused a database error message, which suggests unsafe query building.', remediation='Use parameterized queries.',
      false_positive='Some frameworks show database-like text for unrelated errors.')
def sqli(ctx):
    for url, name in _params(ctx):
        base = ctx.pages.get(url); r = ctx.client.get(_with(url, name, "x'"))
        if re.search(DBERR, r.body) and not (base and re.search(DBERR, base.body)):
            ctx.report('INJ-001', url, 'Database error text after a single-quote probe on "%s". Nothing was modified or extracted.' % name, status='potential', confidence='medium')

@rule('REDIR-001', 'Open redirect', 'redirect', 'MEDIUM', 'CWE-601', 'A01:2021 Broken Access Control', active=True, tags=['standard'],
      description='The site redirects visitors to any address given in a link, which helps phishing.', remediation='Allow only relative paths or a fixed list of destinations.')
def open_redirect(ctx):
    for url, name in _params(ctx):
        if name.lower() in ('next', 'url', 'redirect', 'return', 'returnto', 'continue', 'dest', 'goto'):
            r = ctx.client.get(_with(url, name, 'https://example.org/zq'))
            if r.status in (301, 302, 303, 307, 308) and r.headers.get('location', '').startswith('https://example.org'):
                ctx.report('REDIR-001', url, 'Parameter "%s" redirected to an external address (not followed)' % name, status='confirmed')
