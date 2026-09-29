// Rate limiting protects a shared server; in the browser every visitor only
// talks to their own copy, so these are pass-through.
const passThrough = (req, res, next) => next();
export const authLimiter = passThrough;
export const adminAuthLimiter = passThrough;
