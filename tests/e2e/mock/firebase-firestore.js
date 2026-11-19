const KEY = 'mockDB';
const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
let DB = load();
const save = () => { localStorage.setItem(KEY, JSON.stringify(DB)); fire(); };
const DEL = { __del: 1 };
export const deleteField = () => DEL;
export function initializeFirestore() { return {}; }
export function persistentLocalCache() { return {}; }
export function persistentMultipleTabManager() { return {}; }
let auto = 0;
export function doc(base, ...p) {
  if (base && base.kind === 'col') { const id = p.length ? p.join('/') : 'auto' + Date.now().toString(36) + (auto++); return { kind: 'doc', path: base.path + '/' + id, id: id.split('/').pop() }; }
  const path = p.join('/'); return { kind: 'doc', path, id: p[p.length - 1] };
}
export function collection(base, ...p) { return { kind: 'col', path: p.join('/'), f: [] }; }
export function query(c, ...cs) { return Object.assign({}, c, { f: c.f.concat(cs) }); }
export const where = (k, op, v) => ({ t: 'w', k, op, v });
export const orderBy = (k, d) => ({ t: 'o', k, d });
export const limit = n => ({ t: 'l', n });
const ds = (path) => ({ id: path.split('/').pop(), exists: () => path in DB, data: () => DB[path] ? JSON.parse(JSON.stringify(DB[path])) : undefined, ref: { path } });
function runQ(q) {
  const pre = q.path + '/';
  let docs = Object.keys(DB).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes('/')).map(ds);
  for (const c of q.f) {
    if (c.t === 'w') docs = docs.filter(d => { const x = d.data()[c.k]; return c.op === '==' ? x === c.v : c.op === '>=' ? x >= c.v : c.op === '>' ? x > c.v : true; });
    if (c.t === 'o') docs.sort((a, b) => (a.data()[c.k] > b.data()[c.k] ? 1 : -1) * (c.d === 'desc' ? -1 : 1));
    if (c.t === 'l') docs = docs.slice(0, c.n);
  }
  return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) };
}
const L = [];
function fire() { for (const l of L) emit(l); }
function emit(l) { try { l.cb(l.ref.kind === 'doc' ? ds(l.ref.path) : runQ(l.ref)); } catch (e) { console.error(e); } }
export function onSnapshot(ref, cb, err) { const l = { ref, cb }; L.push(l); setTimeout(() => emit(l), 0); return () => { const i = L.indexOf(l); if (i >= 0) L.splice(i, 1); }; }
export async function getDoc(r) { return ds(r.path); }
export async function getDocs(q) { return runQ(q); }
function applyObj(cur, v) { for (const [k, x] of Object.entries(v)) { if (x === DEL || (x && x.__del)) delete cur[k]; else cur[k] = x; } return cur; }
function rulesCheck(path, v) {
  const mm = path.match(/^households\/([^/]+)\/members\/([^/]+)$/); if (!mm) return;
  const H = 'households/' + mm[1], pins = DB[H + '/secret/pins'] || {}, house = DB[H] || {};
  const ok = (v.pid && pins['p_' + v.pid] === v.pinHash && JSON.stringify(v.roles) === JSON.stringify((DB[H + '/people/' + v.pid] || {}).roles) && v.roles.includes(v.role))
    || (!v.pid && pins[v.role] && pins[v.role] === v.pinHash)
    || (!v.pid && house.ownerUid === mm[2] && v.role === 'admin');
  if (!ok) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
}
export async function setDoc(r, v, o) { if (!(o && o.merge)) rulesCheck(r.path, v); window.__writes = (window.__writes || []); window.__writes.push(['set', r.path]); DB[r.path] = applyObj(o && o.merge ? Object.assign({}, DB[r.path] || {}) : {}, JSON.parse(JSON.stringify(v, (k, x) => x === DEL ? { __del: 1 } : x))); save(); }
export async function updateDoc(r, v) {
  if (!(r.path in DB)) throw Object.assign(new Error('not found ' + r.path), { code: 'not-found' });
  const cur = DB[r.path];
  for (const [k, x] of Object.entries(v)) { const ps = k.split('.'); let o = cur; for (let i = 0; i < ps.length - 1; i++) o = o[ps[i]] = o[ps[i]] || {}; const last = ps[ps.length - 1]; if (x === DEL) delete o[last]; else o[last] = JSON.parse(JSON.stringify(x)); }
  save();
}
export async function deleteDoc(r) { delete DB[r.path]; save(); }
export async function addDoc(c, v) { const r = doc(c); await setDoc(r, v); return r; }
export function writeBatch() { const ops = []; return { set: (r, v) => ops.push([r, v]), async commit() { for (const [r, v] of ops) DB[r.path] = JSON.parse(JSON.stringify(v)); save(); } }; }
