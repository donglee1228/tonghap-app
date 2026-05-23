/* 옷싹 서비스워커 - 최소 설치/페치 캐시 */
const CACHE = "otssak-v1";
const ASSETS = [
  ".",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // data.json 은 네트워크 우선 (최신 가격 반영), 실패 시 캐시
  if (req.url.includes("data.json")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 그 외 정적 자원은 캐시 우선
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
