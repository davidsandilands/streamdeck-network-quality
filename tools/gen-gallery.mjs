// Generates 1920x960 Marketplace gallery images (SVG sources).
//
// Compositions inline the *real* key art produced by src/render.ts so the store
// graphics always match what the plugin actually draws.
//
// Run:
//   node --experimental-strip-types tools/gen-gallery.mjs
//     (the flag lets this .mjs import the TypeScript render module directly)
// Then rasterize each SVG to an exact-size PNG (qlmanage squares the output, so
// use rsvg-convert — `brew install librsvg`):
//   rsvg-convert -w 1920 -h 960 store-assets/<name>.svg -o store-assets/<name>.png
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { renderIdle, renderResult, renderRunning } from "../src/render.ts";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "store-assets");
mkdirSync(OUT, { recursive: true });

const W = 1920;
const H = 960;

// Palette (matches src/render.ts)
const BG0 = "#0E0E16";
const BG1 = "#1B1B2A";
const TEAL = "#4ECDC4";
const BLUE = "#7AA2F7";
const TEXT = "#ECECF1";
const MUTED = "#9A9AAD";
const PANEL = "#1E1E28";
const FIELD = "#2A2A36";

const SANS = "Helvetica, Arial, sans-serif";

// A representative result so the graphics show realistic numbers.
const SAMPLE = {
	downloadBps: 231_688_448,
	uploadBps: 100_125_160,
	responsivenessRpm: 397,
	baseRttMs: 28
};

/** Wrap composition markup in a 1920x960 SVG document with shared defs. */
function doc(inner) {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${BG0}"/>
    <stop offset="1" stop-color="${BG1}"/>
  </linearGradient>
  <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#000000" flood-opacity="0.55"/>
  </filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${inner}
</svg>`;
}

/** Extract the inner markup of a 144x144 key SVG data URL. */
function keyInner(dataUrl) {
	const svg = Buffer.from(dataUrl.split(",")[1], "base64").toString("utf8");
	return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

/**
 * Place a rendered key as a key cap with a drop shadow. The key art is inlined
 * as a nested <svg> (rather than an <image> href) so any SVG rasterizer renders
 * it natively.
 */
function keyCap(dataUrl, x, y, size) {
	const rx = size * 0.125; // matches the key's rounded corners
	return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${BG0}" filter="url(#shadow)"/>
<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 144 144">${keyInner(dataUrl)}</svg>`;
}

function text(x, y, size, fill, weight, content, anchor = "start") {
	return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${content}</text>`;
}

// --- Hero -----------------------------------------------------------------

function hero() {
	const key = keyCap(renderResult(SAMPLE, "auto"), 1260, 250, 460);
	return doc(
		text(140, 360, 110, TEXT, 800, "Network Quality") +
			text(140, 440, 42, TEAL, 600, "Apple&#8217;s network test, one tap on your Stream Deck") +
			text(140, 520, 30, MUTED, 400, "Download &#183; Upload &#183; Responsiveness (RPM) &#183; macOS") +
			`<circle cx="156" cy="612" r="9" fill="${TEAL}"/>` +
			text(178, 622, 28, TEXT, 400, "Download &amp; upload throughput") +
			`<circle cx="156" cy="662" r="9" fill="${BLUE}"/>` +
			text(178, 672, 28, TEXT, 400, "Live responsiveness, color-coded") +
			`<circle cx="156" cy="712" r="9" fill="#F4C430"/>` +
			text(178, 722, 28, TEXT, 400, "Free &amp; open source") +
			key
	);
}

// --- Key states -----------------------------------------------------------

function keyStates() {
	const size = 280;
	const y = 320;
	const xs = [300, 820, 1340];
	const caps = [renderIdle(), renderRunning(1), renderResult(SAMPLE, "auto")];
	const labels = ["Idle", "Testing&#8230;", "Result"];

	let inner = text(W / 2, 180, 64, TEXT, 800, "Press to test", "middle");
	caps.forEach((cap, i) => {
		inner += keyCap(cap, xs[i], y, size);
		inner += text(xs[i] + size / 2, y + size + 60, 34, MUTED, 600, labels[i], "middle");
	});
	// arrows between the keys
	[610, 1130].forEach((x) => {
		inner += `<path d="M${x},${y + size / 2} l44,0 m-16,-14 l16,14 l-16,14" stroke="${MUTED}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
	});
	return doc(inner);
}

// --- Property Inspector mockup --------------------------------------------

function propertyInspector() {
	const px = 1060;
	const pw = 720;
	const py = 150;
	const ph = 660;

	let inner =
		text(150, 330, 76, TEXT, 800, "Tune it to") +
		text(150, 415, 76, TEXT, 800, "your setup") +
		text(152, 500, 30, MUTED, 400, "Units, parallel or sequential,") +
		text(152, 542, 30, MUTED, 400, "a specific interface, Private Relay,") +
		text(152, 584, 30, MUTED, 400, "and optional auto-refresh.");

	inner += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="22" fill="${PANEL}" stroke="#2F2F3D" stroke-width="2" filter="url(#shadow)"/>`;
	inner += text(px + 40, py + 70, 30, TEXT, 700, "Network Quality Test");
	inner += `<line x1="${px + 40}" y1="${py + 96}" x2="${px + pw - 40}" y2="${py + 96}" stroke="#33333f" stroke-width="2"/>`;

	const rows = [
		["Units", "Auto (Mbps / Gbps)", false],
		["Mode", "Parallel", false],
		["Interface", "auto (e.g. en0)", false],
		["Private Relay", "", true],
		["Auto-refresh (min)", "5", false]
	];

	const labelX = px + 40;
	const fieldX = px + 320;
	const fieldW = pw - 360;
	let ry = py + 150;
	for (const [label, value, isCheckbox] of rows) {
		inner += text(labelX, ry + 30, 26, MUTED, 500, label);
		if (isCheckbox) {
			inner += `<rect x="${fieldX}" y="${ry + 4}" width="40" height="40" rx="8" fill="${FIELD}" stroke="#3a3a48" stroke-width="2"/>`;
		} else {
			inner += `<rect x="${fieldX}" y="${ry}" width="${fieldW}" height="48" rx="10" fill="${FIELD}" stroke="#3a3a48" stroke-width="2"/>`;
			const isPlaceholder = label === "Interface";
			inner += text(fieldX + 18, ry + 32, 24, isPlaceholder ? MUTED : TEXT, 400, value);
			if (label === "Units" || label === "Mode") {
				const cx = fieldX + fieldW - 28;
				inner += `<path d="M${cx - 8},${ry + 20} l8,9 l8,-9" stroke="${MUTED}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
			}
		}
		ry += 92;
	}

	return doc(inner);
}

const FILES = [
	["hero", hero()],
	["key-states", keyStates()],
	["property-inspector", propertyInspector()]
];

for (const [name, svg] of FILES) {
	writeFileSync(resolve(OUT, `${name}.svg`), svg);
	console.log(`wrote store-assets/${name}.svg`);
}
