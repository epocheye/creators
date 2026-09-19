"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardAuthGate from "@/components/creators/DashboardAuthGate";
import { creatorFetch } from "@/lib/creatorApi";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";
import { ASSIGNMENT_DAYS, MAX_CREATORS } from "@/lib/creatorProgram";

const inputCx =
	"w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30";

const EMPTY = {
	name: "",
	phone: "",
	instagram_url: "",
	youtube_url: "",
	tiktok_url: "",
	twitter_url: "",
	audience_size: "",
	city: "",
	niche: "",
	pitch: "",
};

// Signed-up creators apply here; the team approves them. Once submitted, the
// application is shown read-only while it is reviewed (it can't be edited).
// After a rejection the creator may submit a fresh one.
export default function ApplyPage() {
	return (
		<DashboardAuthGate requireTerms={false}>
			<ApplyForm />
		</DashboardAuthGate>
	);
}

function ApplyForm() {
	const router = useRouter();
	const [profile, setProfile] = useState(null);
	const [form, setForm] = useState(EMPTY);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await creatorFetch("/api/creator/me");
				const json = await res.json();
				if (!active || !json.success) return;
				if (json.data.status === "active") {
					router.replace(json.data.terms_current ? CREATOR_ROUTES.dashboard : "/accept");
					return;
				}
				const app = json.data.application || {};
				startTransition(() => {
					setProfile(json.data);
					setForm({
						...EMPTY,
						name: app.name || json.data.name || "",
						phone: app.phone || "",
						instagram_url: app.instagram_url || json.data.instagram_url || "",
						youtube_url: app.youtube_url || json.data.youtube_url || "",
						tiktok_url: app.tiktok_url || json.data.tiktok_url || "",
						twitter_url: app.twitter_url || json.data.twitter_url || "",
						audience_size: app.audience_size || "",
						city: app.city || "",
						niche: app.niche || json.data.niche || "",
						pitch: app.pitch || "",
					});
				});
			} catch {
				startTransition(() => setProfile({ status: "pending" }));
			}
		})();
		return () => {
			active = false;
		};
	}, [router]);

	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

	const submit = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const res = await creatorFetch("/api/creator/me/apply", {
				method: "POST",
				body: JSON.stringify(form),
			});
			const json = await res.json();
			if (!json.success) throw new Error(json.error || "Could not submit your application");
			setProfile(json.data);
		} catch (err) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (!profile) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[#080808]">
				<div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
			</main>
		);
	}

	const submitted = Boolean(profile.applied_at) && profile.status === "pending";
	const rejected = profile.status === "rejected";

	if (submitted) {
		return <SubmittedApplication profile={profile} />;
	}

	return (
		<main className="min-h-screen bg-[#080808] px-5 py-12 font-montserrat text-white">
			<div className="mx-auto w-full max-w-xl">
				<h1 className="text-2xl font-semibold">Apply to the Creator Program</h1>
				<p className="mt-2 text-sm text-white/50">
					The program is invite-only: we take up to {MAX_CREATORS} creators. Approved creators get
					their own monument for {ASSIGNMENT_DAYS} days at a time, and their code works only there.
				</p>

				{rejected && (
					<div className="mt-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm text-white/75">
						We couldn&apos;t offer you a place this time. You can update your profile and apply
						again.
					</div>
				)}

				<form
					onSubmit={submit}
					className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
					<Field label="Your name">
						<input required value={form.name} onChange={set("name")} className={inputCx} />
					</Field>
					<Field label="Mobile number">
						<input
							required
							type="tel"
							inputMode="tel"
							autoComplete="tel"
							value={form.phone}
							onChange={set("phone")}
							placeholder="98765 43210"
							className={inputCx}
						/>
					</Field>
					<p className="text-xs text-white/40">At least one profile link:</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<input value={form.instagram_url} onChange={set("instagram_url")} placeholder="https://instagram.com/…" className={inputCx} />
						<input value={form.youtube_url} onChange={set("youtube_url")} placeholder="https://youtube.com/@…" className={inputCx} />
						<input value={form.tiktok_url} onChange={set("tiktok_url")} placeholder="https://tiktok.com/@…" className={inputCx} />
						<input value={form.twitter_url} onChange={set("twitter_url")} placeholder="https://x.com/…" className={inputCx} />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<Field label="Audience size">
							<input value={form.audience_size} onChange={set("audience_size")} placeholder="e.g. 25k" className={inputCx} />
						</Field>
						<Field label="City">
							<input value={form.city} onChange={set("city")} placeholder="e.g. Bengaluru" className={inputCx} />
						</Field>
						<Field label="Niche">
							<input value={form.niche} onChange={set("niche")} placeholder="e.g. Heritage" className={inputCx} />
						</Field>
					</div>
					<Field label="What do you make, and who watches it?">
						<textarea
							required
							minLength={20}
							maxLength={1000}
							rows={5}
							value={form.pitch}
							onChange={set("pitch")}
							className={inputCx}
						/>
					</Field>

					<p className="text-xs text-white/40">
						Check your details before you submit: an application can&apos;t be edited once it&apos;s
						sent.
					</p>

					{error && <p className="text-sm text-red-400">{error}</p>}

					<button
						type="submit"
						disabled={saving}
						className="w-full rounded-full border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-black disabled:opacity-40">
						{saving ? "Sending…" : "Submit application"}
					</button>
				</form>
			</div>
		</main>
	);
}

function Field({ label, children }) {
	return (
		<label className="block space-y-1.5">
			<span className="block text-xs text-white/40">{label}</span>
			{children}
		</label>
	);
}

const LINK_LABELS = {
	instagram_url: "Instagram",
	youtube_url: "YouTube",
	tiktok_url: "TikTok",
	twitter_url: "X / Twitter",
};

// Read-only copy of a submitted application.
function SubmittedApplication({ profile }) {
	const app = profile.application || {};
	const rows = [
		["Name", app.name],
		["Mobile number", app.phone],
		["Email", profile.email],
		...Object.entries(LINK_LABELS).map(([key, label]) => [label, app[key]]),
		["Audience size", app.audience_size],
		["City", app.city],
		["Niche", app.niche],
	].filter(([, value]) => value);
	const submittedOn = profile.applied_at
		? new Date(profile.applied_at).toLocaleDateString("en-IN", {
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: null;

	return (
		<main className="min-h-screen bg-[#080808] px-5 py-12 font-montserrat text-white">
			<div className="mx-auto w-full max-w-xl">
				<h1 className="text-2xl font-semibold">Application submitted</h1>
				<p className="mt-2 text-sm text-white/55">
					Thanks. We review every application and will email you at {profile.email} with our
					decision.{submittedOn ? ` Submitted on ${submittedOn}.` : ""}
				</p>

				<div className="mt-6 rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
					<dl className="space-y-3 text-sm">
						{rows.map(([label, value]) => (
							<div key={label} className="grid grid-cols-3 gap-3">
								<dt className="text-white/40">{label}</dt>
								<dd className="col-span-2 break-words text-white/85">{value}</dd>
							</div>
						))}
					</dl>
					{app.pitch && (
						<div className="mt-5 border-t border-white/5 pt-4">
							<p className="text-xs text-white/40">What you make, and who watches it</p>
							<p className="mt-1.5 whitespace-pre-line text-sm text-white/85">{app.pitch}</p>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
