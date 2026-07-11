// CODEK Training Service Worker - v2 (network-first)
const CACHE = 'codek-v2-' + Date.now();

self.addEventListener('install', function(e){
  // Activate new SW immediately, don't wait for old one to finish
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  const url = e.request.url;
  
  // Supabase: network only, no cache
  if(url.includes('supabase.co')){
    e.respondWith(fetch(e.request));
    return;
  }
  
  // HTML files (index.html or root): NETWORK FIRST - always try to get fresh version
  // Fall back to cache only if offline
  if(e.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(function(response){
        // Cache the fresh version for offline fallback
        const clone = response.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        return response;
      }).catch(function(){
        // Offline: use cache
        return caches.match(e.request);
      })
    );
    return;
  }
  
  // Other assets (icons, manifest, fonts): cache first for speed
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        const clone = response.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        return response;
      });
    })
  );
});

// Listen for skip waiting message from the page
self.addEventListener('message', function(event){
  if(event.data === 'skipWaiting') self.skipWaiting();
});
