// Epocheye-styled QR codes, drawn as SVG.
//
// The house style (owner's design, 2026-09-19):
//   - every dark module keeps square top-left and bottom-right corners and
//     rounds its top-right / bottom-left corner wherever that side is open,
//     so lone modules read as diagonal leaves;
//   - the three finder "eyes" use the same drop shape (top-right and
//     bottom-left rounded);
//   - the "ep" logo sits in a cleared circle in the centre.
// Error correction is H (30%) so the cleared centre never costs a scan.
//
// Use this for every QR we make; only the encoded text changes.
import QRCode from "qrcode";

const QUIET = 2; // quiet-zone modules around the code
const LOGO_FRACTION = 0.26; // logo circle diameter / code width (as in the design)

function modulePath(x, y, rTR, rBL) {
	// Square module at (x, y) with optional rounded TR / BL corners.
	let d = `M${x} ${y}`;
	d += rTR ? `H${x + 1 - rTR}A${rTR} ${rTR} 0 0 1 ${x + 1} ${y + rTR}` : `H${x + 1}`;
	d += `V${y + 1}`;
	d += rBL ? `H${x + rBL}A${rBL} ${rBL} 0 0 1 ${x} ${y + 1 - rBL}` : `H${x}`;
	return `${d}Z`;
}

function dropRect(x, y, size, r) {
	// Square with square TL / BR corners and radius-r TR / BL corners.
	return (
		`M${x} ${y}H${x + size - r}A${r} ${r} 0 0 1 ${x + size} ${y + r}` +
		`V${y + size}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + size - r}Z`
	);
}

function dropRectMirrored(x, y, size, r) {
	// Square with square TR / BL corners and radius-r TL / BR corners.
	return (
		`M${x + r} ${y}H${x + size}V${y + size - r}A${r} ${r} 0 0 1 ${x + size - r} ${y + size}` +
		`H${x}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
	);
}

function eyePath(x, y, mirrored) {
	// 7x7 finder: outer drop minus a 5x5 drop hole, plus a 3x3 drop centre.
	// Each eye keeps a square corner pointing at the centre of the code, as in
	// the design, so the top-right and bottom-left eyes are mirrored.
	const drop = mirrored ? dropRectMirrored : dropRect;
	return drop(x, y, 7, 3.2) + drop(x + 1, y + 1, 5, 2.2) + drop(x + 2, y + 2, 3, 1.4);
}

/**
 * @param {string} text  what the QR encodes (a creator's code, a URL, ...)
 * @param {{ color?: string, background?: string, logoHref?: string, size?: number }} [opts]
 *   color: module colour; background: fill behind the code ("none" = transparent);
 *   logoHref: centre logo image (black logo on light codes, white on dark).
 * @returns {string} SVG markup
 */
export function styledQrSvg(text, opts = {}) {
	const { color = "#000000", background = "#ffffff", logoHref = "/logo-black.png", size = 1024 } = opts;
	const qr = QRCode.create(String(text), { errorCorrectionLevel: "H" });
	const n = qr.modules.size;
	const data = qr.modules.data;
	const dark = (x, y) => x >= 0 && y >= 0 && x < n && y < n && data[y * n + x] === 1;

	const inEye = (x, y) =>
		(x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

	// Clear a circle in the middle for the logo (plus a half-module margin).
	const c = n / 2;
	const logoR = (n * LOGO_FRACTION) / 2;
	const cleared = (x, y) => Math.hypot(x + 0.5 - c, y + 0.5 - c) < logoR + 0.5;

	let body = "";
	for (let y = 0; y < n; y += 1) {
		for (let x = 0; x < n; x += 1) {
			if (!dark(x, y) || inEye(x, y) || cleared(x, y)) continue;
			const rTR = !dark(x, y - 1) && !dark(x + 1, y) ? 0.5 : 0;
			const rBL = !dark(x, y + 1) && !dark(x - 1, y) ? 0.5 : 0;
			body += modulePath(x, y, rTR, rBL);
		}
	}
	const eyes = eyePath(0, 0, false) + eyePath(n - 7, 0, true) + eyePath(0, n - 7, true);

	const total = n + QUIET * 2;
	const logoSize = n * LOGO_FRACTION * 0.92;
	const logoXY = c - logoSize / 2;
	const bg = background === "none" ? "" : `<rect x="${-QUIET}" y="${-QUIET}" width="${total}" height="${total}" fill="${background}"/>`;
	const logo = logoHref
		? `<image href="${logoHref}" x="${logoXY}" y="${logoXY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`
		: "";

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-QUIET} ${-QUIET} ${total} ${total}" shape-rendering="geometricPrecision">` +
		bg +
		`<path fill="${color}" fill-rule="evenodd" d="${body}"/>` +
		`<path fill="${color}" fill-rule="evenodd" d="${eyes}"/>` +
		logo +
		`</svg>`
	);
}

/**
 * Renders a styled QR to a PNG data URL in the browser. The logo is embedded
 * as a data URL first so the canvas is not tainted.
 */
export async function styledQrPng(text, opts = {}) {
	const { logoHref = "/logo-black.png", size = 1024 } = opts;
	let logoData = null;
	if (logoHref) {
		const blob = await (await fetch(logoHref)).blob();
		logoData = await new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.readAsDataURL(blob);
		});
	}
	const svg = styledQrSvg(text, { ...opts, logoHref: logoData, size });
	const img = new Image();
	img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	await img.decode();
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	canvas.getContext("2d").drawImage(img, 0, 0, size, size);
	return canvas.toDataURL("image/png");
}
