/**
 * Stripe product and price definitions for the projection mapping system
 */

export const PRODUCTS = {
  FREE_TRIAL: {
    name: "無料体験",
    description: "20秒の動画投影",
    duration: 20,
    price: 0,
    priceId: null, // Free, no Stripe price needed
  },
  PAID_SERVICE: {
    name: "有料サービス",
    description: "1分間の動画投影",
    duration: 60,
    price: 5000, // JPY
    priceId: process.env.STRIPE_PRICE_ID_PAID_SERVICE || "price_paid_service", // Set in Stripe Dashboard
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
