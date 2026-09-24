import { Router } from 'express';
import express from 'express';
import { stripeWebhook } from '../controllers/webhookController.js';

const router = Router();

// Stripe requires the raw, unparsed body to verify the signature.
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
