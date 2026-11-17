import { EVENING, WEEKLY, PERIODIC, TIPS, EMERGENCY, SEE_DOCTOR } from "./data.js";

// ---------- state ----------
const KEY = "chamcon-v1";
const DEFAULT_SETTINGS = {
  child: "bé", eveningTime: "20:30", satTime: "09:00", sunTime: "09:00",
  med: true, tempMin: 25, tempMax: 28, humMin: 40, humMax: 60,
};
const S = load();

function load() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* fresh start */ }
  return {
    settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) },
    daily: s.daily || {}, weekly: s.weekly || {}, periodic: s.periodic || {}, flares: s.flares || [],
  };
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(S));
  // The service worker can't read localStorage; give it a copy for background reminders.
  if ("caches" in window) {
    caches.open("chamcon-state")
      .then((c) => c.put("./__state.json", new Response(JSON.stringify(S), { headers: { "content-type": "application/json" } })))
      .catch(() => {});
  }
}

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, "0");
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysSince = (k) => Math.round((parseKey(dkey()) - parseKey(k)) / 864e5);
// Weekend = the Saturday of the current Mon–Sun week.
const saturdayOf = (d = new Date()) => addDays(d, d.getDay() === 0 ? -1 : 6 - d.getDay());
const DOW = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const minutesOf = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

// ---------- derived ----------
const eveningItems = () => EVENING.filter((i) => !i.med || S.settings.med);
const weeklyItems = () => WEEKLY.filter((i) => !i.med || S.settings.med);
const day = (k = dkey()) => (S.daily[k] ||= { done: {} });
const week = (k = dkey(saturdayOf())) => (S.weekly[k] ||= { done: {} });

function eveningDone(rec) {
  if (!rec) return 0;
  return eveningItems().filter((i) => (i.id === "measure" ? rec.temp != null && rec.hum != null : rec.done?.[i.id])).length;
}
function weekDone(rec) { return rec ? weeklyItems().filter((i) => rec.done?.[i.id]).length : 0; }
function streak() {
  let n = 0, d = new Date();
  if (eveningDone(S.daily[dkey(d)]) < eveningItems().length) d = addDays(d, -1);
  while (eveningDone(S.daily[dkey(d)]) >= eveningItems().length) { n++; d = addDays(d, -1); }
  return n;
}
function duePeriodic() {
  return PERIODIC.map((p) => {
    const last = S.periodic[p.id];
    const since = last ? daysSince(last) : null;
    return { ...p, last, left: last ? p.days - since : 0 };
  }).sort((a, b) => a.left - b.left);
}
function assess(t, h) {
  const s = S.settings, out = [];
  if (t != null) {
    if (t < s.tempMin) out.push(["warn", `🥶 Hơi lạnh (${t}°C). Tăng điều hòa lên ${s.tempMin}–${s.tempMax}°C, đắp chăn cotton mỏng.`]);
    else if (t > s.tempMax) out.push(["warn", `🥵 Hơi nóng (${t}°C). Bé ra mồ hôi sẽ ngứa hơn: chỉnh điều hòa về ${s.tempMin}–${s.tempMax}°C, mặc đồ mỏng.`]);
    else out.push(["ok", `👍 Nhiệt độ ${t}°C là phù hợp.`]);
  }
  if (h != null) {
    if (h < s.humMin) out.push(["warn", `🏜️ Không khí khô (${h}%). Da bé dễ khô: thoa kem kỹ hơn; đặt chậu nước trong phòng hoặc dùng chế độ tạo ẩm (nếu máy có).`]);
    else if (h > s.humMax) out.push(["warn", `💧 Độ ẩm cao (${h}%). Mạt bụi, nấm mốc dễ phát triển: bật chế độ Dry của điều hòa 1–2 giờ, không phơi đồ trong phòng ngủ.`]);
    else out.push(["ok", `👍 Độ ẩm ${h}% là phù hợp.`]);
  }
  return out;
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };

// ---------- views ----------
let tab = "today";
let flareForm = null; // { level } while the "ghi lại đợt nổi mẩn" form is open
const app = document.getElementById("app");

function checkItem(item, done, action, extra = "") {
  return `<li class="item ${done ? "done" : ""}">
    <button class="check" data-act="${action}" data-id="${item.id}" aria-pressed="${!!done}" aria-label="${esc(item.title)}">${done ? "✓" : ""}</button>
    <div class="txt"><div class="t">${esc(item.title)}</div><div class="d">${esc(item.detail)}</div>${extra}</div>
  </li>`;
}

