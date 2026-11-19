// غداء البيت — household lunch app (Firebase + GitHub Pages)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, onSnapshot, query, where, orderBy, limit, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { I18N, QUICK_NOTES } from './i18n.js';
import { DISHES, ITEMS } from './seed.js';

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try { db = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(fbApp, {}); }

/* ---------------- constants ---------------- */
const SITE = 'https://ghada-albait.github.io';
const CATS = ['main', 'rice', 'side', 'salad', 'soup', 'dessert'];
const UNITS = ['kg', 'pcs', 'pack', 'bunch', 'tray', 'carton', 'L', 'bag', 'bottle', 'can'];
const ROLES = ['admin', 'family', 'cook', 'driver'];
const LANGS = {
  ar: { dir: 'rtl', loc: 'ar-KW-u-nu-latn', label: 'العربية', gt: 'ar' },
  hi: { dir: 'ltr', loc: 'hi-IN', label: 'हिन्दी', gt: 'hi' },
  bn: { dir: 'ltr', loc: 'bn-BD-u-nu-latn', label: 'বাংলা', gt: 'bn' },
  fil: { dir: 'ltr', loc: 'fil-PH', label: 'Filipino', gt: 'tl' },
  en: { dir: 'ltr', loc: 'en-GB', label: 'English', gt: 'en' }
};
const WD_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DEF = { counts: { main: 1, rice: 0, side: 1, salad: 1, soup: 0, dessert: 0 }, noRepeat: 10, horizon: 14, offDays: [] };
const ROLE_AR = { admin: 'الإدارة', family: 'العائلة', cook: 'الطباخ', driver: 'السائق' };
const ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#F3B35E" stroke-width="5" stroke-linecap="round"><path d="M38 29c-5-5 5-8 0-15"/><path d="M50 27c-5-5 5-8 0-15"/><path d="M62 29c-5-5 5-8 0-15"/></g><g fill="#FFF4E8"><circle cx="50" cy="37" r="4"/><path d="M24 50a26 12 0 0 1 52 0z"/><rect x="18" y="50" width="64" height="6" rx="3"/><path d="M24 58h52v8a14 14 0 0 1-14 14H38a14 14 0 0 1-14-14z"/><rect x="11" y="60" width="11" height="5" rx="2.5"/><rect x="78" y="60" width="11" height="5" rx="2.5"/></g><rect x="24" y="64" width="52" height="3.5" fill="#F3B35E"/></svg>`;
const SV = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11h18"/><path d="M5 11v3a7 7 0 0 0 14 0v-3"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 7h15l-2 9H8z"/><path d="M6 7L5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
  week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
};

/* ---------------- state ---------------- */
const S = {
  uid: null, hid: null, role: null, lang: null, house: null,
  dishes: {}, items: {}, menus: {}, shortages: [], purchases: [], photos: {}, subs: [], members: [], queue: [],
  loaded: {}, view: 'login', tab: 'today', adminTab: 'menu', libTab: 'dishes', month: null, offline: !navigator.onLine
};
let M = null, pending = false, confirmKey = null, unsubs = [], genDone = false, genRunning = false;
const $app = document.getElementById('app'), $modal = document.getElementById('modal'), $sheet = document.getElementById('sheet');

/* ---------------- helpers ---------------- */
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
const L = () => (S.role === 'admin' ? 'ar' : (S.lang || 'ar'));
const t = k => (I18N[L()] && I18N[L()][k]) || I18N.en[k] || k;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pd = s => { const a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const today = () => ymd(new Date());
const fmt = (s, o) => { try { return pd(s).toLocaleDateString(LANGS[L()].loc, o); } catch (e) { return s; } };
const wdName = s => (L() === 'ar' ? WD_AR[pd(s).getDay()] : fmt(s, { weekday: 'long' }));
const money = v => (Number(v) || 0).toFixed(3);
const nm = (o, lang) => { lang = lang || L(); if (!o) return '—'; if (o.custom) return o.custom; return o['name_' + lang] || o.name_en || o.name_ar || '—'; };
const split = s => { const m = String(s || '').match(/^(.*?)\s*\((.*)\)\s*$/); return m ? [m[1], m[2]] : [s, '']; };
const unitL = u => t('u_' + u);
const settings = () => { const s = (S.house && S.house.settings) || {}; return Object.assign({}, DEF, s, { counts: Object.assign({}, DEF.counts, s.counts || {}) }); };
const isTyping = () => { const a = document.activeElement; return a && $app.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.type !== 'checkbox'; };
const monthOf = d => d.slice(0, 7);
function toast(m) { const el = document.getElementById('toast'); el.textContent = m; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2400); }
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const pinHash = (hid, role, pin) => sha(hid + '|' + role + '|' + pin);
const H = (...p) => doc(db, 'households', S.hid, ...p);
const HC = (...p) => collection(db, 'households', S.hid, ...p);
function errMsg(e) { if (e && e.code === 'permission-denied') return L() === 'ar' ? 'لا توجد صلاحية' : 'No permission'; return (e && e.message) || 'Error'; }

