# 🖼️ Image Watermark

**[English](README.md) | [中文](README_CN.md)**

## 访问 [https://iw.vidocat.com](https://iw.vidocat.com/)可以进行预览

一个现代化的图片水印处理应用，基于 Next.js 15 + Fabric.js 构建，支持批量处理和智能水印定位。

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Fabric.js](https://img.shields.io/badge/Fabric.js-6-orange?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ 主要功能

### 🎯 智能水印定位
- **九宫格对齐**：9种预设位置，精确控制水印位置
- **比例模式**：跨分辨率一致性，确保不同尺寸图片的水印效果统一
- **像素模式**：精确像素级定位，适合单一分辨率处理
- **实时预览**：所见即所得的水印效果预览

### 🖼️ 多种水印类型
- **文字水印**：自定义字体、颜色、透明度、旋转、描边、阴影
- **图片水印**：支持 PNG、JPG、WebP 格式，可调整大小和透明度
- **全屏平铺**：重复平铺模式，适用于版权保护

### ⚡ 高效批量处理
- **并行处理**：基于 Fabric.js 的高性能渲染引擎
- **进度监控**：实时显示处理进度和状态
- **错误恢复**：完善的错误处理和重试机制
- **多格式输出**：支持 PNG、JPEG、WebP 格式导出

### 🎨 现代化界面
- **响应式设计**：完美适配桌面和移动设备
- **暗色主题**：基于 shadcn/ui 的精美界面
- **拖拽上传**：直观的文件上传体验
- **键盘快捷键**：提升操作效率

## 🚀 快速开始

### 📋 环境要求
- Node.js 18.0+
- npm/yarn/pnpm

### 🔧 本地开发

```bash
# 克隆项目
git clone https://github.com/xyh9949/image-watermark.git
cd image-watermark

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

### 🏗️ 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 🐳 Docker 部署

```bash
# 构建镜像
docker build -t image-watermark .

# 运行容器
docker run -p 3000:3000 image-watermark
```

## 📖 使用指南

### 🎯 基本操作

1. **📁 上传图片**
   - 拖拽文件到上传区域
   - 或点击选择文件
   - 支持 JPG、PNG、WebP 格式

2. **⚙️ 配置水印**
   - 选择水印类型（文字/图片/全屏）
   - 调整样式参数（颜色、大小、透明度等）
   - 选择位置（九宫格定位）

3. **🎨 预览效果**
   - 实时预览水印效果
   - 支持缩放和平移查看细节

4. **🚀 批量处理**
   - 点击"开始处理"按钮
   - 查看处理进度
   - 自动下载处理结果

### 💡 高级功能

#### 智能定位模式
- **像素模式**：精确像素定位，适合单一分辨率
- **比例模式**：相对比例定位，确保跨分辨率一致性

#### 批量处理技巧
- 建议单次处理不超过 50 张图片
- 大图片建议降低输出质量以提升速度
- 支持中途取消和错误重试

## 🏗️ 技术架构

### 🛠️ 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.x | React 全栈框架 |
| TypeScript | 5.x | 类型安全 |
| Fabric.js | 6.x | Canvas 渲染引擎 |
| Zustand | 4.x | 状态管理 |
| shadcn/ui | Latest | UI 组件库 |
| Tailwind CSS | 3.x | 样式框架 |

### 📁 项目结构
```
src/app/
├── components/           # React 组件
│   ├── controls/        # 控制面板组件
│   ├── editor/          # 编辑器组件
│   ├── upload/          # 上传组件
│   └── preview/         # 预览组件
├── lib/                 # 核心逻辑
│   ├── canvas/          # Canvas 相关工具
│   ├── stores/          # 状态管理
│   ├── utils/           # 工具函数
│   └── watermark/       # 水印处理核心
├── types/               # TypeScript 类型定义
├── hooks/               # 自定义 Hooks
└── api/                 # API 路由
```

## 🔧 开发指南

### 🚀 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # 类型检查
```

### 📝 代码规范
- 使用 TypeScript 确保类型安全
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand
- 样式使用 Tailwind CSS

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 🔄 贡献流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 🐛 问题反馈
- 使用 [GitHub Issues](https://github.com/xyh9949/image-watermark/issues) 报告 Bug
- 提供详细的复现步骤和环境信息
- 建议新功能或改进

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Fabric.js](http://fabricjs.com/) - 强大的 Canvas 库
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 UI 组件
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

[🐛 报告问题](https://github.com/xyh9949/image-watermark/issues) · [💡 功能建议](https://github.com/xyh9949/image-watermark/issues) · [📖 文档](https://github.com/xyh9949/image-watermark)

</div>
