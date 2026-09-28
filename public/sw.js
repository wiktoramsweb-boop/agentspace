// AgentSpace, service worker.
//
// Dwie rzeczy: instalowalna apka z sensownym zachowaniem bez zasięgu
// oraz powiadomienia push.
//
// UWAGA na cache: nie trzymamy tu ani HTML-a z /app, ani odpowiedzi z /api.
// To są dane zalogowanego człowieka, a z jednego telefonu potrafi korzystać
// więcej niż jedna osoba. Cache'ujemy wyłącznie rzeczy publiczne i niezmienne.

const VERSION = "v2";
const STATIC_CACHE = `as-static-${VERSION}`;
const OFFLINE_URL = "/offline";

/** Minimum, które musi być pod ręką, gdy sieć padnie. */
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Pliki Next.js mają hash w nazwie, więc raz pobrane nigdy się nie zmienią. */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/wzory/") ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Dane i logowanie zawsze z sieci. Nigdy z cache'u.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Wejście na stronę: próbujemy sieci, a gdy jej nie ma, pokazujemy
  // własny ekran zamiast komunikatu przeglądarki.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? new Response("Brak połączenia", { status: 503 });
      }),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cache'ujemy tylko to, co faktycznie się pobrało.
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});

// --- Push ---

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "AgentSpace";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Powiadomienia o tym samym zdarzeniu mają się podmieniać, a nie mnożyć.
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    requireInteraction: Boolean(data.important),
    data: { url: data.url || "/app" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Apka już otwarta: przenosimy ją na właściwy ekran, zamiast otwierać drugą.
      for (const client of list) {
        if (client.url.includes("/app") && "focus" in client) {
          if ("navigate" in client) client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
