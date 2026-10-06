# Image Watermark 项目接续

## 范围与流程
- 仓库：https://github.com/xyh9949/image-watermark；工作目录 `E:\wp\_review_image_watermark`，主分支 `master`。
- 网站：https://iw.vidocat.com；Vercel 跟随 GitHub 推送部署。用户已授权优化完成后先本地验证，再推送 GitHub。
- 中英文路由：`/`、`/compress`、`/metadata`、`/en`、`/en/compress`、`/en/metadata`。图片在浏览器本地处理。
- 文案入口 `src/app/lib/i18n.ts`；版本须同步 package.json、package-lock.json 和 `src/app/lib/site.ts`。

## 2026-10-06 优化版 1.3.2
- 本轮范围：布局、加载性能、元数据正确性和依赖维护；没有加入统计跟踪、预设、PWA 或新工具。
- `ToolWorkspace` 为三页共用的响应式面板，移动标签通过 CSS 控制显示，保留编辑状态；水印画布在选图后动态加载。
- ExifTool 使用共享 WASM 和文件系统，必须通过引擎内的串行队列调用，禁止绕过队列并发读写。
- 清除全部的双 `-q` 用于抑制预期 ICC 删除警告；真实错误及非零退出码仍失败。GPSAltitudeRef 使用 `#` 写原始枚举值。
- WASM 地址由 next.config.ts 按文件内容计算哈希，并 rewrite 到 public/zeroperl.wasm；仅哈希地址长期缓存。
- Fabric 7.4 保持旧版左上角原点，避免已有水印配置偏移。
- Next 16.3.8、React 19.1.9；生产依赖审计为 0 漏洞。开发侧 ESLint/braces 依赖链仍有 5 条关联高危审计项，等待兼容的上游修复，禁止强制降级 Next 工具链。

## 验证入口
- 本地 Node 22.15+；`npm run verify` 包含类型检查、零警告 lint、真实 WASM 元数据回归、生产构建、六页 SEO/英文文案 HTML smoke。
- 临时浏览器测试、截图、下载和服务日志在被忽略的 `output/playwright/`，不提交测试产物。
- 浏览器验证覆盖 320/390/1440px、上传与水印导出、JPG/PNG/WebP 压缩、清理与保留字段、同名 ZIP、GPS 编辑回读与批量清除、失败后重试。
- 本次性能比较口径：HTML 引用的脚本解压后总字节，不是网络传输量或 Lighthouse 分数。构建、网站版本和审计结果在后续任务中需重新核实。

## 后续候选（未实施）
- 长文字自动换行、隐私检查、本地预设、PWA 和 Worker。需按用户下一次明确目标独立确定范围。
