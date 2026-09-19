"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardAuthGate from "@/components/creators/DashboardAuthGate";
import { creatorFetch } from "@/lib/creatorApi";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";
import {
	ASSIGNMENT_DAYS,
	CUSTOMER_DISCOUNT_PERCENT,
	LIST_PRICE_INR,
	SUPPORT_EMAIL,
	TERMS_VERSION,
	TIERS,
	formatInr,
} from "@/lib/creatorProgram";
import { useCreatorMonuments } from "@/lib/useCreatorMonuments";

// Required step between signup and the dashboard: the creator's code only goes
// live in the app once they accept the current program terms.
export default function AcceptTermsPage() {
	return (
		<DashboardAuthGate requireTerms={false}>
			<AcceptTermsForm />
		</DashboardAuthGate>
	);
}

function AcceptTermsForm() {
	const router = useRouter();
	const monuments = useCreatorMonuments();
	const [accepted, setAccepted] = useState(false);
	const [indiaResident, setIndiaResident] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	const submit = async (e) => {
		e.preventDefault();
		if (!accepted || !indiaResident) return;
		setSaving(true);
		setError(null);
		try {
			const res = await creatorFetch("/api/creator/me/accept-terms", {
				method: "POST",
				body: JSON.stringify({
					accept: true,
					india_resident: true,
					terms_version: TERMS_VERSION,
				}),
			});
			const json = await res.json();
			if (!json.success) throw new Error(json.error || "Could not save your acceptance");
			router.replace(CREATOR_ROUTES.dashboard);
		} catch (err) {
			setError(err.message);
			setSaving(false);
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-12 font-montserrat text-white">
			<form
				onSubmit={submit}
				className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
				<h1 className="text-xl font-semibold">Before your code goes live</h1>
				<p className="mt-2 text-sm text-white/50">
					Your code starts working in the app once you accept the creator terms.
				</p>

				<ul className="mt-5 space-y-2 text-sm text-white/65">
					<li>
						You promote a one-time monument unlock at {formatInr(LIST_PRICE_INR)}.
						Your code gives {CUSTOMER_DISCOUNT_PERCENT}% off.
					</li>
					<li>
						You earn {TIERS[0].rate}% to {TIERS[TIERS.length - 1].rate}% of the
						list price per sale, rising with your total sales.
					</li>
					<li>
						You get one monument for {ASSIGNMENT_DAYS} days at a time, and your code works only
						there during that window. Monuments now: {monuments.map((m) => m.name).join(", ")}.
					</li>
					<li>
						A scan of your QR (it opens Epocheye in the app store) counts as a click. Only paid
						unlocks in the app with your code count as sales.
					</li>
					<li>Payouts go by UPI, in rupees.</li>
				</ul>

				<label className="mt-6 flex items-start gap-3 text-sm text-white/75">
					<input
						type="checkbox"
						checked={accepted}
						onChange={(e) => setAccepted(e.target.checked)}
						className="mt-1"
					/>
					<span>
						I have read and accept the{" "}
						<Link href="/terms" target="_blank" className="underline">
							Creator Program Terms
						</Link>{" "}
						(version {TERMS_VERSION}).
					</span>
				</label>
				<label className="mt-3 flex items-start gap-3 text-sm text-white/75">
					<input
						type="checkbox"
						checked={indiaResident}
						onChange={(e) => setIndiaResident(e.target.checked)}
						className="mt-1"
					/>
					<span>I am a resident of India, at least 18, with a UPI ID in my name.</span>
				</label>

				{error && <p className="mt-4 text-sm text-red-400">{error}</p>}

				<button
					type="submit"
					disabled={!accepted || !indiaResident || saving}
					className="mt-6 w-full rounded-full border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white">
					{saving ? "Saving…" : "Accept and open dashboard"}
				</button>

				<p className="mt-4 text-xs text-white/35">
					Not in India? The program isn&apos;t open to you yet. Email {SUPPORT_EMAIL} to
					hear when it is.
				</p>
			</form>
		</main>
	);
}
