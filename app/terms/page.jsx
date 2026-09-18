import Link from "next/link";
import {
	ACCESS_HOURS,
	CHANGE_NOTICE_DAYS,
	CUSTOMER_DISCOUNT_PERCENT,
	HOLD_DAYS,
	DEFAULT_MONUMENTS,
	LIST_PRICE_INR,
	MIN_PAYOUT_INR,
	SUPPORT_EMAIL,
	TERMS_VERSION,
	TIERS,
	commissionPerSale,
	formatInr,
} from "@/lib/creatorProgram";

export const metadata = {
	title: "Creator Program Terms - Epocheye",
	description:
		"Plain-language terms for the Epocheye Creator Program: what counts as a sale, how commission is calculated, payouts, and fraud.",
};

const MAIN_SITE_ORIGIN = (
	process.env.NEXT_PUBLIC_MAIN_SITE_ORIGIN ||
	process.env.MAIN_SITE_ORIGIN ||
	"https://epocheye.com"
).replace(/\/$/, "");

// Monuments the admin lists on the creator page (Admin → Settings → Creator Page).
async function getMonuments() {
	try {
		const res = await fetch(`${MAIN_SITE_ORIGIN}/api/creator/program`, {
			next: { revalidate: 60 },
		});
		const json = await res.json();
		const list = json?.data?.monuments;
		if (json?.success && Array.isArray(list) && list.length > 0) return list;
	} catch {
		// Fall through to the default.
	}
	return DEFAULT_MONUMENTS;
}

function Section({ n, title, children }) {
	return (
		<section>
			<h2 className="mb-3 text-xl font-semibold text-white">
				{n}. {title}
			</h2>
			<div className="space-y-3">{children}</div>
		</section>
	);
}

export default async function CreatorTermsPage() {
	const monuments = await getMonuments();
	return (
		<main className="min-h-screen bg-black font-montserrat text-white">
			<article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
				<Link
					href="/"
					className="text-xs uppercase tracking-widest text-white/40 hover:text-white/70">
					← Creator Program
				</Link>

				<header className="mb-10 mt-8">
					<h1 className="text-3xl font-light sm:text-4xl">Creator Program Terms</h1>
					<p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
						Version {TERMS_VERSION}
					</p>
					<p className="mt-5 text-sm leading-relaxed text-white/60">
						These terms are between you and Epocheye. You accept them when you
						join the program, and your code works only after you do. The
						general{" "}
						<a
							href="https://epocheye.com/terms"
							className="underline hover:text-white/80">
							Epocheye Terms of Service
						</a>{" "}
						also apply.
					</p>
				</header>

				<div className="space-y-9 text-sm leading-relaxed text-white/65">
					<Section n={1} title="Who can join">
						<p>
							The program is currently open only to residents of India with a
							UPI ID in their own name. You must be at least 18. One creator
							account per person.
						</p>
					</Section>

					<Section n={2} title="What you are promoting">
						<p>
							A one-time unlock of one monument in the Epocheye app, at a list
							price of {formatInr(LIST_PRICE_INR)} with {ACCESS_HOURS} hours of
							access. It is not a subscription. The program currently covers:{" "}
							{monuments
								.map((m) => (m.place ? `${m.name} (${m.place})` : m.name))
								.join(", ")}
							.
						</p>
						<p>
							Your code gives the customer {CUSTOMER_DISCOUNT_PERCENT}% off.
							Epocheye sets this discount; you cannot change it.
						</p>
					</Section>

					<Section n={3} title="What counts as a qualifying sale">
						<p>
							A sale qualifies when a customer enters your code at checkout in
							the Epocheye app and the payment is captured. Attribution is by
							code only. There is no link-click or cookie window: a visitor who
							clicks your link but buys without your code is not your sale.
						</p>
						<p>
							A sale does not qualify if it is refunded or charged back, if you
							or someone acting for you is the buyer, or if it breaks section 7.
						</p>
					</Section>

					<Section n={4} title="Commission">
						<p>
							Commission is a percentage of the {formatInr(LIST_PRICE_INR)} list
							price, not of the discounted price, so the customer discount never
							reduces your earnings. Your rate for each sale depends on how many
							qualifying sales you have made before it:
						</p>
						<ul className="list-disc space-y-1 pl-5">
							{TIERS.map((t) => (
								<li key={t.from}>
									{t.to === null
										? `Sale ${t.from} onward`
										: `Sales ${t.from} to ${t.to}`}
									: {t.rate}%, which is{" "}
									{formatInr(commissionPerSale(t.rate), { decimals: 2 })} per sale
								</li>
							))}
						</ul>
						<p>
							Moving up a tier raises the rate on later sales only. It does not
							change what earlier sales earned.
						</p>
					</Section>

					<Section n={5} title="Payouts">
						<p>
							Each sale is held for {HOLD_DAYS} days so refunds can clear, then
							becomes payable. Once your payable balance reaches{" "}
							{formatInr(MIN_PAYOUT_INR)}, you can request a payout from your
							dashboard. We pay to the UPI ID on your account and process
							requests at least once a month. Payouts are in Indian rupees.
						</p>
					</Section>

					<Section n={6} title="Refunds and chargebacks">
						<p>
							If a sale is refunded or charged back, its commission is reversed.
							If it was already paid out, we deduct it from your next payouts.
						</p>
					</Section>

					<Section n={7} title="Fraud and prohibited activity">
						<ul className="list-disc space-y-1 pl-5">
							<li>Buying through your own code, or having others buy for you to earn commission.</li>
							<li>Creating or using multiple or fake accounts, in the app or in this program.</li>
							<li>Bidding on Epocheye brand terms in paid search, or posting your code on coupon sites.</li>
							<li>Misleading claims about Epocheye, its prices, or where it works.</li>
						</ul>
						<p>
							If we find any of these, we may withhold or reverse the affected
							commission and close your account. You must also follow
							advertising disclosure rules and mark sponsored or paid posts as
							such.
						</p>
					</Section>

					<Section n={8} title="Changes and ending the program">
						<p>
							We may change the commission rates, the discount, the list price,
							or the list of monuments. We will give you at least{" "}
							{`${CHANGE_NOTICE_DAYS} days'`} notice by email before a change
							takes effect. Sales made before the change keep the terms they were
							made under.
						</p>
						<p>
							You can leave at any time. We can end your participation with
							notice, or immediately for a breach of section 7. When
							participation ends, payable commission from qualifying sales
							is still paid, except commission withheld under section 7.
						</p>
					</Section>

					<Section n={9} title="Contact">
						<p>
							Questions about these terms:{" "}
							<a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
								{SUPPORT_EMAIL}
							</a>
							.
						</p>
					</Section>
				</div>
			</article>
		</main>
	);
}
