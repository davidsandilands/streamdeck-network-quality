import type { NetworkQualityResult, SpeedUnits } from "./types";

const SIZE = 144;
const BG = "#15151E";
const DL_COLOR = "#4ECDC4";
const UL_COLOR = "#7AA2F7";
const LABEL = "#8A8A99";
const TEXT = "#ECECF1";

/** Wrap inner SVG markup into a 144x144 data URL accepted by `setImage`. */
function svg(inner: string): string {
	const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${inner}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(doc).toString("base64")}`;
}

function background(fill: string = BG): string {
	return `<rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="18" fill="${fill}"/>`;
}

/** A small solid triangle, pointing down (download) or up (upload). */
function arrow(cx: number, cy: number, s: number, color: string, up: boolean): string {
	const d = up
		? `M${cx - s},${cy + s} L${cx + s},${cy + s} L${cx},${cy - s} Z`
		: `M${cx - s},${cy - s} L${cx + s},${cy - s} L${cx},${cy + s} Z`;
	return `<path d="${d}" fill="${color}"/>`;
}

/** Convert bits/sec into a display value + unit, honoring the chosen units. */
export function formatSpeed(bps: number, units: SpeedUnits): { value: string; unit: string } {
	const mbps = bps / 1e6;
	const useGbps = units === "gbps" || (units === "auto" && mbps >= 1000);
	const v = useGbps ? mbps / 1000 : mbps;
	const unit = useGbps ? "Gbps" : "Mbps";

	let value: string;
	if (!Number.isFinite(v)) {
		value = "–";
	} else if (v >= 100) {
		value = Math.round(v).toString();
	} else if (v >= 10) {
		value = v.toFixed(1);
	} else {
		value = v.toFixed(2);
	}
	return { value, unit };
}

/** Color band for responsiveness: green (good), amber (ok), red (poor). */
function rpmColor(rpm: number): string {
	if (rpm >= 800) {
		return "#4ECDC4";
	}
	if (rpm >= 300) {
		return "#F4C430";
	}
	return "#FF6B6B";
}

/** Render a completed result: ↓download, ↑upload, unit, and an RPM band. */
export function renderResult(result: NetworkQualityResult, units: SpeedUnits): string {
	const dl = formatSpeed(result.downloadBps, units);
	const ul = formatSpeed(result.uploadBps, units);
	const rpm = Math.round(result.responsivenessRpm);
	const band = rpmColor(rpm);
	const unitLabel = dl.unit === ul.unit ? dl.unit : `${dl.unit}/${ul.unit}`;

	return svg(
		background() +
			arrow(26, 34, 8, DL_COLOR, false) +
			`<text x="44" y="44" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${TEXT}">${dl.value}</text>` +
			arrow(26, 76, 8, UL_COLOR, true) +
			`<text x="44" y="86" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${TEXT}">${ul.value}</text>` +
			`<text x="${SIZE / 2}" y="108" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${LABEL}">${unitLabel}</text>` +
			`<rect x="10" y="116" width="124" height="20" rx="6" fill="${band}"/>` +
			`<text x="${SIZE / 2}" y="131" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#15151E">RPM ${rpm}</text>`
	);
}

/** Idle/ready state shown before the first test. */
export function renderIdle(): string {
	return svg(
		background() +
			arrow(60, 56, 11, DL_COLOR, false) +
			arrow(84, 56, 11, UL_COLOR, true) +
			`<text x="${SIZE / 2}" y="98" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${TEXT}">Speed</text>` +
			`<text x="${SIZE / 2}" y="120" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${LABEL}">Tap to test</text>`
	);
}

/** Animated running state; `frame` increments while the test runs. */
export function renderRunning(frame: number): string {
	const dots = [0, 1, 2]
		.map((i) => {
			const on = i === frame % 3;
			return `<circle cx="${56 + i * 16}" cy="92" r="6" fill="${on ? DL_COLOR : "#3A3A48"}"/>`;
		})
		.join("");

	return svg(
		background() +
			`<text x="${SIZE / 2}" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="${TEXT}">Testing</text>` +
			dots +
			`<text x="${SIZE / 2}" y="124" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="${LABEL}">~15s</text>`
	);
}

/** Error state with a short message. */
export function renderError(message: string): string {
	const short = message.length > 22 ? `${message.slice(0, 21)}…` : message;
	return svg(
		background("#2A1620") +
			`<path d="M52,40 L92,80 M92,40 L52,80" stroke="#FF6B6B" stroke-width="9" stroke-linecap="round"/>` +
			`<text x="${SIZE / 2}" y="118" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="${TEXT}">${escapeXml(short)}</text>`
	);
}

/** Escape characters that would break the SVG/XML document. */
function escapeXml(s: string): string {
	return s.replace(/[<>&"']/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case '"':
				return "&quot;";
			default:
				return "&apos;";
		}
	});
}
