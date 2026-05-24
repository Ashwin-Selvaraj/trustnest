const USDC_DECIMALS = 1_000_000; // 6 decimal places

/**
 * Converts an INR rupee amount to USDC 6-decimal wei (bigint).
 *
 * @param amountINR  - Amount in Indian Rupees (integer rupees, not paise)
 * @param forexRate  - Exchange rate expressed as INR per 1 USDC (e.g. 83.5 means ₹83.50 = 1 USDC)
 *
 * Example: inrToUsdc(75_000, 83.5) → 898_204n  (≈ 0.898204 USDC)
 */
export function inrToUsdc(amountINR: number, forexRate: number): bigint {
  if (forexRate <= 0) throw new Error('forexRate must be positive');
  if (amountINR < 0)  throw new Error('amountINR must be non-negative');
  return BigInt(Math.round((amountINR / forexRate) * USDC_DECIMALS));
}
