import streamDeck, {
	action,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent
} from "@elgato/streamdeck";

import { NetworkQualityError, runNetworkQuality } from "../network-quality";
import { renderError, renderIdle, renderResult, renderRunning } from "../render";
import type { NetworkQualitySettings } from "../types";

/**
 * Minimal structural view of a key action. Both {@link KeyDownEvent} and a
 * narrowed {@link WillAppearEvent} action satisfy this, which keeps the helper
 * methods free of the key/dial action union.
 */
type KeyApi = {
	readonly id: string;
	setImage(image?: string): Promise<void>;
	setSettings(settings: NetworkQualitySettings): Promise<void>;
};

/** Per-key runtime state (not persisted). */
type ContextState = {
	running: boolean;
	animTimer?: ReturnType<typeof setInterval>;
	refreshTimer?: ReturnType<typeof setInterval>;
};

const ANIMATION_INTERVAL_MS = 400;

/**
 * Runs Apple's networkQuality test on key press and renders download, upload,
 * and responsiveness on the key. Supports an optional auto-refresh interval.
 */
@action({ UUID: "com.davidsandilands.network-quality.test" })
export class SpeedTestAction extends SingletonAction<NetworkQualitySettings> {
	readonly #contexts = new Map<string, ContextState>();

	override async onWillAppear(ev: WillAppearEvent<NetworkQualitySettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const settings = ev.payload.settings;
		await this.#renderCurrent(ev.action, settings);
		this.#scheduleRefresh(ev.action, settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<NetworkQualitySettings>): void {
		const state = this.#contexts.get(ev.action.id);
		if (state) {
			this.#clearTimer(state, "animTimer");
			this.#clearTimer(state, "refreshTimer");
			this.#contexts.delete(ev.action.id);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<NetworkQualitySettings>): Promise<void> {
		await this.#runTest(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<NetworkQualitySettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const settings = ev.payload.settings;
		const state = this.#state(ev.action.id);
		if (!state.running) {
			await this.#renderCurrent(ev.action, settings);
		}
		this.#scheduleRefresh(ev.action, settings);
	}

	/** Draw the last result if present, otherwise the idle state. */
	async #renderCurrent(api: KeyApi, settings: NetworkQualitySettings): Promise<void> {
		if (settings.lastResult) {
			await api.setImage(renderResult(settings.lastResult, settings.units ?? "auto"));
		} else {
			await api.setImage(renderIdle());
		}
	}

	/** Start a test, animating while it runs, then persist and render the result. */
	async #runTest(api: KeyApi, settings: NetworkQualitySettings): Promise<void> {
		const state = this.#state(api.id);
		if (state.running) {
			return;
		}
		state.running = true;

		let frame = 0;
		await api.setImage(renderRunning(frame));
		state.animTimer = setInterval(() => {
			frame += 1;
			void api.setImage(renderRunning(frame));
		}, ANIMATION_INTERVAL_MS);

		try {
			const result = await runNetworkQuality(settings);
			this.#clearTimer(state, "animTimer");
			await api.setSettings({ ...settings, lastResult: result });
			await api.setImage(renderResult(result, settings.units ?? "auto"));
		} catch (err) {
			this.#clearTimer(state, "animTimer");
			const message = err instanceof NetworkQualityError ? err.message : "Test failed";
			streamDeck.logger.error("networkQuality test failed", err);
			await api.setImage(renderError(message));
		} finally {
			state.running = false;
		}
	}

	/** (Re)arm the auto-refresh timer based on the configured interval. */
	#scheduleRefresh(api: KeyApi, settings: NetworkQualitySettings): void {
		const state = this.#state(api.id);
		this.#clearTimer(state, "refreshTimer");

		const minutes = Number(settings.autoRefreshMinutes ?? 0);
		if (Number.isFinite(minutes) && minutes > 0) {
			state.refreshTimer = setInterval(
				() => {
					void this.#runTest(api, settings);
				},
				minutes * 60_000
			);
		}
	}

	#state(id: string): ContextState {
		let state = this.#contexts.get(id);
		if (!state) {
			state = { running: false };
			this.#contexts.set(id, state);
		}
		return state;
	}

	#clearTimer(state: ContextState, key: "animTimer" | "refreshTimer"): void {
		const timer = state[key];
		if (timer) {
			clearInterval(timer);
			state[key] = undefined;
		}
	}
}
