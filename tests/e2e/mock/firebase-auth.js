const uid = localStorage.getItem('mockUid') || 'u1';
export function getAuth() { return {}; }
export async function signInAnonymously() {}
export function onAuthStateChanged(a, cb) { setTimeout(() => cb({ uid }), 0); }
