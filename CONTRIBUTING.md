# Contributing

Thanks for helping improve Image Watermark. This project is a browser-based image toolkit focused on privacy, batch workflows, and practical publishing tasks.

## Ways To Contribute

- Report bugs with a clear reproduction.
- Suggest workflows that are useful for photographers, creators, ecommerce teams, and designers.
- Improve Chinese or English copy.
- Test image metadata behavior across JPG, PNG, and WebP files.
- Improve accessibility, keyboard navigation, and mobile layout.
- Add focused tests or smoke checks.

## Local Setup

```bash
git clone https://github.com/xyh9949/image-watermark.git
cd image-watermark
npm install
npm run dev
```

## Verification

Please run the full verification suite before opening a pull request:

```bash
npm run verify
```

This runs:

- TypeScript checks.
- ESLint.
- Production build.
- HTML smoke checks for localized pages, canonical links, hreflang, sitemap, and visible version text.

## Pull Request Guidelines

- Keep changes focused. One bug fix or feature per PR is easiest to review.
- Do not mix formatting-only changes with behavior changes.
- Include screenshots or short recordings for visible UI changes.
- Mention which routes you tested, such as `/`, `/compress`, `/metadata`, `/en`, `/en/compress`, or `/en/metadata`.
- For metadata changes, include the file format tested and whether read, write, clear all, clear GPS, and download were verified.

## Code Style

- Use existing project patterns before introducing new abstractions.
- Keep browser-only image processing local to the client.
- Avoid adding server storage, accounts, or database dependencies unless the project direction changes explicitly.
- Keep copy in the centralized i18n layer when text is visible to users.
- Prefer small, explicit helpers for image and metadata processing.

## Reporting Metadata Issues

Metadata behavior depends on file format, browser APIs, and ExifTool support. A good report includes:

- File type: JPG, PNG, or WebP.
- Browser and operating system.
- What action failed: read, common field edit, advanced tag edit, clear all, clear GPS, or download.
- The tag name and error shown in the UI, if any.
- A sample image only if it is safe to share publicly.

## Security Reports

Please do not report security-sensitive issues in public GitHub issues. See [SECURITY.md](SECURITY.md).
