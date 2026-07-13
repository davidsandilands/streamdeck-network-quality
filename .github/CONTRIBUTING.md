# Contributing

Thanks for your interest in improving **Network Quality for Stream Deck**! This
is a small, personal open-source project, so contributions are welcome but kept
lightweight. There's no SLA — please be patient with reviews.

## Ways to contribute

- **Report a bug** — [open an issue](https://github.com/davidsandilands/streamdeck-network-quality/issues)
  with your macOS version, Stream Deck app version, and steps to reproduce.
- **Suggest a feature** — open an issue describing the use case.
- **Send a pull request** — fixes and small improvements are appreciated.

## Development setup

Requires macOS 12+ and Node.js. See the [README](../README.md#from-source-development)
for the full flow.

```bash
npm install            # install build deps
npm run build          # bundle src/ -> *.sdPlugin/bin/plugin.js
npm run watch          # rebuild + restart the plugin on every change
```

## Pull request guidelines

- Keep changes focused — one concern per PR.
- Match the existing code style; run `npm run build` and confirm it succeeds.
- CI (`.github/workflows/ci.yml`) must pass.
- Update [CHANGELOG.md](../CHANGELOG.md) if your change is user-facing.
- Describe what changed and why in the PR description.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](../LICENSE) that covers this project.
