// Accounts en cloud-opslag. Twee backends met dezelfde interface:
//   - PocketBase (zelf hosten, bijv. Docker op Unraid)
//   - Supabase   (gehost)
// Alles via fetch, zonder extra bibliotheek.
import { BACKEND, PB_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const AK = 'flic.auth';
const OWN = 'flic.owner';
const LAST = 'flic.acctlast';
const PB = BACKEND === 'pocketbase';

export const backend = () => BACKEND;
export const hostLabel = () => (PB ? 'de server van de beheerder van deze site' : 'Supabase (databasedienst)');
export const canRecover = () => !PB;   // PocketBase: wachtwoord laat de beheerder resetten (geen mailserver nodig)

export const enabled = () => {
  if (PB) return !(!PB_URL && /\.github\.io$/.test(location.hostname));   // op GitHub Pages is een PB_URL nodig
  return /^https:\/\/[^/]+\.[^/]+/.test(SUPABASE_URL) && !SUPABASE_URL.includes('JOUW') &&
    SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('JOUW');
};

const getAuth = () => { try { return JSON.parse(localStorage.getItem(AK)); } catch { return null; } };
export const loggedIn = () => !!getAuth();
export const getUser = () => (getAuth() || {}).user || null;
export const getOwner = () => localStorage.getItem(OWN);
export const setOwner = id => (id ? localStorage.setItem(OWN, id) : localStorage.removeItem(OWN));
export const lastSync = () => +localStorage.getItem(LAST) || 0;
export const setLastSync = t => localStorage.setItem(LAST, String(t));

// ---------------------------------------------------------------- foutmeldingen (NL)
const NL = [
  [/invalid login credentials|failed to authenticate|invalid_credentials/i, 'E-mailadres of wachtwoord is onjuist.'],
  [/already registered|already been registered|user_already_exists|validation_not_unique|already exists/i, 'Er bestaat al een account met dit e-mailadres. Log in of vraag de beheerder om een nieuw wachtwoord.'],
  [/password should be at least|weak_password|validation_length|validation_min|validation_too_short/i, 'Dit wachtwoord is te kort of te zwak (minimaal 8 tekens).'],
  [/valid email|invalid format|email_address_invalid|validation_is_email|validation_invalid_email/i, 'Dit e-mailadres is ongeldig.'],
  [/rate limit|too many/i, 'Te veel pogingen kort achter elkaar. Probeer het over een paar minuten opnieuw.'],
  [/signups? not allowed|signup_disabled/i, 'Registreren is uitgeschakeld.'],
  [/email not confirmed/i, 'Dit e-mailadres is nog niet bevestigd.'],
  [/old password|oldpassword|validation_values_mismatch/i, 'Het huidige wachtwoord klopt niet.'],
];

function describe(data) {
  if (!data) return '';
  const parts = [data.error_description, data.msg, data.message, data.error_code, data.error];
  if (data.data && typeof data.data === 'object') {          // PocketBase: { data: { email: { code, message } } }
    for (const f of Object.values(data.data)) if (f) parts.push(f.code, f.message);
  }
  return parts.filter(Boolean).join(' | ');
}
function mapError(status, data) {
  const raw = describe(data);
  const hit = NL.find(([re]) => re.test(raw));
  const err = new Error(hit ? hit[1] : (raw ? `Er ging iets mis: ${raw}` : `Er ging iets mis (status ${status}).`));
  err.status = status;
  return err;
}

async function call(url, { method = 'GET', body, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw Object.assign(new Error('Geen verbinding met de server. Ben je online?'), { status: 0 }); }
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { /* geen JSON */ }
  if (!res.ok) throw mapError(res.status, data);
  return data;
}

const jwtExp = t => {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp || 0; } catch { return 0; }
};
const now = () => Math.floor(Date.now() / 1000);
const clearSession = () => localStorage.removeItem(AK);
const store = a => localStorage.setItem(AK, JSON.stringify(a));

// ================================================================ POCKETBASE
const pbBase = () => (PB_URL || '').replace(/\/+$/, '');
const pbCall = (path, opts = {}, tok) =>
  call(pbBase() + path, { ...opts, headers: { ...(tok ? { Authorization: tok } : {}), ...(opts.headers || {}) } });

function pbSave(r) {
  if (!r || !r.token || !r.record) return false;
  store({ access_token: r.token, expires_at: jwtExp(r.token) || now() + 3600, user: { id: r.record.id, email: r.record.email } });
  return true;
}

async function pbToken() {
  const a = getAuth();
  if (!a) throw Object.assign(new Error('Niet ingelogd.'), { status: 401 });
  const left = a.expires_at - now();
  if (left > 3 * 86400) return a.access_token;
  try {                                                  // vernieuwen zolang het token nog geldig is
    const r = await pbCall('/api/collections/users/auth-refresh', { method: 'POST' }, a.access_token);
    pbSave(r);
    return r.token;
  } catch (e) {
    if (left > 60 && e.status !== 400 && e.status !== 401 && e.status !== 403) return a.access_token;   // netwerkprobleem: oude token nog gebruiken
    if (e.status === 400 || e.status === 401 || e.status === 403) {
      clearSession();
      throw Object.assign(new Error('Je sessie is verlopen. Log opnieuw in.'), { status: 401 });
    }
    throw e;
  }
}

