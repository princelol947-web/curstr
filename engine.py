import datetime, json, logging, pathlib, re, threading
from . import checks  # noqa: F401  (registers built-in rules)
from .core import RULES, SEVERITIES, Client, Ctx, ScanError, Scope, discover, rule, score, log

LIMITS = ['Automated checks give indicators, not proof; verify "potential" findings manually.', 'Authenticated, authorization and deep checks are not implemented in this version.',
          'Only the pages reached by a small in-scope crawl were tested.', 'A clean report does not guarantee the site is secure.']

def load_custom(path):
    """Custom rules are JSON files: id, name, severity, category, description, remediation, references, enabled, tags, detection{type,...}."""
    for f in sorted(pathlib.Path(path).glob('*.json')):
        d = json.loads(f.read_text()); det = d['detection']; rid = d['id']
        if d.get('enabled', True) is False: continue
        def fn(ctx, det=det, rid=rid):
            root = ctx.target.rstrip('/')
            if det['type'] == 'header_missing' and det['header'].lower() not in ctx.client.get(ctx.target).headers: ctx.report(rid, ctx.target, 'Header absent: ' + det['header'])
            elif det['type'] in ('body_regex', 'path_exists'):
                r = ctx.client.get(root + det.get('path', '/'))
                if r.status == 200 and re.search(det.get('pattern') or det.get('signature', ''), r.body[:5000]): ctx.report(rid, root + det.get('path', '/'), 'Pattern matched (content not stored)', status='detected')
        rule(rid, d['name'], d.get('category', 'custom'), d['severity'].upper(), d.get('cwe', ''), d.get('owasp', ''), d.get('description', ''), d.get('remediation', ''), d.get('references', ()),
             active=det['type'] != 'header_missing', tags=d.get('tags', ['custom']))(fn)

def run_scan(target, scope, authorized=False, mode='passive', rps=2.0, timeout=8, max_requests=200, disable=(), min_severity='INFO', only=None, allow_private=False, stop=None, custom_dir=None):
    if not authorized: raise ScanError('Authorization not confirmed: only scan sites you own or have written permission to test.')
    if mode == 'deep': raise ScanError('Authorized deep mode (test credentials) is not implemented in this version.')
    if mode not in ('passive', 'standard', 'custom'): raise ScanError('Unknown mode: ' + mode)
    if custom_dir: load_custom(custom_dir)
    sc = Scope(scope, allow_private); sc.check(target)
    client = Client(sc, rps, timeout, max_requests, stop=stop); ctx = Ctx(target, client, mode); started, errors = datetime.datetime.utcnow().isoformat() + 'Z', []
    log.info('scan start target=%s scope=%s mode=%s', target, scope, mode)
    try:
        discover(ctx)
        for rid, m in RULES.items():
            if rid in disable or not m['enabled'] or (mode == 'passive' and m['active']) or (mode == 'custom' and rid not in (only or [])): continue
            try: m['fn'](ctx)
            except ScanError as e: errors.append('%s: %s' % (rid, e)); log.warning('rule %s stopped: %s', rid, e)
            except Exception as e: errors.append('%s crashed: %s' % (rid, e)); log.exception('rule %s crashed', rid)
            if client.stop.is_set() or client.count >= client.max_requests: break
    finally: log.info('scan end requests=%d findings=%d', client.count, len(ctx.findings))
    fs = [f for f in ctx.findings if SEVERITIES.index(f.severity) >= SEVERITIES.index(min_severity)]
    home = ctx.pages.get(target); tech = [dict(name=v, confidence='medium', source=k) for k, v in (home.headers.items() if home else []) if k in ('server', 'x-powered-by')]
    return dict(target=target, scope=sc.domains, mode=mode, started=started, finished=datetime.datetime.utcnow().isoformat() + 'Z', requests=client.count,
                config=dict(rps=rps, timeout=timeout, max_requests=max_requests, disabled=list(disable)), findings=[f.__dict__ for f in fs], sitemap=ctx.sitemap,
                technologies=tech, score=score(fs), errors=errors, limitations=LIMITS)
