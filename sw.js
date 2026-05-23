/* 옷싹 서비스워커 v2 - 항상 최신 우선(network-first), 오프라인 시 캐시 */
const CACHE = "otssak-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(이미지 프록시 등)는 그대로 통과

  // 네트워크 우선: 최신을 받고, 받은 건 캐시에 저장. 오프라인이면 캐시로 폴백.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
