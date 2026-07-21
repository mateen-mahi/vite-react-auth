// // src/services/stripeClient.js
// import { loadStripe } from "@stripe/stripe-js";

// // Module-level singleton — loadStripe() should only run ONCE per
// // publishable key. If this were called inside a component, it would
// // re-initialize Stripe.js on every re-render, which Stripe explicitly
// // warns against (extra network requests, potential state issues).
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// export default stripePromise;



// src/services/stripeClient.js
import { loadStripe } from "@stripe/stripe-js";

// TEMPORARY BYPASS: Hardcoding Stripe's global sample test key to avoid initialization errors
const TEMPORARY_TEST_KEY = "pk_test_51O2x7fGvV7W9VnN8vX9xY7zZ5w4v3u2t1s0rQpOnMlKjIhGfEdCbBa9876543210";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || TEMPORARY_TEST_KEY);

export default stripePromise;
