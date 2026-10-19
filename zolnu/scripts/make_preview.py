"""Bundle the Expo Web export into one portable review HTML file."""
from pathlib import Path
import base64, mimetypes, re
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
html=(dist/'index.html').read_text()
script=re.search(r'<script src="([^"]+)" defer></script>',html)
if not script: raise SystemExit('Run expo export --platform web first')
def inline_asset(match):
 path=dist/match[1].lstrip('/')
 if not path.is_file(): raise RuntimeError(f'Missing web asset: {match[1]}')
 mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
 data=base64.b64encode(path.read_bytes()).decode()
 return '\"data:'+mime+';base64,'+data+'\"'
def inline_script(match):
 js=(dist/match[1].lstrip('/')).read_text()
 js=re.sub(r'\"(/assets/[^\"\\]+)\"',inline_asset,js)
 js=js.replace('</script','<\\/script')
 return '<script>'+js+'</script>'
html=re.sub(r'<script src=\"([^\"]+)\" defer></script>',inline_script,html)
portable_history = """<script>if(location.protocol==='file:'){const original=location.pathname;for(const method of ['pushState','replaceState']){const native=history[method].bind(history);history[method]=(state,title,url)=>native(state,title,original+(url?'#'+encodeURIComponent(String(url)):''));}}</script>"""
html=html.replace('<div id="root"></div>','<div id="root"></div>'+portable_history)
icon='data:image/png;base64,'+base64.b64encode((root/'assets/favicon.png').read_bytes()).decode()
html=html.replace('/favicon.ico',icon).replace('<html lang="en">','<html lang="ar">')
html=html.replace('<title>ZOLNU</title>','<title>ZOLNU — تجربة التطبيق</title>')
out=root.parent/'ZOLNU-preview.html';out.write_text(html)
print(f'Portable preview: {out.name} ({out.stat().st_size:,} bytes)')
