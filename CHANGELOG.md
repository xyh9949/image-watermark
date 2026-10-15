# Changelog

## 1.4.2 - 2026-10-15

- Keep drag-and-drop enabled over loaded watermark previews, compression results, and metadata tables in both languages.
- Append dropped files without replacing the active image, drafts, or existing results; retain validation and processing locks.
- Disable click-to-upload in loaded previews so canvas controls, result dialogs, downloads, and metadata inputs remain interactive.

## 1.4.1 - 2026-10-15

- Make the central empty upload area accept drag-and-drop files in all three tools and both languages, with hover and drag feedback.
- Share watermark file validation between the sidebar and central upload area, retaining local-only processing and single-batch handling.
- Keep file selection and toolbar shortcuts working without duplicate upload input IDs.
- Disable the persistent Turbopack build cache after detecting stale global CSS in a production rebuild.
- Add HTML smoke guards for the central upload areas, unique toolbar input IDs, and their referenced stylesheets.

## 1.4.0 - 2026-10-15

- Replace the green theme with a neutral gray-and-white workspace and blue primary actions, configured through Ant Design 6.
- Migrate navigation, buttons, inputs, sliders, switches, tabs, color pickers, uploads, metadata tables, collapsible sections, alerts, tags, progress indicators, and image preview dialogs to Ant Design.
- Extract initial component styles with the official Next.js registry and provide Chinese / English component locales.
- Respect reduced-motion preferences through Ant Design motion tokens instead of overriding popup animation lifecycles.
- Keep file processing local, retain all six tool routes and advanced settings, and preserve drafts when collapsing panels.
- Remove unused Radix UI components and dependencies, the old dropzone dependency, and manual fullscreen image drag event emulation.

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
