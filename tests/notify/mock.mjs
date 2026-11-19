export const R = { reads: 0, sent: [], writes: [] };
const DB = globalThis.__DB;
const snapDoc = (path, data) => ({ id: path.split('/').pop(), data: () => data, exists: !!data, ref: docRef(path) });
function docRef(path) { return {
  id: path.split('/').pop(), path,
  collection: c => colRef(path + '/' + c),
  async get() { R.reads++; return snapDoc(path, DB[path]); },
  async set(v, o) { R.writes.push([path, v]); DB[path] = Object.assign({}, o && o.merge ? DB[path] : {}, v); },
  async delete() { delete DB[path]; } }; }
function colRef(path, filt) { return {
  doc: id => docRef(path + '/' + id),
  where: (f, op, v) => colRef(path, [f, v]),
  async get() { const ds = Object.keys(DB).filter(k => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/')).filter(k => !filt || (DB[k][filt[0]] > filt[1])).map(k => snapDoc(k, DB[k])); R.reads += Math.max(1, ds.length); return { docs: ds, forEach: f => ds.forEach(f) }; } }; }
export default { initializeApp() {}, credential: { cert: x => x }, firestore: () => ({ collection: c => colRef(c) }), messaging: () => ({ async send(m) { R.sent.push(m); } }) };
