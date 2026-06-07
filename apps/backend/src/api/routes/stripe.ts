/**
 * stripe.ts (routes)
 * Stripe Checkout and webhook handling for TavernTable Premium.
 * Mounted at /api/stripe
 *
 * Endpoints:
 *   POST /api/stripe/checkout   — create a Checkout session, return { url }
 *   POST /api/stripe/webhook    — handle Stripe webhook events
 *   GET  /api/stripe/status/:userId — check premium status
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *   STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID
 */

import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';

const router = Router();

// ---------------------------------------------------------------------------
// Lazy Stripe client — only instantiated when routes are hit (safe for tests)
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY env var is not set');
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// In-memory premium store (replace with Prisma / DB in production)
// ---------------------------------------------------------------------------

interface PremiumRecord {
  isPremium: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const premiumStore = new Map<string, PremiumRecord>();

function getPremiumRecord(userId: string): PremiumRecord {
  return premiumStore.get(userId) ?? { isPremium: false, plan: 'free' };
}

function setPremiumRecord(userId: string, record: PremiumRecord): void {
  premiumStore.set(userId, record);
}

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout
// Body: { billing: 'monthly' | 'yearly', userId?: string, successUrl?: string, cancelUrl?: string }
// Returns: { url: string }
// ---------------------------------------------------------------------------

router.post(
  '/checkout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        billing = 'monthly',
        userId,
        successUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/premium?success=1`,
        cancelUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/premium?canceled=1`,
      } = req.body as {
        billing?: 'monthly' | 'yearly';
        userId?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

      const priceId =
        billing === 'yearly'
          ? process.env.STRIPE_YEARLY_PRICE_ID
          : process.env.STRIPE_MONTHLY_PRICE_ID;

      if (!priceId) {
        res.status(500).json({
          error: {
            code: 'STRIPE_CONFIG_MISSING',
            message: `STRIPE_${billing.toUpperCase()}_PRICE_ID env var is not set`,
          },
        });
        return;
      }

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(userId && { client_reference_id: userId }),
        metadata: { billing, ...(userId && { userId }) },
        subscription_data: {
          metadata: { billing, ...(userId && { userId }) },
        },
      });

      res.json({ url: session.url });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// Must be mounted with express.raw() body parser (not JSON) — handled below.
// Stripe sends raw body; we verify with the webhook secret.
// ---------------------------------------------------------------------------

router.post(
  '/webhook',
  // Note: the calling router must NOT apply express.json() before this route.
  // In index.ts mount stripe router BEFORE the global json middleware, or apply
  // express.raw({ type: 'application/json' }) on this specific path.
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[Stripe] STRIPE_WEBHOOK_SECRET not set — webhook unverified');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body as Buffer, sig ?? '', secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Stripe] Webhook signature verification failed:', message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    // Handle events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id ?? session.metadata?.userId;
          const billing = (session.metadata?.billing as 'monthly' | 'yearly') ?? 'monthly';

          if (userId) {
            setPremiumRecord(userId, {
              isPremium: true,
              plan: billing,
              stripeCustomerId: session.customer as string | undefined,
              stripeSubscriptionId: session.subscription as string | undefined,
            });
            console.info(`[Stripe] Premium activated for user ${userId} (${billing})`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId) {
            setPremiumRecord(userId, { isPremium: false, plan: 'free' });
            console.info(`[Stripe] Premium cancelled for user ${userId}`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId && subscription.status !== 'active') {
            setPremiumRecord(userId, { isPremium: false, plan: 'free' });
            console.info(
              `[Stripe] Subscription for user ${userId} status changed to ${subscription.status}`,
            );
          }
          break;
        }

        default:
          // Unhandled event types are fine — we only care about the above
          break;
      }
    } catch (err) {
      console.error('[Stripe] Error handling webhook event:', err);
      res.status(500).send('Internal error handling webhook');
      return;
    }

    res.json({ received: true });
  },
);

// ---------------------------------------------------------------------------
// GET /api/stripe/status/:userId
// Returns: { isPremium: boolean, plan: 'free'|'monthly'|'yearly' }
// ---------------------------------------------------------------------------

router.get(
  '/status/:userId',
  (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } });
      return;
    }
    const record = getPremiumRecord(userId);
    res.json({ isPremium: record.isPremium, plan: record.plan });
  },
);

export default router;
