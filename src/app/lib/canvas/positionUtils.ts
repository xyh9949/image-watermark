// 九宫格位置计算工具函数

import { WatermarkPosition } from '../../types';

// 九宫格位置数组（按行排列）
export const POSITION_GRID: WatermarkPosition[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right'
];

// 位置标签映射
export const POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': '左上',
  'top-center': '上中',
  'top-right': '右上',
  'middle-left': '左中',
  'middle-center': '中心',
  'middle-right': '右中',
  'bottom-left': '左下',
  'bottom-center': '下中',
  'bottom-right': '右下',
  'custom': '自定义'
};

// Fabric.js originX/originY 映射
export interface OriginAlignment {
  originX: 'left' | 'center' | 'right';
  originY: 'top' | 'center' | 'bottom';
}

// 锚点位置
export interface AnchorPosition {
  anchorX: number;
  anchorY: number;
}

/**
 * 根据九宫格位置获取 Fabric.js 的 originX/originY 对齐方式
 */
export function getOriginFromPosition(position: WatermarkPosition): OriginAlignment {
  const originMap: Record<WatermarkPosition, OriginAlignment> = {
    'top-left': { originX: 'left', originY: 'top' },
    'top-center': { originX: 'center', originY: 'top' },
    'top-right': { originX: 'right', originY: 'top' },
    'middle-left': { originX: 'left', originY: 'center' },
    'middle-center': { originX: 'center', originY: 'center' },
    'middle-right': { originX: 'right', originY: 'center' },
    'bottom-left': { originX: 'left', originY: 'bottom' },
    'bottom-center': { originX: 'center', originY: 'bottom' },
    'bottom-right': { originX: 'right', originY: 'bottom' },
    'custom': { originX: 'left', originY: 'top' }, // 自定义位置默认左上
  };

  return originMap[position] || originMap['middle-center'];
}

/**
 * 计算九宫格锚点位置
 * 基于 TestCanvas.tsx 中验证的锚点计算逻辑
 *
 * 注意：此函数保持原有行为以确保向后兼容性
 * 如需边缘对齐，请使用 calculateEdgeAlignedAnchorPosition
 *
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param position 九宫格位置
 * @param margin 边距（默认20px）
 * @param offsetX X轴偏移量（百分比值，正值向右，负值向左）
 * @param offsetY Y轴偏移量（百分比值，正值向下，负值向上）
 * @returns 锚点坐标
 */
export function calculateAnchorPosition(
  canvasWidth: number,
  canvasHeight: number,
  position: WatermarkPosition,
  margin: number = 20,
  offsetX: number = 0,
  offsetY: number = 0
): AnchorPosition {
  let anchorX: number;
  let anchorY: number;

  // 将百分比偏移转换为像素值
  const pixelOffsetX = (offsetX / 100) * canvasWidth;
  const pixelOffsetY = (offsetY / 100) * canvasHeight;

  // 水平锚点计算
  switch (position) {
    case 'top-left':
    case 'middle-left':
    case 'bottom-left':
      // 左侧锚点：x = 边距 + offsetX（百分比转像素）
      anchorX = margin + pixelOffsetX;
      break;
    case 'top-center':
    case 'middle-center':
    case 'bottom-center':
      // 中间锚点：x = (画布宽度 / 2) + offsetX（百分比转像素）
      anchorX = canvasWidth / 2 + pixelOffsetX;
      break;
    case 'top-right':
    case 'middle-right':
    case 'bottom-right':
    default:
      // 右侧锚点：x = 画布宽度 - 边距 + offsetX（百分比转像素）
      anchorX = canvasWidth - margin + pixelOffsetX;
      break;
  }

  // 垂直锚点计算
  switch (position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      // 顶部锚点：y = 边距 + offsetY（百分比转像素）
      anchorY = margin + pixelOffsetY;
      break;
    case 'middle-left':
    case 'middle-center':
    case 'middle-right':
      // 中间锚点：y = (画布高度 / 2) + offsetY（百分比转像素）
      anchorY = canvasHeight / 2 + pixelOffsetY;
      break;
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
    default:
      // 底部锚点：y = 画布高度 - 边距 + offsetY（百分比转像素）
      anchorY = canvasHeight - margin + pixelOffsetY;
      break;
  }

  return { anchorX, anchorY };
}

