# 贡献指南

感谢您对图片水印工具项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告 Bug
1. 在 [Issues](https://github.com/xyh9949/image-watermark/issues) 中搜索是否已有相关问题
2. 如果没有，请创建新的 Issue，使用 Bug 报告模板
3. 提供详细的复现步骤和环境信息

### 建议新功能
1. 在 [Issues](https://github.com/xyh9949/image-watermark/issues) 中创建功能请求
2. 使用功能请求模板
3. 详细描述功能需求和使用场景

### 提交代码
1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature-name`
5. 创建 Pull Request

## 🛠️ 开发环境设置

### 环境要求
- Node.js 18.0+
- npm/yarn/pnpm

### 本地开发
```bash
# 克隆项目
git clone https://github.com/xyh9949/image-watermark.git
cd image-watermark

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📝 开发指南

### 项目结构
```
src/app/
├── components/     # React 组件
├── lib/           # 核心逻辑
├── types/         # TypeScript 类型
├── hooks/         # 自定义 Hooks
└── api/           # API 路由
```

### 添加新功能
1. 在相应目录下创建组件/工具函数
2. 添加 TypeScript 类型定义
3. 编写测试（如果适用）
4. 更新文档

## 🧪 测试

目前项目主要依靠手动测试，欢迎贡献自动化测试。

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](LICENSE) 下获得许可。

## 💬 联系方式

如有任何问题，请通过以下方式联系：
- 创建 [Issue](https://github.com/xyh9949/image-watermark/issues)
- 发起 [Discussion](https://github.com/xyh9949/image-watermark/discussions)

感谢您的贡献！🎉
