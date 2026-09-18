// Creator program economics — the ONE source for every number shown on the
// creators site. Page copy, the payout table, the dashboard sample and the terms
// all compute from these constants, so they cannot drift apart.
//
// Keep in sync with lib/server/creatorProgram.js in the main site (which
// computes real commissions in the redeem webhook).

/** Standing list price of one monument unlock, Indian visitors, in rupees. */
export const LIST_PRICE_INR = 449;

/**
 * Hours of access one unlock gives. Must equal
 * explorer_pass_config.single_access_hours (set to 4 by backend migration 116).
 */
export const ACCESS_HOURS = 4;

/** Default customer discount a creator code gives. Set by Epocheye, not the creator. */
export const CUSTOMER_DISCOUNT_PERCENT = 10;

/** Minimum balance before a payout can be requested (admin_settings.min_payout_inr). */
export const MIN_PAYOUT_INR = 500;

/** Days a sale is held before it becomes payable (admin_settings.conversion_confirm_days). */
export const HOLD_DAYS = 7;

/**
 * Commission tiers by the creator's lifetime qualifying sales. The rate applies
 * per sale, based on how many qualifying sales came before it: sales 1–24 earn
 * 5%, sales 25–99 earn 10%, and so on. Always a % of LIST_PRICE_INR, whatever
 * discount the customer received.
 */
export const TIERS = [
	{ from: 1, to: 24, rate: 5 },
	{ from: 25, to: 99, rate: 10 },
	{ from: 100, to: 249, rate: 15 },
	{ from: 250, to: 499, rate: 20 },
	{ from: 500, to: null, rate: 25 },
];

/** The program is invite-only: at most this many approved creators. */
export const MAX_CREATORS = 100;

/** Days a creator holds a monument before renewal is decided. */
export const ASSIGNMENT_DAYS = 14;

/**
 * Fallback list of monuments shown on the creator page. The live list is set by
 * the admin (Admin → Settings → Creator Page) and served by
 * GET /api/creator/program; this is only used if that call fails, so it must
 * never name a monument that isn't live in the app.
 */
export const DEFAULT_MONUMENTS = [
	{ name: "Tipu Sultan's Summer Palace", place: "Bengaluru" },
];

export const SUPPORT_EMAIL = "support@epocheye.app";

/** Bump when the creator terms change materially; creators re-accept. */
export const TERMS_VERSION = "2026-09-19";

/** Days of notice before a rate or monument change takes effect. */
export const CHANGE_NOTICE_DAYS = 14;

/** Commission in rupees for one sale at a given rate. */
export function commissionPerSale(rate) {
	return round2((LIST_PRICE_INR * rate) / 100);
}

/** Tier rate for the n-th qualifying sale (1-based). */
export function rateForSale(n) {
	const tier = TIERS.find((t) => n >= t.from && (t.to === null || n <= t.to));
	return tier ? tier.rate : TIERS[0].rate;
}

/** Total commission for a creator's first `sales` qualifying sales. */
export function earningsForSales(sales) {
	let total = 0;
	for (let n = 1; n <= sales; n += 1) total += commissionPerSale(rateForSale(n));
	return round2(total);
}

/** What a customer pays with a creator code. */
export function discountedPrice(discountPercent = CUSTOMER_DISCOUNT_PERCENT) {
	return round2(LIST_PRICE_INR - (LIST_PRICE_INR * discountPercent) / 100);
}

export function formatInr(value, { decimals } = {}) {
	const d = decimals ?? (Number.isInteger(value) ? 0 : 2);
	return `₹${Number(value).toLocaleString("en-IN", {
		minimumFractionDigits: d,
		maximumFractionDigits: d,
	})}`;
}

function round2(n) {
	return Math.round(n * 100) / 100;
}