/* ---------------- render ---------------- */
let rq = false;
function schedule() { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(); }); }
function render() {
  if (isTyping()) { pending = true; return; }
  pending = false;
  const l = L(); document.documentElement.lang = l; document.documentElement.dir = LANGS[l].dir;
  let h;
  if (S.view === 'boot') h = `<div class="login"><div class="logo big">${ICON}</div><div class="center"><span class="spin"></span></div></div>`;
  else if (S.view === 'login') h = loginView();
  else if (S.view === 'create') h = createView();
  else h = shell();
  $app.innerHTML = h;
}
function langChips(cur) {
  return `<div class="chips">${['ar', 'hi', 'bn', 'fil', 'en'].map(k => `<button class="chip ${cur === k ? 'on' : ''}" data-act="setLang" data-v="${k}">${LANGS[k].label}</button>`).join('')}</div>`;
}
function loginView() {
  return `<div class="login">
  <div class="center"><div class="logo big">${ICON}</div><h1>${esc(t('title'))}</h1></div>
  <div><div class="lbl" style="margin-bottom:8px">اللغة · Language · भाषा · ভাষা · Wika</div>${langChips(S.lang || 'ar')}</div>
  <div class="card" style="padding:20px">
    <div class="field" style="margin-top:0"><label for="code">${esc(t('houseCode'))}</label><input id="code" class="code" autocomplete="off" autocapitalize="characters" value="${esc(ls('lastCode') || '')}"></div>
    <div class="field"><label for="pin">${esc(t('yourPin'))}</label><input id="pin" class="pinbox" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div>
    <button class="block" data-act="login">${esc(t('enter'))}</button>
  </div>
  <p class="center small mute" style="margin:0">${esc(t('loginHint'))}</p>
  <p class="center small" style="margin:auto 0 0"><a href="#" data-act="goCreate">إنشاء بيت جديد (لصاحب البيت)</a></p>
  </div>`;
}
function createView() {
  return `<div class="login" dir="rtl">
  <div class="center"><div class="logo big">${ICON}</div><h1>بيت جديد</h1><p class="mute small" style="margin:0">ينشئ صاحب البيت حساب البيت مرة واحدة، ثم يعطي كل شخص رمزه.</p></div>
  <div class="card" style="padding:20px">
    <div class="field" style="margin-top:0"><label for="hname">اسم البيت</label><input id="hname" placeholder="مثال: بيت الرجيب"></div>
    <div class="field"><label for="hcode">رمز البيت (أحرف إنجليزية وأرقام، 4 إلى 10)</label><input id="hcode" class="code" autocomplete="off" placeholder="RJB24"></div>
    <div class="field"><label for="apin">رمز الإدارة (6 أرقام)</label><input id="apin" class="pinbox" type="password" inputmode="numeric" maxlength="6"></div>
    <div class="field"><label for="apin2">أعد كتابة رمز الإدارة</label><input id="apin2" class="pinbox" type="password" inputmode="numeric" maxlength="6"></div>
    <button class="block" data-act="create">إنشاء البيت</button>
  </div>
  <p class="center small"><a href="#" data-act="goLogin">رجوع لتسجيل الدخول</a></p></div>`;
}
function shell() {
  const r = S.role, l = L();
  let body = '';
  if (!S.loaded.dishes || !S.loaded.menu || !S.house) body = `<div class="empty"><span class="spin"></span></div>`;
  else if (r === 'family') body = familyView();
  else if (r === 'cook') body = cookView();
  else if (r === 'driver') body = driverView();
  else body = adminView();
  const nav = r === 'cook' ? `<nav class="nav"><div class="in">${[['today', 'tabToday'], ['list', 'tabList'], ['week', 'tabWeek']].map(([k, lab]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${SV[k]}${esc(t(lab))}${k === 'list' && S.shortages.length ? ` (${S.shortages.length})` : ''}</button>`).join('')}</div></nav>` : '';
  return `<header class="top"><div class="topin">
    <div class="brand"><div class="logo">${ICON}</div><div style="min-width:0"><div class="ttl">${esc((S.house && S.house.name) || t('title'))}</div><div class="sub">${esc(wdName(today()))} · ${esc(fmt(today(), { day: 'numeric', month: 'long' }))}</div></div></div>
    <div class="actions">${r !== 'admin' ? `<button class="pill" data-act="openLang">${esc(LANGS[l].label)}</button>` : ''}<button class="pill" data-act="openMe">${esc(t('r_' + r))}</button></div>
  </div>${S.offline ? `<div class="banner">${esc(t('offline'))}</div>` : ''}</header>
  <main class="wrap">${body}</main>${nav}`;
}

/* ---------------- dish display ---------------- */
function photoSrc(d) { if (!d) return null; return S.photos[d.id] || (d.photo && d.photo.src) || null; }
function thumb(d) { const s = photoSrc(d); return s ? `<img class="thumb" loading="lazy" src="${esc(s)}" alt="">` : `<div class="thumb ph"><span class="emo">${esc(d.emoji || '🍽️')}</span></div>`; }
function heroImg(d) {
  const s = photoSrc(d);
  if (!s) return `<div class="photo ph"><span class="emo" style="font-size:64px">${esc(d.emoji || '🍽️')}</span></div>`;
  const cr = !S.photos[d.id] && d.photo ? `<a class="credit" href="${esc(d.photo.page)}" target="_blank" rel="noopener">📷 ${esc(d.photo.author || 'Wikimedia')} · ${esc(d.photo.license || '')}</a>` : '';
  return `<div class="heroimg"><img class="photo" src="${esc(s)}" alt="">${cr}</div>`;
}
function dishNames(d, big) {
  const [a, b] = split(nm(d));
  return `<div class="${big ? 'dname' : 'nm'}">${esc(a)}</div>${b ? `<div class="${big ? 'ddesc' : 'meta'}">${esc(b)}</div>` : ''}${L() !== 'ar' ? `<div class="dar">${esc(d.name_ar)}</div>` : ''}`;
}
function menuItems(m) { const out = []; const it = (m && m.items) || {}; CATS.forEach(c => (it[c] || []).forEach(id => { if (S.dishes[id]) out.push([c, S.dishes[id]]); })); return out; }
function notesHtml(m) {
  if (!m) return '';
  const qs = (m.notes || []).filter(k => QUICK_NOTES[k]).map(k => QUICK_NOTES[k][L()] || QUICK_NOTES[k].en);
  const free = (m.note || '').trim();
  if (!qs.length && !free) return '';
  const gt = `https://translate.google.com/?sl=ar&tl=${LANGS[L()].gt}&op=translate&text=${encodeURIComponent(free)}`;
  return `<div class="note"><b>📝 ${esc(t('familyNote'))}</b>${qs.map(q => `<div>• ${esc(q)}</div>`).join('')}${free ? `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',sans-serif">${esc(free)}${L() !== 'ar' ? ` <a class="tr" href="${gt}" target="_blank" rel="noopener">${esc(t('translate'))} ›</a>` : ''}</div>` : ''}</div>`;
}
function heroMenu(date, opt) {
  opt = opt || {}; const m = S.menus[date];
  if (!m) return `<div class="card empty">${esc(t('noMenu'))}</div>`;
  if (m.off) return `<div class="card empty">🚫 ${esc(t('noLunch'))}</div>`;
  const list = menuItems(m); if (!list.length) return `<div class="card empty">${esc(t('noMenu'))}</div>`;
  const [c0, d0] = list[0];
  let h = `<div class="card hero">${heroImg(d0)}<div style="padding:10px 6px 2px"><div class="cat">${esc(t('c_' + c0))}</div>${dishNames(d0, true)}</div>`;
  if (opt.cook && !S.photos[d0.id]) h += `<div style="padding:4px 6px 0"><button class="sm soft" data-act="photo" data-v="${d0.id}">📷 ${esc(t('photoAsk'))}</button></div>`;
  list.slice(1).forEach(([c, d]) => { h += `<div class="row" style="padding:10px 6px">${thumb(d)}<div class="grow">${dishNames(d)}</div><span class="meta">${esc(t('c_' + c))}</span></div>`; });
  h += `</div>` + notesHtml(m);
  if (opt.cook) h += m.seen ? `<div class="center"><span class="badge ok">✓ ${esc(t('gotIt').replace(' ✓', ''))}</span></div>` : `<button class="block" data-act="seen" data-v="${date}">${esc(t('gotIt'))}</button>`;
  else if (m.seen) h += `<div><span class="badge ok">✓ ${esc(t('seen'))}</span></div>`;
  return h;
}
function weekList(start, n, admin) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const d = addDays(start, i), m = S.menus[d];
    let txt;
    if (!m) txt = `<span class="mute">${esc(t('noMenu'))}</span>`;
    else if (m.off) txt = `<span class="mute">🚫 ${esc(t('noLunch'))}</span>`;
    else { const li = menuItems(m); const main = li.filter(x => x[0] === 'main' || x[0] === 'rice').map(x => split(nm(x[1]))[0]); const rest = li.filter(x => x[0] !== 'main' && x[0] !== 'rice').map(x => split(nm(x[1]))[0]); txt = `<div class="nm" style="font-size:15px">${esc(main.join(' + ') || '—')}</div>${rest.length ? `<div class="meta">${esc(rest.join(' · '))}</div>` : ''}`; }
    const first = m && !m.off && menuItems(m)[0];
    const badges = admin && m ? `<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">${m.auto ? '<span class="badge gray">تلقائي</span>' : '<span class="badge">مُعدّل</span>'}${m.seen ? '<span class="badge ok">✓ استلم الطباخ</span>' : ''}${(m.note || (m.notes || []).length) ? '<span class="badge gray">📝</span>' : ''}</div>` : '';
    h += `<div class="row"${admin ? ` data-act="editDay" data-v="${d}" style="cursor:pointer"` : ''}><div class="wd"><b>${esc(wdName(d))}</b><span>${esc(fmt(d, { day: 'numeric', month: 'short' }))}</span></div>${first ? thumb(first[1]) : ''}<div class="grow">${txt}${badges}</div></div>`;
  }
  return `<div class="card flat" style="padding:2px 14px">${h}</div>`;
}

