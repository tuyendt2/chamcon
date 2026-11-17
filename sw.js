// Offline cache + background reminders. Bump VERSION on every deploy.
const VERSION = "chamcon-v1";
const SHELL = ["./", "./index.html", "./style.css", "./app.js", "./data.js", "./manifest.webmanifest",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== "chamcon-state").map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Network first (so updates arrive), cache as offline fallback.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then((hit) => hit || (e.request.mode === "navigate" ? caches.match("./") : Response.error()))),
  );
});

// ---- Background reminders (Chrome Android, installed app, periodic background sync) ----
// Keep these ids in step with data.js. "*" = only when the asthma-medicine setting is on.
const EVE = ["measure", "cream", "med*", "purifier", "clothes"];
const WEEK = ["bedding", "vacuum", "wipe", "purifier", "ac", "toys", "spacer*", "nails", "meters"];

const pad = (n) => String(n).padStart(2, "0");
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const mins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const ids = (list, med) => list.filter((i) => med || !i.endsWith("*")).map((i) => i.replace("*", ""));

async function check() {
  const store = await caches.open("chamcon-state");
  const res = await store.match("./__state.json");
  if (!res) return;
  const S = await res.json(), s = S.settings;
  const sentRes = await store.match("./__sent.json");
  const sent = sentRes ? await sentRes.json() : {};
  const now = new Date(), today = dkey(now), m = now.getHours() * 60 + now.getMinutes(), dow = now.getDay();
  const notes = [];

  // Evening: after the set time, until 23:30, if not everything is ticked.
  const r = S.daily[today] || { done: {} };
  const eveLeft = ids(EVE, s.med).filter((id) => (id === "measure" ? r.temp == null || r.hum == null : !r.done?.[id])).length;
  if (m >= mins(s.eveningTime) && m < 23 * 60 + 30 && eveLeft > 0 && !sent["eve-" + today]) {
    notes.push(["eve-" + today, `🌙 Tối nay còn ${eveLeft} việc cho ${s.child}`, "Đo nhiệt độ – độ ẩm phòng, bôi kem dưỡng…"]);
  }
  // Weekend: Saturday reminder, Sunday only if something is left.
  if (dow === 6 || dow === 0) {
    const sat = new Date(now); if (dow === 0) sat.setDate(sat.getDate() - 1);
    const w = S.weekly[dkey(sat)] || { done: {} };
    const left = ids(WEEK, s.med).filter((id) => !w.done?.[id]).length;
    const at = dow === 6 ? s.satTime : s.sunTime, key = "wk-" + today;
    if (left > 0 && m >= mins(at) && m < 21 * 60 && !sent[key]) {
      notes.push([key, dow === 6 ? "🧹 Thứ 7: vệ sinh phòng ngủ cho bé" : `🧹 Chủ nhật: còn ${left} việc vệ sinh chưa xong`,
        `Còn ${left} việc: giặt ga gối, hút bụi, vệ sinh lọc máy…`]);
    }
  }
  for (const [key, title, body] of notes) {
    await self.registration.showNotification(title, { body, tag: key, icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: key.startsWith("wk") ? "./#weekend" : "./" } });
    sent[key] = 1;
  }
  if (notes.length) {
    // Keep only recent keys.
    const keep = Object.fromEntries(Object.entries(sent).filter(([k]) => k.slice(-10) >= dkey(new Date(Date.now() - 7 * 864e5))));
    await store.put("./__sent.json", new Response(JSON.stringify(keep)));
  }
}

self.addEventListener("periodicsync", (e) => { if (e.tag === "chamcon-check") e.waitUntil(check()); });
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const c = list.find((w) => w.url.startsWith(self.registration.scope));
    return c ? c.navigate(url).then((w) => (w || c).focus()) : self.clients.openWindow(url);
  }));
});
