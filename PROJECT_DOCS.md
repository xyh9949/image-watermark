# 批量图片水印在线工具 - 开发文档

## 📋 项目概述

**项目名称**: 批量图片水印在线工具  
**开发者**: 熟悉 Next.js、Vue  
**项目目标**: 开发一个支持批量为图片添加水印的在线工具  
**开始时间**: 2025-08-13  
**当前状态**: 需求分析完成，准备开始开发  

## 🎯 核心功能需求

### 主要功能
- [x] 全屏水印（平铺模式）
- [x] 图片水印（PNG/JPG/SVG支持）
- [x] 文字水印（自定义字体、颜色、大小）
- [x] 批量处理（支持多文件上传）
- [x] 自适应水印尺寸（核心需求）
- [x] 实时预览功能（多尺寸预览）
- [x] 批量预设管理（保存/加载配置）
- [x] **比例模式**（跨分辨率统一功能）✨ **新增**

### 🆕 比例模式功能（2025-08-14 新增）

#### 核心特性
- **跨分辨率一致性**：确保水印在不同分辨率图片上保持相同的相对大小和位置
- **九宫格对齐增强**：完全兼容现有的九宫格对齐系统
- **智能比例计算**：自动计算和应用水印的相对比例
- **模式切换**：像素模式 ↔ 比例模式无缝切换
- **向后兼容**：现有配置自动识别为像素模式，无需修改

#### 技术实现
- **比例数据结构**：scaleXPercent, scaleYPercent, offsetXPercent, offsetYPercent
- **工具函数库**：proportionUtils.ts 提供完整的比例计算功能
- **Fabric.js 集成**：createTextWatermark 函数支持比例模式
- **状态管理扩展**：watermarkStore 新增比例相关 actions
- **UI 控制增强**：WatermarkControls 支持比例模式切换和配置

### 水印类型详细需求

#### 1. 文字水印
- 自定义文字内容
- 字体选择（系统字体 + Web字体）
- 颜色、大小、透明度调节
- 位置控制（九宫格 + 自由拖拽）
- 旋转角度
- 描边效果

#### 2. 图片水印
- 支持 PNG/JPG/SVG 格式
- 尺寸缩放
- 透明度调节
- 位置控制
- 混合模式（正常、叠加、柔光等）

#### 3. 全屏水印
- 平铺模式
- 对角线重复
- 密度控制
- 透明度渐变

#### 4. 实时预览功能
- 多尺寸预览（小图、中图、大图、超宽屏、竖屏）
- 用户图片预览（显示前3张上传图片效果）
- 标准尺寸预览（800×600, 1920×1080, 4000×3000等）
- 实时参数调整预览
- 详细预览模式

#### 5. 批量预设管理
- 保存当前水印配置为预设
- 预设分类管理（文字、图片、全屏、自定义）
- 默认预设模板
- 预设导入/导出功能
- 使用频率统计
- 快速预设选择器

## 🏗️ 技术架构

### 技术栈选择
**前端框架**: Next.js 14 + TypeScript + Tailwind CSS  
**原因**: 开发者熟悉，全栈能力，性能优化，部署简单

### 核心技术组件
```
Next.js 14 + TypeScript + Tailwind CSS
├── 图片上传：react-dropzone
├── 图片预览：next/image + react-image-gallery
├── 水印编辑：fabric.js 或 konva.js
├── UI组件：shadcn/ui 或 Ant Design
├── 状态管理：zustand 或 React Context
├── 图片处理：sharp (后端)
├── 批量处理：bull.js (队列系统)
└── 进度追踪：WebSocket 或 SSE
```

