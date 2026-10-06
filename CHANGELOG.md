# Changelog

## 1.3.3 - 2026-10-06

- Apply the approved light workspace design to watermark, compression, and metadata tools in Chinese and English.
- Combine tool navigation with the site header while keeping language selection in the global header.
- Use compact file rows, larger unframed previews, grouped settings, and persistent export controls.
- Keep preview and settings visible together on mobile, with an expandable file list that retains drafts.
- Move compression summaries into the result area and give metadata tables a responsive three-column layout.
- Add a visible option for the existing default adaptive watermark mode; align Chinese and English compression layouts.
- Lock metadata inputs while reading or writing so fresh edits cannot be overwritten by the refreshed draft.
- Retain local image processing, all six routes, existing advanced controls, and SEO content.

## 1.3.2 - 2026-10-06

- Share tool panels between desktop and mobile layouts, retaining edits when switching tabs and fixing mobile tab overflow.
- Load Fabric only when an image is selected or batch processing starts. Dispose editor and batch canvases when leaving the tool.
- Cache the ExifTool WASM asset with a content-hashed URL.
- Serialize ExifTool operations to prevent concurrent files from corrupting the shared runtime.
- Correct GPS coordinate parsing, hemisphere handling, negative altitudes, and invalid input validation. Clear GPS from both EXIF and XMP.
- Report metadata processing failures instead of silently offering an unverified compressed file. Show partial preservation warnings.
- Handle the expected ICC deletion warning when clearing all metadata. Explain orientation and color profile removal in the editor.
- Avoid restoring stale orientation and image dimensions after canvas compression.
- Keep same-name files in compression ZIP downloads; display size increases correctly and calculate the total compression ratio by bytes.
- Update Next.js, React, Fabric, fflate, and compatible transitive dependencies. Retain the previous Fabric positioning defaults.
- Add metadata regression coverage to `npm run verify` and monthly Dependabot checks.

Production dependencies passed `npm audit --omit=dev` on the release check. The development dependency chain through ESLint and `braces` still has advisories without a compatible upstream fix; do not downgrade Next.js tooling through `npm audit fix --force`.