function viewToday() {
  const now = new Date(), rec = day(), items = eveningItems();
  const doneN = eveningDone(rec), total = items.length;
  const late = nowMinutes() >= minutesOf(S.settings.eveningTime);
  const wk = week(), wDone = weekDone(wk), wTotal = weeklyItems().length;
  const dow = now.getDay();
  const tip = TIPS[Math.floor(parseKey(dkey()) / 864e5) % TIPS.length];
  const due = duePeriodic().filter((p) => p.left <= 0).length;

  let banner = "";
  if ((dow === 6 || dow === 0) && wDone < wTotal) {
    banner = `<div class="card orange"><div class="card-title"><h2>🧹 ${dow === 6 ? "Hôm nay thứ 7: vệ sinh phòng cho bé" : `Chủ nhật: còn ${wTotal - wDone} việc chưa xong`}</h2></div>
      <p class="small">Đã xong ${wDone}/${wTotal} việc cuối tuần.</p>
      <button class="btn primary block" data-go="weekend">Xem việc cần làm</button></div>`;
  } else if (dow === 5) {
    banner = `<div class="card teal small">📅 Mai là thứ 7: nhớ dành thời gian vệ sinh phòng ngủ, giặt ga gối cho ${esc(S.settings.child)}.</div>`;
  } else if ((dow === 6 || dow === 0) && wDone === wTotal) {
    banner = `<div class="card green small">✅ Tuần này đã vệ sinh phòng xong. Tuyệt vời!</div>`;
  }

  const readings = `<div class="readings">
      <label class="field"><span>Nhiệt độ (°C)</span><input id="temp" inputmode="decimal" placeholder="vd 26" value="${rec.temp ?? ""}"></label>
      <label class="field"><span>Độ ẩm (%)</span><input id="hum" inputmode="decimal" placeholder="vd 55" value="${rec.hum ?? ""}"></label>
    </div>
    <div class="advice">${assess(rec.temp, rec.hum).map(([c, t]) => `<div class="${c}">${t}</div>`).join("")}</div>`;

  return `<div class="head"><div><div class="date">${DOW[dow]}, ${fmt(now)}</div><h1>Chăm ${esc(S.settings.child)} 💚</h1></div></div>
    ${banner}
    <div class="card">
      <div class="card-title"><h2>🌙 Tối nay</h2>
        <span class="pill ${doneN === total ? "green" : late ? "orange" : "grey"}">${doneN === total ? "Xong rồi" : late ? `${doneN}/${total} · đến giờ` : `${doneN}/${total} · ${S.settings.eveningTime}`}</span></div>
      <div class="progress"><i style="width:${(doneN / total) * 100}%"></i></div>
      <ul class="list">${items.map((i) => checkItem(i, i.id === "measure" ? rec.temp != null && rec.hum != null : rec.done[i.id], "eve", i.id === "measure" ? readings : "")).join("")}</ul>
    </div>
    <div class="stats">
      <div class="stat"><b>${streak()}</b><span>ngày liên tục</span></div>
      <div class="stat"><b>${wDone}/${wTotal}</b><span>việc cuối tuần</span></div>
      <div class="stat" data-go="weekend"><b>${due}</b><span>việc định kỳ đến hạn</span></div>
    </div>
    <div class="card teal tip"><div class="cat">💡 Mẹo hôm nay · ${esc(tip.cat)}</div><p>${esc(tip.text)}</p></div>
    <div class="card red small"><b>🚑 Đi cấp cứu ngay (115) nếu bé:</b> khó thở, thở rít, sưng môi/mặt/lưỡi, lừ đừ sau khi nổi mề đay.
      <a href="#" data-go="tips">Xem thêm</a></div>`;
}