/* ---------------- views ---------------- */
function familyView() {
  const td = today();
  return `<h1 class="page">${esc(t('today'))}</h1>` + heroMenu(td) + `<div class="sec"><h2>${esc(t('tomorrow'))}</h2></div>` + weekList(addDays(td, 1), 1) + `<div class="sec"><h2>${esc(t('thisWeek'))}</h2></div>` + weekList(addDays(td, 2), 6);
}
function cookView() {
  const td = today();
  if (S.tab === 'list') return `<div class="sec"><h2>${esc(t('shortages'))}</h2><button class="sm" data-act="addShort">+ ${esc(t('addMissing'))}</button></div>` + shortList('cook');
  if (S.tab === 'week') return `<div class="sec"><h2>${esc(t('tomorrow'))}</h2><span class="badge">${esc(t('prep'))}</span></div>` + heroMenu(addDays(td, 1)) + `<div class="sec"><h2>${esc(t('thisWeek'))}</h2></div>` + weekList(addDays(td, 2), 6);
  return `<h1 class="page">${esc(t('today'))}</h1>` + heroMenu(td, { cook: true }) + `<div class="card flat" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span class="nm">${esc(t('shortages'))} · ${S.shortages.length}</span><button class="sm soft" data-act="addShort">+ ${esc(t('addMissing'))}</button></div>`;
}
function shortRow(s, mode) {
  const o = (s.itemId && S.items[s.itemId]) || s;
  let act = '';
  if (mode === 'driver' || mode === 'admin') act += `<button class="sm" data-act="buy" data-id="${s.id}">${esc(t('markBought'))}</button>`;
  if (mode === 'cook' || mode === 'admin') act += `<button class="icon" data-act="delShort" data-id="${s.id}" aria-label="${esc(t('del'))}">✕</button>`;
  return `<div class="row"><div class="thumb ph"><span class="emo">${esc(o.emoji || '🛒')}</span></div><div class="grow"><div class="nm">${esc(nm(o))}</div><div class="meta">${esc(s.qty)} ${esc(unitL(s.unit))}${L() !== 'ar' && !s.custom ? ' · ' + esc(o.name_ar || '') : ''}${s.note ? ' · ' + esc(s.note) : ''}</div></div>${act}</div>`;
}
function shortList(mode) {
  if (!S.shortages.length) return `<div class="card empty">${esc(t('nothingToBuy'))}</div>`;
  return `<div class="card flat" style="padding:2px 14px">${S.shortages.map(s => shortRow(s, mode)).join('')}</div>`;
}
const storeL = s => (s === 'coop' ? t('coop') : s === 'supermarket' ? t('supermarket') : (s || t('otherStore')));
function driverView() {
  const tp = S.purchases.filter(p => p.date === today()); const tot = tp.reduce((a, p) => a + (Number(p.price) || 0), 0);
  let h = `<div class="summary"><div style="display:flex;align-items:baseline;gap:8px"><span class="big-n">${S.shortages.length}</span><span>${esc(t('toBuy'))}</span></div>${S.shortages.length ? `<button class="sm" data-act="shareList">${esc(t('share'))}</button>` : ''}</div>`;
  h += shortList('driver') + `<button class="ghost block" data-act="extraBuy">+ ${esc(t('extraPurchase'))}</button>`;
  h += `<div class="sec"><h2>${esc(t('boughtToday'))}</h2>${tp.length ? `<span class="badge">${esc(t('total'))}: ${money(tot)} ${esc(t('kwd'))}</span>` : ''}</div>`;
  h += tp.length ? `<div class="card flat" style="padding:2px 14px">${tp.map(p => { const o = (p.itemId && S.items[p.itemId]) || p; return `<div class="row"><div class="thumb ph"><span class="emo">${esc(o.emoji || '🛒')}</span></div><div class="grow"><div class="nm">${esc(nm(o))}</div><div class="meta">${esc(p.qty)} ${esc(unitL(p.unit))} · ${esc(storeL(p.store))}</div></div><b>${money(p.price)}</b></div>`; }).join('')}</div>` : `<div class="card empty">—</div>`;
  return h;
}
/* --- admin --- */
const TABS = [['menu', 'المنيو'], ['short', 'النواقص'], ['report', 'التقارير'], ['lib', 'المكتبة'], ['set', 'الإعدادات']];
function adminView() {
  let h = `<div class="seg" style="grid-template-columns:repeat(5,1fr)">${TABS.map(([k, l]) => `<button class="${S.adminTab === k ? 'on' : ''}" data-act="atab" data-v="${k}">${l}${k === 'short' && S.shortages.length ? ` (${S.shortages.length})` : ''}${k === 'lib' && S.queue.length ? ` (${S.queue.length})` : ''}</button>`).join('')}</div>`;
  const a = S.adminTab;
  if (a === 'menu') h += adminMenu();
  else if (a === 'short') h += `<div class="sec"><h2>النواقص المفتوحة</h2><button class="sm" data-act="addShort">+ إضافة</button></div>` + shortList('admin') + `<button class="ghost block" data-act="extraBuy">+ تسجيل شراء</button>`;
  else if (a === 'report') h += adminReport();
  else if (a === 'lib') h += adminLib();
  else h += adminSettings();
  return h;
}
function adminMenu() {
  const st = settings(), td = today();
  return `<h1 class="page">غداء اليوم</h1>` + heroMenu(td) + `<div class="sec"><h2>الأيام القادمة</h2><button class="sm soft" data-act="regen">${confirmKey === 'regen' ? 'اضغط للتأكيد' : '🔀 إعادة توليد'}</button></div><p class="small mute" style="margin:0 2px">اضغط على أي يوم لتعديله أو إضافة ملاحظة للطباخ.</p>` + weekList(td, st.horizon, true);
}
function adminLib() {
  let h = `<div class="seg" style="grid-template-columns:repeat(3,1fr)">${[['dishes', 'الأطباق'], ['items', 'السلع'], ['photos', 'صور بانتظارك' + (S.queue.length ? ` (${S.queue.length})` : '')]].map(([k, l]) => `<button class="${S.libTab === k ? 'on' : ''}" data-act="ltab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (S.libTab === 'photos') {
    if (!S.queue.length) return h + `<div class="card empty">لا توجد صور جديدة</div>`;
    return h + S.queue.map(q => { const d = S.dishes[q.dishId]; return `<div class="card"><img class="photo" src="${esc(q.data)}" alt=""><div class="nm" style="margin:8px 2px">${esc(d ? d.name_ar : q.dishId)}</div><div class="btns" style="margin-top:6px"><button data-act="approve" data-id="${q.id}">اعتماد الصورة</button><button class="danger" data-act="reject" data-id="${q.id}">رفض</button></div></div>`; }).join('');
  }
  if (S.libTab === 'items') {
    const all = Object.values(S.items).sort((a, b) => (a.name_ar || '').localeCompare(b.name_ar || '', 'ar'));
    return h + `<div class="sec"><h2>السلع (${all.length})</h2><button class="sm" data-act="item">+ سلعة</button></div><div class="card flat" style="padding:2px 14px">${all.map(i => `<div class="row" data-act="item" data-id="${i.id}" style="cursor:pointer"><div class="thumb ph"><span class="emo">${esc(i.emoji || '🛒')}</span></div><div class="grow"><div class="nm">${esc(i.name_ar)}</div><div class="meta">${esc(unitL(i.unit))} · ${esc(i.name_hi || '')}</div></div></div>`).join('')}</div>`;
  }
  const all = Object.values(S.dishes);
  h += `<div class="sec"><h2>الأطباق (${all.length})</h2><button class="sm" data-act="dish">+ طبق</button></div>`;
  CATS.forEach(c => {
    const ds = all.filter(d => d.cat === c).sort((a, b) => (a.name_ar || '').localeCompare(b.name_ar || '', 'ar')); if (!ds.length) return;
    h += `<div class="lbl" style="margin:16px 4px 0">${esc(t('c_' + c))} (${ds.length})</div><div class="card flat" style="padding:2px 14px">` + ds.map(d => `<div class="row ${d.active === false ? 'off' : ''}">${thumb(d)}<div class="grow" data-act="dish" data-id="${d.id}" style="cursor:pointer"><div class="nm">${esc(d.name_ar)}</div><div class="meta">${S.photos[d.id] ? '📷 صورتكم' : d.photo ? 'صورة مرجعية' : 'بدون صورة'}${d.pair === 'rice' ? ' · مع عيش' : ''}</div></div><button class="sm ${d.active === false ? 'soft' : 'ghost'}" data-act="toggleDish" data-id="${d.id}">${d.active === false ? 'تفعيل' : 'إيقاف'}</button></div>`).join('') + `</div>`;
  });
  return h;
}
function adminSettings() {
  const st = settings(), ps = (S.house && S.house.pinSet) || {};
  let h = `<div class="sec"><h2>رموز الدخول</h2></div><div class="card flat">` + ROLES.map(r => `<div class="row"><div class="grow"><div class="nm">${ROLE_AR[r]}</div><div class="meta">${ps[r] ? '✓ الرمز محدد' : 'لم يُحدد بعد'}</div></div><button class="sm ${ps[r] ? 'ghost' : ''}" data-act="setPin" data-v="${r}">${ps[r] ? 'تغيير' : 'تحديد'}</button>${ps[r] && r !== 'admin' ? `<button class="sm soft" data-act="invite" data-v="${r}">دعوة</button>` : ''}</div>`).join('') + `<p class="small mute" style="margin:8px 0 0">رمز البيت: <b dir="ltr">${esc(S.hid)}</b> · اجعل رمز كل دور مختلفاً.</p></div>`;
  h += `<div class="sec"><h2>الأجهزة الداخلة</h2></div><div class="card flat" style="padding:2px 14px">${S.members.map(m => `<div class="row"><div class="grow"><div class="nm">${ROLE_AR[m.role] || m.role}${m.id === S.uid ? ' (هذا الجهاز)' : ''}</div><div class="meta">${esc(LANGS[m.lang] ? LANGS[m.lang].label : '')} · ${m.joinedAt ? esc(new Date(m.joinedAt).toLocaleDateString('ar-KW-u-nu-latn')) : ''}</div></div>${m.id !== S.uid ? `<button class="icon" data-act="kick" data-id="${m.id}">${confirmKey === 'k' + m.id ? 'تأكيد؟' : '✕'}</button>` : ''}</div>`).join('') || '<div class="empty">—</div>'}</div><p class="small mute" style="margin:4px 2px">لإخراج شخص نهائياً: احذف جهازه ثم غيّر رمز دوره.</p>`;
  h += `<div class="sec"><h2>تركيبة الغداء اليومي</h2></div><div class="card flat">` + CATS.map(c => `<div class="row"><div class="grow nm" style="font-size:15px">${esc(t('c_' + c))}${c === 'rice' ? '<div class="meta">يُضاف تلقائياً مع المرق والمشاوي</div>' : ''}</div><select data-s="count_${c}" style="width:120px">${[0, 1, 2, 3].map(n => `<option value="${n}" ${st.counts[c] == n ? 'selected' : ''}>${n === 0 ? (c === 'rice' ? 'تلقائي' : 'بدون') : n}</option>`).join('')}</select></div>`).join('') + `</div>`;
  h += `<div class="card flat"><div class="field" style="margin-top:0"><label>عدم تكرار الطبق الرئيسي قبل (أيام)</label><input data-s="noRepeat" type="number" min="1" max="60" value="${esc(st.noRepeat)}"></div><div class="field"><label>تجهيز المنيو مسبقاً لعدد أيام</label><input data-s="horizon" type="number" min="3" max="30" value="${esc(st.horizon)}"></div><div class="field"><label>أيام بدون غداء في البيت</label>${WD_AR.map((w, i) => `<label class="chk"><input type="checkbox" data-s="off_${i}" ${(st.offDays || []).includes(i) ? 'checked' : ''}><span>${w}</span></label>`).join('')}</div><button class="block" data-act="saveSettings">حفظ الإعدادات</button></div>`;
  h += `<div class="card flat"><button class="ghost block" data-act="logout">${confirmKey === 'logout' ? 'اضغط مرة أخرى للخروج' : 'خروج من هذا الجهاز'}</button></div>`;
  return h;
}
function monthLabel(m, short) { try { return new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString('ar-KW-u-nu-latn', short ? { month: 'short' } : { month: 'long', year: 'numeric' }); } catch (e) { return m; } }
function prevMonth(m) { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function adminReport() {
  const cur = monthOf(today()), month = S.month || cur, P = S.purchases;
  const months = []; let m = cur; for (let i = 0; i < 6; i++) { months.unshift(m); m = prevMonth(m); }
  const tot = mm => P.filter(p => p.month === mm).reduce((a, p) => a + (Number(p.price) || 0), 0);
  const totals = months.map(tot), max = Math.max(...totals, 0.001);
  const inM = P.filter(p => p.month === month), total = tot(month), prev = tot(prevMonth(month));
  const days = new Set(inM.map(p => p.date)).size;
  const coop = inM.filter(p => p.store === 'coop').reduce((a, p) => a + (Number(p.price) || 0), 0);
  let h = `<div class="summary" style="flex-direction:column;align-items:stretch"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:13px;color:#F6D6C8">${esc(monthLabel(month))}</div><div class="big-n" style="font-size:34px" dir="ltr">${money(total)} <span style="font-size:15px;font-weight:500">د.ك</span></div></div>${prev ? `<span class="badge" style="background:rgba(255,255,255,.16);color:#fff">${total >= prev ? '▲' : '▼'} ${Math.abs(Math.round((total - prev) / prev * 100))}%</span>` : ''}</div><div class="bars">${months.map((mm, i) => `<button class="bar ${mm === month ? 'on' : ''}" data-act="month" data-v="${mm}"><em>${totals[i] ? money(totals[i]) : ''}</em><i style="height:${Math.max(4, totals[i] / max * 70)}%"></i><span>${esc(monthLabel(mm, true))}</span></button>`).join('')}</div></div>`;
  h += `<div class="stat" style="margin-top:10px"><div><b>${inM.length}</b><span>عملية شراء</span></div><div><b>${days}</b><span>مشوار شراء</span></div><div><b>${total ? Math.round(coop / total * 100) : 0}%</b><span>من الجمعية</span></div></div>`;
  const groups = {}; P.forEach(p => { const k = (p.itemId || ('c:' + (p.custom || p.name_ar))) + '|' + p.unit; (groups[k] = groups[k] || []).push(p); });
  const rows = [];
  Object.values(groups).forEach(g => {
    const gm = g.filter(p => p.month === month); if (!gm.length) return;
    const sum = (a, f) => a.reduce((x, p) => x + (Number(p[f]) || 0), 0);
    const allAvg = sum(g, 'price') / Math.max(sum(g, 'qty'), 1e-4), mAvg = sum(gm, 'price') / Math.max(sum(gm, 'qty'), 1e-4);
    const so = g.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)), last = so[so.length - 1], lastU = (Number(last.price) || 0) / Math.max(Number(last.qty) || 1, 1e-4);
    const dates = [...new Set(so.map(p => p.date))].sort(); const every = dates.length > 1 ? diffDays(dates[0], dates[dates.length - 1]) / (dates.length - 1) : null;
    rows.push({ p: last, times: gm.length, qty: sum(gm, 'qty'), spend: sum(gm, 'price'), mAvg, allAvg, lastU, every, flag: g.length >= 3 && lastU > allAvg * 1.2, unit: last.unit });
  });
  rows.sort((a, b) => b.spend - a.spend);
  h += `<div class="sec"><h2>حسب السلعة</h2></div>`;
  h += rows.length ? `<div class="card flat" style="padding:2px 14px">${rows.map(r => { const o = (r.p.itemId && S.items[r.p.itemId]) || r.p, u = unitL(r.unit); return `<div class="row" style="align-items:flex-start"><div class="grow"><div style="display:flex;justify-content:space-between;gap:8px"><span class="nm">${esc(o.emoji || '')} ${esc(nm(o, 'ar'))}</span><b>${money(r.spend)}</b></div><div class="meta">${r.times} مرات · ${+r.qty.toFixed(2)} ${esc(u)}${r.every ? ` · كل ~${Math.round(r.every)} يوم` : ''}</div><div class="meta">سعر ${esc(u)}: هذا الشهر ${money(r.mAvg)} · المعدل ${money(r.allAvg)}</div>${r.flag ? `<div style="margin-top:4px"><span class="badge warn">آخر سعر ${money(r.lastU)} أعلى من المعدل بأكثر من 20%</span></div>` : ''}</div></div>`; }).join('')}</div>` : `<div class="card empty">لا توجد مشتريات في هذا الشهر</div>`;
  if (inM.length) h += `<div class="card flat"><details><summary>كل عمليات الشراء (${inM.length})</summary>${inM.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map(p => { const o = (p.itemId && S.items[p.itemId]) || p; return `<div class="row"><div class="grow"><div class="nm" style="font-size:15px">${esc(nm(o, 'ar'))}</div><div class="meta">${esc(p.date)} · ${esc(p.qty)} ${esc(unitL(p.unit))} · ${esc(storeL(p.store))}</div></div><b>${money(p.price)}</b><button class="icon" data-act="delPurchase" data-id="${p.id}">${confirmKey === 'p' + p.id ? 'تأكيد؟' : '✕'}</button></div>`; }).join('')}</details></div>`;
  return h;
}

