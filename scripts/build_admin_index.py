"""Build the editing dashboard's index from the active repo files."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PAGES=[
 ('Homepage','content/_index.md','layouts/index.html'),
 ('Sites / field notes','content/sites/_index.md','layouts/_default/single.html'),
 ('Audio overview','content/exhibition/_index.md','layouts/exhibition/list.html'),
 ('Audio pages','content/exhibition/kesoberi.md','layouts/exhibition/single.html'),
 ('About','content/about.md','layouts/_default/single.html'),
 ('Map','content/map.md','layouts/_default/map.html'),
 ('News','content/news.md','layouts/news/single.html'),
 ('Installations','content/installs.md','layouts/installs/single.html'),
 ('Cressingham interactive map','content/cressingham-install.md','layouts/installs/detail.html'),
 ('Thoughts','content/thoughts.md','layouts/thoughts/single.html'),
 ('Quotes','static/data/twt_quotes.json','layouts/quotes/Single.html'),
 ('Thank you','content/thankyou.md','layouts/thankyou/single.html'),
 ('Link in bio','content/linkinbio.md','layouts/linkinbio/single.html'),
 ('Press','content/press.md','layouts/_default/single.html'),
]
DESCRIPTIONS={'static/admin/config.yml':'Content editor fields and collections','static/admin/index.html':'Sveltia CMS loader','static/css/style.css':'Main shared stylesheet and fonts','static/css/core-nav.css':'Shared standalone-page navigation','layouts/_default/baseof.html':'Main HTML shell, metadata and shared assets','layouts/partials/core-nav.html':'Shared navigation markup','static/JS/gallery.js':'Dropbox galleries','static/JS/supercharged.js':'Audio players and shared behaviour','hugo.toml':'Hugo website configuration'}
def group(path):
 if path.startswith('content/') or path.startswith('static/data/'):return 'content'
 if path.startswith('layouts/'):return 'layouts'
 if path.startswith('static/css/'):return 'styles'
 if path.startswith('static/JS/'):return 'scripts'
 if path.startswith('static/tools/'):return 'tools'
 return 'settings'
def main():
 files=[]
 for prefix in ('content','layouts','static/css','static/JS','static/tools','static/admin','static/data'):
  for p in sorted((ROOT/prefix).rglob('*')):
   if not p.is_file() or p.suffix not in ('.md','.html','.css','.js','.yml','.json'):continue
   path=p.relative_to(ROOT).as_posix()
   if '_old' in p.stem or '_backup' in p.stem or p.stem.endswith('_latest'):continue
   files.append({'path':path,'group':group(path),'description':DESCRIPTIONS.get(path,p.stem.replace('_',' ').replace('-',' '))})
 files.append({'path':'hugo.toml','group':'settings','description':DESCRIPTIONS['hugo.toml']})
 pages=[]
 for title,content,layout in PAGES:
  assert (ROOT/content).exists(),content
  assert (ROOT/layout).exists(),layout
  pages.append({'title':title,'content':content,'layout':layout,'style':'static/css/style.css'})
 out=ROOT/'static/manage/files.json';out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps({'files':files,'pages':pages},indent=2)+'\n')
 print(f'Indexed {len(files)} active files and {len(pages)} page types')
if __name__=='__main__':main()
