"use client";

import { startTransition, useEffect, useState } from "react";
import { DEFAULT_MONUMENTS } from "@/lib/creatorProgram";

/**
 * Monuments the admin lists on the creator page (Admin → Settings → Creator
 * Page), fetched from the main site through the /api/creator/* rewrite. Starts
 * with, and falls back to, DEFAULT_MONUMENTS.
 */
export function useCreatorMonuments() {
	const [monuments, setMonuments] = useState(DEFAULT_MONUMENTS);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await fetch("/api/creator/program");
				const json = await res.json();
				const list = json?.data?.monuments;
				if (active && json?.success && Array.isArray(list) && list.length > 0) {
					startTransition(() => setMonuments(list));
				}
			} catch {
				// Keep the fallback.
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	return monuments;
}

/** "A (X), B (Y)" for sentences. */
export function monumentSentence(monuments) {
	return monuments.map((m) => (m.place ? `${m.name} (${m.place})` : m.name)).join(", ");
}
