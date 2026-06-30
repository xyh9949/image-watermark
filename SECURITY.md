# Security Policy

Image Watermark is a browser-based image tool. The core workflows process files locally in the browser and do not require image uploads, accounts, or database storage.

## Supported Versions

Security reports are accepted for the current `master` branch and the latest deployed version at [iw.vidocat.com](https://iw.vidocat.com/).

## Reporting A Vulnerability

Please do not open a public GitHub issue for security-sensitive reports.

If you believe you found a vulnerability, contact the maintainer through GitHub by opening a minimal issue that does not include exploit details, or use the repository owner's preferred private contact method if one is listed on their GitHub profile.

Useful details:

- Affected route or feature.
- Browser and operating system.
- Steps to reproduce.
- Expected impact.
- Whether a file upload, download, metadata write, or generated ZIP is involved.

## Scope

In scope:

- Cross-site scripting in rendered UI.
- Unsafe handling of image metadata displayed in the page.
- Unsafe generated download names.
- Privacy leaks that upload or transmit local images unexpectedly.
- Dependency vulnerabilities that affect runtime behavior.

Out of scope:

- Vulnerabilities in user-supplied images that only affect the user's local browser or image decoder.
- Social engineering.
- Denial-of-service reports that require extremely large local files without a broader security impact.
- Issues in third-party hosting infrastructure outside this repository.

## Privacy Expectation

The project should not upload user images for core watermarking, compression, or metadata editing workflows. If a future feature changes that behavior, it must be explicit in the UI and documentation.
