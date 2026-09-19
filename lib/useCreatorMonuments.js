"use client";

import { startTransition, useEffect, useState } from "react";
import { DEFAULT_MONUMENTS, FALLBACK_INR_PER_USD, MIN_PAYOUT_INR } from "@/lib/creatorProgram";

const DEFAULT_PROGRAM = {
	monuments: DEFAULT_MONUMENTS,
	inrPerUsd: FALLBACK_INR_PER_USD,
	minPayoutInr: MIN_PAYOUT_INR,
};

/**
 * What the admin controls on the creator site (monument list, payout minimum)
 * plus today's INR-per-USD rate for showing amounts in dollars. Fetched from
 * the main site through the /api/creator/* rewrite; starts with, and falls
 * back to, the defaults.
 */
export function useCreatorProgram() {
	const [program, setProgram] = useState(DEFAULT_PROGRAM);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await fetch("/api/creator/program");
				const json = await res.json();
				if (!active || !json?.success) return;
				const d = json.data || {};
				startTransition(() =>
					setProgram({
						monuments:
							Array.isArray(d.monuments) && d.monuments.length > 0 ? d.monuments : DEFAULT_MONUMENTS,
						inrPerUsd: Number(d.inr_per_usd) > 0 ? Number(d.inr_per_usd) : FALLBACK_INR_PER_USD,
						minPayoutInr: Number(d.min_payout_inr) > 0 ? Number(d.min_payout_inr) : MIN_PAYOUT_INR,
					})
				);
			} catch {
				// Keep the defaults.
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	return program;
}

/** Monuments only (kept for existing callers). */
export function useCreatorMonuments() {
	return useCreatorProgram().monuments;
}

/** "A (X), B (Y)" for sentences. */
export function monumentSentence(monuments) {
	return monuments.map((m) => (m.place ? `${m.name} (${m.place})` : m.name)).join(", ");
}
