import { track } from "@vercel/analytics";

export const EVENT_NAMES = {
	signUpCompleted: "sign_up_completed",
	contentSubmitted: "content_submitted",
	promoCodeCopied: "promo_code_copied",
	referralLinkCopied: "referral_link_copied",
	promoQrShown: "promo_qr_shown",
	promoQrDownloaded: "promo_qr_downloaded",
	payoutRequestSubmitted: "payout_request_submitted",
};

export function trackEvent(eventName, properties = {}) {
	if (typeof window === "undefined" || !eventName) return;

	try {
		track(eventName, properties);
	} catch {
		// Keep analytics failures from affecting the user flow.
	}
}