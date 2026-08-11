import { loadStripe } from "@stripe/stripe-js";



const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_ACC_KEY);

export default stripePromise;
