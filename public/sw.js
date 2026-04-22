const CACHE="financas-v12";
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/index.html"])));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  if(e.request.url.includes("pocketbase")||e.request.url.includes("/api/"))return;
  const url=new URL(e.request.url);
  if(url.pathname.startsWith("/assets/")){
    e.respondWith(caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r});
    }));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});
