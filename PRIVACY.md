# Privacy Policy

**Network Quality for Stream Deck** is a free, open-source plugin. It is designed
to collect as little as possible.

## What the plugin collects

**Nothing personal.** The plugin does not collect, store, transmit, or share any
personal data. It has no analytics, no tracking, and no accounts.

- Your settings (units, mode, interface, auto-refresh, and the most recent result)
  are stored **locally** by the Stream Deck app on your own machine.
- The plugin does not send your settings or results anywhere.

## Network activity

When you run a test, the plugin invokes macOS's built-in `networkquality`
tool (`/usr/bin/networkquality`). That tool measures your connection by
exchanging traffic with **Apple's** network-quality servers — this is how the
test works and is the same behavior as running `networkquality` yourself in
Terminal. That exchange is between your Mac and Apple; the plugin neither sees
nor records the contents of it. Apple's handling of that traffic is governed by
[Apple's Privacy Policy](https://www.apple.com/legal/privacy/).

## Questions

Open an issue at
<https://github.com/davidsandilands/streamdeck-network-quality/issues>.
