# 🖼️ Image Watermark

**[English](README.md) | [中文](README_CN.md)**

## Visit [https://iw.vidocat.com](https://iw.vidocat.com/) for live preview

A modern image watermarking application built with Next.js 15 + Fabric.js, supporting batch processing and intelligent watermark positioning.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Fabric.js](https://img.shields.io/badge/Fabric.js-6-orange?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Key Features

### 🎯 Smart Watermark Positioning
- **Nine-Grid Alignment**: 9 preset positions for precise watermark control
- **Ratio Mode**: Cross-resolution consistency, ensuring uniform watermark effects across different image sizes
- **Pixel Mode**: Precise pixel-level positioning, suitable for single resolution processing
- **Real-time Preview**: WYSIWYG watermark effect preview

### 🖼️ Multiple Watermark Types
- **Text Watermark**: Customizable font, color, transparency, rotation, stroke, and shadow
- **Image Watermark**: Supports PNG, JPG, WebP formats with adjustable size and transparency
- **Full-screen Tiling**: Repeating tile mode, suitable for copyright protection

### ⚡ Efficient Batch Processing
- **Parallel Processing**: High-performance rendering engine based on Fabric.js
- **Progress Monitoring**: Real-time display of processing progress and status
- **Error Recovery**: Comprehensive error handling and retry mechanisms
- **Multi-format Output**: Supports PNG, JPEG, WebP format export

### 🎨 Modern Interface
- **Responsive Design**: Perfect adaptation for desktop and mobile devices
- **Dark Theme**: Beautiful interface based on shadcn/ui
- **Drag & Drop Upload**: Intuitive file upload experience
- **Keyboard Shortcuts**: Enhanced operational efficiency

## 🚀 Quick Start

### 📋 Requirements
- Node.js 18.0+
- npm/yarn/pnpm

### 🔧 Local Development

```bash
# Clone the project
git clone https://github.com/xyh9949/image-watermark.git
cd image-watermark

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using.

### 🏗️ Build & Deploy

```bash
# Build production version
npm run build

# Start production server
npm start
```

### 🐳 Docker Deployment

```bash
# Build image
docker build -t image-watermark .

# Run container
docker run -p 3000:3000 image-watermark
```

## 📖 User Guide

### 🎯 Basic Operations

1. **📁 Upload Images**
   - Drag files to upload area
   - Or click to select files
   - Supports JPG, PNG, WebP formats

2. **⚙️ Configure Watermark**
   - Select watermark type (text/image/fullscreen)
   - Adjust style parameters (color, size, transparency, etc.)
   - Choose position (nine-grid positioning)

3. **🎨 Preview Effects**
   - Real-time watermark effect preview
   - Support zoom and pan to view details

4. **🚀 Batch Processing**
   - Click "Start Processing" button
   - View processing progress
   - Automatic download of processing results

### 💡 Advanced Features

#### Smart Positioning Modes
- **Pixel Mode**: Precise pixel positioning, suitable for single resolution
- **Ratio Mode**: Relative ratio positioning, ensuring cross-resolution consistency

#### Batch Processing Tips
- Recommend processing no more than 50 images at once
- For large images, consider reducing output quality to improve speed
- Support mid-process cancellation and error retry

## 🏗️ Technical Architecture

### 🛠️ Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React full-stack framework |
| TypeScript | 5.x | Type safety |
| Fabric.js | 6.x | Canvas rendering engine |
| Zustand | 4.x | State management |
| shadcn/ui | Latest | UI component library |
| Tailwind CSS | 3.x | Styling framework |

### 📁 Project Structure
```
src/app/
├── components/           # React components
│   ├── controls/        # Control panel components
│   ├── editor/          # Editor components
│   ├── upload/          # Upload components
│   └── preview/         # Preview components
├── lib/                 # Core logic
│   ├── canvas/          # Canvas-related tools
│   ├── stores/          # State management
│   ├── utils/           # Utility functions
│   └── watermark/       # Watermark processing core
├── types/               # TypeScript type definitions
├── hooks/               # Custom Hooks
└── api/                 # API routes
```

## 🔧 Development Guide

### 🚀 Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Code linting
npm run type-check   # Type checking
```

### 📝 Code Standards
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components + Hooks
- State management with Zustand
- Styling with Tailwind CSS

## 🤝 Contributing

Issues and Pull Requests are welcome!

### 🔄 Contribution Process
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### 🐛 Issue Reporting
- Use [GitHub Issues](https://github.com/xyh9949/image-watermark/issues) to report bugs
- Provide detailed reproduction steps and environment information
- Suggest new features or improvements

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [Next.js](https://nextjs.org/) - React full-stack framework
- [Fabric.js](http://fabricjs.com/) - Powerful Canvas library
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management

---

<div align="center">

**⭐ If this project helps you, please give it a Star!**

[🐛 Report Issues](https://github.com/xyh9949/image-watermark/issues) · [💡 Feature Requests](https://github.com/xyh9949/image-watermark/issues) · [📖 Documentation](https://github.com/xyh9949/image-watermark)

</div>
