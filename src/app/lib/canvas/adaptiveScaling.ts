// 自适应缩放工具
// {{ Shrimp-X: Add - 新增自适应缩放逻辑，支持不同缩放模式. Approval: Cunzhi(ID:timestamp). }}

import { WatermarkConfig, ScaleMode, AdaptiveConfig } from '../../types';

export interface ScalingResult {
  fontSize?: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  marginX: number;
  marginY: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 计算自适应水印尺寸
 * 根据不同的缩放模式计算水印的最终尺寸
 */
export function calculateAdaptiveWatermarkSize(
  config: WatermarkConfig,
  imageDimensions: ImageDimensions,
  originalWatermarkSize?: { width: number; height: number }
): ScalingResult {
  const { scaleMode, adaptive } = config;
  const { width: imageWidth, height: imageHeight } = imageDimensions;



  // Shrimp‑X: Modify - 显式支持 'adaptive'，并统一走百分比算法路径。Approval: Cunzhi(ID:timestamp).
  switch (scaleMode) {
    case 'percentage':
    case 'adaptive':
      // 比例/自适应模式：保持固定的相对大小和位置比例
      return calculatePercentageScaling(config, imageDimensions, originalWatermarkSize);

    case 'fixed':
      // 固定尺寸模式：使用相同的像素尺寸
      return calculateFixedScaling(config, imageDimensions, originalWatermarkSize);

    default:
      // 默认使用百分比模式
      return calculatePercentageScaling(config, imageDimensions, originalWatermarkSize);
  }
}

/**
 * 智能基准选择算法
 * 根据图片宽高比自动选择最佳的缩放基准
 */
function getIntelligentBaseOn(width: number, height: number): 'width' | 'height' | 'shorter-edge' {
  const aspectRatio = width / height;

  // 超宽图片（宽高比 > 1.8）：基于高度，确保水印不会因为图片太宽而过大
  if (aspectRatio > 1.8) {
    return 'height';
  }

  // 超高图片（宽高比 < 0.6）：基于宽度，确保水印不会因为图片太高而过大
  if (aspectRatio < 0.6) {
    return 'width';
  }

  // 常规图片：基于短边，保持水印在各种尺寸下的一致性
  return 'shorter-edge';
}

/**
 * 动态可读性限制计算
 * 基于图片尺寸和面积动态调整字体大小的上下限
 */
function getReadabilityLimits(imageDimensions: ImageDimensions): { minSize: number; maxSize: number } {
  const { width, height } = imageDimensions;
  const area = width * height;

  // 使用图片面积的平方根作为归一化因子
  const scaleFactor = Math.sqrt(area) / 1000;

  // 动态计算最小和最大字体大小
  const dynamicMinSize = Math.max(12, Math.round(scaleFactor * 8));
  const dynamicMaxSize = Math.min(200, Math.round(scaleFactor * 60));

  return {
    minSize: dynamicMinSize,
    maxSize: dynamicMaxSize
  };
}

/**
 * 百分比缩放模式
 * 水印尺寸基于图片尺寸的百分比
 */
// Shrimp‑X: Modify - 统一比例缩放算法，支持 baseOn 与统一边距比例，增加智能基准选择。Approval: Cunzhi(ID:timestamp).
function calculatePercentageScaling(
  config: WatermarkConfig,
  imageDimensions: ImageDimensions,
  originalSize?: { width: number; height: number }
): ScalingResult {
  const { width: imageWidth, height: imageHeight } = imageDimensions;
  const { adaptive } = config;

  // 统一默认值：比例 5%，边距 3%
  const scaleRatio = (adaptive?.scaleRatio ?? 0.05);
  const marginRatio = (adaptive?.marginRatio ?? 0.03);

  // 智能基准选择：如果用户未指定 baseOn，则使用智能算法
  const baseOn = adaptive?.baseOn ?? getIntelligentBaseOn(imageWidth, imageHeight);

  // 根据选择的基准计算基准尺寸
  let baseDimension: number;
  switch (baseOn) {
    case 'height':
      baseDimension = imageHeight;
      break;
    case 'width':
      baseDimension = imageWidth;
      break;
    case 'shorter-edge':
    default:
      baseDimension = Math.min(imageWidth, imageHeight);
      break;
  }

  // 动态可读性限制：如果用户未设置 minSize/maxSize，则使用动态计算
  const readabilityLimits = getReadabilityLimits(imageDimensions);
  const minSize = (adaptive?.minSize && adaptive.minSize > 0) ? adaptive.minSize : readabilityLimits.minSize;
  const maxSize = (adaptive?.maxSize && adaptive.maxSize > 0) ? adaptive.maxSize : readabilityLimits.maxSize;

  let width: number;
  let height: number;

  if (config.type === 'text') {
    // 文字水印：以 baseDimension 计算字体大小
    const target = Math.round(baseDimension * scaleRatio);
    let fontSize = target;

    // 应用动态可读性限制
    fontSize = Math.max(minSize, fontSize);
    fontSize = Math.min(maxSize, fontSize);

    // 粗略估算文字尺寸用于定位
    const textLength = config.textStyle?.content?.length || 4;
    width = Math.round(fontSize * textLength * 0.6);
    height = fontSize;

    return {
      fontSize,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      marginX: Math.round(imageWidth * marginRatio),
      marginY: Math.round(imageHeight * marginRatio)
    };
  } else if (config.type === 'image' && originalSize) {
    // 图片水印：以 baseDimension 推导目标宽度，保持比例
    const targetWidth = baseDimension * scaleRatio;
    const scale = targetWidth / originalSize.width;

    width = Math.round(originalSize.width * scale);
    height = Math.round(originalSize.height * scale);

    return {
      width,
      height,
      scaleX: scale,
      scaleY: scale,
      marginX: Math.round(imageWidth * marginRatio),
      marginY: Math.round(imageHeight * marginRatio)
    };
  }

  // 兜底：返回与 baseDimension 成比例的尺寸
  const fallback = Math.round(baseDimension * scaleRatio);
  return {
    width: fallback,
    height: fallback,
    scaleX: 1,
    scaleY: 1,
    marginX: Math.round(imageWidth * marginRatio),
    marginY: Math.round(imageHeight * marginRatio)
  };
}

/**
 * 固定尺寸缩放模式
 * 水印使用固定的像素尺寸，不随图片尺寸变化
 */
function calculateFixedScaling(
  config: WatermarkConfig,
  imageDimensions: ImageDimensions,
  originalSize?: { width: number; height: number }
): ScalingResult {
  const { width: imageWidth, height: imageHeight } = imageDimensions;
  const { adaptive } = config;
  
  if (config.type === 'text' && config.textStyle) {
    const fontSize = config.textStyle.fontSize;
    const textLength = config.textStyle.content?.length || 4;
    
    return {
      fontSize,
      width: fontSize * textLength * 0.6,
      height: fontSize,
      scaleX: 1,
      scaleY: 1,
      marginX: adaptive.marginRatio ? Math.round(imageWidth * adaptive.marginRatio) : 20,
      marginY: adaptive.marginRatio ? Math.round(imageHeight * adaptive.marginRatio) : 20
    };
  } else if (config.type === 'image' && config.imageStyle && originalSize) {
    const targetWidth = config.imageStyle.width;
    const targetHeight = config.imageStyle.height;
    
    return {
      width: targetWidth,
      height: targetHeight,
      scaleX: targetWidth / originalSize.width,
      scaleY: targetHeight / originalSize.height,
      marginX: adaptive.marginRatio ? Math.round(imageWidth * adaptive.marginRatio) : 20,
      marginY: adaptive.marginRatio ? Math.round(imageHeight * adaptive.marginRatio) : 20
    };
  }
  
  // 默认固定尺寸
  return {
    width: 200,
    height: 60,
    scaleX: 1,
    scaleY: 1,
    marginX: 20,
    marginY: 20
  };
}



/**
 * 计算水印在图片上的相对位置百分比
 * 用于在不同尺寸图片间保持一致的相对位置
 */
export function calculateRelativePosition(
  absolutePosition: { x: number; y: number },
  imageDimensions: ImageDimensions
): { xPercent: number; yPercent: number } {
  return {
    xPercent: absolutePosition.x / imageDimensions.width,
    yPercent: absolutePosition.y / imageDimensions.height
  };
}

/**
 * 从相对位置百分比计算绝对位置
 */
export function calculateAbsolutePosition(
  relativePosition: { xPercent: number; yPercent: number },
  imageDimensions: ImageDimensions
): { x: number; y: number } {
  return {
    x: Math.round(relativePosition.xPercent * imageDimensions.width),
    y: Math.round(relativePosition.yPercent * imageDimensions.height)
  };
}
