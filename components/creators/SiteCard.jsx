"use client";

import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { creatorFetch } from "@/lib/creatorApi";
import { ASSIGNMENT_DAYS } from "@/lib/creatorProgram";

function fmtDate(value) {
	return new Date(value).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// The creator's monument and window, or their place in line.
export default function SiteCard() {
	const [site, setSite] = useState(null);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await creatorFetch("/api/creator/me/site");
				const json = await res.json();
				if (active && json.success) setSite(json.data);
			} catch {
				// Leave the card in its loading state.
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	if (!site) {
		return <div className="h-28 bg-[#0d0d0d] border border-white/5 rounded-xl animate-pulse" />;
	}

	if (site.state === "assigned") {
		const pct = site.sales_target > 0 ? Math.min(100, (site.sales_in_window / site.sales_target) * 100) : 100;
		return (
			<div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
				<p className="text-xs font-medium text-white/35 uppercase tracking-widest mb-3 flex items-center gap-2">
					<Landmark className="w-3.5 h-3.5" />
					Your monument{site.renewed ? " · renewed" : ""}
				</p>
				<p className="text-xl font-semibold text-white">{site.site_name}</p>
				<p className="text-sm text-white/45 mt-1">
					Your code works only here, until {fmtDate(site.ends_at)}.
				</p>
				<div className="mt-4">
					<div className="flex justify-between text-xs text-white/45 mb-1.5">
						<span>Sales this window</span>
						<span>
							{site.sales_in_window} / {site.sales_target} to keep it for another {ASSIGNMENT_DAYS} days
						</span>
					</div>
					<div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
						<div className="h-full bg-white/70 rounded-full" style={{ width: `${pct}%` }} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6">
			<p className="text-xs font-medium text-white/35 uppercase tracking-widest mb-3 flex items-center gap-2">
				<Landmark className="w-3.5 h-3.5" />
				Your monument
			</p>
			<p className="text-base text-white">
				{site.queue_position
					? `You're #${site.queue_position} in line for a monument.`
					: "You'll be in line for a monument once you've accepted the terms."}
			</p>
			<p className="text-sm text-white/45 mt-1">
				Each monument has one creator for {ASSIGNMENT_DAYS} days at a time. Your code starts working
				the day a monument becomes yours, and we&apos;ll show it here.
			</p>
		</div>
	);
}
