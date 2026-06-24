# Network Quality for Stream Deck (macOS)

A free, open-source Stream Deck plugin that runs Apple's built-in
[`networkQuality`](https://support.apple.com/guide/mac-help/test-your-internet-connections-speed-mchlf09e9be0/mac)
tool and shows **download**, **upload**, and **responsiveness (RPM)** right on a key.

macOS has shipped a capable network test (`/usr/bin/networkquality`) since Monterey,
but there's no free Stream Deck plugin for it — only a paid/Windows option. This fills that gap.

<p align="center">
  <em>↓ download · ↑ upload · RPM responsiveness band (green / amber / red)</em>
</p>

## Features

- **One-press test** — press the key to run `networkQuality`; an animation plays while it runs (~15s).
- **Three metrics at a glance** — download, upload, and responsiveness rendered together.
- **Auto-refresh** — optionally re-run on an interval (e.g. every 5 minutes).
- **Configurable** — units (Mbps/Gbps), parallel vs. sequential, network interface, and iCloud Private Relay.
- **macOS native** — no API keys, no accounts, no third-party servers beyond Apple's test endpoints.

## Requirements

- macOS 12 (Monterey) or later — `networkQuality` is built in.
- Stream Deck app 7.1+.

## Install

### From the Marketplace
Coming soon.

### From source (development)

```bash
npm install            # install build deps
npm run build          # bundle src/ -> *.sdPlugin/bin/plugin.js
node tools/gen-icons.mjs   # regenerate raster icons (only if you change the design)

streamdeck dev                                            # enable developer mode (once)
streamdeck link com.davidsandilands.network-quality.sdPlugin
streamdeck restart com.davidsandilands.network-quality
```

Then drag **Network Quality → Network Quality Test** onto a key.

Use `npm run watch` during development — it rebuilds and restarts the plugin on every change.

### Releasing

CI (`.github/workflows/ci.yml`) builds and validates on every push/PR. To cut a
release: add an entry to [CHANGELOG.md](./CHANGELOG.md), then push a version tag:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

`.github/workflows/release.yml` then builds, packs the `.streamDeckPlugin`, and
publishes a GitHub Release with it and the gallery images attached. Upload that
packaged file to the [Elgato Maker Console](https://maker.elgato.com) to submit a
new version — Elgato has no publishing API, so that final submission is manual.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Units | Auto | `Auto` shows Mbps, switching to Gbps at ≥1000 Mbps. |
| Mode | Parallel | `Sequential` runs upload then download (Apple's `-s`). |
| Interface | Auto | Bind to a specific interface, e.g. `en0` (Apple's `-I`). |
| iCloud Private Relay | Off | Route the test over Private Relay (Apple's `-p`). |
| Auto-refresh (min) | 0 (off) | Re-run automatically every N minutes. |

## How it works

The plugin spawns `networkquality -c` (machine-readable JSON), parses the
`dl_throughput`, `ul_throughput`, `responsiveness`, and `base_rtt` fields, and renders
an SVG onto the key. No elevated privileges are required.

## Project layout

```
src/
  plugin.ts            # entry point: registers the action, connects
  actions/speed-test.ts# the key action (press, animation, auto-refresh, settings)
  network-quality.ts   # spawn + parse networkQuality, with timeout/error handling
  render.ts            # SVG rendering for result / running / idle / error states
  types.ts             # settings + result types
tools/gen-icons.mjs    # dependency-free PNG icon generator
com.davidsandilands.network-quality.sdPlugin/
  manifest.json        # plugin + action definition
  ui/network-quality.html  # Property Inspector (settings UI)
  imgs/                # generated icons
```

## Support

This is a personal, open-source project — built to scratch my own itch and shared
in case it's useful to you. There's no SLA, but bug reports and ideas are welcome:

- **Found a bug or have a request?** [Open an issue](https://github.com/davidsandilands/streamdeck-network-quality/issues).
- **Want to help?** Pull requests are welcome.

## Privacy

The plugin collects no personal data; settings stay on your machine. Tests use
Apple's `networkQuality`, which exchanges traffic with Apple's servers by design.
See [PRIVACY.md](./PRIVACY.md).

## Disclaimer

Unofficial — not affiliated with, endorsed by, or sponsored by Apple or
Elgato/Corsair. "networkQuality" is a macOS tool by Apple; "Stream Deck" is a
trademark of Corsair/Elgato. All trademarks belong to their respective owners.

## License

[MIT](./LICENSE) © David Sandilands
