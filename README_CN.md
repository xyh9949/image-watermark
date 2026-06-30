# Image Watermark 图片工具

一个浏览器端本地处理的图片工具，支持批量加水印、批量压缩、EXIF / 元数据查看编辑与清除。图片在用户浏览器中处理，不上传服务器。

[在线体验](https://iw.vidocat.com/) · [English README](README.md) · [路线图](ROADMAP.md) · [反馈问题](https://github.com/xyh9949/image-watermark/issues)

![GitHub stars](https://img.shields.io/github/stars/xyh9949/image-watermark?style=flat-square)
![License](https://img.shields.io/github/license/xyh9949/image-watermark?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

![Image Watermark 预览](public/og-image.png)

## 为什么做这个项目

很多在线图片工具需要上传文件、注册账号，或者把图片交给服务器处理。Image Watermark 更适合隐私敏感和高频批处理场景：

- 水印、压缩、元数据编辑都在浏览器本地完成。
- 不需要账号、数据库或服务器端文件存储。
- 支持批量处理，适合重复发布流程。
- 已支持中文和英文路由。
- 已补充 SEO / GEO：sitemap、canonical、hreflang、FAQ 内容和 `llms.txt`。

## 功能

### 批量水印工具

- 添加文字水印、图片水印和全屏平铺水印。
- 支持九宫格位置和自定义位置。
- 可调整透明度、旋转、大小、描边、阴影和颜色。
- 导出前实时预览效果。
- 支持多图处理和下载。

### 批量压缩工具

- 在浏览器中压缩 JPEG、PNG、WebP 和 GIF。
- 支持高质量、均衡、高压缩三档质量预设。
- 可按需移除图片元数据。
- 显示原始大小、压缩后大小、节省空间和压缩率。
- 支持单文件下载和 ZIP 打包下载。

### EXIF / 元数据工具

- 查看 JPG、JPEG、PNG、WebP 图片元数据。
- 编辑标题、描述、关键词、作者、版权、相机、镜头、拍摄时间、评论和 GPS。
- 查看高级 EXIF、IPTC、XMP、ICC、PNG、WebP、File、System、Composite 标签。
- 支持清除全部元数据、清除 GPS、清除选中字段。
- 支持批量清除元数据并打包下载。

## 适合谁

- 摄影师：发布前清除照片 GPS 和敏感拍摄信息。
- 电商团队：批量压缩商品图，减少页面体积。
- 博主 / 自媒体：批量添加品牌水印。
- 设计师：分享草稿前添加版权标识。
- 开发者：需要一个本地优先的开源图片处理工具。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 框架 | Next.js 16, React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| Canvas | Fabric.js |
| 元数据引擎 | ExifTool via `@uswriting/exiftool` WASM |
| ZIP 导出 | `fflate` |
| UI 基础组件 | Radix UI |

## 本地运行

### 环境要求

- 推荐 Node.js 20.9+。Docker 使用 Node.js 22。
- 推荐 npm 10+。

### 开发模式

```bash
git clone https://github.com/xyh9949/image-watermark.git
cd image-watermark
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 本地验证

```bash
npm run verify
```

`verify` 会执行类型检查、lint、生产构建和 HTML smoke 检查。

### 生产构建

```bash
npm run build
npm run start
```

### Docker

```bash
docker build -t image-watermark .
docker run -p 3000:3000 image-watermark
```

## 路由

| 路由 | 说明 |
| --- | --- |
| `/` | 中文水印工具 |
| `/compress` | 中文压缩工具 |
| `/metadata` | 中文 EXIF / 元数据工具 |
| `/en` | 英文水印工具 |
| `/en/compress` | 英文压缩工具 |
| `/en/metadata` | 英文 EXIF / 元数据工具 |
| `/sitemap.xml` | 网站地图 |
| `/llms.txt` | 面向 AI 的项目摘要 |

## 隐私模型

Image Watermark 是本地优先的 Web 应用。图片文件由浏览器读取，并在用户设备上处理。核心工具不依赖服务器上传、用户账号或数据库。

元数据编辑通过浏览器端 WebAssembly 版本 ExifTool 完成。处理结果会生成新文件下载，不覆盖原始文件。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 检查
npm run smoke:html   # HTML 和 SEO smoke 检查
npm run verify       # 完整验证
```

## 参与贡献

欢迎提交 Issue 和 Pull Request。提交 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

适合优先参与的方向：

- 补充 README 示例或截图。
- 反馈特定格式下无法写入的元数据标签。
- 优化中英文文案。
- 改善无障碍和键盘操作。
- 测试大批量图片处理流程。

## 安全问题

安全相关问题请不要直接公开发 Issue，详见 [SECURITY.md](SECURITY.md)。

## License

MIT License. See [LICENSE](LICENSE).
