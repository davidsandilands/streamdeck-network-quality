// Generates the plugin's raster icons (no external dependencies).
//
// macOS ships no SVG rasterizer and we avoid adding native image libs, so this
// draws a supersampled speedometer gauge into an RGBA buffer and encodes PNG
// directly (zlib deflate + CRC32). Run with: node tools/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = "com.davidsandilands.network-quality.sdPlugin";

const SS = 3; // supersampling factor for anti-aliasing

// Palette (matches src/render.ts)
const BG = [21, 21, 30];
const RING = [78, 205, 196];
const NEEDLE = [255, 107, 107];
const HUB = [236, 236, 241];
const WHITE = [255, 255, 255];

/** Signed distance to a rounded box centered in the unit square. */
function roundedBoxSdf(x, y, radius) {
	const dx = Math.abs(x - 0.5) - (0.5 - radius);
	const dy = Math.abs(y - 0.5) - (0.5 - radius);
	const ox = Math.max(dx, 0);
	const oy = Math.max(dy, 0);
	return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) - radius;
}

/** Distance from point to a line segment. */
function distToSegment(px, py, ax, ay, bx, by) {
	const vx = bx - ax;
	const vy = by - ay;
	const wx = px - ax;
	const wy = py - ay;
	const len2 = vx * vx + vy * vy || 1e-9;
	let t = (wx * vx + wy * vy) / len2;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

const TAU = Math.PI * 2;
const deg = (d) => (d * Math.PI) / 180;

/**
 * Color (with alpha) for a normalized point, before downsampling.
 * `variant` is "color" (rounded dark tile, teal/red gauge) or "mono"
 * (white gauge on a transparent background, per Marketplace icon rules).
 */
function sample(nx, ny, variant) {
	const mono = variant === "mono";

	let color = [0, 0, 0, 0];
	if (!mono) {
		// Background (transparent outside the rounded square).
		if (roundedBoxSdf(nx, ny, 0.16) > 0) {
			return [0, 0, 0, 0];
		}
		color = [...BG, 255];
	}

	const ringCol = mono ? WHITE : RING;
	const needleCol = mono ? WHITE : NEEDLE;
	const hubCol = mono ? WHITE : HUB;

	const cx = 0.5;
	const cy = 0.56;
	const dx = nx - cx;
	const dy = ny - cy;
	const dist = Math.hypot(dx, dy);

	// Gauge ring: 270deg arc, 90deg gap at the bottom.
	const ringR = 0.33;
	const ringT = 0.075;
	if (Math.abs(dist - ringR) <= ringT) {
		let ang = Math.atan2(dy, dx); // screen coords: +y is down
		if (ang < 0) ang += TAU;
		const gapHalf = deg(45);
		const bottom = deg(90);
		if (Math.abs(ang - bottom) > gapHalf) {
			color = [...ringCol, 255];
		}
	}

	// Needle pointing up-right (fast).
	const ang = deg(-38);
	const tipX = cx + Math.cos(ang) * 0.27;
	const tipY = cy + Math.sin(ang) * 0.27;
	if (distToSegment(nx, ny, cx, cy, tipX, tipY) <= 0.028) {
		color = [...needleCol, 255];
	}

	// Center hub.
	if (dist <= 0.06) {
		color = [...hubCol, 255];
	}

	return color;
}

/** Render an anti-aliased RGBA buffer at the requested size. */
function render(size, variant) {
	const hi = size * SS;
	const out = Buffer.alloc(size * size * 4);

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let sy = 0; sy < SS; sy++) {
				for (let sx = 0; sx < SS; sx++) {
					const nx = (x * SS + sx + 0.5) / hi;
					const ny = (y * SS + sy + 0.5) / hi;
					const [cr, cg, cb, ca] = sample(nx, ny, variant);
					const af = ca / 255;
					r += cr * af; // premultiplied
					g += cg * af;
					b += cb * af;
					a += ca;
				}
			}
			const n = SS * SS;
			const alpha = a / n;
			const i = (y * size + x) * 4;
			if (alpha > 0) {
				out[i] = Math.round(r / n / (alpha / 255));
				out[i + 1] = Math.round(g / n / (alpha / 255));
				out[i + 2] = Math.round(b / n / (alpha / 255));
			}
			out[i + 3] = Math.round(alpha);
		}
	}
	return out;
}

// --- PNG encoding ---------------------------------------------------------

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c;
	}
	return table;
})();

function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const typeBuf = Buffer.from(type, "ascii");
	const body = Buffer.concat([typeBuf, data]);
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body), 0);
	return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
	const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
	// 10-12 already zero (compression, filter, interlace)

	const stride = size * 4;
	const raw = Buffer.alloc((stride + 1) * size);
	for (let y = 0; y < size; y++) {
		raw[y * (stride + 1)] = 0; // filter: none
		rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
	}
	const idat = deflateSync(raw, { level: 9 });

	return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- Output ---------------------------------------------------------------

// [path without extension, @1x size, variant]; @2x is generated at double size.
// Marketplace rules: category icon is monochrome/transparent, action icon is a
// white stroke; the plugin "marketplace" icon and the key image stay full color.
const TARGETS = [
	["imgs/plugin/marketplace", 256, "color"],
	["imgs/plugin/category-icon", 28, "mono"],
	["imgs/actions/test/icon", 20, "mono"],
	["imgs/actions/test/key", 72, "color"]
];

for (const [rel, size, variant] of TARGETS) {
	for (const [suffix, dim] of [["", size], ["@2x", size * 2]]) {
		const file = resolve(ROOT, PLUGIN, `${rel}${suffix}.png`);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, encodePng(dim, render(dim, variant)));
		console.log(`wrote ${rel}${suffix}.png (${dim}x${dim}, ${variant})`);
	}
}
