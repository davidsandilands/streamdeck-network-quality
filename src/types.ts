/**
 * How throughput values are displayed on the key.
 * - `auto`: Mbps, switching to Gbps at/above 1000 Mbps.
 * - `mbps` / `gbps`: always use the chosen unit.
 */
export type SpeedUnits = "auto" | "mbps" | "gbps";

/** Whether networkQuality runs download/upload in parallel or sequentially. */
export type TestMode = "parallel" | "sequential";

/** Action settings, persisted per key via `setSettings`. */
export type NetworkQualitySettings = {
	units?: SpeedUnits;
	/** Network interface to bind to, e.g. `en0`. Empty or `auto` uses the default route. */
	interface?: string;
	mode?: TestMode;
	/** Route the test over iCloud Private Relay. */
	privateRelay?: boolean;
	/** Re-run automatically every N minutes. `0` (or unset) disables auto-refresh. */
	autoRefreshMinutes?: number;
	/** Most recent result, so the key can be restored when it reappears. */
	lastResult?: NetworkQualityResult;
};

/** A parsed, normalized networkQuality result. */
export type NetworkQualityResult = {
	/** Download throughput, bits per second. */
	downloadBps: number;
	/** Upload throughput, bits per second. */
	uploadBps: number;
	/** Responsiveness in round-trips per minute (RPM). */
	responsivenessRpm: number;
	/** Idle latency in milliseconds, if reported. */
	baseRttMs?: number;
	/** Interface the test ran on, e.g. `en0`. */
	interfaceName?: string;
	/** Test end timestamp as reported by networkQuality. */
	endDate?: string;
	/** Epoch milliseconds when the result was captured. */
	capturedAt?: number;
};
