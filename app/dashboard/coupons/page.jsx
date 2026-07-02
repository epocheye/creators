"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Plus, Copy, Check, Loader2, Ban } from "lucide-react";
import { creatorFetch } from "@/lib/creatorApi";

function formatDate(value) {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	} catch {
		return "—";
	}
}

function formatPaise(paise) {
	return `₹${(Number(paise || 0) / 100).toFixed(2)}`;
}

function couponStatus(c) {
	if (!c.is_active) return { label: "Inactive", tone: "muted" };
	if (c.expires_at && new Date(c.expires_at) < new Date()) {
		return { label: "Expired", tone: "muted" };
	}
	if (c.max_uses != null && c.use_count >= c.max_uses) {
		return { label: "Exhausted", tone: "amber" };
	}
	return { label: "Active", tone: "green" };
}

function StatusPill({ status }) {
	const tones = {
		green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
		amber: "bg-amber-500/10 border-amber-500/20 text-amber-300",
		muted: "bg-white/5 border-white/10 text-white/40",
	};
	const dot = {
		green: "bg-emerald-400",
		amber: "bg-amber-400",
		muted: "bg-white/30",
	};
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${tones[status.tone]}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${dot[status.tone]}`} />
			{status.label}
		</span>
	);
}

const EMPTY_FORM = {
	code: "",
	discount_percent: "10",
	label: "",
	max_uses: "",
	expires_at: "",
};

export default function CouponsPage() {
	const [coupons, setCoupons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState(EMPTY_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [copied, setCopied] = useState(null);
	const [deactivating, setDeactivating] = useState(null);

	const load = useCallback(async () => {
		try {
			const res = await creatorFetch("/api/coupons");
			if (res.ok) {
				const json = await res.json();
				setCoupons(Array.isArray(json) ? json : []);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const update = (key) => (e) =>
		setForm((f) => ({ ...f, [key]: e.target.value }));

	const handleCreate = async (e) => {
		e.preventDefault();
		setError(null);

		const discount = parseInt(form.discount_percent, 10);
		if (Number.isNaN(discount) || discount < 5 || discount > 25) {
			setError("Discount must be between 5% and 25%.");
			return;
		}
		const code = form.code.trim().toUpperCase();
		if (code && !/^[A-Z0-9]{4,12}$/.test(code)) {
			setError("Custom code must be 4–12 letters or digits.");
			return;
		}

		const payload = { discount_percent: discount };
		if (code) payload.code = code;
		if (form.label.trim()) payload.label = form.label.trim();
		if (form.max_uses.trim()) {
			const m = parseInt(form.max_uses, 10);
			if (!Number.isNaN(m) && m > 0) payload.max_uses = m;
		}
		if (form.expires_at) {
			// <input type="date"> → end-of-day ISO so the coupon is valid all day.
			payload.expires_at = new Date(`${form.expires_at}T23:59:59`).toISOString();
		}

		setSubmitting(true);
		try {
			const res = await creatorFetch("/api/coupons", {
				method: "POST",
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const text = await res.text();
				setError(text || "Could not create coupon.");
				return;
			}
			setForm(EMPTY_FORM);
			await load();
		} catch {
			setError("Could not reach the coupon service.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeactivate = async (id) => {
		setDeactivating(id);
		try {
			const res = await creatorFetch(`/api/coupons/${id}`, { method: "DELETE" });
			if (res.ok) await load();
		} finally {
			setDeactivating(null);
		}
	};

	const copyCode = async (code) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(code);
			setTimeout(() => setCopied(null), 2000);
		} catch {
			// Clipboard can fail in unsupported contexts.
		}
	};

	return (
		<div className="p-6 md:p-10 max-w-5xl">
			<div className="mb-8">
				<h1 className="text-xl font-semibold text-white">Coupons</h1>
				<p className="text-white/35 text-sm mt-1">
					Create discount codes your audience can apply at checkout in the Epocheye app.
				</p>
			</div>

			{/* Create form */}
			<form
				onSubmit={handleCreate}
				className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6 mb-6">
				<p className="text-xs font-medium text-white/35 uppercase tracking-widest mb-5 flex items-center gap-2">
					<BadgePercent className="w-3.5 h-3.5" />
					New coupon
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<label className="flex flex-col gap-1.5">
						<span className="text-xs text-white/40">Code (optional)</span>
						<input
							value={form.code}
							onChange={update("code")}
							placeholder="Auto-generated if blank"
							maxLength={12}
							className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase placeholder:text-white/20 placeholder:normal-case focus:outline-none focus:border-white/30"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-xs text-white/40">Discount % (5–25)</span>
						<input
							type="number"
							min={5}
							max={25}
							required
							value={form.discount_percent}
							onChange={update("discount_percent")}
							className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-xs text-white/40">Label (optional)</span>
						<input
							value={form.label}
							onChange={update("label")}
							placeholder="e.g. Diwali launch"
							className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-xs text-white/40">Max uses (optional)</span>
						<input
							type="number"
							min={1}
							value={form.max_uses}
							onChange={update("max_uses")}
							placeholder="Unlimited"
							className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-xs text-white/40">Expires (optional)</span>
						<input
							type="date"
							value={form.expires_at}
							onChange={update("expires_at")}
							className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
						/>
					</label>
				</div>

				{error && (
					<p className="text-sm text-red-400/90 mt-4 break-words">{error}</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-sm text-white/80 hover:text-white hover:border-white/30 transition-all duration-200 disabled:opacity-50">
					{submitting ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Plus className="w-4 h-4" />
					)}
					{submitting ? "Creating…" : "Create coupon"}
				</button>
			</form>

			{/* List */}
			<div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
				{loading ? (
					<div className="p-6 space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-12 bg-white/3 rounded-lg animate-pulse" />
						))}
					</div>
				) : coupons.length === 0 ? (
					<div className="p-10 text-center">
						<p className="text-white/60 text-sm">No coupons yet.</p>
						<p className="text-white/30 text-xs mt-1">
							Create one above — it works instantly in the app at checkout.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-white/5 text-white/40 text-[11px] uppercase tracking-wider">
									<th className="text-left px-5 py-3 font-medium">Code</th>
									<th className="text-right px-5 py-3 font-medium">Discount</th>
									<th className="text-right px-5 py-3 font-medium">Uses</th>
									<th className="text-right px-5 py-3 font-medium">Given</th>
									<th className="text-left px-5 py-3 font-medium">Expires</th>
									<th className="text-left px-5 py-3 font-medium">Status</th>
									<th className="text-right px-5 py-3 font-medium" />
								</tr>
							</thead>
							<tbody>
								{coupons.map((c) => {
									const status = couponStatus(c);
									return (
										<tr
											key={c.coupon_id}
											className="border-b border-white/5 last:border-b-0 hover:bg-white/2 transition-colors">
											<td className="px-5 py-4">
												<button
													onClick={() => copyCode(c.code)}
													className="inline-flex items-center gap-2 text-white font-mono hover:text-white/80"
													aria-label={`Copy ${c.code}`}>
													{c.code}
													{copied === c.code ? (
														<Check className="w-3.5 h-3.5 text-green-400" />
													) : (
														<Copy className="w-3.5 h-3.5 text-white/30" />
													)}
												</button>
												{c.label ? (
													<div className="text-white/30 text-xs mt-0.5">
														{c.label}
													</div>
												) : null}
											</td>
											<td className="px-5 py-4 text-white/80 text-right">
												{c.discount_percent}%
											</td>
											<td className="px-5 py-4 text-white/60 text-right">
												{c.use_count}
												{c.max_uses != null ? ` / ${c.max_uses}` : ""}
											</td>
											<td className="px-5 py-4 text-white/60 text-right">
												{formatPaise(c.total_discount_given_paise)}
											</td>
											<td className="px-5 py-4 text-white/60">
												{formatDate(c.expires_at)}
											</td>
											<td className="px-5 py-4">
												<StatusPill status={status} />
											</td>
											<td className="px-5 py-4 text-right">
												{c.is_active ? (
													<button
														onClick={() => handleDeactivate(c.coupon_id)}
														disabled={deactivating === c.coupon_id}
														className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400/90 transition-colors disabled:opacity-50"
														aria-label={`Deactivate ${c.code}`}>
														{deactivating === c.coupon_id ? (
															<Loader2 className="w-3.5 h-3.5 animate-spin" />
														) : (
															<Ban className="w-3.5 h-3.5" />
														)}
														Deactivate
													</button>
												) : (
													<span className="text-white/20 text-xs">—</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<p className="text-white/30 text-xs mt-4">
				Codes are stored in uppercase and the app accepts any case visitors type.
				Deactivating a coupon stops it from being applied immediately.
			</p>
		</div>
	);
}