/* ---------------- modals ---------------- */
function openModal(m) { M = m; renderModal(); $modal.classList.remove('hidden'); }
function closeModal() { M = null; $modal.classList.add('hidden'); $sheet.innerHTML = ''; if (pending) render(); }
function syncModal() { if (!M) return; $sheet.querySelectorAll('[data-m]').forEach(el => { M[el.dataset.m] = el.type === 'checkbox' ? el.checked : el.value; }); }
function renderModal() {
  if (!M) return; $sheet.setAttribute('dir', LANGS[L()].dir);
  let h = '<div class="handle"></div>';
  if (M.type === 'lang') h += `<h3>${esc(t('language'))}</h3>${langChips(S.lang)}`;
  else if (M.type === 'me') h += `<h3>${esc(t('r_' + S.role))}</h3><p class="mute">${esc((S.house && S.house.name) || '')} · <span dir="ltr">${esc(S.hid)}</span></p><button class="ghost block" data-act="logout">${esc(confirmKey === 'logout' ? t('logoutAsk') : t('logout'))}</button>`;
  else if (M.type === 'short') h += modalShort();
  else if (M.type === 'buy') h += modalBuy();
  else if (M.type === 'day') h += modalDay();
  else if (M.type === 'dish') h += modalDish();
  else if (M.type === 'item') h += modalItem();
  else if (M.type === 'pin') h += `<h3>رمز ${ROLE_AR[M.role]}</h3><div class="field"><label>الرمز الجديد (${M.role === 'admin' ? '6' : '4 إلى 6'} أرقام)</label><input data-m="pin" class="pinbox" inputmode="numeric" maxlength="6" value="${esc(M.pin || '')}"></div><p class="small mute">احفظ الرمز عندك، فالتطبيق لا يعرضه بعد الحفظ.</p>`;
  else if (M.type === 'invite') h += `<h3>دعوة ${ROLE_AR[M.role]}</h3><div class="field"><label>اكتب رمز ${ROLE_AR[M.role]} ليُضاف للرسالة</label><input data-m="pin" class="pinbox" inputmode="numeric" maxlength="6" value="${esc(M.pin || '')}"></div><div class="field"><label>لغة الرسالة</label><div class="chips">${['hi', 'bn', 'fil', 'en', 'ar'].map(k => `<button class="chip ${M.lang === k ? 'on' : ''}" data-act="invLang" data-v="${k}">${LANGS[k].label}</button>`).join('')}</div></div>`;
  h += `<div class="btns"><button class="ghost" data-act="closeModal">${esc(t('cancel'))}</button>${M.save ? `<button data-act="${M.save}" ${M.busy ? 'disabled' : ''}>${M.busy ? '<span class="spin"></span>' : esc(M.saveLabel || t('save'))}</button>` : ''}</div>`;
  $sheet.innerHTML = h;
}
function itemTile(i) { const k = [i.name_ar, i.name_en, i.name_hi, i.name_bn, i.name_fil].join(' ').toLowerCase(); return `<button class="tile" data-act="pickItem" data-id="${i.id}" data-key="${esc(k)}"><span class="te">${esc(i.emoji || '🛒')}</span><span>${esc(nm(i))}</span>${L() !== 'ar' ? `<span class="ta">${esc(i.name_ar)}</span>` : ''}</button>`; }
function modalShort() {
  const buy = M.mode === 'buy';
  if (!M.sel) {
    M.save = null;
    const items = Object.values(S.items).sort((a, b) => nm(a).localeCompare(nm(b)));
    return `<h3>${esc(buy ? t('whatBought') : t('addMissing'))}</h3><input data-filter data-m="q" placeholder="🔍 ${esc(t('search'))}" value="${esc(M.q || '')}" autocomplete="off"><div class="grid" id="grid">${items.map(itemTile).join('')}<button class="tile" data-act="pickCustom"><span class="te">✍️</span><span>${esc(t('otherItem'))}</span></button></div>`;
  }
  M.save = 'saveShort'; M.saveLabel = buy ? t('save') : t('add');
  const it = M.sel === '__custom' ? null : S.items[M.sel];
  const dup = !buy && it && S.shortages.some(s => s.itemId === it.id);
  return `<h3>${esc(buy ? t('whatBought') : t('addMissing'))}</h3><div class="card flat" style="display:flex;align-items:center;gap:12px;margin-top:0"><div class="thumb ph"><span class="emo">${esc(it ? it.emoji : '✍️')}</span></div><div class="grow">${it ? `<div class="nm">${esc(nm(it))}</div>${L() !== 'ar' ? `<div class="dar">${esc(it.name_ar)}</div>` : ''}` : `<input data-m="custom" value="${esc(M.custom || '')}" placeholder="${esc(t('otherPlaceholder'))}">`}</div><button class="sm ghost" data-act="unpick">${esc(t('back'))}</button></div>${dup ? `<div class="note">ℹ️ ${esc(t('inList'))}</div>` : ''}${qtyFields()}${buy ? priceFields() : `<div class="field"><label>${esc(t('note'))}</label><input data-m="note" value="${esc(M.note || '')}"></div>`}`;
}
function qtyFields() { return `<div class="field"><label>${esc(t('qty'))}</label><div class="stepper"><button data-act="qty" data-v="-1">−</button><input data-m="qty" inputmode="decimal" value="${esc(M.qty)}"><button data-act="qty" data-v="1">+</button></div></div><div class="field"><div class="chips">${UNITS.map(u => `<button class="chip ${M.unit === u ? 'on' : ''}" data-act="unit" data-v="${u}">${esc(unitL(u))}</button>`).join('')}</div></div>`; }
function priceFields() { return `<div class="field"><label>${esc(t('price'))}</label><input data-m="price" inputmode="decimal" placeholder="0.000" value="${esc(M.price || '')}" style="font-family:var(--head);font-size:24px;font-weight:600"></div><div class="field"><label>${esc(t('store'))}</label><div class="chips">${['coop', 'supermarket', 'other'].map(s => `<button class="chip ${M.store === s ? 'on' : ''}" data-act="store" data-v="${s}">${esc(s === 'other' ? t('otherStore') : storeL(s))}</button>`).join('')}</div>${M.store === 'other' ? `<input data-m="storeOther" style="margin-top:8px" value="${esc(M.storeOther || '')}" placeholder="${esc(t('otherStore'))}">` : ''}</div>`; }
function modalBuy() { M.save = 'saveBuy'; M.saveLabel = t('save'); const o = (M.itemId && S.items[M.itemId]) || M; return `<h3>${esc(t('markBought'))}</h3><div class="card flat" style="display:flex;align-items:center;gap:12px;margin-top:0"><div class="thumb ph"><span class="emo">${esc(o.emoji || '🛒')}</span></div><div class="grow"><div class="nm">${esc(nm(o))}</div>${L() !== 'ar' && !M.custom ? `<div class="dar">${esc(o.name_ar || '')}</div>` : ''}</div></div>${qtyFields()}${priceFields()}`; }
function modalDay() {
  M.save = 'saveDay'; M.saveLabel = 'حفظ';
  let h = `<h3>${esc(wdName(M.date))} · ${esc(fmt(M.date, { day: 'numeric', month: 'long' }))}</h3><label class="chk"><input type="checkbox" data-m="off" ${M.off ? 'checked' : ''} data-act="dayOff"><span>لا يوجد غداء في البيت هذا اليوم</span></label>`;
  if (!M.off) CATS.forEach(c => {
    const ids = M.items[c] || [];
    h += `<div class="field"><span class="flabel">${esc(t('c_' + c))}</span><div>${ids.map(id => { const d = S.dishes[id]; return d ? `<span class="dchip">${esc(d.name_ar)}<button data-act="dayShuffle" data-v="${c}" data-id="${id}" aria-label="تبديل">🔀</button><button data-act="dayRm" data-v="${c}" data-id="${id}" aria-label="حذف">✕</button></span>` : ''; }).join('')}<button class="chip" data-act="dayAdd" data-v="${c}" style="margin:4px">+ إضافة</button></div>`;
    if (M.picking === c) { const ds = Object.values(S.dishes).filter(d => d.cat === c && !ids.includes(d.id)).sort((a, b) => (a.name_ar || '').localeCompare(b.name_ar || '', 'ar')); h += `<div class="chips" style="margin-top:8px;padding:10px;background:var(--bg);border-radius:14px">${ds.map(d => `<button class="chip" data-act="dayPick" data-v="${c}" data-id="${d.id}">${esc(d.name_ar)}</button>`).join('') || '<span class="small mute">لا توجد أطباق أخرى</span>'}</div>`; }
    h += `</div>`;
  });
  h += `<div class="field"><span class="flabel">ملاحظات جاهزة (تُترجم تلقائياً للطباخ)</span><div class="chips">${Object.entries(QUICK_NOTES).map(([k, v]) => `<button class="chip ${M.notes.includes(k) ? 'on' : ''}" data-act="toggleNote" data-v="${k}">${esc(v.ar)}</button>`).join('')}</div></div><div class="field"><label>ملاحظة أخرى</label><textarea data-m="note" placeholder="يظهر للطباخ بالعربي مع زر ترجمة">${esc(M.note || '')}</textarea></div>`;
  return h;
}
function nameFields() { return ['ar', 'en', 'hi', 'bn', 'fil'].map(l => `<div class="field"><label>${{ ar: 'الاسم بالعربي', en: 'English', hi: 'हिन्दी', bn: 'বাংলা', fil: 'Filipino' }[l]}</label><input data-m="name_${l}" value="${esc(M['name_' + l] || '')}"></div>`).join(''); }
function modalDish() {
  M.save = 'saveDish';
  const d = M.id && S.dishes[M.id];
  return `<h3>${M.id ? 'تعديل طبق' : 'طبق جديد'}</h3>${d ? heroImg(d) : ''}<div class="btns" style="margin-top:8px"><button class="sm soft" data-act="adminPhoto">📷 ${d && S.photos[d.id] ? 'تغيير صورتكم' : 'رفع صورة'}</button>${d && S.photos[d.id] ? `<button class="sm danger" data-act="delPhoto">حذف صورتكم</button>` : ''}</div>${nameFields()}<p class="small mute" style="margin-top:-6px">للأطباق الكويتية: اكتب الاسم بالنطق الكويتي ثم الشرح بين قوسين، مثل: मचबूस दियाय (मसाला चावल और चिकन)</p><div class="two"><div class="field"><label>القسم</label><select data-m="cat">${CATS.map(c => `<option value="${c}" ${M.cat === c ? 'selected' : ''}>${esc(t('c_' + c))}</option>`).join('')}</select></div><div class="field"><label>رمز</label><input data-m="emoji" value="${esc(M.emoji || '')}" style="text-align:center;font-size:22px"></div></div><label class="chk"><input type="checkbox" data-m="pairRice" ${M.pairRice ? 'checked' : ''}><span>يُقدَّم مع عيش (يضيف التطبيق صنف عيش تلقائياً)</span></label>${M.id ? `<button class="sm danger" data-act="delDish">${confirmKey === 'dish' ? 'اضغط مرة أخرى للتأكيد' : 'حذف الطبق'}</button>` : ''}`;
}
function modalItem() { M.save = 'saveItem'; return `<h3>${M.id ? 'تعديل سلعة' : 'سلعة جديدة'}</h3>${nameFields()}<div class="two"><div class="field"><label>الوحدة</label><select data-m="unit">${UNITS.map(u => `<option value="${u}" ${M.unit === u ? 'selected' : ''}>${esc(unitL(u))}</option>`).join('')}</select></div><div class="field"><label>رمز</label><input data-m="emoji" value="${esc(M.emoji || '')}" style="text-align:center;font-size:22px"></div></div>${M.id ? `<button class="sm danger" data-act="delItem">${confirmKey === 'item' ? 'اضغط مرة أخرى للتأكيد' : 'حذف السلعة'}</button>` : ''}`; }

