/* Cardápio (Mãe) — Service Worker */
const CACHE_NAME = "cardapio-mae-v34";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Estratégia simples: cache-first para arquivos locais; network-first para o restante
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Só intercepta dentro do escopo do GitHub Pages do app
  if (!url.pathname.includes("/CARDAPIO-mae/")) return;

  // Arquivos estáticos: cache-first
  if (url.pathname.endsWith(".html") || url.pathname.endsWith(".json") || url.pathname.endsWith(".png") || url.pathname.endsWith(".js") || url.pathname.endsWith("/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        // fallback: index.html
        const fallback = await cache.match("./index.html");
        return fallback || Response.error();
      }
    })());
    return;
  }

  // Demais: tenta rede e cai no cache
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await cache.match(req, { ignoreSearch: true });
      return cached || Response.error();
    }
  })());
});
