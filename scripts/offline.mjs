import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = await readdir('dist/assets');
const hash = createHash('sha256').update(await readFile('dist/index.html')).update(assets.join(',')).digest('hex').slice(0,16);
await writeFile('dist/sw.js', `const cacheName = ${JSON.stringify('pulsebridge-'+hash)};
const files = ${JSON.stringify(['/index.html', ...assets.map(a=>'/assets/'+a)])};
self.addEventListener('install', e => e.waitUntil(caches.open(cacheName).then(c=>c.addAll(files))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pulsebridge-')&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==location.origin) return;
 if(e.request.mode==='navigate' && url.pathname==='/') e.respondWith(caches.open(cacheName).then(c=>c.match('/index.html')).then(r=>r||fetch(e.request)));
 else if(files.includes(url.pathname)) e.respondWith(caches.open(cacheName).then(c=>c.match(e.request)).then(r=>r||fetch(e.request)));
});`);
