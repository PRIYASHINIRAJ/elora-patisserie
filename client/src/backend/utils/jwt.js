// Session tokens for the in-browser API. There is no server to keep a secret
// from, so a token is just the encoded session payload with an expiry.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload) {
  return btoa(encodeURIComponent(JSON.stringify({ ...payload, exp: Date.now() + WEEK_MS })));
}

export function verifyToken(token) {
  const payload = JSON.parse(decodeURIComponent(atob(token)));
  if (!payload.exp || payload.exp < Date.now()) throw new Error('Session expired');
  return payload;
}
