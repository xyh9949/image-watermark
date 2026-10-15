# Image Watermark 项目接续

## 范围与流程
- 仓库：https://github.com/xyh9949/image-watermark；工作目录 `E:\wp\_review_image_watermark`，主分支 `master`。
- 网站：https://iw.vidocat.com；Vercel 跟随 GitHub 推送部署。用户已授权优化完成后先本地验证，再推送 GitHub。
- 中英文路由：`/`、`/compress`、`/metadata`、`/en`、`/en/compress`、`/en/metadata`。图片在浏览器本地处理。
- 文案入口 `src/app/lib/i18n.ts`；版本须同步 package.json、package-lock.json 和 `src/app/lib/site.ts`。
- 项目文档使用英文 README.md 和中文 README_CN.md，顶部明确语言互链；中文版包含操作流程和元数据编辑边界。纯文档更新不升级应用版本。

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

## 2026-10-15 Ant Design 1.4.0
- 用户要求使用 Ant Design 重写主题，简洁美观、不要绿色；本轮以灰白底色、蓝色操作和中性品牌标记替代 1.3.3 的绿色方向。
- 全局主题与中英文组件语言入口为 `src/components/AntdProvider.tsx`，根布局使用 `@ant-design/nextjs-registry` 提取首屏样式。新增界面优先使用 Ant Design，不再新增 Radix 组件。
- 保留图片引擎与路由；公共 UI 入口薄适配既有事件接口，实际控件使用 Ant Design。高级折叠使用 Collapse，元数据用 Table，上传用 Upload.Dragger。
- `LocalUpload` 的 `beforeUpload` 必须返回 `Upload.LIST_IGNORE`，且每批文件只处理一次，禁止发起服务器上传；隐藏输入 ID 仍支持现有上传快捷入口。
- 后续修改需注意：Ant Design 样式可能覆盖 Tailwind 的 display 工具类；响应式主操作入口使用 tool-add-desktop / tool-files-toggle 语义类管理。
- 系统减少动效偏好由 AntdProvider 监听并设置 motion token；禁止全局把组件动画时长压缩至 0.01ms，这会让弹层停留在定位前的屏幕外位置。
- 本地验收：verify、最终构建及 HTML smoke 通过；六页 × 五档宽度无溢出，英文导航在 320px 下可完整显示，横屏和减少动效模式通过。水印单张/批量、两种 Logo 上传、三格式压缩、弹窗 Escape、GPS 编辑回读和批量清除通过；测试未发现 POST 上传请求。
- 下载文件已验证尺寸、非空像素、ZIP 三文件数量、标题/GPS 写入及清除结果。生产依赖以 npm 官方审计端点检查为 0 漏洞；本机默认 npm 镜像不提供审计端点。

## 2026-10-15 中央拖放修复 1.4.1
- 三个工具的中间空白上传区均使用 LocalUpload / Ant Design Upload.Dragger；中英文入口复用同一回调，拖放整块区域可用并显示高亮，不改变已有编辑或结果视图。
- 水印的共享校验和消息状态移至 `src/app/hooks/useImageUpload.ts`；侧栏与中间区域必须调用同一处理函数，不能直接绕过校验调用 store。
- 中间 LocalUpload 使用 `empty` 和 `inputId={null}`，不重复注册 `tool-upload-input`；原任务栏隐藏输入与 Logo 输入保持原约定。
- 本地发现 Turbopack 持久构建缓存复用了更新前的 globals.css；生产构建关闭 `turbopackFileSystemCacheForBuild`，开发缓存不变。HTML smoke 同时检查中央上传入口、隐藏输入唯一性及实际引用的 CSS，避免只验证 HTML 而遗漏旧样式。
- 本地浏览器覆盖六路由 × 桌面/手机共 12 个批量拖入场景，检查整块接收范围、高亮、每批只添加一次、无效及损坏文件校验、三个中心按钮选图、水印导出与两文件压缩 ZIP；未捕获页面异常或 POST 上传。

## 2026-10-06 UI 1.3.3 实施
- 用户指定使用 `ui-ux-pro-max`，已认可 A 版草图并授权实施，沿用本地验证后推送发布的流程。
- A 版“轻量图片工作台”保存在 `output/playwright/ui-concept/index.html`；同目录含设计说明、三页桌面/手机截图及初始状态。此目录被 Git 忽略，仅在本机。
- 方向：全局导航合并为单行、桌面三栏、常用设置优先、导出固定可达；手机预览与设置顺排、文件列表按需展开。示例图片和处理数据不是真实用户数据。
- 新 UI 使用 globals.css 中的语义工作台样式，三页共用 ToolWorkspace，导航仅在 SiteChrome 挂载一次。手机文件区折叠时不卸载组件，预览与设置顺排。
- 上传输入约定 ID 为 tool-upload-input，任务栏和初始预览共用该上传入口。高级字段用原生 details 折叠，保留原处理接口；默认 adaptive 模式增加对应文案选项。
- 本轮实现中英文浅色方向，并保留原有 dark tokens；未增加深色切换功能。草图及测试产物仍不提交。
- 元数据读取/写回期间锁定普通和高级输入，避免读回重建草稿覆盖新输入；通过暂停 WASM 请求验证读取锁定、完成后可编辑。
- 本地验收：verify 全部通过；六路由 × 五档宽度（320/390/768/1024/1440px）无横向溢出，桌面操作栏可见；生产浏览器完成水印单张/批量导出、三格式压缩 ZIP、元数据/GPS 编辑回读、GPS 清除和三文件批量清除，未捕获 pageerror。
