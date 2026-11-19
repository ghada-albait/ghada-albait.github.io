// Sends push notifications for new activity. Run by .github/workflows/notify.yml every ~5 minutes.
// Needs the FIREBASE_SA secret (service-account JSON). Reads Firestore with admin rights, sends via FCM.
import admin from 'firebase-admin';
import fs from 'node:fs';
const I18N = new Function(fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8').replace(/export const/g, 'const') + '\n;return I18N;')();

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore(), fcm = admin.messaging();
const SITE = 'https://ghada-albait.github.io/';
const RTL = { ar: 1 };
const tl = (l, k) => (I18N[l] && I18N[l][k]) || I18N.en[k] || k;
const nm = (o, l) => !o ? '' : (o.custom || o['name_' + l] || o.name_en || o.name_ar || '').replace(/\s*\(.*\)\s*$/, '');
const kwt = d => new Date(d.getTime() + 3 * 3600e3); // Kuwait time (UTC+3, no DST)
const dayKey = d => kwt(d).toISOString().slice(0, 10);

async function send(tokDocs, build, tag) {
  let n = 0;
  for (const td of tokDocs) {
    const t = td.data(), l = t.lang || 'en', msg = build(l);
    if (!msg) continue;
    try {
      await fcm.send({ token: t.token, data: { title: msg.title, body: (msg.body || '').slice(0, 300), url: SITE, tag: tag || '', lang: l, dir: RTL[l] ? 'rtl' : 'ltr' }, webpush: { headers: { Urgency: 'high', TTL: '86400' } } });
      n++;
    } catch (e) {
      const c = e.code || '';
      if (c.includes('registration-token-not-registered') || c.includes('invalid-argument') || c.includes('invalid-registration-token')) await td.ref.delete().catch(() => {});
      else console.warn('send fail', c, e.message);
    }
  }
  return n;
}

async function household(h) {
  const hid = h.id, metaRef = h.ref.collection('meta').doc('notify');
  const meta = (await metaRef.get()).data() || {}, now = Date.now();
  const last = meta.lastRun || 0;
  const toks = (await h.ref.collection('tokens').get()).docs;
  const byRole = r => toks.filter(t => t.data().role === r);
  const byUid = u => toks.filter(t => t.data().uid === u);
  let sent = 0;
  if (!last) { await metaRef.set({ lastRun: now }, { merge: true }); return 0; } // first run: start from now, no backlog
  const dishes = {}; (await h.ref.collection('dishes').get()).forEach(d => dishes[d.id] = d.data());
  const items = {}; (await h.ref.collection('items').get()).forEach(d => items[d.id] = d.data());

  // 1) messages
  const msgs = (await h.ref.collection('messages').where('at', '>', last - 1).get()).docs.map(d => d.data()).filter(m => m.at > last && m.at <= now);
  for (const m of msgs) {
    const what = l => (m.text || '').trim() || (m.audio ? '🎙️' : (m.type === 'suggest' ? nm(dishes[m.dishId], l) : ''));
    if (m.type === 'admin') sent += await send(byRole(m.to), l => ({ title: '✉️ ' + tl(l, 'fromAdmin'), body: what(l) }), 'msg');
    else sent += await send(byRole('admin'), l => ({ title: (m.type === 'suggest' ? '🍽️ ' + tl(l, 'suggestDish') : '💬 ' + tl(l, 'messages')) + ' · ' + (m.fromName || tl(l, 'r_' + m.from)), body: m.type === 'suggest' ? nm(dishes[m.dishId], l) + (m.text ? ' — ' + m.text : '') : what(l) }), 'msg');
  }
  // 2) replies from the manager
  const reps = (await h.ref.collection('messages').where('replyAt', '>', last).get()).docs.map(d => d.data()).filter(m => m.replyAt <= now);
  for (const m of reps) sent += await send(byUid(m.fromUid), l => ({ title: '💬 ' + tl(l, 'reply'), body: (m.reply || '').trim() || (m.replyAudio ? '🎙️' : '') }), 'reply');
  // 3) new shortages -> driver
  const sh = (await h.ref.collection('shortages').where('createdAt', '>', last).get()).docs.map(d => d.data()).filter(s => s.createdAt <= now && s.by !== 'driver');
  if (sh.length) sent += await send(byRole('driver'), l => ({ title: '🛒 ' + tl(l, 'toBuy') + ' (' + sh.length + ')', body: sh.map(s => nm((s.itemId && items[s.itemId]) || s, l) + ' × ' + s.qty + ' ' + tl(l, 'u_' + s.unit)).join('، ') }), 'short');
  // 4) menu for the cook: tomorrow's menu the evening before, optional morning reminder, and edits
  const st = Object.assign({ notifyEve: 19, notifyMorning: 8 }, (h.data().settings || {}));
  const nowK = kwt(new Date(now)), hour = nowK.getUTCHours(), today = nowK.toISOString().slice(0, 10);
  const tomorrow = new Date(Date.UTC(nowK.getUTCFullYear(), nowK.getUTCMonth(), nowK.getUTCDate() + 1)).toISOString().slice(0, 10);
  const CATS = ['main', 'rice', 'side', 'salad', 'soup', 'dessert'];
  const menuOf = async d => (await h.ref.collection('menu').doc(d).get()).data();
  const list = (m, l) => m.off ? '🚫 ' + tl(l, 'noLunch') : CATS.flatMap(c => ((m.items || {})[c] || []).map(id => nm(dishes[id], l))).filter(Boolean).join(' + ');
  const cooks = byRole('cook'), upd = {};
  if (st.notifyEve >= 0 && hour >= st.notifyEve && meta.eve !== tomorrow) {
    const m = await menuOf(tomorrow);
    if (m) sent += await send(cooks, l => ({ title: '🍽️ ' + tl(l, 'tomorrow'), body: list(m, l) }), 'menu-' + tomorrow);
    upd.eve = tomorrow;
  }
  if (st.notifyMorning >= 0 && hour >= st.notifyMorning && hour < st.notifyMorning + 3 && meta.morning !== today) {
    const m = await menuOf(today);
    if (m && !m.off) sent += await send(cooks, l => ({ title: '🍽️ ' + tl(l, 'today'), body: list(m, l) }), 'menu-' + today);
    upd.morning = today;
  }
  for (const d of [today, tomorrow]) {
    const m = await menuOf(d), already = d === today ? true : meta.eve === tomorrow || upd.eve === tomorrow;
    if (m && m.editedAt > last && m.editedAt <= now && already) sent += await send(cooks, l => ({ title: '✏️ ' + tl(l, 'menuEdited') + ' · ' + tl(l, d === today ? 'today' : 'tomorrow'), body: list(m, l) }), 'menu-' + d);
  }
  if (Object.keys(upd).length) await metaRef.set(upd, { merge: true });
  await metaRef.set({ lastRun: now }, { merge: true });
  return sent;
}

const hs = (await db.collection('households').get()).docs;
let total = 0;
for (const h of hs) { try { total += await household(h); } catch (e) { console.error(h.id, e.message); } }
console.log(`households: ${hs.length}, notifications sent: ${total}`);
process.exit(0);