/* ---------------- menu generation ---------------- */
function usageMap() { const u = {}; Object.values(S.menus).sort((a, b) => (a.date < b.date ? -1 : 1)).forEach(m => { if (m.off) return; const it = m.items || {}; CATS.forEach(c => (it[c] || []).forEach(id => { u[id] = m.date; })); }); return u; }
function pickDish(cat, date, used, exclude, gapMin) {
  const pool = Object.values(S.dishes).filter(d => d.cat === cat && d.active !== false && !exclude.includes(d.id)); if (!pool.length) return null;
  const sc = pool.map(d => ({ d, gap: used[d.id] ? Math.abs(diffDays(used[d.id], date)) : 999 }));
  let ok = sc.filter(s => s.gap >= gapMin); if (!ok.length) { sc.sort((a, b) => b.gap - a.gap); ok = sc.slice(0, Math.max(1, Math.ceil(sc.length / 3))); }
  const w = ok.map(s => Math.min(s.gap, 60) + 1); let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ok.length; i++) { r -= w[i]; if (r <= 0) return ok[i].d.id; } return ok[ok.length - 1].d.id;
}
function genDay(date, used, st) {
  if ((st.offDays || []).includes(pd(date).getDay())) return { date, off: true, items: {}, auto: true, notes: [], note: '', seen: null };
  const items = {};
  CATS.forEach(c => {
    let n = +st.counts[c] || 0;
    if (c === 'rice' && !n && (items.main || []).some(id => S.dishes[id] && S.dishes[id].pair === 'rice')) n = 1;
    if (!n) return;
    const gap = c === 'main' ? (+st.noRepeat || 10) : Math.max(2, Math.floor((+st.noRepeat || 10) / 3)); const ch = [];
    for (let k = 0; k < n; k++) { const id = pickDish(c, date, used, ch, gap); if (!id) break; ch.push(id); used[id] = date; }
    items[c] = ch;
  });
  return { date, off: false, items, auto: true, notes: [], note: '', seen: null };
}
async function maybeGenerate(force) {
  if (genRunning || (!force && genDone)) return;
  if (!['admin', 'cook'].includes(S.role) || !S.loaded.dishes || !S.loaded.menu || !S.house || S.offline) return;
  if (!Object.keys(S.dishes).length) return;
  genRunning = true;
  try {
    const st = settings(), td = today(), used = usageMap();
    for (let i = 0; i < (+st.horizon || 14); i++) {
      const d = addDays(td, i); if (S.menus[d]) continue;
      const ex = await getDoc(H('menu', d)); if (ex.exists()) continue;
      const m = genDay(d, used, st); S.menus[d] = m; await setDoc(H('menu', d), m);
    }
  } catch (e) { console.warn(e); }
  finally { genRunning = false; genDone = true; schedule(); }
}