### 项目结构
```
image-watermark/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API 路由
│   │   ├── upload/        # 图片上传
│   │   ├── watermark/     # 水印处理
│   │   ├── download/      # 批量下载
│   │   └── presets/       # 预设管理
│   ├── components/        # React 组件
│   │   ├── ui/           # 基础 UI 组件
│   │   ├── upload/       # 上传组件
│   │   ├── editor/       # 水印编辑器
│   │   ├── preview/      # 预览组件
│   │   └── presets/      # 预设管理组件
│   ├── lib/              # 工具函数
│   │   ├── watermark/    # 水印处理逻辑
│   │   ├── preview/      # 预览生成逻辑
│   │   └── storage/      # 预设存储管理
│   ├── types/            # TypeScript 类型
│   └── page.tsx          # 主页面
├── public/               # 静态资源
├── temp/                 # 临时文件存储
├── output/              # 处理后文件
└── PROJECT_DOCS.md      # 项目文档
```

## 🎨 水印自适应策略（核心特性）

### 1. 按比例缩放策略
- **基于图片宽度百分比**: 水印宽度 = 图片宽度 × 比例系数
- **基于图片面积百分比**: 水印面积 = 图片面积 × 比例系数

### 2. 分级尺寸策略
- 小图 (≤800px): 120×40 水印
- 中图 (≤1920px): 200×60 水印  
- 大图 (≤4000px): 300×90 水印
- 超大图 (>4000px): 400×120 水印

### 3. 智能自适应策略
- **文字水印**: 基础字体大小 = 图片宽度的 2-5%
- **图片水印**: 最大占图片 25%，保持原始比例
- **位置自适应**: 边距占图片的 5%

### 4. 全屏水印自适应
- 根据图片尺寸调整水印间距
- 密度系数控制水印分布
- 自动计算平铺数量和位置

## 📅 开发计划

### Phase 1: 基础功能 (1-2周) - 🔄 待开始
- [ ] 项目初始化 (Next.js + TypeScript)
- [ ] 基础 UI 界面设计
- [ ] 单图片上传和预览功能
- [ ] 简单文字水印功能
- [ ] 水印位置控制（九宫格）

### Phase 2: 核心功能 (2-3周) - ⏳ 计划中
- [ ] 批量上传处理
- [ ] 图片水印功能
- [ ] 水印自适应尺寸算法实现
- [ ] 水印样式控制面板
- [ ] 实时预览功能（多尺寸预览）
- [ ] 批量下载功能

### Phase 3: 高级功能 (1-2周) - ⏳ 计划中
- [ ] 全屏水印模式（平铺）
- [ ] 批量预设管理系统
- [ ] 预设导入/导出功能
- [ ] 进度追踪和错误处理
- [ ] 性能优化

### Phase 4: 增强功能 (可选) - ⏳ 计划中
- [ ] 用户系统和历史记录
- [ ] 云存储集成
- [ ] API 接口开放
- [ ] 移动端适配

## 🔧 技术实现要点

### 水印配置接口
```typescript
interface WatermarkConfig {
  scaleMode: 'percentage' | 'fixed' | 'adaptive';
  widthPercent?: number; // 0.1 - 0.5
  heightPercent?: number;
  fixedWidth?: number;
  fixedHeight?: number;
  minSize?: number;
  maxSize?: number;
  position: WatermarkPosition;
  marginPercent: number;
  tileMode?: boolean;
  tileDensity?: number;
}
```

### 核心处理流程
1. **图片上传** → 格式验证 → 尺寸检测
2. **水印配置** → 自适应计算 → 实时预览
3. **批量处理** → 队列管理 → 进度追踪
4. **结果输出** → 压缩打包 → 下载

## 🚀 部署方案
- **开发环境**: 本地 Next.js dev server
- **生产环境**: Vercel (推荐) 或 自建服务器
- **文件存储**: 本地存储 + 可选 AWS S3/阿里云 OSS
- **CDN**: Vercel Edge Network 或 CloudFlare

## 📝 开发日志

### 2025-08-13
- ✅ 完成需求分析和技术方案设计
- ✅ 确定水印自适应策略
- ✅ 创建项目开发文档
- ✅ 设计实时预览功能方案
- ✅ 设计批量预设管理方案
- ✅ 更新项目文档，添加新功能需求
- 🔄 下一步: 开始 Phase 1 开发

