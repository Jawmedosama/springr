// Ça va jobber : affiche les notifications « nouvelles offres pour toi ».
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(d.title || "Ça va jobber", {
      body: d.body || "",
      icon: "/apple-icon",
      badge: "/apple-icon",
      tag: "new-offers",
      data: { url: d.url || "/fr/offres" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/fr/offres";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.includes("/offres"));
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
