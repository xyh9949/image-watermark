# 🖼️ Image Batch Processing Tool

**[English](README_JASON.md) | [中文](README_CN.md)**

A modern image batch processing application built with Next.js 16, integrating watermarking and image compression with intelligent optimization and batch processing.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Fabric.js](https://img.shields.io/badge/Fabric.js-6-orange?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Version](https://img.shields.io/badge/version-1.3.1-green?style=flat-square)

## ✨ Key Features

### 🏷️ Watermark Tool

#### 🎯 Smart Watermark Positioning
- **Nine-Grid Alignment**: 9 preset positions for precise watermark control
- **Ratio Mode**: Cross-resolution consistency — uniform watermark effects across different image sizes
- **Pixel Mode**: Precise pixel-level positioning for single-resolution processing
- **Real-time Preview**: WYSIWYG watermark effect preview

#### 🖼️ Multiple Watermark Types
- **Text Watermark**: Customizable font, color, transparency, rotation, stroke, and shadow
- **Image Watermark**: Supports PNG, JPG, WebP with adjustable size and transparency
- **Full-screen Tiling**: Repeating tile mode for copyright protection

#### 📁 Folder Upload (New in v1.3.1)
- **Add Folder**: Select a single folder — all images inside are imported at once
- **Add Parent Folder**: Select a parent folder — recursively imports images from all sub-folders
- **Path Tracking**: Preserves `relativePath`, `sourceDirectory`, and `sourceRootName` for each file, enabling folder-structure-aware export

#### 💾 Save Settings (New in v1.3.1)
- **Local Folder Save**: Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to write processed files directly to a user-chosen local folder — no ZIP required
- **ZIP Fallback**: Automatically falls back to ZIP download on browsers that don't support the API
- **Folder Naming Rule**: Customizable folder name template (`{name}`, `{date}`, etc.) for organized output
- **Save & Clear**: On success, automatically clears the uploaded image list for a clean workflow
- **Retry on Failure**: If saving fails, a retry button appears — no need to re-process

#### ✏️ Export Filename Rule
- Template-based filename control: `{name}`, `{index}`, `{index:03}`, `{date}`
- Live preview of the output filename before processing

### 🗜️ Compression Tool

#### 📦 Lossless Compression Technology
- **Format Preservation**: Maintains original formats (JPEG, PNG, WebP, GIF)
- **Smart Optimization**: Selects optimal compression strategy per image
- **Metadata Cleaning**: Optional removal of EXIF, XMP metadata
- **Quality Control**: Three compression levels (light, standard, deep)

#### 🚀 Efficient Processing
- **Batch Compression**: Process multiple images simultaneously
- **Real-time Preview**: Before/after comparison with statistics
- **One-click Download**: Individual or batch ZIP export

### ⚡ Universal Features
- **Parallel Processing**: High-performance rendering engine
- **Progress Monitoring**: Real-time progress and status display
- **Error Recovery**: Comprehensive error handling and retry
- **Multi-format Support**: PNG, JPEG, WebP, GIF

### 🎨 Modern Interface
- **Responsive Design**: Desktop and mobile support
- **Dark Theme**: Built on shadcn/ui
- **Drag & Drop Upload**: Intuitive file upload
- **i18n**: Full Chinese / English support

## 🚀 Quick Start

### Requirements
- Node.js 18.0+
- npm / yarn / pnpm

### Local Development

```bash
git clone https://github.com/Jason-zzr/batchimage-watermark.git
cd batchimage-watermark
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Build & Deploy

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t image-watermark .
docker run -p 3000:3000 image-watermark
```

## 📖 User Guide

### Watermark Tool

1. **Upload** — Drag files, click to select files, or use the new **Add Folder** / **Add Parent Folder** buttons
2. **Configure** — Choose watermark type, adjust style, set position
3. **Save Settings** *(new)* — Optionally choose a local save folder; set folder and filename naming rules
4. **Process** — Click "Start Processing"; results are saved to the chosen folder or downloaded as ZIP

### Compression Tool

1. Select images (or drag & drop)
2. Set compression level and metadata options
3. View real-time progress and before/after stats
4. Download individually or as ZIP

## 🏗️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React full-stack framework |
| TypeScript | 5.x | Type safety |
| Fabric.js | 6.x | Canvas rendering engine |
| Zustand | 5.x | State management |
| shadcn/ui | Latest | UI component library |
| Tailwind CSS | 4.x | Styling framework |

## 📁 Project Structure

```
src/app/
├── components/
│   ├── controls/        # Watermark control panel (save settings, filename rules)
│   ├── editor/          # Fabric.js canvas editor
│   ├── upload/          # File & folder upload
│   └── preview/         # Preview components
├── lib/
│   ├── canvas/          # Canvas scaling / position utils
│   ├── stores/          # Zustand state (imageStore tracks folder paths)
│   ├── utils/           # File validation, renaming utils
│   ├── watermark/       # Batch processor (File System Access API save)
│   └── i18n.ts          # zh / en copy
├── types/               # TypeScript types (ImageInfo, BatchProcessingResult)
└── api/                 # Health check route
```

## 🔧 Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## 🤝 Contributing

Issues and Pull Requests welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

[MIT License](LICENSE)

---

<div align="center">

**⭐ If this project helps you, please give it a Star!**

[🐛 Report Issues](https://github.com/Jason-zzr/batchimage-watermark/issues) · [💡 Feature Requests](https://github.com/Jason-zzr/batchimage-watermark/issues)

</div>