/* ---------------- photos ---------------- */
function pickImage() { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.setAttribute('capture', 'environment'); i.onchange = () => res(i.files && i.files[0]); i.click(); }); }
async function compress(file) {
  const bmp = await createImageBitmap(file); const max = 720; const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.72, out = c.toDataURL('image/jpeg', q); while (out.length > 300000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
  return out;
}

/* ---------------- actions ---------------- */
const ACT = {
  setLang(v) { S.lang = v; ls('lang', v); if (S.view === 'app' && S.uid && S.hid) updateDoc(H('members', S.uid), { lang: v }).catch(() => {}); closeModal(); render(); },
  openLang() { openModal({ type: 'lang' }); },
  openMe() { confirmKey = null; openModal({ type: 'me' }); },
  closeModal() { confirmKey = null; closeModal(); },
  goCreate() { S.view = 'create'; render(); },
  goLogin() { S.view = 'login'; render(); },
  async login(v, id, el) {
    const code = (document.getElementById('code').value || '').trim().toUpperCase(), pin = (document.getElementById('pin').value || '').trim();
    if (!code || !pin) { toast(t('loginBad')); return; }
    el.disabled = true; el.innerHTML = '<span class="spin"></span>';
    try { await deleteDoc(doc(db, 'households', code, 'members', S.uid)); } catch (e) { }
    let ok = null;
    for (const role of ROLES) {
      try { await setDoc(doc(db, 'households', code, 'members', S.uid), { role, pinHash: await pinHash(code, role, pin), lang: S.lang || 'ar', joinedAt: Date.now() }); ok = role; break; } catch (e) { }
    }
    if (!ok) { el.disabled = false; el.textContent = t('enter'); toast(t('loginBad')); return; }
    ls('lastCode', code); ls('hid', code); if (ok === 'admin' || ok === 'family') { if (!S.lang) S.lang = 'ar'; }
    start(code);
  },
  async create(v, id, el) {
    const name = (document.getElementById('hname').value || '').trim(), code = (document.getElementById('hcode').value || '').trim().toUpperCase();
    const p1 = document.getElementById('apin').value.trim(), p2 = document.getElementById('apin2').value.trim();
    if (!name) return toast('اكتب اسم البيت'); if (!/^[A-Z0-9]{4,10}$/.test(code)) return toast('رمز البيت: 4 إلى 10 أحرف إنجليزية أو أرقام');
    if (!/^\d{6}$/.test(p1)) return toast('رمز الإدارة 6 أرقام'); if (p1 !== p2) return toast('الرمزان غير متطابقين');
    el.disabled = true; el.innerHTML = '<span class="spin"></span>';
    try {
      await setDoc(doc(db, 'households', code), { name, ownerUid: S.uid, createdAt: Date.now(), settings: DEF, pinSet: { admin: true } });
    } catch (e) { el.disabled = false; el.textContent = 'إنشاء البيت'; return toast('هذا الرمز مستخدم، اختر رمزاً آخر'); }
    try {
      const hh = await pinHash(code, 'admin', p1);
      await setDoc(doc(db, 'households', code, 'members', S.uid), { role: 'admin', pinHash: hh, lang: 'ar', joinedAt: Date.now() });
      await setDoc(doc(db, 'households', code, 'secret', 'pins'), { admin: hh });
      const all = [...DISHES.map(d => ['dishes', d.id, Object.assign({ active: true }, d)]), ...ITEMS.map(i => ['items', i.id, i])];
      for (let i = 0; i < all.length; i += 400) { const b = writeBatch(db); all.slice(i, i + 400).forEach(([c, id, data]) => { const x = Object.assign({}, data); delete x.id; b.set(doc(db, 'households', code, c, id), x); }); await b.commit(); }
      ls('hid', code); ls('lastCode', code); S.lang = 'ar'; ls('lang', 'ar');
      toast('تم إنشاء البيت ✓'); start(code); S.adminTab = 'set';
    } catch (e) { console.error(e); el.disabled = false; el.textContent = 'إنشاء البيت'; toast('تعذّر الإكمال: ' + errMsg(e)); }
  },
  async logout() {
    if (confirmKey !== 'logout') { confirmKey = 'logout'; if (M) renderModal(); else render(); return; }
    confirmKey = null; try { await deleteDoc(H('members', S.uid)); } catch (e) { }
    stop(); ls('hid', null); S.hid = null; S.role = null; closeModal(); S.view = 'login'; render();
  },
  tab(v) { S.tab = v; render(); window.scrollTo(0, 0); },
  atab(v) { S.adminTab = v; confirmKey = null; render(); window.scrollTo(0, 0); },
  ltab(v) { S.libTab = v; render(); },
  month(v) { S.month = v; render(); },
  async seen(v) { await updateDoc(H('menu', v), { seen: { at: Date.now(), by: S.role } }); toast('✓'); },
  async photo(dishId) {
    const f = await pickImage(); if (!f) return; toast(t('working'));
    try { const data = await compress(f); await addDoc(HC('photoSubmissions'), { dishId, data, by: S.role, at: Date.now() }); toast(t('photoSent')); } catch (e) { toast(errMsg(e)); }
  },
  addShort() { openModal({ type: 'short', mode: 'short', q: '', sel: null, qty: 1, unit: 'kg', note: '' }); },
  extraBuy() { openModal({ type: 'short', mode: 'buy', q: '', sel: null, qty: 1, unit: 'kg', price: '', store: ls('store') || 'coop' }); },
  pickItem(v, id) { const it = S.items[id]; M.sel = id; M.unit = it.unit || 'pcs'; M.qty = 1; renderModal(); },
  pickCustom() { M.sel = '__custom'; M.custom = M.q || ''; M.unit = 'pcs'; M.qty = 1; renderModal(); },
  unpick() { M.sel = null; renderModal(); },
  qty(v) { let q = parseFloat(M.qty) || 0; const step = (M.unit === 'kg' || M.unit === 'L') ? 0.5 : 1; M.qty = Math.max(step, +(q + (+v) * step).toFixed(2)); renderModal(); },
  unit(v) { M.unit = v; renderModal(); },
  store(v) { M.store = v; renderModal(); },
  async saveShort() {
    const qty = parseFloat(M.qty); if (!(qty > 0)) return toast(t('qty'));
    const it = M.sel === '__custom' ? null : S.items[M.sel];
    if (!it && !(M.custom || '').trim()) return toast(t('otherPlaceholder'));
    const base = it ? { itemId: it.id, name_ar: it.name_ar, emoji: it.emoji || '' } : { itemId: null, custom: M.custom.trim(), name_ar: M.custom.trim(), emoji: '🛒' };
    if (M.mode === 'buy') { M = Object.assign({ type: 'buy', sid: null, storeOther: '' }, base, { qty, unit: M.unit, price: M.price || '', store: M.store || 'coop' }); return ACT.saveBuy(); }
    M.busy = true; renderModal();
    try { await addDoc(HC('shortages'), Object.assign(base, { qty, unit: M.unit, note: (M.note || '').trim(), createdAt: Date.now(), by: S.role })); toast(t('added')); closeModal(); }
    catch (e) { M.busy = false; renderModal(); toast(errMsg(e)); }
  },
  async delShort(v, id) { await deleteDoc(H('shortages', id)); },
  buy(v, id) { const s = S.shortages.find(x => x.id === id); if (!s) return; openModal({ type: 'buy', sid: id, itemId: s.itemId, custom: s.custom || '', name_ar: s.name_ar, emoji: s.emoji, qty: s.qty, unit: s.unit, price: '', store: ls('store') || 'coop', storeOther: '' }); },
  async saveBuy() {
    const price = parseFloat(String(M.price || '').replace(',', '.'));
    if (!(price >= 0) || M.price === '') { toast(t('priceRequired')); if (M.type !== 'buy') M.type = 'buy'; renderModal(); $modal.classList.remove('hidden'); return; }
    const qty = parseFloat(M.qty) || 1, store = M.store === 'other' ? ((M.storeOther || '').trim() || t('otherStore')) : M.store, it = M.itemId && S.items[M.itemId];
    const p = { itemId: M.itemId || null, custom: M.custom || '', name_ar: (it && it.name_ar) || M.name_ar || M.custom || '', emoji: (it && it.emoji) || M.emoji || '🛒', qty, unit: M.unit, price, unitPrice: price / qty, store, date: today(), month: monthOf(today()), ts: Date.now(), by: S.role };
    M.busy = true; renderModal();
    try { await addDoc(HC('purchases'), p); if (M.sid) await deleteDoc(H('shortages', M.sid)); if (M.store !== 'other') ls('store', M.store); toast('✓ ' + t('saved')); closeModal(); }
    catch (e) { M.busy = false; renderModal(); toast(errMsg(e)); }
  },
  async shareList() {
    const lines = S.shortages.map(s => { const o = (s.itemId && S.items[s.itemId]) || s, a = nm(o), b = o.name_ar; return '• ' + a + (L() !== 'ar' && b && b !== a ? ' / ' + b : '') + ' — ' + s.qty + ' ' + unitL(s.unit) + (s.note ? ' (' + s.note + ')' : ''); });
    const txt = '🛒 ' + t('toBuy') + ' — ' + fmt(today(), { day: 'numeric', month: 'short' }) + '\n' + lines.join('\n');
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast(t('copied')); } } catch (e) { }
  },
  editDay(v) { const m = S.menus[v] || { date: v, items: {}, off: false, note: '', notes: [] }; openModal({ type: 'day', date: v, items: JSON.parse(JSON.stringify(m.items || {})), off: !!m.off, note: m.note || '', notes: (m.notes || []).slice(), orig: JSON.stringify([m.items || {}, !!m.off, m.note || '', m.notes || []]), seen: m.seen || null }); },
  dayOff() { renderModal(); },
  dayAdd(v) { M.picking = M.picking === v ? null : v; renderModal(); },
  dayPick(v, id) { (M.items[v] = M.items[v] || []).push(id); M.picking = null; renderModal(); },
  dayRm(v, id) { M.items[v] = (M.items[v] || []).filter(x => x !== id); renderModal(); },
  dayShuffle(v, id) { const ex = M.items[v] || []; const n = pickDish(v, M.date, usageMap(), ex, v === 'main' ? settings().noRepeat : 2); if (!n) return toast('لا يوجد بديل'); M.items[v] = ex.map(x => (x === id ? n : x)); renderModal(); },
  toggleNote(k) { M.notes = M.notes.includes(k) ? M.notes.filter(x => x !== k) : M.notes.concat(k); renderModal(); },
  async saveDay() {
    M.busy = true; renderModal();
    const note = (M.note || '').trim(), changed = JSON.stringify([M.items, !!M.off, note, M.notes]) !== M.orig;
    try { await setDoc(H('menu', M.date), { date: M.date, items: M.off ? {} : M.items, off: !!M.off, note, notes: M.notes, auto: false, seen: changed ? null : M.seen }); toast('تم الحفظ'); closeModal(); }
    catch (e) { M.busy = false; renderModal(); toast(errMsg(e)); }
  },
  async regen() {
    if (confirmKey !== 'regen') { confirmKey = 'regen'; render(); setTimeout(() => { if (confirmKey === 'regen') { confirmKey = null; render(); } }, 4000); return; }
    confirmKey = null; const tm = addDays(today(), 1);
    const ds = Object.values(S.menus).filter(m => m.date >= tm && m.auto && !m.seen).map(m => m.date);
    for (const d of ds) { await deleteDoc(H('menu', d)); delete S.menus[d]; }
    genDone = false; await maybeGenerate(true); toast('تم توليد منيو جديد');
  },
  dish(v, id) { const d = id ? S.dishes[id] : null; confirmKey = null; openModal(Object.assign({ type: 'dish', id: id || null, cat: 'main', emoji: '🍽️' }, d ? { name_ar: d.name_ar, name_en: d.name_en, name_hi: d.name_hi, name_bn: d.name_bn, name_fil: d.name_fil, cat: d.cat, emoji: d.emoji, pairRice: d.pair === 'rice' } : {})); },
  item(v, id) { const d = id ? S.items[id] : null; confirmKey = null; openModal(Object.assign({ type: 'item', id: id || null, unit: 'pcs', emoji: '🛒' }, d ? { name_ar: d.name_ar, name_en: d.name_en, name_hi: d.name_hi, name_bn: d.name_bn, name_fil: d.name_fil, unit: d.unit, emoji: d.emoji } : {})); },
  async saveDish() {
    if (!(M.name_ar || '').trim()) return toast('اكتب الاسم');
    const id = M.id || ('d-' + Date.now().toString(36)), old = S.dishes[id] || {};
    const data = { name_ar: M.name_ar.trim(), name_en: (M.name_en || '').trim(), name_hi: (M.name_hi || '').trim(), name_bn: (M.name_bn || '').trim(), name_fil: (M.name_fil || '').trim(), cat: M.cat, emoji: (M.emoji || '').trim() || '🍽️', active: old.active !== false, pair: M.pairRice ? 'rice' : null };
    if (old.photo) data.photo = old.photo;
    await setDoc(H('dishes', id), data); toast('تم الحفظ'); closeModal();
  },
  async delDish() { if (confirmKey !== 'dish') { confirmKey = 'dish'; renderModal(); return; } confirmKey = null; await deleteDoc(H('dishes', M.id)); toast('تم الحذف'); closeModal(); },
  async toggleDish(v, id) { const d = S.dishes[id]; await updateDoc(H('dishes', id), { active: d.active === false }); },
  async adminPhoto() { if (!M.id) return toast('احفظ الطبق أولاً'); const f = await pickImage(); if (!f) return; toast('جارٍ الرفع…'); const data = await compress(f); await setDoc(H('dishPhotos', M.id), { data, at: Date.now() }); toast('تم ✓'); renderModal(); },
  async delPhoto() { await deleteDoc(H('dishPhotos', M.id)); renderModal(); },
  async saveItem() {
    if (!(M.name_ar || '').trim()) return toast('اكتب الاسم');
    const id = M.id || ('i-' + Date.now().toString(36));
    await setDoc(H('items', id), { name_ar: M.name_ar.trim(), name_en: (M.name_en || '').trim(), name_hi: (M.name_hi || '').trim(), name_bn: (M.name_bn || '').trim(), name_fil: (M.name_fil || '').trim(), unit: M.unit, emoji: (M.emoji || '').trim() || '🛒' });
    toast('تم الحفظ'); closeModal();
  },
  async delItem() { if (confirmKey !== 'item') { confirmKey = 'item'; renderModal(); return; } confirmKey = null; await deleteDoc(H('items', M.id)); toast('تم الحذف'); closeModal(); },
  async approve(v, id) { const q = S.queue.find(x => x.id === id); if (!q) return; await setDoc(H('dishPhotos', q.dishId), { data: q.data, at: Date.now() }); await deleteDoc(H('photoSubmissions', id)); toast('تم اعتماد الصورة ✓'); },
  async reject(v, id) { await deleteDoc(H('photoSubmissions', id)); },
  async delPurchase(v, id) { if (confirmKey !== 'p' + id) { confirmKey = 'p' + id; render(); return; } confirmKey = null; await deleteDoc(H('purchases', id)); },
  async kick(v, id) { if (confirmKey !== 'k' + id) { confirmKey = 'k' + id; render(); return; } confirmKey = null; await deleteDoc(H('members', id)); toast('تم'); },
  setPin(r) { openModal({ type: 'pin', role: r, pin: '', save: 'savePin', saveLabel: 'حفظ الرمز' }); },
  async savePin() {
    const pin = (M.pin || '').trim(), r = M.role;
    if (r === 'admin' ? !/^\d{6}$/.test(pin) : !/^\d{4,6}$/.test(pin)) return toast(r === 'admin' ? 'رمز الإدارة 6 أرقام' : 'الرمز 4 إلى 6 أرقام');
    M.busy = true; renderModal();
    try { await setDoc(H('secret', 'pins'), { [r]: await pinHash(S.hid, r, pin) }, { merge: true }); await updateDoc(H(), { ['pinSet.' + r]: true }); toast('تم حفظ الرمز ✓'); const role = r; closeModal(); if (role !== 'admin') ACT.invite(role, null, null, pin); }
    catch (e) { M.busy = false; renderModal(); toast(errMsg(e)); }
  },
  invite(r, id, el, pin) { openModal({ type: 'invite', role: r, pin: pin || '', lang: r === 'family' ? 'ar' : 'hi', save: 'sendInvite', saveLabel: 'مشاركة' }); },
  invLang(v) { M.lang = v; renderModal(); },
  async sendInvite() {
    const l = M.lang, T = I18N[l];
    const txt = `🍽️ ${T.title}\n${SITE}\n\n${T.houseCode}: ${S.hid}\n${T.yourPin}: ${M.pin || '____'}\n\n${T.loginHint}`;
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast('تم النسخ'); } closeModal(); } catch (e) { }
  },
  async saveSettings() {
    const q = k => $app.querySelector(`[data-s="${k}"]`);
    const counts = {}; CATS.forEach(c => { counts[c] = +q('count_' + c).value; });
    const offDays = []; for (let i = 0; i < 7; i++) if (q('off_' + i).checked) offDays.push(i);
    const s = { counts, noRepeat: Math.max(1, Math.min(60, +q('noRepeat').value || 10)), horizon: Math.max(3, Math.min(30, +q('horizon').value || 14)), offDays };
    if (document.activeElement) document.activeElement.blur();
    await updateDoc(H(), { settings: s }); toast('تم الحفظ. استخدم "إعادة توليد" لتطبيقها على الأيام التلقائية'); genDone = false; maybeGenerate();
  }
};