function viewWeekend() {
  const sat = saturdayOf(), wk = week(), items = weeklyItems();
  const doneN = weekDone(wk), total = items.length, dow = new Date().getDay();
  const status = doneN === total ? `<span class="pill green">Hoàn thành</span>`
    : dow === 0 ? `<span class="pill red">Còn ${total - doneN} việc</span>`
    : dow === 6 ? `<span class="pill orange">Hôm nay</span>`
    : `<span class="pill grey">Thứ 7 · ${S.settings.satTime}</span>`;
  const periodic = duePeriodic();
  const history = Object.keys(S.weekly).filter((k) => k !== dkey(sat)).sort().reverse().slice(0, 6);

  return `<div class="head"><div><div class="date">Thứ 7 ${fmt(sat)} – CN ${fmt(addDays(sat, 1))}</div><h1>Vệ sinh cuối tuần</h1></div></div>
    <div class="card">
      <div class="card-title"><h2>🧹 Việc hằng tuần</h2>${status}</div>
      <div class="progress"><i style="width:${(doneN / total) * 100}%"></i></div>
      <p class="small muted">Có thể làm rải rác trong tuần, tick lúc nào cũng được. Thứ 7 app nhắc, Chủ nhật nhắc lại phần còn sót.</p>
      <ul class="list">${items.map((i) => checkItem(i, wk.done[i.id], "week")).join("")}</ul>
    </div>
    <h3>Việc định kỳ</h3>
    <div class="card"><ul class="list">${periodic.map((p) => {
      const pill = !p.last ? `<span class="pill orange">Chưa làm</span>`
        : p.left <= 0 ? `<span class="pill red">Đến hạn</span>`
        : `<span class="pill grey">còn ${p.left} ngày</span>`;
      const done = p.last && p.left > 0;
      return `<li class="item ${done ? "done" : ""}">
        <button class="check" data-act="per" data-id="${p.id}" aria-label="Đánh dấu đã làm: ${esc(p.title)}">${done ? "✓" : ""}</button>
        <div class="txt"><div class="t">${esc(p.title)}</div><div class="d">${esc(p.detail)}</div>
          <div class="d">Mỗi ${p.days} ngày${p.last ? ` · lần cuối ${fmt(parseKey(p.last))}` : ""}</div></div>
        <div class="side">${pill}</div></li>`;
    }).join("")}</ul></div>
    ${history.length ? `<h3>Các tuần trước</h3><div class="card"><ul class="list">${history.map((k) => {
      const n = weekDone(S.weekly[k]);
      return `<li class="item"><div class="txt"><div class="t">Tuần ${fmt(parseKey(k))}</div></div><span class="pill ${n === total ? "green" : "orange"}">${n}/${total}</span></li>`;
    }).join("")}</ul></div>` : ""}`;
}

