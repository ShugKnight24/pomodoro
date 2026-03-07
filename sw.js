/**
 * Service Worker for Pomidor (Помидор) PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = "pomidor-v3";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/variables.css",
  "/js/app.js",
  "/js/modules/timer.js",
  "/js/modules/todo.js",
  "/js/modules/calendar.js",
  "/js/modules/modal.js",
  "/js/modules/toast.js",
  "/js/modules/settings.js",
  "/js/modules/theme.js",
  "/js/modules/stats.js",
  "/js/modules/keyboard.js",
  "/js/modules/focusMode.js",
  "/js/modules/achievements.js",
  "/js/modules/volume.js",
  "/js/modules/utils.js",
  "/js/modules/pomodoro.js",
  "/js/modules/sectionToggle.js",
  "/js/modules/i18n.js",
  "/js/modules/modernTimer.js",
  "/js/modules/sceneAndNav.js",
  "/js/modules/vault.js",
  "/js/modules/kanban.js",
  "/js/components/progress-ring.js",
  "/js/components/hour-glass.js",
  "/js/utils/todoDragDrop.js",
  "/audio/buzzer.mp3",
  "/manifest.json",
  "/icons/brand/pomidor_en.webp",
  "/icons/brand/\u043f\u043e\u043c\u0438\u0434\u043e\u0440_ru.webp",
];

// External resources to cache
const EXTERNAL_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Happy+Monkey&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
];

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        // Cache static assets first
        return cache.addAll(STATIC_ASSETS).then(() => {
          // Try to cache external assets, but don't fail if they're unavailable
          return Promise.allSettled(
            EXTERNAL_ASSETS.map((url) =>
              cache
                .add(url)
                .catch((err) => console.log("Could not cache:", url)),
            ),
          );
        });
      })
      .then(() => self.skipWaiting()),
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // Fetch and update cache in background (stale-while-revalidate)
        event.waitUntil(
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {}), // Ignore network errors during background update
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

/**
 * Handle background sync for data
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-stats") {
    event.waitUntil(syncStats());
  }
});

/**
 * Sync stats when back online
 */
async function syncStats() {
  // Future: Sync stats to a server when online
  console.log("Background sync triggered");
}

/**
 * Handle push notifications
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Time to focus!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    vibrate: [200, 100, 200],
    tag: "pomodoro-notification",
    requireInteraction: false,
    actions: [
      { action: "start", title: "Start Timer" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Pomodoro Timer", options),
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "start") {
    event.waitUntil(clients.openWindow("/?action=start"));
  } else {
    event.waitUntil(clients.openWindow("/"));
  }
});
