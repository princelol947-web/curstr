import argparse, logging, signal, sys, threading
from .core import ScanError, to_csv, to_html, to_json
from .engine import run_scan
import scanner.core as core

def main(argv=None):
    a = argparse.ArgumentParser(prog='scanner', description='Authorized, non-destructive web security scanner.')
    a.add_argument('--target', required=True); a.add_argument('--scope', action='append', required=True, help='e.g. example.com or *.example.com (repeatable)')
    a.add_argument('--authorized', action='store_true', help='I own this site or have written permission to test it')
    a.add_argument('--mode', default='passive', choices=['passive', 'standard', 'deep', 'custom']); a.add_argument('--rules', nargs='*', help='rule ids for custom mode')
    a.add_argument('--disable', nargs='*', default=[]); a.add_argument('--min-severity', default='INFO'); a.add_argument('--custom-rules', help='folder of JSON rule files')
    a.add_argument('--rps', type=float, default=2.0); a.add_argument('--max-requests', type=int, default=200); a.add_argument('--timeout', type=int, default=8)
    a.add_argument('--allow-private', action='store_true', help='DEVELOPMENT ONLY: allow localhost/private targets'); a.add_argument('--out', default='report')
    o = a.parse_args(argv); logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s'); stop = threading.Event()
    signal.signal(signal.SIGINT, lambda *_: (print('Stopping...'), stop.set()))
    try: rep = run_scan(o.target, o.scope, o.authorized, o.mode, o.rps, o.timeout, o.max_requests, o.disable, o.min_severity.upper(), o.rules, o.allow_private, stop, o.custom_rules)
    except ScanError as e: print('Error:', e); return 2
    for ext, fn in (('json', to_json), ('csv', to_csv), ('html', to_html)): open('%s.%s' % (o.out, ext), 'w').write(fn(rep))
    print('Score %s (%s) | %d findings | %d requests | reports: %s.json/.csv/.html' % (rep['score']['score'], rep['score']['label'], len(rep['findings']), rep['requests'], o.out)); return 0
if __name__ == '__main__': sys.exit(main())