function spark(vals, lo, hi, bandLo, bandHi, color) {
  const W = 320, H = 70, n = vals.length, y = (v) => H - 6 - ((v - lo) / (hi - lo)) * (H - 12);
  const x = (i) => 8 + (i * (W - 16)) / (n - 1);
  let path = "", pen = false;
  vals.forEach((v, i) => {
    if (v == null) { pen = false; return; }
    path += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(Math.min(hi, Math.max(lo, v))).toFixed(1)}`; pen = true;
  });
  const dots = vals.map((v, i) => (v == null ? "" : `<circle cx="${x(i)}" cy="${y(Math.min(hi, Math.max(lo, v)))}" r="3" fill="${v < bandLo || v > bandHi ? "#d9534f" : color}"/>`)).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    <rect x="0" y="${y(bandHi)}" width="${W}" height="${y(bandLo) - y(bandHi)}" fill="${color}" opacity=".12" rx="4"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>${dots}</svg>`;
}

function viewDiary() {
  const s = S.settings;
  const days = Array.from({ length: 14 }, (_, i) => dkey(addDays(new Date(), i - 13)));
  const temps = days.map((k) => S.daily[k]?.temp ?? null), hums = days.map((k) => S.daily[k]?.hum ?? null);
  const hasData = temps.some((v) => v != null) || hums.some((v) => v != null);
  const keys = new Set([...Object.keys(S.daily), ...S.flares.map((f) => f.at.slice(0, 10))]);
  const list = [...keys].sort().reverse().slice(0, 30);

  const form = flareForm ? `<div class="card red">
      <h2>Ghi lại đợt nổi mẩn / mề đay</h2>
      <p class="small muted">Ghi càng sớm càng nhớ rõ. Nhiệt độ – độ ẩm tối nay sẽ được gắn kèm.</p>
      <div class="field"><span>Mức độ</span><div class="chips">${["Nhẹ", "Vừa", "Nặng"].map((l) => `<button class="chip ${flareForm.level === l ? "on" : ""}" data-act="lvl" data-id="${l}">${l}</button>`).join("")}</div></div>
      <label class="field" style="margin-top:10px"><span>Vị trí (mặt, tay, lưng…)</span><input id="f-where"></label>
      <label class="field" style="margin-top:10px"><span>Nghi tác nhân (món ăn, thời tiết, chăn, đồ chơi…)</span><input id="f-trigger"></label>
      <label class="field" style="margin-top:10px"><span>Ghi chú (đã xử lý thế nào, bác sĩ nói gì)</span><textarea id="f-note"></textarea></label>
      <div class="row" style="margin-top:10px"><button class="btn primary" data-act="flare-save">Lưu</button><button class="btn ghost" data-act="flare-cancel">Hủy</button></div>
    </div>` : `<button class="btn primary block" data-act="flare-open" style="margin-bottom:14px">＋ Ghi lại đợt nổi mẩn / mề đay</button>`;

  return `<div class="head"><div><div class="date">Mang theo khi đi khám</div><h1>Nhật ký</h1></div></div>
    ${form}
    <div class="card"><h2>14 ngày qua</h2>${hasData ? `
      <div class="legend">Nhiệt độ (°C) · vùng xanh: ${s.tempMin}–${s.tempMax}°C</div>${spark(temps, 18, 34, s.tempMin, s.tempMax, "#2a9d8f")}
      <div class="legend" style="margin-top:8px">Độ ẩm (%) · vùng xanh: ${s.humMin}–${s.humMax}%</div>${spark(hums, 20, 90, s.humMin, s.humMax, "#3b7dd8")}
      <p class="small muted">Chấm đỏ: ngoài khoảng khuyến nghị.</p>`
      : `<p class="muted small">Chưa có số đo. Mỗi tối nhập nhiệt độ – độ ẩm ở tab Hôm nay.</p>`}</div>
    <div class="card">${list.length ? list.map((k) => {
      const r = S.daily[k], fl = S.flares.filter((f) => f.at.startsWith(k));
      const badges = [];
      if (r?.temp != null) badges.push(`<span class="pill ${r.temp < s.tempMin || r.temp > s.tempMax ? "orange" : "grey"}">🌡 ${r.temp}°C</span>`);
      if (r?.hum != null) badges.push(`<span class="pill ${r.hum < s.humMin || r.hum > s.humMax ? "orange" : "grey"}">💧 ${r.hum}%</span>`);
      if (r?.done?.cream) badges.push(`<span class="pill green">Kem ✓</span>`);
      if (S.settings.med && r?.done?.med) badges.push(`<span class="pill green">Thuốc ✓</span>`);
      return `<div class="entry"><div class="when">${DOW[parseKey(k).getDay()]}, ${fmt(parseKey(k))}</div>
        <div class="badges">${badges.join("") || `<span class="muted small">—</span>`}</div>
        ${fl.map((f) => `<div class="flare"><button class="x" data-act="flare-del" data-id="${f.id}" aria-label="Xóa">✕</button>
          <b>🔴 Nổi mẩn ${esc(f.level).toLowerCase()}</b> · ${f.at.slice(11, 16)}${f.where ? ` · ${esc(f.where)}` : ""}
          ${f.trigger ? `<div>Nghi do: ${esc(f.trigger)}</div>` : ""}${f.note ? `<div>${esc(f.note)}</div>` : ""}</div>`).join("")}
      </div>`;
    }).join("") : `<p class="muted small">Chưa có ghi chép nào.</p>`}</div>`;
}

function viewTips() {
  const cats = [...new Set(TIPS.map((t) => t.cat))];
  return `<div class="head"><div><div class="date">Đọc dần mỗi ngày</div><h1>Lời khuyên</h1></div></div>
    <div class="card red"><h2>🚑 Đi cấp cứu ngay / gọi 115 nếu bé:</h2><ul class="bullets">${EMERGENCY.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    <div class="card orange"><h2>🩺 Nên đưa bé đi khám khi:</h2><ul class="bullets">${SEE_DOCTOR.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    ${cats.map((c) => `<h3>${esc(c)}</h3><div class="card"><ul class="tips-list">${TIPS.filter((t) => t.cat === c).map((t) => `<li>${esc(t.text)}</li>`).join("")}</ul></div>`).join("")}
    <p class="small muted">Thông tin chăm sóc chung, không thay thế chỉ định của bác sĩ điều trị cho bé. Khi lời khuyên ở đây khác với bác sĩ, hãy làm theo bác sĩ.</p>`;
}

// ---------- reminders: calendar links + background notifications ----------
function nextAt(dow, hhmm) {
  const d = new Date(), [h, m] = hhmm.split(":").map(Number);
  if (dow != null) d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
  d.setHours(h, m, 0, 0);
  return d;
}
const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const APP_URL = location.href.split(/[?#]/)[0];
function events() {
  const s = S.settings;
  return [
    { id: "evening", label: "Mỗi tối", title: `🌙 Chăm ${s.child}: đo nhiệt độ – độ ẩm, bôi kem dưỡng`, start: nextAt(null, s.eveningTime), rrule: "FREQ=DAILY",
      details: `Mở app Chăm Con để tick checklist tối nay: ${APP_URL}` },
    { id: "sat", label: "Thứ 7", title: `🧹 Thứ 7: vệ sinh phòng ngủ cho ${s.child}`, start: nextAt(6, s.satTime), rrule: "FREQ=WEEKLY;BYDAY=SA",
      details: `Giặt ga gối nước nóng, hút bụi, lau ẩm, vệ sinh lọc máy lọc & điều hòa. Danh sách: ${APP_URL}` },
    { id: "sun", label: "Chủ nhật", title: `🧹 CN: làm nốt việc vệ sinh còn sót (bỏ qua nếu đã xong)`, start: nextAt(0, s.sunTime), rrule: "FREQ=WEEKLY;BYDAY=SU",
      details: `Mở app xem còn việc nào chưa tick: ${APP_URL}` },
  ];
}
function gcalLink(e) {
  const end = new Date(e.start.getTime() + 15 * 60e3);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, details: e.details, dates: `${stamp(e.start)}/${stamp(end)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh", recur: `RRULE:${e.rrule}` });
  return `https://calendar.google.com/calendar/render?${q}`;
}
function icsFile() {
  const escT = (t) => t.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const enc = new TextEncoder();
  const fold = (line) => { // RFC 5545: max 75 octets per line
    const out = []; let cur = "";
    for (const ch of line) { if (enc.encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch; }
    return [...out, cur].join("\r\n");
  };
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ChamCon//VI", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Chăm Con"];
  for (const e of events()) {
    lines.push("BEGIN:VEVENT", `UID:chamcon-${e.id}@tuyendt2.github.io`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, "DURATION:PT15M",
      `RRULE:${e.rrule}`, `SUMMARY:${escT(e.title)}`, `DESCRIPTION:${escT(e.details)}`, `URL:${APP_URL}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT0M", `DESCRIPTION:${escT(e.title)}`, "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
function downloadIcs() {
  const blob = new Blob([icsFile()], { type: "text/calendar;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "cham-con-nhac-viec.ics" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function notifStatus() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  const reg = await navigator.serviceWorker.ready;
  if (!("periodicSync" in reg)) return "foreground";
  const tags = await reg.periodicSync.getTags().catch(() => []);
  return tags.includes("chamcon-check") ? "on" : "foreground";
}
async function enableNotifications() {
  if (!("Notification" in window)) return toast("Trình duyệt này không hỗ trợ thông báo. Hãy dùng nhắc bằng Lịch.");
  const p = await Notification.requestPermission();
  if (p !== "granted") return toast("Bạn chưa cho phép thông báo.");
  const reg = await navigator.serviceWorker.ready;
  if ("periodicSync" in reg) {
    try {
      const perm = await navigator.permissions.query({ name: "periodic-background-sync" });
      if (perm.state === "granted") await reg.periodicSync.register("chamcon-check", { minInterval: 60 * 60 * 1000 });
    } catch { /* not installed as app yet */ }
  }
  reg.showNotification("Chăm Con", { body: "Thông báo đã bật 👍", icon: "icons/icon-192.png", tag: "test" });
  render();
}

function viewSettings() {
  const s = S.settings;
  return `<div class="head"><div><div class="date">Nhắc việc & tùy chỉnh</div><h1>Cài đặt</h1></div></div>
    <div class="card teal">
      <h2>🔔 Bước 1: Thêm lịch nhắc vào điện thoại</h2>
      <p class="small">Cách nhắc chắc chắn nhất: app tạo sẵn 3 lịch lặp lại trong ứng dụng Lịch của điện thoại, kể cả khi bạn không mở app.</p>
      <p class="small"><b>Android (Google Calendar):</b> bấm từng nút, rồi bấm <i>Lưu</i>.</p>
      ${events().map((e) => `<a class="btn block" href="${gcalLink(e)}" target="_blank" rel="noopener">📅 ${e.label} · ${e.id === "evening" ? s.eveningTime : e.id === "sat" ? s.satTime : s.sunTime}</a>`).join("")}
      <p class="small" style="margin-top:12px"><b>iPhone / lịch khác:</b> tải file lịch rồi mở để thêm cả 3 lịch một lần (trên iPhone nên mở app bằng Safari khi làm bước này).</p>
      <button class="btn block" data-act="ics">⬇️ Tải file lịch (.ics)</button>
      <p class="small muted">Đổi giờ bên dưới thì thêm lại lịch (và xóa lịch cũ).</p>
    </div>
    <div class="card">
      <h2>📲 Bước 2 (Android): thông báo từ app</h2>
      <p class="small">Khi đã cài app ra màn hình chính, Chrome Android có thể tự kiểm tra định kỳ và chỉ báo khi bạn <b>chưa tick xong</b> (vd Chủ nhật chỉ báo nếu thứ 7 còn sót). Giờ báo có thể trễ, nên vẫn giữ lịch ở Bước 1.</p>
      <p class="small" id="notif-status">Đang kiểm tra…</p>
      <button class="btn primary block" data-act="notif">Bật thông báo</button>
    </div>
    <div class="card">
      <h2>⏰ Giờ nhắc</h2>
      <div class="grid2">
        <label class="field"><span>Mỗi tối</span><input type="time" data-set="eveningTime" value="${s.eveningTime}"></label>
        <label class="field"><span>Thứ 7</span><input type="time" data-set="satTime" value="${s.satTime}"></label>
        <label class="field"><span>Chủ nhật</span><input type="time" data-set="sunTime" value="${s.sunTime}"></label>
        <label class="field"><span>Tên gọi của bé</span><input data-set="child" value="${esc(s.child)}"></label>
      </div>
      <label class="switch"><span>Bé đang dùng thuốc dự phòng hen<br><span class="small muted">Thêm nhắc dùng thuốc & rửa buồng đệm</span></span>
        <input type="checkbox" data-set="med" ${s.med ? "checked" : ""}></label>
    </div>
    <div class="card">
      <h2>🌡 Khoảng phù hợp cho phòng ngủ</h2>
      <p class="small muted">Chỉnh theo lời dặn của bác sĩ của bé.</p>
      <div class="grid2">
        <label class="field"><span>Nhiệt độ thấp nhất (°C)</span><input inputmode="decimal" data-set="tempMin" value="${s.tempMin}"></label>
        <label class="field"><span>Nhiệt độ cao nhất (°C)</span><input inputmode="decimal" data-set="tempMax" value="${s.tempMax}"></label>
        <label class="field"><span>Độ ẩm thấp nhất (%)</span><input inputmode="decimal" data-set="humMin" value="${s.humMin}"></label>
        <label class="field"><span>Độ ẩm cao nhất (%)</span><input inputmode="decimal" data-set="humMax" value="${s.humMax}"></label>
      </div>
    </div>
    <div class="card">
      <h2>💾 Dữ liệu</h2>
      <p class="small muted">Dữ liệu chỉ nằm trên điện thoại này. Sao lưu trước khi đổi máy hoặc xóa trình duyệt.</p>
      <div class="row"><button class="btn sm" data-act="export">Sao lưu</button>
        <label class="btn sm">Khôi phục<input type="file" accept="application/json" id="import" hidden></label>
        <button class="btn sm danger" data-act="wipe">Xóa hết</button></div>
    </div>
    <div class="card small">
      <h2>📱 Cài app ra màn hình chính</h2>
      <p><b>Android (Chrome):</b> menu ⋮ → <i>Thêm vào màn hình chính / Cài đặt ứng dụng</i>.</p>
      <p><b>iPhone (Safari):</b> nút Chia sẻ → <i>Thêm vào MH chính</i>.</p>
      <p class="muted">App chạy được cả khi không có mạng.</p>
    </div>`;
}

const VIEWS = { today: viewToday, weekend: viewWeekend, diary: viewDiary, tips: viewTips, settings: viewSettings };
function render() {
  app.innerHTML = VIEWS[tab]();
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  if (tab === "settings") {
    notifStatus().then((st) => {
      const el = document.getElementById("notif-status");
      if (el) el.textContent = {
        on: "✅ Đang bật: app sẽ tự nhắc khi chưa hoàn thành.",
        foreground: "⚠️ Đã cho phép thông báo, nhưng trình duyệt chưa cho nhắc nền (cần cài app ra màn hình chính trên Chrome Android). Hãy dùng lịch ở Bước 1.",
        off: "Chưa bật.", denied: "❌ Thông báo bị chặn: mở cài đặt trình duyệt để cho phép.",
        unsupported: "Thiết bị này không hỗ trợ: hãy dùng lịch ở Bước 1.",
      }[st];
    });
  }
}
function go(t) { tab = t; flareForm = null; render(); scrollTo(0, 0); }

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3200);
}

// ---------- events ----------
document.querySelector(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) go(b.dataset.tab); });

app.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) { e.preventDefault(); return go(g.dataset.go); }
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const { act, id } = b.dataset;
  if (act === "eve") {
    if (id === "measure") return document.getElementById("temp")?.focus();
    const r = day(); r.done[id] = !r.done[id];
    save(); render();
    if (eveningDone(r) === eveningItems().length) toast("🌟 Xong việc tối nay! Chúc bé ngủ ngon.");
  } else if (act === "week") {
    const w = week(); w.done[id] = !w.done[id];
    save(); render();
    if (weekDone(w) === weeklyItems().length) toast("🎉 Đã vệ sinh xong cả tuần!");
  } else if (act === "per") {
    const p = PERIODIC.find((x) => x.id === id);
    if (S.periodic[id] === dkey()) delete S.periodic[id]; // undo a tap made today
    else { S.periodic[id] = dkey(); toast(`Đã ghi nhận. Lần tới: ${fmt(addDays(new Date(), p.days))}`); }
    save(); render();
  } else if (act === "flare-open") { flareForm = { level: "Nhẹ" }; render(); }
  else if (act === "flare-cancel") { flareForm = null; render(); }
  else if (act === "lvl") {
    flareForm.level = id;
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.id === id));
  } else if (act === "flare-save") {
    const v = (x) => document.getElementById(x).value.trim();
    const now = new Date(), r = S.daily[dkey()];
    S.flares.push({ id: String(now.getTime()), at: `${dkey(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
      level: flareForm.level, where: v("f-where"), trigger: v("f-trigger"), note: v("f-note"), temp: r?.temp ?? null, hum: r?.hum ?? null });
    flareForm = null; save(); render(); toast("Đã lưu vào nhật ký.");
  } else if (act === "flare-del") {
    if (confirm("Xóa ghi chép này?")) { S.flares = S.flares.filter((f) => f.id !== id); save(); render(); }
  } else if (act === "ics") downloadIcs();
  else if (act === "notif") enableNotifications();
  else if (act === "export") {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `cham-con-${dkey()}.json` });
    document.body.append(a); a.click(); a.remove();
  } else if (act === "wipe") {
    if (confirm("Xóa toàn bộ dữ liệu (checklist, nhật ký, cài đặt)?")) { localStorage.removeItem(KEY); location.reload(); }
  }
});

app.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.id === "temp" || el.id === "hum") {
    const r = day(); r[el.id] = num(el.value);
    save(); render();
  } else if (el.dataset.set) {
    const k = el.dataset.set;
    S.settings[k] = el.type === "checkbox" ? el.checked : typeof DEFAULT_SETTINGS[k] === "number" ? (num(el.value) ?? DEFAULT_SETTINGS[k]) : (el.value || DEFAULT_SETTINGS[k]);
    save(); render(); toast("Đã lưu");
  } else if (el.id === "import" && el.files[0]) {
    try {
      const data = JSON.parse(await el.files[0].text());
      if (!data.settings) throw new Error();
      localStorage.setItem(KEY, JSON.stringify(data)); location.reload();
    } catch { toast("File không hợp lệ."); }
  }
});

// Re-render when the app comes back (e.g. opened from a reminder the next day).
document.addEventListener("visibilitychange", () => { if (!document.hidden && !flareForm) render(); });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
if (location.hash.slice(1) in VIEWS) tab = location.hash.slice(1);
addEventListener("hashchange", () => { if (location.hash.slice(1) in VIEWS) go(location.hash.slice(1)); });
save();
render();