let pbRecordId = null;
const pbImpl = {
  async signUp(email, password) {
    await pbCall('/api/collections/users/records', { method: 'POST', body: { email, password, passwordConfirm: password } });
    await pbImpl.signIn(email, password);
    return { session: true };
  },
  async signIn(email, password) {
    pbSave(await pbCall('/api/collections/users/auth-with-password', { method: 'POST', body: { identity: email, password } }));
  },
  async signOut() { /* PocketBase-tokens zijn stateless: lokaal wissen is genoeg */ },
  async recover() { throw new Error('Wachtwoord herstellen gaat via de beheerder.'); },
  async changePassword(oldPw, newPw) {
    const a = getAuth(), tok = await pbToken();
    await pbCall('/api/collections/users/records/' + a.user.id, { method: 'PATCH', body: { oldPassword: oldPw, password: newPw, passwordConfirm: newPw } }, tok);
    await pbImpl.signIn(a.user.email, newPw);            // oude tokens zijn nu ongeldig
  },
  async deleteAccount() {
    const a = getAuth(), tok = await pbToken();
    await pbCall('/api/collections/users/records/' + a.user.id, { method: 'DELETE' }, tok);   // voortgang verdwijnt via cascade
  },
  async pull() {
    const tok = await pbToken();
    const r = await pbCall('/api/collections/progress/records?perPage=1', {}, tok);
    const item = r && r.items && r.items[0];
    pbRecordId = item ? item.id : null;
    return item ? item.data : null;
  },
  async push(data) {
    const tok = await pbToken(), u = getUser();
    if (pbRecordId) {
      await pbCall('/api/collections/progress/records/' + pbRecordId, { method: 'PATCH', body: { data } }, tok);
    } else {
      const r = await pbCall('/api/collections/progress/records', { method: 'POST', body: { user: u.id, data } }, tok);
      pbRecordId = r.id;
    }
  },
};

// ================================================================ SUPABASE
const sbCall = (path, opts = {}, tok) =>
  call(SUPABASE_URL + path, { ...opts, headers: { apikey: SUPABASE_ANON_KEY, ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...(opts.headers || {}) } });

function sbSave(r) {
  if (!r || !r.access_token || !r.user) return false;
  store({
    access_token: r.access_token, refresh_token: r.refresh_token,
    expires_at: r.expires_at || now() + (r.expires_in || 3600),
    user: { id: r.user.id, email: r.user.email },
  });
  return true;
}
async function sbToken() {
  const a = getAuth();
  if (!a) throw Object.assign(new Error('Niet ingelogd.'), { status: 401 });
  if (a.expires_at - now() > 60) return a.access_token;
  try {
    const r = await sbCall('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: a.refresh_token } });
    sbSave(r);
    return r.access_token;
  } catch (e) {
    if (e.status >= 400 && e.status < 500) { clearSession(); throw Object.assign(new Error('Je sessie is verlopen. Log opnieuw in.'), { status: 401 }); }
    throw e;
  }
}
const sbImpl = {
  async signUp(email, password) {
    const r = await sbCall('/auth/v1/signup', { method: 'POST', body: { email, password } });
    return { session: sbSave(r) };      // false = bevestiging per mail vereist (als dat in Supabase aan staat)
  },
  async signIn(email, password) {
    sbSave(await sbCall('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  },
  async signOut() {
    const a = getAuth();
    if (a) { try { await sbCall('/auth/v1/logout', { method: 'POST' }, a.access_token); } catch { /* lokaal uitloggen is genoeg */ } }
  },
  recover: email => sbCall('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', body: { email } }),
  async changePassword(_old, newPw) { await sbCall('/auth/v1/user', { method: 'PUT', body: { password: newPw } }, await sbToken()); },
  async deleteAccount() { await sbCall('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} }, await sbToken()); },
  async pull() {
    const rows = await sbCall('/rest/v1/progress?select=data', {}, await sbToken());
    return rows && rows[0] ? rows[0].data : null;
  },
  async push(data) {
    const u = getUser();
    await sbCall('/rest/v1/progress?on_conflict=user_id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { user_id: u.id, data, updated_at: new Date().toISOString() },
    }, await sbToken());
  },
};

// ================================================================ publieke interface
const impl = PB ? pbImpl : sbImpl;

export const signUp = (e, p) => impl.signUp(e, p);
export const signIn = (e, p) => impl.signIn(e, p);
export async function signOut() { await impl.signOut(); clearSession(); pbRecordId = null; }
export const recover = e => impl.recover(e);
export const changePassword = (o, n) => impl.changePassword(o, n);
export async function deleteAccount() { await impl.deleteAccount(); clearSession(); setOwner(null); pbRecordId = null; }
// Alleen Supabase: nieuw wachtwoord instellen via de herstellink uit de e-mail
export const setPassword = (accessToken, password) => sbCall('/auth/v1/user', { method: 'PUT', body: { password } }, accessToken);

export const provider = { pull: () => impl.pull(), push: d => impl.push(d) };
