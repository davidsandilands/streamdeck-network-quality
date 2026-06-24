# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-24

Initial release. 🎉

### Added
- Press-to-test action that runs macOS's built-in `networkQuality` from a Stream
  Deck key and renders download, upload, and responsiveness (RPM) on the key.
- Color-coded RPM band (green / amber / red) for responsiveness under load.
- Live animation while a test runs (~15s).
- Optional auto-refresh on a configurable interval.
- Property Inspector settings: units (Mbps/Gbps), parallel/sequential mode,
  network interface, and iCloud Private Relay.

### Requirements
- macOS 12 (Monterey) or later.

[Unreleased]: https://github.com/davidsandilands/streamdeck-network-quality/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/davidsandilands/streamdeck-network-quality/releases/tag/v0.1.0
