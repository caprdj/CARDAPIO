// Nome do cache — se mudar algo grande, troque o v1 por v2, v3...
const CACHE_NAME = "cardapio-cache-v1";

// Arquivos principais para funcionar offline
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
  // Se você tiver outros arquivos fixos (ex: ./icons/icon-192.png), pode adicionar aqui
];

// Instalação do service worker: guarda os arquivos no cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos, se houver
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições: tenta usar o cache primeiro, depois a rede
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Só tratamos GET; POST/PUT/etc vão direto para a rede
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).catch(() => {
        // Se der erro na rede e não tiver no cache, simplesmente falha
        // (poderia retornar uma página offline aqui, se você quiser futuramente)
        return new Response(
          "Você está offline e este recurso não está em cache.",
          { status: 503, statusText: "Offline" }
        );
      });
    })
  );
});
