"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Copy, Check } from "lucide-react";
import { creatorFetch } from "@/lib/creatorApi";
import { formatUsd } from "@/lib/creatorProgram";
import { useCreatorProgram } from "@/lib/useCreatorMonuments";

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

// A code is live only while its creator holds a monument (see the "Your
// monument" card on the overview).
function couponStatus(c) {
	const now = new Date();
	if (!c.is_active) return { label: "Waiting for a monument", tone: "muted" };
	if (c.valid_from && new Date(c.valid_from) > now) return { label: "Starts soon", tone: "amber" };
	if (c.expires_at && new Date(c.expires_at) < now) return { label: "Window ended", tone: "muted" };
	return { label: "Live", tone: "green" };
}

function StatusPill({ status }) {
	const tones = {
		green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
		amber: "bg-amber-500/10 border-amber-500/20 text-amber-300",
		muted: "bg-white/5 border-white/10 text-white/40",
	};
	const dot = { green: "bg-emerald-400", amber: "bg-amber-400", muted: "bg-white/30" };
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${tones[status.tone]}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${dot[status.tone]}`} />
			{status.label}
		</span>
	);
}

// Read-only: each creator has one code. Epocheye sets its discount, and the
// creator's site assignment sets where and when it works.
export default function CouponsPage() {
	const [coupons, setCoupons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(null);
	const { inrPerUsd } = useCreatorProgram();

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await creatorFetch("/api/creator/coupons");
				if (res.ok) {
					const json = await res.json();
					if (active) setCoupons(Array.isArray(json) ? json : []);
				}
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

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
				<h1 className="text-xl font-semibold text-white flex items-center gap-2">
					<BadgePercent className="w-5 h-5 text-white/50" />
					Your code
				</h1>
				<p className="text-white/35 text-sm mt-1 max-w-2xl">
					Your code works only in the Epocheye app, only at your monument, during your window.
					Clicks are scans of your QR (see the overview). A code entry is someone typing your
					code in the app, once per person per day. A sale is someone paying in the app with
					your code.
				</p>
			</div>

			<div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
				{loading ? (
					<div className="h-32 animate-pulse" />
				) : coupons.length === 0 ? (
					<p className="px-5 py-10 text-sm text-white/35 text-center">
						Your code appears here once your application is approved and you&apos;ve accepted the
						terms.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-white/5 text-xs text-white/35">
									<th className="text-left px-5 py-3 font-medium">Code</th>
									<th className="text-right px-5 py-3 font-medium">Discount</th>
									<th className="text-right px-5 py-3 font-medium">Code entries</th>
									<th className="text-right px-5 py-3 font-medium">Sales</th>
									<th className="text-right px-5 py-3 font-medium">Discount given</th>
									<th className="text-left px-5 py-3 font-medium">Window</th>
									<th className="text-left px-5 py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{coupons.map((c) => (
									<tr key={c.coupon_id} className="border-b border-white/[0.03]">
										<td className="px-5 py-3">
											<button
												type="button"
												onClick={() => copyCode(c.code)}
												className="inline-flex items-center gap-2 font-mono text-white hover:text-white/80"
												aria-label={`Copy ${c.code}`}>
												{c.code}
												{copied === c.code ? (
													<Check className="w-3.5 h-3.5 text-green-400" />
												) : (
													<Copy className="w-3.5 h-3.5 text-white/30" />
												)}
											</button>
										</td>
										<td className="px-5 py-3 text-right text-white/70">{c.discount_percent}%</td>
										<td className="px-5 py-3 text-right text-white/70">{c.entries ?? 0}</td>
										<td className="px-5 py-3 text-right text-white/70">{c.total_orders ?? 0}</td>
										<td className="px-5 py-3 text-right text-white/50">
											{formatUsd(Number(c.total_discount_given_paise || 0) / 100, inrPerUsd)}
										</td>
										<td className="px-5 py-3 text-white/50 text-xs">
											{c.is_active && c.valid_from
												? `${formatDate(c.valid_from)} – ${formatDate(c.expires_at)}`
												: "—"}
										</td>
										<td className="px-5 py-3">
											<StatusPill status={couponStatus(c)} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
