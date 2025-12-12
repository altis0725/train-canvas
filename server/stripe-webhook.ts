import type { Request, Response } from "express";
import Stripe from "stripe";
import { createPayment, getPaymentByStripeIntentId, updatePaymentStatus, getReservationById, updateReservationStatus } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[Webhook] Checkout session completed:", session.id);

        // Extract metadata
        const userId = session.metadata?.user_id
          ? parseInt(session.metadata.user_id)
          : null;
        const reservationId = session.metadata?.reservation_id
          ? parseInt(session.metadata.reservation_id)
          : null;
        const customerEmail = session.metadata?.customer_email || session.customer_email;
        const paymentIntentId = session.payment_intent as string;

        if (!userId || !paymentIntentId) {
          console.error("[Webhook] Missing user_id or payment_intent in session metadata");
          break;
        }

        // Idempotent payment upsert
        const existing = await getPaymentByStripeIntentId(paymentIntentId);
        let paymentId: number;
        if (existing) {
          paymentId = existing.id;
          await updatePaymentStatus(paymentIntentId, "succeeded");
        } else {
          paymentId = await createPayment({
            userId,
            amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
            currency: session.currency?.toUpperCase() || "JPY",
            paymentMethod: "stripe",
            stripePaymentIntentId: paymentIntentId,
            status: "succeeded",
            metadata: JSON.stringify({
              sessionId: session.id,
              customerEmail,
            }),
          });
        }

        // Confirm reservation if still active
        if (reservationId) {
          const reservation = await getReservationById(reservationId);
          if (reservation && reservation.status !== "cancelled" && reservation.status !== "expired") {
            const holdExpired =
              reservation.status === "pending_payment" &&
              reservation.holdExpiresAt &&
              reservation.holdExpiresAt < new Date();

            if (!holdExpired) {
              await updateReservationStatus(reservationId, "confirmed", undefined, paymentId);
            } else {
              await updateReservationStatus(reservationId, "expired", undefined, paymentId);
              console.warn(`[Webhook] Reservation ${reservationId} hold expired before payment confirmation`);
            }
          }
        }

        console.log(`[Webhook] Payment processed for intent: ${paymentIntentId}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] Payment intent succeeded:", paymentIntent.id);

        // Update payment status if exists
        await updatePaymentStatus(paymentIntent.id, "succeeded");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] Payment intent failed:", paymentIntent.id);

        // Update payment status
        await updatePaymentStatus(
          paymentIntent.id,
          "failed",
          paymentIntent.last_payment_error?.message
        );
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: error.message });
  }
}
