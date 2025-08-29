// 批量处理缩放工具
// {{ Shrimp-X: Add - 新增批量处理缩放一致性工具. Approval: Cunzhi(ID:timestamp). }}

import { WatermarkConfig, ImageInfo, PositionMode, ProportionData } from '../../types';
import { calculateAdaptiveWatermarkSize, ImageDimensions } from '../canvas/adaptiveScaling';
import { calculateProportions } from '../canvas/proportionUtils';

export interface BatchScalingContext {
  referenceImage?: ImageInfo;
  referenceDimensions?: ImageDimensions;
  baseProportions?: ProportionData;
  scalingMode: 'adaptive' | 'proportional' | 'fixed';
}

export interface ScaledWatermarkConfig extends WatermarkConfig {
  scalingContext?: BatchScalingContext;
  originalConfig?: WatermarkConfig;
}

/**
 * 为批量处理准备水印配置
 * 确保所有图片使用一致的缩放策略
 */
export function prepareBatchWatermarkConfig(
  config: WatermarkConfig,
  images: ImageInfo[],
  scalingStrategy: 'adaptive' | 'proportional' | 'fixed' = 'adaptive'
): ScaledWatermarkConfig {
  if (images.length === 0) {
    return { ...config };
  }

  // 选择参考图片（通常是第一张或中等尺寸的图片）
  const referenceImage = selectReferenceImage(images);
  const referenceDimensions: ImageDimensions = {
    width: referenceImage.width,
    height: referenceImage.height
  };

  let baseProportions: ProportionData | undefined;

  // 根据策略计算基准比例
  if (scalingStrategy === 'proportional') {
    // 计算参考图片上的水印比例
    const referenceScaling = calculateAdaptiveWatermarkSize(config, referenceDimensions);
    
    baseProportions = {
      scaleXPercent: referenceScaling.width / referenceDimensions.width,
      scaleYPercent: referenceScaling.height / referenceDimensions.height,
      offsetXPercent: (config.position.offsetX || 0) / referenceDimensions.width,
      offsetYPercent: (config.position.offsetY || 0) / referenceDimensions.height
    };
  }

  const scalingContext: BatchScalingContext = {
    referenceImage,
    referenceDimensions,
    baseProportions,
    scalingMode: scalingStrategy
  };

  return {
    ...config,
    scalingContext,
    originalConfig: { ...config }
  };
}

/**
 * 为特定图片调整水印配置
 * 基于批量处理上下文确保一致性
 */
export function adjustWatermarkForImage(
  scaledConfig: ScaledWatermarkConfig,
  targetImage: ImageInfo
): WatermarkConfig {
  const { scalingContext, originalConfig } = scaledConfig;
  
  if (!scalingContext || !originalConfig) {
    return scaledConfig;
  }

  const targetDimensions: ImageDimensions = {
    width: targetImage.width,
    height: targetImage.height
  };

  const adjustedConfig: WatermarkConfig = { ...originalConfig };

  switch (scalingContext.scalingMode) {
    case 'proportional':
      adjustedConfig.position = {
        ...originalConfig.position,
        mode: 'proportion' as PositionMode,
        proportions: scalingContext.baseProportions
      };
      break;

    case 'adaptive':
      // 自适应模式：每张图片独立计算，但使用一致的参数
      // 保持原始配置，让 adaptiveScaling 处理
      break;

    case 'fixed':
      // 固定模式：所有图片使用相同的像素尺寸
      adjustedConfig.scaleMode = 'fixed';
      break;
  }

  return adjustedConfig;
}

/**
 * 选择参考图片
 * 选择中等尺寸的图片作为缩放参考
 */
function selectReferenceImage(images: ImageInfo[]): ImageInfo {
  if (images.length === 1) {
    return images[0];
  }

  // 计算所有图片的面积
  const imagesWithArea = images.map(img => ({
    image: img,
    area: img.width * img.height
  }));

  // 按面积排序
  imagesWithArea.sort((a, b) => a.area - b.area);

  // 选择中位数图片作为参考
  const medianIndex = Math.floor(imagesWithArea.length / 2);
  return imagesWithArea[medianIndex].image;
}

/**
 * 验证批量处理的一致性
 * 检查所有图片的水印是否保持视觉一致性
 */
