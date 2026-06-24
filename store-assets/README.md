# Marketplace listing assets

1920×960 (2:1) images for the Elgato Marketplace listing. These are **listing
assets** uploaded in the Maker Console — they are not bundled in the plugin.

| File | Suggested Maker Console slot |
| --- | --- |
| `hero.png` | Thumbnail / first gallery image |
| `key-states.png` | Gallery image — explains the press-to-test flow |
| `property-inspector.png` | Gallery image — shows the settings |

The plugin icon itself (`imgs/plugin/marketplace.png`, 256/512) lives inside the
`.sdPlugin` bundle and is set in the manifest, not here.

## Regenerating

The `.svg` files are the editable source; the `.png` files are upload-ready.

```bash
node --experimental-strip-types tools/gen-gallery.mjs   # writes the .svg files
# rasterize to exact 1920×960 (needs: brew install librsvg)
for n in hero key-states property-inspector; do
  rsvg-convert -w 1920 -h 960 "store-assets/$n.svg" -o "store-assets/$n.png"
done
```

The compositions inline the real key renders from `src/render.ts`, so editing the
on-key design automatically flows through to these graphics on regeneration.
