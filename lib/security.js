import crypto from "crypto";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, expectedHash, salt) {
  if (!password || !expectedHash || !salt) {
    return false;
  }

  const actual = Buffer.from(crypto.scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(digest, "hex");
  const actual = Buffer.from(signature, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}
