// Service worker tối giản: cache shell + chiến lược network-first cho API,
// stale-while-revalidate cho asset tĩnh.
const CACHE_NAME = "phongkham-v1"
const SHELL = ["/", "/login", "/manifest.json", "/favicon.svg", "/icons/icon-192.svg", "/icons/icon-512.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Bỏ qua API và auth — luôn đi mạng để tránh trả dữ liệu cũ
  if (url.pathname.startsWith("/api/")) return

  // Static asset: stale-while-revalidate
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          }
          return res
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // HTML: network-first, fallback cache
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && req.headers.get("accept")?.includes("text/html")) {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, copy))
      }
      return res
    }).catch(() => caches.match(req).then((c) => c || caches.match("/")))
  )
})