export function validateBatchConsistency(
  configs: WatermarkConfig[],
  images: ImageInfo[]
): {
  isConsistent: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (configs.length !== images.length) {
    issues.push('配置数量与图片数量不匹配');
    return { isConsistent: false, issues, recommendations };
  }

  // 检查缩放模式一致性
  const scaleModes = new Set(configs.map(c => c.scaleMode));
  if (scaleModes.size > 1) {
    issues.push('不同图片使用了不同的缩放模式');
    recommendations.push('建议所有图片使用相同的缩放模式');
  }

  // 检查位置模式一致性
  const positionModes = new Set(configs.map(c => c.position.mode || 'pixel'));
  if (positionModes.size > 1) {
    issues.push('不同图片使用了不同的位置模式');
    recommendations.push('建议所有图片使用相同的位置模式');
  }

  // 检查水印类型一致性
  const watermarkTypes = new Set(configs.map(c => c.type));
  if (watermarkTypes.size > 1) {
    issues.push('不同图片使用了不同的水印类型');
    recommendations.push('建议所有图片使用相同的水印类型');
  }

  // 检查比例一致性（如果使用比例模式）
  if (positionModes.has('proportion')) {
    const proportions = configs
      .filter(c => c.position.mode === 'proportion' && c.position.proportions)
      .map(c => c.position.proportions!);

    if (proportions.length > 0) {
      const firstProportion = proportions[0];
      const isProportionConsistent = proportions.every(p => 
        Math.abs(p.scaleXPercent - firstProportion.scaleXPercent) < 0.01 &&
        Math.abs(p.scaleYPercent - firstProportion.scaleYPercent) < 0.01
      );

      if (!isProportionConsistent) {
        issues.push('比例模式下不同图片的缩放比例不一致');
        recommendations.push('建议使用统一的比例配置');
      }
    }
  }

  // 检查图片尺寸差异
  const areas = images.map(img => img.width * img.height);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);
  const areaRatio = maxArea / minArea;

  if (areaRatio > 10) {
    recommendations.push('图片尺寸差异较大，建议使用自适应缩放模式');
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * 生成批量处理报告
 */
export function generateBatchReport(
  configs: WatermarkConfig[],
  images: ImageInfo[],
  scalingContext: BatchScalingContext
): {
  summary: string;
  details: {
    referenceImage: string;
    scalingMode: string;
    totalImages: number;
    sizeRange: string;
    consistency: ReturnType<typeof validateBatchConsistency>;
  };
} {
  const consistency = validateBatchConsistency(configs, images);
  
  const areas = images.map(img => img.width * img.height);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);
  
  const minImage = images.find(img => img.width * img.height === minArea);
  const maxImage = images.find(img => img.width * img.height === maxArea);

  const summary = `批量处理 ${images.length} 张图片，使用 ${scalingContext.scalingMode} 缩放模式。${
    consistency.isConsistent ? '配置一致性良好。' : `发现 ${consistency.issues.length} 个一致性问题。`
  }`;

  return {
    summary,
    details: {
      referenceImage: scalingContext.referenceImage?.name || '未知',
      scalingMode: scalingContext.scalingMode,
      totalImages: images.length,
      sizeRange: `${minImage?.width}×${minImage?.height} 到 ${maxImage?.width}×${maxImage?.height}`,
      consistency
    }
  };
}

/**
 * 优化批量处理配置
 * 根据图片特征自动选择最佳缩放策略
 */
export function optimizeBatchConfiguration(
  config: WatermarkConfig,
  images: ImageInfo[]
): {
  optimizedConfig: ScaledWatermarkConfig;
  strategy: 'adaptive' | 'proportional' | 'fixed';
  reason: string;
} {
  const areas = images.map(img => img.width * img.height);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);
  const areaRatio = maxArea / minArea;

  let strategy: 'adaptive' | 'proportional' | 'fixed';
  let reason: string;

  if (areaRatio > 10) {
    // 尺寸差异很大，使用自适应
    strategy = 'adaptive';
    reason = '图片尺寸差异较大，使用自适应缩放确保在所有尺寸上都有合适的视觉效果';
  } else if (areaRatio > 3) {
    // 中等差异，使用比例
    strategy = 'proportional';
    reason = '图片尺寸有一定差异，使用比例缩放保持相对一致的视觉比例';
  } else {
    // 尺寸相近，可以使用固定
    strategy = 'fixed';
    reason = '图片尺寸相近，使用固定尺寸确保完全一致的水印大小';
  }

  const optimizedConfig = prepareBatchWatermarkConfig(config, images, strategy);

  return {
    optimizedConfig,
    strategy,
    reason
  };
}
