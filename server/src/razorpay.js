import Razorpay from "razorpay";

// Razorpay is optional: if keys are not set, the app falls back to a mock
// "mark as paid" so the demo still works without a payment account.
export const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const razorpayEnabled = Boolean(RZP_KEY_ID && RZP_KEY_SECRET);

export const razorpay = razorpayEnabled
  ? new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET })
  : null;
