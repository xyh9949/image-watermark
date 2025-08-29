# 图片水印处理系统

一个基于 Next.js + Fabric.js + Sharp 的现代化图片水印处理系统，支持批量处理和跨分辨率比例统一功能。

## ✨ 核心功能

### 🎯 比例模式（新功能）
- **跨分辨率一致性**：确保水印在不同分辨率图片上保持相同的相对大小和位置
- **九宫格对齐**：支持 9 种预设位置，精确控制水印位置
- **智能缩放**：字体大小和偏移量自动按比例调整
- **模式切换**：像素模式 ↔ 比例模式无缝切换

### 🖼️ 水印类型
- **文字水印**：支持自定义字体、颜色、透明度、旋转、描边、阴影
- **图片水印**：支持 PNG、JPG 等格式，可调整大小和透明度
- **全屏水印**：平铺模式，适用于版权保护

### ⚡ 批量处理
- **高性能处理**：基于 Fabric.js 的高效渲染引擎
- **进度追踪**：实时显示处理进度和状态
- **错误处理**：完善的错误恢复机制
- **格式支持**：输出 PNG、JPEG、WebP 格式

### 🎨 用户界面
- **直观控制**：现代化的控制面板，支持实时预览
- **响应式设计**：适配桌面和移动设备
- **主题支持**：基于 shadcn/ui 的美观界面

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用指南

### 基本使用

1. **上传图片**：拖拽或点击上传一张或多张图片
2. **配置水印**：选择水印类型，调整样式和位置
3. **选择模式**：
   - **像素模式**：使用绝对像素值定位（适合单一分辨率）
   - **比例模式**：使用相对比例定位（适合多分辨率批量处理）
4. **开始处理**：点击"开始处理"按钮
5. **下载结果**：处理完成后自动下载

### 比例模式详细说明

比例模式是本系统的核心创新功能，解决了传统水印系统在处理不同分辨率图片时的一致性问题。

#### 核心优势
- ✅ **一致性保证**：800x600 和 4K 图片上的水印相对效果完全一致
- ✅ **批量友好**：一次配置，适用于所有分辨率
- ✅ **精确控制**：支持 0.1% 精度的比例调整
- ✅ **向后兼容**：现有配置无需修改

#### 使用步骤
1. 在控制面板中找到"位置模式"切换开关
2. 切换到"比例模式"
3. 调整比例参数：
   - **宽度比例**：5% - 100%（推荐 10% - 30%）
   - **高度比例**：2% - 50%（推荐 5% - 15%）
   - **偏移量**：-50% 到 50%（微调位置）
4. 或者在像素模式下配置好后，点击"保存为比例模板"

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 15**：React 全栈框架
- **TypeScript**：类型安全
- **Fabric.js**：Canvas 渲染引擎
- **Zustand**：状态管理
- **shadcn/ui**：UI 组件库
- **Tailwind CSS**：样式框架

### 核心模块
```
src/app/
├── lib/
│   ├── canvas/
│   │   ├── proportionUtils.ts    # 比例计算核心
│   │   ├── fabricUtils.ts        # Fabric.js 集成
│   │   └── positionUtils.ts      # 九宫格对齐
│   ├── watermark/
│   │   └── batchProcessor.ts     # 批量处理器
│   └── stores/
│       └── watermarkStore.ts     # 状态管理
├── components/
│   └── controls/
│       └── WatermarkControls.tsx # 主控制面板
└── types/
    └── index.ts                  # 类型定义
```

## 📚 文档

- [项目文档](./PROJECT_DOCS.md) - 完整的项目文档
- [集成完成报告](./INTEGRATION_COMPLETE.md) - 九宫格对齐集成说明

## 🔧 开发

### 项目结构
```
image-watermark/
├── src/app/                 # Next.js App Router
│   ├── components/         # React 组件
│   ├── lib/               # 工具函数和核心逻辑
│   └── types/             # TypeScript 类型定义
├── public/               # 静态资源
└── docs/                 # 文档
```

### 添加新功能
1. 在 `src/app/types/` 中定义类型
2. 在 `src/app/lib/` 中实现核心逻辑
3. 在 `src/app/components/` 中创建 UI 组件
4. 在 `__tests__/` 中添加测试

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 为新功能添加单元测试
- 更新相关文档

## 📄 许可证

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Fabric.js](http://fabricjs.com/) - Canvas 库
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件
- [Sharp](https://sharp.pixelplumbing.com/) - 图像处理（计划中）
