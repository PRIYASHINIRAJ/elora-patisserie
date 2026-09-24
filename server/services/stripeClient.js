import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey ? new Stripe(secretKey) : null;

export function isStripeConfigured() {
  return Boolean(secretKey);
}

export function requireStripeConfigured(res) {
  if (!isStripeConfigured()) {
    res.status(503).json({
      error:
        'Payment gateway is not configured yet. Add a real STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) ' +
        'to server/.env to enable checkout — see https://dashboard.stripe.com/apikeys. ' +
        'This message is shown instead of a fake payment screen.',
      code: 'stripe_not_configured',
    });
    return false;
  }
  return true;
}
