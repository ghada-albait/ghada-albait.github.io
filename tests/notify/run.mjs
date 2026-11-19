const now = Date.now(), H = 'households/TEST';
const base = () => { const D = { [H]: { settings: { notifyEve: 0, notifyMorning: -1 } }, [H + '/meta/notify']: { lastRun: now - 300000 } };
  for (let i = 0; i < 77; i++) D[H + '/dishes/d' + i] = { name_en: 'Dish' + i, name_te: 'వంటకం' + i };
  for (let i = 0; i < 60; i++) D[H + '/items/i' + i] = { name_en: 'Item' + i };
  return D; };
const scen = process.argv[2];
const D = base();
if (scen !== 'notoken') { D[H + '/members/c'] = {}; D[H + '/members/d'] = {}; D[H + '/members/a'] = {}; D[H + '/members/m'] = {}; D[H + '/tokens/m'] = { role: 'driver', roles: ['driver','maid'], pid: 'P1', token: 'TM', lang: 'fil', uid: 'm' }; D[H + '/tokens/x'] = { role: 'cook', token: 'TX', lang: 'te', uid: 'x' }; D[H + '/tokens/c'] = { role: 'cook', token: 'TC', lang: 'te' }; D[H + '/tokens/d'] = { role: 'driver', token: 'TD', lang: 'hi' }; D[H + '/tokens/a'] = { role: 'admin', token: 'TA', lang: 'ar', uid: 'a' }; }
const k = new Date(now + 3 * 3600e3); const tom = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + 1)).toISOString().slice(0, 10);
if (scen === 'quiet') { D[H + '/meta/notify'].eve = tom; }
if (scen === 'busy') { D[H + '/menu/' + tom] = { items: { main: ['d3'], rice: ['d5'] } }; D[H + '/shortages/s1'] = { itemId: 'i2', qty: 2, unit: 'kg', createdAt: now - 1000, by: 'cook' }; D[H + '/messages/m2'] = { type: 'admin', toPid: 'P1', text: 'hello', at: now - 500 }; D[H + '/messages/m3'] = { type: 'admin', to: 'maid', text: 'clean', at: now - 400 }; D[H + '/messages/m1'] = { type: 'suggest', dishId: 'd7', at: now - 1000, from: 'family', fromName: 'X' }; }
globalThis.__DB = D;
const { R } = await import('./mock.mjs'); await import('./notify_t.mjs');
console.log(scen, 'reads=', R.reads, 'sent=', R.sent.map(m => m.token + ':' + m.data.title + ' | ' + m.data.body + ' | ' + m.data.url).join(' ;; '));
console.log('meta=', JSON.stringify(D[H + '/meta/notify']));
