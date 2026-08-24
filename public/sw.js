self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "US360", body: "You have a thoughtful reminder." };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon.svg" }));
});