document.addEventListener('click', async e => {
  if (e.target === $modal) { closeModal(); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
  if (M && $sheet.contains(el)) syncModal();
  const fn = ACT[el.dataset.act]; if (!fn) return;
  try { await fn(el.dataset.v, el.dataset.id, el); } catch (err) { console.error(err); toast(errMsg(err)); }
});
document.addEventListener('input', e => { if (e.target.hasAttribute('data-filter')) { const q = e.target.value.trim().toLowerCase(); if (M) M.q = e.target.value; document.querySelectorAll('#grid .tile[data-key]').forEach(b => { b.style.display = !q || b.dataset.key.includes(q) ? '' : 'none'; }); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pin') document.querySelector('[data-act="login"]').click(); });
document.addEventListener('focusout', () => setTimeout(() => { if (pending && !isTyping()) render(); }, 60));
window.addEventListener('online', () => { S.offline = false; schedule(); });
window.addEventListener('offline', () => { S.offline = true; schedule(); });

/* ---------------- data ---------------- */
function stop() { roleSubsOn = false; unsubs.forEach(u => { try { u(); } catch (e) { } }); unsubs = []; Object.assign(S, { dishes: {}, items: {}, menus: {}, shortages: [], purchases: [], photos: {}, members: [], queue: [], loaded: {}, house: null }); genDone = false; }
function sub(ref, key, fn, onErr) { unsubs.push(onSnapshot(ref, snap => { fn(snap); S.loaded[key] = true; if (key === 'dishes' || key === 'menu' || key === 'house') maybeGenerate(); schedule(); }, err => { console.warn(key, err); if (onErr) onErr(err); S.loaded[key] = true; schedule(); })); }
function start(hid) {
  stop(); S.hid = hid; S.view = 'app'; render();
  sub(H('members', S.uid), 'me', snap => {
    if (!snap.exists()) { stop(); ls('hid', null); S.view = 'login'; S.role = null; return; }
    const m = snap.data(); const changed = S.role !== m.role; S.role = m.role;
    if (!S.lang) S.lang = m.lang || (m.role === 'cook' || m.role === 'driver' ? 'en' : 'ar');
    if (changed) { S.tab = 'today'; attachRoleSubs(); }
  }, () => { stop(); ls('hid', null); S.view = 'login'; });
}
let roleSubsOn = false;
function attachRoleSubs() {
  if (roleSubsOn) return; roleSubsOn = true;
  const r = S.role;
  sub(H(), 'house', s => { S.house = s.exists() ? s.data() : null; });
  sub(HC('dishes'), 'dishes', s => { const o = {}; s.forEach(d => { o[d.id] = Object.assign({ id: d.id }, d.data()); }); S.dishes = o; });
  sub(HC('items'), 'items', s => { const o = {}; s.forEach(d => { o[d.id] = Object.assign({ id: d.id }, d.data()); }); S.items = o; });
  sub(query(HC('menu'), where('date', '>=', addDays(today(), -60))), 'menu', s => { const o = {}; s.forEach(d => { o[d.id] = Object.assign({}, d.data(), { date: d.id }); }); S.menus = o; });
  sub(HC('dishPhotos'), 'photos', s => { const o = {}; s.forEach(d => { o[d.id] = d.data().data; }); S.photos = o; });
  if (r !== 'family') sub(HC('shortages'), 'shortages', s => { S.shortages = s.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); });
  if (r === 'admin' || r === 'driver') sub(query(HC('purchases'), orderBy('ts', 'desc'), limit(1500)), 'purchases', s => { S.purchases = s.docs.map(d => Object.assign({ id: d.id }, d.data())); });
  if (r === 'admin') {
    sub(HC('members'), 'members', s => { S.members = s.docs.map(d => Object.assign({ id: d.id }, d.data())); });
    sub(HC('photoSubmissions'), 'queue', s => { S.queue = s.docs.map(d => Object.assign({ id: d.id }, d.data())); });
  }
}

/* ---------------- boot ---------------- */
S.lang = ls('lang'); S.view = 'boot'; render();
onAuthStateChanged(auth, async u => {
  if (!u) { try { await signInAnonymously(auth); } catch (e) { $app.innerHTML = `<div class="login"><p class="center">${esc(e.message)}</p></div>`; } return; }
  S.uid = u.uid;
  const hid = ls('hid');
  if (hid) start(hid); else { S.view = 'login'; render(); }
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => { });
