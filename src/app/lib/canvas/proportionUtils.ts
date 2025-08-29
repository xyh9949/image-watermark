// 比例计算工具函数
// {{ Shrimp-X: Add - 实现跨分辨率比例统一功能. Approval: Cunzhi(ID:timestamp). }}

import { PositionConfig, ProportionData, WatermarkPosition } from '../../types';
import { calculateAnchorPosition, getOriginFromPosition } from './positionUtils';

/**
 * 像素数据接口
 */
export interface PixelData {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  offsetX: number;
  offsetY: number;
}

/**
 * 比例配置接口
 */
export interface ProportionConfig {
  mode: 'proportion';
  position: WatermarkPosition;
  proportions: ProportionData;
}

/**
 * 尺寸信息接口
 */
export interface SizeInfo {
  width: number;
  height: number;
}

/**
 * 从当前像素配置计算相对比例
 * 
 * @param config 当前位置配置
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param watermarkWidth 水印宽度
 * @param watermarkHeight 水印高度
 * @returns 比例数据
 */
export function calculateProportions(
  config: PositionConfig,
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number
): ProportionData {
  // 计算水印尺寸相对于画布的比例
  const scaleXPercent = watermarkWidth / canvasWidth;
  const scaleYPercent = watermarkHeight / canvasHeight;
  
  // 计算偏移量相对于画布的比例
  const offsetXPercent = (config.offsetX || 0) / canvasWidth;
  const offsetYPercent = (config.offsetY || 0) / canvasHeight;
  
  return {
    scaleXPercent,
    scaleYPercent,
    offsetXPercent,
    offsetYPercent
  };
}

/**
 * 将比例应用到新尺寸图片
 * 
 * @param proportions 比例数据
 * @param newWidth 新图片宽度
 * @param newHeight 新图片高度
 * @returns 像素数据
 */
export function applyProportions(
  proportions: ProportionData,
  newWidth: number,
  newHeight: number
): PixelData {
  // 计算新的水印尺寸
  const width = Math.round(newWidth * proportions.scaleXPercent);
  const height = Math.round(newHeight * proportions.scaleYPercent);
  
  // 计算新的偏移量
  const offsetX = Math.round(newWidth * proportions.offsetXPercent);
  const offsetY = Math.round(newHeight * proportions.offsetYPercent);
  
  // 基于比例计算字体大小（基于高度比例）
  const fontSize = Math.round(newHeight * proportions.scaleYPercent * 0.8); // 0.8 是经验系数
  
  return {
    x: 0, // 将在位置计算中确定
    y: 0, // 将在位置计算中确定
    width,
    height,
    fontSize,
    offsetX,
    offsetY
  };
}

/**
 * 将像素配置转换为比例配置
 * 
 * @param pixelConfig 像素模式配置
 * @param referenceSize 参考尺寸
 * @param watermarkSize 水印尺寸
 * @returns 比例配置
 */
export function convertPixelToProportion(
  pixelConfig: PositionConfig,
  referenceSize: SizeInfo,
  watermarkSize: SizeInfo
): ProportionConfig {
  const proportions = calculateProportions(
    pixelConfig,
    referenceSize.width,
    referenceSize.height,
    watermarkSize.width,
    watermarkSize.height
  );
  
  return {
    mode: 'proportion',
    position: pixelConfig.position,
    proportions
  };
}

/**
 * 将比例配置转换为像素配置
 * 
 * @param proportionConfig 比例配置
 * @param targetSize 目标尺寸
 * @returns 像素配置
 */
export function convertProportionToPixel(
  proportionConfig: ProportionConfig,
  targetSize: SizeInfo
): PositionConfig {
  const pixelData = applyProportions(proportionConfig.proportions, targetSize.width, targetSize.height);
  
  return {
    mode: 'pixel',
    position: proportionConfig.position,
    x: pixelData.x,
    y: pixelData.y,
    marginX: 20, // 默认边距
    marginY: 20, // 默认边距
    marginPercent: 5, // 默认百分比边距
    offsetX: pixelData.offsetX,
    offsetY: pixelData.offsetY
  };
}

/**
 * 计算比例模式下的实际位置
 * 重用现有的九宫格对齐逻辑
 * 
 * @param proportionConfig 比例配置
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param margin 边距
 * @returns 完整的位置信息
 */
export function calculateProportionPosition(
  proportionConfig: ProportionConfig,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 20
) {
  const pixelData = applyProportions(proportionConfig.proportions, canvasWidth, canvasHeight);
  
  // 使用现有的九宫格对齐逻辑
  const anchor = calculateAnchorPosition(
    canvasWidth,
    canvasHeight,
    proportionConfig.position,
    margin,
    pixelData.offsetX,
    pixelData.offsetY
  );
  
  const origin = getOriginFromPosition(proportionConfig.position);
  
  return {
    ...anchor,
    ...origin,
    ...pixelData
  };
}

/**
 * 验证比例数据的有效性
 * 
 * @param proportions 比例数据
 * @returns 是否有效
 */
export function validateProportions(proportions: ProportionData): boolean {
  return (
    proportions.scaleXPercent > 0 &&
    proportions.scaleYPercent > 0 &&
    proportions.scaleXPercent <= 1 &&
    proportions.scaleYPercent <= 1 &&
    Math.abs(proportions.offsetXPercent) <= 1 &&
    Math.abs(proportions.offsetYPercent) <= 1
  );
}

/**
 * 创建默认比例数据
 * 
 * @returns 默认比例数据
 */
export function createDefaultProportions(): ProportionData {
  return {
    scaleXPercent: 0.2, // 默认占画布宽度的20%
    scaleYPercent: 0.1, // 默认占画布高度的10%
    offsetXPercent: 0,  // 无偏移
    offsetYPercent: 0   // 无偏移
  };
}

/**
 * 计算统一缩放比例
 * 重用现有的缩放计算模式：Math.min(scaleX, scaleY)
 * 
 * @param sourceWidth 源宽度
 * @param sourceHeight 源高度
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 * @returns 统一缩放比例
 */
export function calculateUnifiedScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): number {
  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;
  
  // 使用现有的缩放计算模式
  return Math.min(scaleX, scaleY);
}

/**
 * 比例模式下的字体大小计算
 * 基于画布高度的比例计算，确保不同尺寸图片字体一致
 * 
 * @param baseHeight 基准高度
 * @param targetHeight 目标高度
 * @param baseFontSize 基准字体大小
 * @returns 计算后的字体大小
 */
export function calculateProportionalFontSize(
  baseHeight: number,
  targetHeight: number,
  baseFontSize: number
): number {
  const scale = targetHeight / baseHeight;
  return Math.round(baseFontSize * scale);
}
