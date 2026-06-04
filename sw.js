/* 옷싹 서비스워커 v20260604d
   - install: 앱 셸 프리캐시 (오프라인 첫 방문에도 셸 로드 가능)
   - activate: 구버전 캐시만 삭제(현재 버전 유지) + clients.claim
   - fetch 전략:
       · 내비게이션(HTML 문서): network-first → 실패 시 캐시된 index.html 폴백(앱 셸/오프라인)
       · data.json: stale-while-revalidate (즉시 캐시 반환 + 백그라운드 최신화)
       · 기타 동일 출처 정적 자원(css/js/png/svg/manifest): cache-first + 백그라운드 갱신
       · 외부 출처(이미지 프록시 등): SW 미개입(그대로 통과)
*/
const VERSION = "otssak-v20260604d";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})         // 일부 파일 실패해도 설치는 진행
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 자원은 미개입

  // 1) 내비게이션(HTML 문서) — network-first, 오프라인이면 캐시된 셸로 폴백
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  // 2) data.json — stale-while-revalidate(즉시 캐시 + 백그라운드 최신화)
  if (url.pathname.endsWith("/data.json") || url.pathname.endsWith("data.json")) {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((cached) => {
          const fresh = fetch(req)
            .then((res) => {
              if (res && res.ok) c.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  // 3) 핵심 코드/스타일(app.js·style.css) — network-first
  //    (오래된/깨진 스크립트가 캐시에 박혀 백지가 되는 사고 방지. 오프라인일 때만 캐시 폴백)
  if (url.pathname.endsWith("app.js") || url.pathname.endsWith("style.css")) {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        fetch(req)
          .then((res) => {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          })
          .catch(() => c.match(req))
      )
    );
    return;
  }

  // 4) 기타 동일 출처 정적 자원(아이콘·이미지·manifest) — cache-first + 백그라운드 갱신
  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