### 2025-08-14 - 比例模式功能开发
- ✅ **类型定义扩展**：添加 PositionMode 和 ProportionData 类型
- ✅ **比例计算工具**：创建 proportionUtils.ts 核心工具函数库
- ✅ **Fabric.js 集成**：扩展 createTextWatermark 支持比例模式
- ✅ **状态管理更新**：watermarkStore 新增比例相关 actions
- ✅ **UI 控制扩展**：WatermarkControls 支持比例模式切换
- ✅ **批量处理器更新**：batchProcessor 支持比例统一处理
- ✅ **测试工具创建**：proportion-test 页面和单元测试
- ✅ **文档完善**：比例模式使用指南和 API 文档
- 🎉 **功能完成**：跨分辨率比例统一功能全面实现

## 🎯 关键决策记录

1. **技术栈选择**: 选择 Next.js 而非 Vue，因为全栈能力更适合图片处理需求
2. **图片处理库**: 选择 Sharp 而非 Canvas API，性能更优
3. **水印策略**: 采用多种自适应策略组合，而非单一固定尺寸
4. **架构模式**: 前后端一体化，简化部署和维护
5. **比例模式设计** (2025-08-14):
   - **向后兼容优先**: 新增字段为可选，现有配置自动识别为像素模式
   - **重用现有基础设施**: 充分利用现有的九宫格对齐和状态管理系统
   - **渐进式扩展**: 通过最小化修改实现最大化功能扩展
   - **精确度平衡**: 支持 0.1% 精度的比例调整，同时进行像素取整避免模糊
   - **测试驱动**: 创建专门的测试页面和单元测试确保功能可靠性

## 📞 联系信息
- 项目路径: `Documents/augment-projects/image_watermark`
- 文档更新: 每个开发阶段完成后更新进度
- 备注: 开发者熟悉 Next.js 和 Vue，优先使用 Next.js

## 🔍 实时预览功能详细设计

### 预览系统架构
- **多尺寸预览**: 支持小图(800×600)、中图(1920×1080)、大图(4000×3000)、超宽屏(3440×1440)、竖屏(1080×1920)
- **用户图片预览**: 显示用户上传图片的前3张预览效果
- **实时渲染**: 使用Canvas API快速生成预览，参数变化时实时更新
- **自适应显示**: 预览窗口固定大小(300px)，保持图片比例

### 核心接口设计
```typescript
interface PreviewConfig {
  sampleImages: Record<string, {width: number, height: number}>;
  previewSize: number;
}

interface WatermarkPreviewProps {
  watermarkConfig: WatermarkConfig;
  userImages?: File[];
  showSampleSizes?: boolean;
}
```

### 预览生成流程
1. 获取图片尺寸 → 2. 计算水印参数 → 3. Canvas渲染 → 4. 生成预览图

## 💾 批量预设管理详细设计

### 预设数据结构
```typescript
interface WatermarkPreset {
  id: string;
  name: string;
  description?: string;
  category: 'text' | 'image' | 'fullscreen' | 'custom';
  config: WatermarkConfig;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
  usageCount?: number;
}
```

### 存储策略
- **本地存储**: 使用localStorage保存用户自定义预设
- **默认预设**: 内置3个系统预设（右下角文字、Logo水印、全屏防盗）
- **导入导出**: 支持JSON格式的预设配置导入导出
- **使用统计**: 记录预设使用频率，优化推荐

### 预设分类
- **文字水印**: 各种文字水印样式
- **图片水印**: Logo和图片水印配置
- **全屏水印**: 防盗水印和平铺效果
- **自定义**: 用户保存的个性化配置

### 快速操作
- **快速选择器**: 显示最近使用的5个预设
- **一键应用**: 点击即可应用预设配置
- **批量管理**: 支持批量删除、导出预设

---
*文档最后更新: 2025-08-13*
