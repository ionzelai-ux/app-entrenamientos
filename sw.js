// CODEK Training Service Worker
const CACHE = 'codek-v1';
const ASSETS = [
  '/app-entrenamientos/',
  '/app-entrenamientos/index.html',
  '/app-entrenamientos/manifest.json',
  '/app-entrenamientos/icon-192.png',
  '/app-entrenamientos/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Network first for Supabase, cache first for assets
  if(e.request.url.includes('supabase.co')){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
  } else {
    e.respondWith(
      caches.match(e.request).then(function(r){ return r || fetch(e.request); })
    );
  }
});
