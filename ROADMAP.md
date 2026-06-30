# Roadmap

This roadmap focuses on making Image Watermark more useful, more trustworthy, and easier to recommend. It is not a promise of delivery order, but it explains the direction of the project.

## Current Focus

### Project Trust And Adoption

- Keep README, screenshots, and demo links current.
- Improve GitHub issue templates and contributor guidance.
- Keep `npm run verify` as the default local quality gate.
- Add more real-world examples for watermarking, compression, and metadata privacy.

### Privacy-First Image Workflows

- Keep image processing in the browser.
- Avoid account systems, server uploads, and persistent backend storage for core tools.
- Make privacy behavior obvious in the UI and docs.

## Near-Term Candidates

### PWA / Installable App

Make the app installable from the browser and improve repeat usage:

- Web app manifest.
- App icons.
- Offline shell for the main pages.
- Clear messaging for features that require WASM assets to be available.

### Better Demo Assets

Improve GitHub and social sharing conversion:

- Short watermark workflow GIF.
- Short metadata clear workflow GIF.
- Before / after compression screenshot.
- Example images that are safe to ship in the repository.

### Compression Comparison View

Make compression results easier to evaluate:

- Side-by-side preview.
- Original size, output size, saved percentage.
- Per-file quality result summary.

## Later Candidates

### Web Worker Batch Pipeline

Improve responsiveness when processing many large files:

- Worker-based queue.
- Pause / resume.
- Per-file retry.
- Better memory pressure handling.

### Watermark Presets

Save repeatable watermark settings locally:

- Text preset.
- Logo preset.
- Position, opacity, size, and rotation.
- Browser local storage only.

### Metadata Presets

Reusable metadata actions:

- Clear GPS.
- Clear all publishing-sensitive fields.
- Apply copyright / author template.
- Export metadata report.

## Non-Goals For Now

- User accounts.
- Backend file storage.
- Paid team workspaces.
- Server-side image processing.
- Replacing professional desktop editors.
