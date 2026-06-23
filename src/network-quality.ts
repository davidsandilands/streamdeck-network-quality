import { spawn } from "node:child_process";

import type { NetworkQualityResult, NetworkQualitySettings } from "./types";

/** Absolute path to the macOS networkQuality binary (Monterey and later). */
const BINARY = "/usr/bin/networkquality";

/** Safety cap; a parallel test is ~15-20s, sequential longer. */
const HARD_TIMEOUT_MS = 90_000;

/** Error raised when a test cannot run or its output cannot be understood. */
export class NetworkQualityError extends Error {
	readonly detail?: string;

	constructor(message: string, detail?: string) {
		super(message);
		this.name = "NetworkQualityError";
		this.detail = detail;
	}
}

/** Shape of the raw JSON emitted by `networkquality -c`. */
type RawOutput = {
	dl_throughput?: number;
	ul_throughput?: number;
	responsiveness?: number;
	base_rtt?: number;
	interface_name?: string;
	end_date?: string;
	error_code?: number | string;
	error_domain?: string;
};

/** Build the networkQuality argument list from the action's settings. */
export function buildArgs(settings: NetworkQualitySettings): string[] {
	const args = ["-c"];
	if (settings.mode === "sequential") {
		args.push("-s");
	}
	if (settings.privateRelay) {
		args.push("-p");
	}
	const iface = (settings.interface ?? "").trim();
	if (iface && iface.toLowerCase() !== "auto") {
		args.push("-I", iface);
	}
	return args;
}

/** Parse and normalize the JSON output of `networkquality -c`. */
export function parseOutput(stdout: string): NetworkQualityResult {
	let raw: RawOutput;
	try {
		raw = JSON.parse(stdout) as RawOutput;
	} catch {
		throw new NetworkQualityError("Could not read networkQuality output");
	}

	if (raw.error_code !== undefined && raw.error_code !== 0) {
		throw new NetworkQualityError("networkQuality reported an error", `${raw.error_domain ?? "error"} ${raw.error_code}`);
	}

	if (typeof raw.dl_throughput !== "number" || typeof raw.ul_throughput !== "number") {
		throw new NetworkQualityError("networkQuality output was incomplete");
	}

	return {
		downloadBps: raw.dl_throughput,
		uploadBps: raw.ul_throughput,
		responsivenessRpm: typeof raw.responsiveness === "number" ? raw.responsiveness : 0,
		baseRttMs: typeof raw.base_rtt === "number" ? raw.base_rtt : undefined,
		interfaceName: raw.interface_name,
		endDate: raw.end_date,
		capturedAt: Date.now()
	};
}

/** Run a network quality test and resolve with the parsed result. */
export function runNetworkQuality(settings: NetworkQualitySettings): Promise<NetworkQualityResult> {
	const args = buildArgs(settings);

	return new Promise<NetworkQualityResult>((resolve, reject) => {
		const child = spawn(BINARY, args, { stdio: ["ignore", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";
		let settled = false;

		const finish = (fn: () => void): void => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timer);
			fn();
		};

		const timer = setTimeout(() => {
			finish(() => {
				child.kill("SIGKILL");
				reject(new NetworkQualityError("networkQuality timed out"));
			});
		}, HARD_TIMEOUT_MS);

		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		child.on("error", (err) => {
			finish(() => reject(new NetworkQualityError("Could not start networkQuality", err.message)));
		});

		child.on("close", (code) => {
			finish(() => {
				if (code !== 0) {
					reject(new NetworkQualityError(`networkQuality exited with code ${code}`, stderr.trim() || undefined));
					return;
				}
				try {
					resolve(parseOutput(stdout));
				} catch (err) {
					reject(err as Error);
				}
			});
		});
	});
}