/**
 * 计算九宫格位置的完整信息
 * 包含锚点位置和 Fabric.js 对齐方式
 */
export function calculateGridPositionInfo(
  canvasWidth: number,
  canvasHeight: number,
  position: WatermarkPosition,
  margin: number = 20,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const anchor = calculateAnchorPosition(canvasWidth, canvasHeight, position, margin, offsetX, offsetY);
  const origin = getOriginFromPosition(position);

  return {
    ...anchor,
    ...origin,
    position,
    margin,
    offsetX,
    offsetY
  };
}

/**
 * 检查位置是否为边缘位置
 * 所有位置都完全贴边，不使用默认margin
 * 用户如需间距可通过offsetX/offsetY参数自行调整
 */
export function isEdgePosition(position: WatermarkPosition): boolean {
  // 所有位置都完全贴边，不使用默认margin
  return true;
}

/**
 * 描边配置接口
 */
export interface StrokeConfig {
  width: number; // 像素基线宽度
  color: string;
  widthRatio?: number; // 可选：相对字号的比例（例如 0.05 表示字号的5%）
}

/**
 * 计算描边设置，确保预览和导出一致性
 * @param strokeConfig 描边配置
 * @param scale 缩放比例
 * @param renderMode 渲染模式
 */
export function calculateStrokeSettings(
  strokeConfig: StrokeConfig,
  scale: number,
  renderMode: 'canvas' | 'fabric' = 'canvas',
  opts?: { scaledFontSize?: number; baseFontSize?: number }
) {
  let effectiveLineWidth: number | undefined = undefined;

  // 1) 首选：按“与字体大小成比例”的方式计算
  if (opts?.scaledFontSize && opts?.baseFontSize && opts.baseFontSize > 0) {
    const ratio = strokeConfig.width / opts.baseFontSize; // 与原始字号的比例
    effectiveLineWidth = ratio * opts.scaledFontSize;
  }

  // 2) 其次：显式提供 widthRatio（相对字号比例）
  if (!effectiveLineWidth && strokeConfig.widthRatio && opts?.scaledFontSize) {
    effectiveLineWidth = strokeConfig.widthRatio * opts.scaledFontSize;
  }

  // 3) 兜底：按像素宽度随显示缩放比例计算
  const base = effectiveLineWidth ?? (strokeConfig.width * scale);

  if (renderMode === 'canvas') {
    // 原生Canvas API：使用双倍宽度实现向外描边
    return {
      lineWidth: base * 2,
      strokeStyle: strokeConfig.color
    };
  } else {
    // Fabric.js：使用paintFirst属性实现向外描边
    return {
      strokeWidth: base,
      stroke: strokeConfig.color,
      paintFirst: 'stroke' as const
    };
  }
}

/**
 * 计算边缘对齐的锚点位置
 * 边缘位置时margin自动设为0，确保精确贴边
 */
export function calculateEdgeAlignedAnchorPosition(
  canvasWidth: number,
  canvasHeight: number,
  position: WatermarkPosition,
  margin: number = 20,
  offsetX: number = 0,
  offsetY: number = 0
): AnchorPosition {
  // 边缘位置时强制margin为0
  const effectiveMargin = isEdgePosition(position) ? 0 : margin;

  return calculateAnchorPosition(
    canvasWidth,
    canvasHeight,
    position,
    effectiveMargin,
    offsetX,
    offsetY
  );
}

/**
 * 验证位置是否为有效的九宫格位置
 */
export function isValidGridPosition(position: string): position is WatermarkPosition {
  return POSITION_GRID.includes(position as WatermarkPosition) || position === 'custom';
}
