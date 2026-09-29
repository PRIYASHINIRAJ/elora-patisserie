// Online card payments need a server holding a Stripe secret key, which this
// browser-only site does not have. Checkout shows a clear "not available" state.
export const stripe = null;

export function isStripeConfigured() {
  return false;
}

export function requireStripeConfigured(res) {
  res.status(503).json({
    error: 'Online payment is not available on this site yet. Please contact us on WhatsApp to arrange payment.',
    code: 'stripe_not_configured',
  });
  return false;
}
