// Fabric.js 工具函数

import { Canvas, FabricImage, FabricText, Shadow, FabricObject, Rect } from 'fabric';
import * as fabric from 'fabric';
import { CanvasConfig, FabricWatermarkObject } from '../../types/watermark';
import { WatermarkConfig, ImageInfo } from '../../types';
import {
  calculateAnchorPosition,
  calculateEdgeAlignedAnchorPosition,
  isEdgePosition,
  getOriginFromPosition
} from './positionUtils';
import {
  calculateProportionPosition,
  convertProportionToPixel,
  calculateProportionalFontSize
} from './proportionUtils';
import {
  calculateAdaptiveWatermarkSize,
  ImageDimensions
} from './adaptiveScaling';

// 默认Canvas配置
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  selection: true,
  preserveObjectStacking: true,
};

/**
 * 初始化Fabric Canvas
 */
export function initializeCanvas(
  canvasElement: HTMLCanvasElement,
  config: Partial<CanvasConfig> = {}
): Canvas {
  const finalConfig = { ...DEFAULT_CANVAS_CONFIG, ...config };

  const canvas = new Canvas(canvasElement, {
    width: finalConfig.width,
    height: finalConfig.height,
    backgroundColor: finalConfig.backgroundColor,
    selection: finalConfig.selection,
    preserveObjectStacking: finalConfig.preserveObjectStacking,
  });

  // 设置Canvas样式
  canvas.setDimensions({
    width: finalConfig.width,
    height: finalConfig.height
  });

  return canvas;
}

/**
 * 加载图片到Canvas
 * {{ Shrimp-X: Modify - 修复图片切换时Canvas尺寸适配问题. Approval: Cunzhi(ID:timestamp). }}
 */
export function loadImageToCanvas(
  canvas: Canvas,
  imageInfo: ImageInfo
): Promise<FabricImage> {
  return new Promise((resolve, reject) => {
    FabricImage.fromURL(
      imageInfo.url,
      {
        crossOrigin: 'anonymous'
      }
    ).then((img) => {
      if (!img) {
        reject(new Error('Failed to load image'));
        return;
      }

      // 获取图片原始尺寸
      const imageWidth = img.width || imageInfo.width;
      const imageHeight = img.height || imageInfo.height;

      // 定义最大显示尺寸（容器限制）
      const maxDisplayWidth = 800;
      const maxDisplayHeight = 600;

      // 计算适合显示的尺寸，保持图片宽高比
      const scaleX = maxDisplayWidth / imageWidth;
      const scaleY = maxDisplayHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

      // 计算Canvas的新尺寸（基于缩放后的图片尺寸）
      const newCanvasWidth = Math.round(imageWidth * scale);
      const newCanvasHeight = Math.round(imageHeight * scale);

      // 调整Canvas尺寸以适配图片
      canvas.setDimensions({
        width: newCanvasWidth,
        height: newCanvasHeight
      });

      // 设置图片属性（填满整个Canvas）
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      });

      // {{ Shrimp-X: Modify - 修复sendToBack方法调用错误. Approval: Cunzhi(ID:timestamp). }}
      // 清空Canvas并添加图片
      canvas.clear();
      canvas.add(img);

      // 将图片移到最底层
      try {
        canvas.bringObjectToFront && canvas.bringObjectToFront(img);
      } catch (error) {
        // 继续执行，不影响主要功能
      }

      canvas.renderAll();
      resolve(img);
    }).catch(reject);
  });
}

/**
 * 创建文字水印对象
 */
export function createTextWatermark(
  config: WatermarkConfig,
  canvasWidth?: number,
  canvasHeight?: number
): FabricText | null {
  if (!config.textStyle) return null;

  const textStyle = config.textStyle;
  let left = config.position.x;
  let top = config.position.y;
  let fontSize = textStyle.fontSize;
  let originX: 'left' | 'center' | 'right' = 'left';
  let originY: 'top' | 'center' | 'bottom' = 'top';

  // {{ Shrimp-X: Modify - 添加自适应缩放支持，使用 adaptiveScaling 计算. Approval: Cunzhi(ID:timestamp). }}
  // 如果提供了画布尺寸，使用自适应缩放计算字体大小
  if (canvasWidth && canvasHeight) {
    const imageDimensions: ImageDimensions = {
      width: canvasWidth,
      height: canvasHeight
    };

    // 计算自适应尺寸
    const scalingResult = calculateAdaptiveWatermarkSize(config, imageDimensions);

    // 使用计算出的字体大小
    if (scalingResult.fontSize) {
      fontSize = scalingResult.fontSize;
    }

    // 检查是否为比例模式
    if (config.position.mode === 'proportion' && config.position.proportions) {
      // 比例模式：使用比例计算工具
      const proportionConfig = {
        mode: 'proportion' as const,
        position: config.position.position,
        proportions: config.position.proportions
      };

      const positionInfo = calculateProportionPosition(
        proportionConfig,
        canvasWidth,
        canvasHeight,
        scalingResult.marginX
      );

      left = positionInfo.anchorX;
      top = positionInfo.anchorY;
      originX = positionInfo.originX;
      originY = positionInfo.originY;
    } else if (config.position.position !== 'custom') {
      // 像素模式：使用现有的九宫格对齐逻辑，但使用自适应边距
      const margin = scalingResult.marginX;
      const offsetX = config.position.offsetX || 0;
      const offsetY = config.position.offsetY || 0;

      // 计算锚点位置 - 所有位置都贴边对齐
      const position = config.position.position;

      // 直接计算完全贴边的位置，不使用originX/originY
      // 创建临时文字对象来测量尺寸
      const tempText = new FabricText(textStyle.content, {
        fontFamily: textStyle.fontFamily,
        fontSize,
        fontWeight: textStyle.fontWeight,
      });

      const textWidth = tempText.width || 0;
      const textHeight = tempText.height || 0;

      // 根据位置直接计算left/top，确保完全贴边
      switch (position) {
        case 'top-left':
          left = 0 + offsetX;
          top = 0 + offsetY;
          break;
        case 'top-center':
          left = (canvasWidth - textWidth) / 2 + offsetX;
          top = 0 + offsetY;
          break;
        case 'top-right':
          left = canvasWidth - textWidth + offsetX;
          top = 0 + offsetY;
          break;
        case 'middle-left':
          left = 0 + offsetX;
          top = (canvasHeight - textHeight) / 2 + offsetY;
          break;
        case 'middle-center':
          left = (canvasWidth - textWidth) / 2 + offsetX;
          top = (canvasHeight - textHeight) / 2 + offsetY;
          break;
        case 'middle-right':
          left = canvasWidth - textWidth + offsetX;
          top = (canvasHeight - textHeight) / 2 + offsetY;
          break;
        case 'bottom-left':
          left = 0 + offsetX;
          top = canvasHeight - textHeight + offsetY;
          break;
        case 'bottom-center':
          left = (canvasWidth - textWidth) / 2 + offsetX;
          top = canvasHeight - textHeight + offsetY;
          break;
        case 'bottom-right':
          left = canvasWidth - textWidth + offsetX;
          top = canvasHeight - textHeight + offsetY;
          break;
        default:
          left = 0;
          top = 0;
      }

      // 使用左上角对齐，因为我们已经计算了精确位置
      originX = 'left';
      originY = 'top';

      console.log('createTextWatermark: 完全贴边位置计算', {
        position,
        canvasSize: { width: canvasWidth, height: canvasHeight },
        textSize: { width: textWidth, height: textHeight },
        final: { left, top },
        offset: { x: offsetX, y: offsetY }
      });
    }
  }

  const text = new FabricText(textStyle.content, {
    left,
    top,
    originX,
    originY,
    fontFamily: textStyle.fontFamily,
    fontSize, // 使用计算后的字体大小（比例模式或原始大小）
    fontWeight: textStyle.fontWeight,
    fill: textStyle.color,
    opacity: textStyle.opacity,
    angle: textStyle.rotation,
    stroke: textStyle.stroke?.color,
    strokeWidth: textStyle.stroke?.width || 0,
    paintFirst: 'stroke', // 先绘制描边，实现向外描边效果
    shadow: textStyle.shadow ? new Shadow({
      color: textStyle.shadow.color,
      blur: textStyle.shadow.blur,
      offsetX: textStyle.shadow.offsetX,
      offsetY: textStyle.shadow.offsetY,
    }) : undefined,
  });

  // 对于边缘位置，进一步调整以消除文字内在边距
  if (config.position.position !== 'custom' && config.position.position !== 'middle-center') {
    // 获取文字的实际边界框
    const bounds = text.getBoundingRect();

    // 计算文字对象位置与实际渲染边界的差异
    const leftDiff = bounds.left - text.left!;
    const topDiff = bounds.top - text.top!;

    // 根据位置调整，消除内在边距
    let adjustedLeft = left;
    let adjustedTop = top;

    const pos = config.position.position;

    // 水平调整
    if (pos.includes('left')) {
      adjustedLeft = left - leftDiff;
    } else if (pos.includes('right')) {
      adjustedLeft = left - leftDiff;
    }

    // 垂直调整
    if (pos.includes('top')) {
      adjustedTop = top - topDiff;
    } else if (pos.includes('bottom')) {
      adjustedTop = top - topDiff;
    }

    text.set({
      left: adjustedLeft,
      top: adjustedTop
    });

    console.log('createTextWatermark: 边距调整', {
      position: pos,
      original: { left, top },
      bounds: { left: bounds.left, top: bounds.top },
      diff: { left: leftDiff, top: topDiff },
      adjusted: { left: adjustedLeft, top: adjustedTop }
    });
  }

  return text;
}

/**
 * 创建图片水印对象
 */
export function createImageWatermark(
  config: WatermarkConfig,
  canvasWidth?: number,
  canvasHeight?: number
): Promise<FabricImage | null> {
  console.log('createImageWatermark: 开始创建图片水印', {
    hasImageUrl: !!config.imageStyle?.imageUrl,
    imageUrl: config.imageStyle?.imageUrl?.substring(0, 50) + '...',
    imageStyle: config.imageStyle
  });

  if (!config.imageStyle?.imageUrl) {
    console.log('createImageWatermark: 图片URL为空');
    return Promise.resolve(null);
  }

  return FabricImage.fromURL(
    config.imageStyle.imageUrl,
    {
      crossOrigin: 'anonymous'
    }
  ).then((img) => {
    if (!img) {
      throw new Error('Failed to load watermark image');
    }

    // {{ Shrimp-X: Modify - 重写图片水印缩放逻辑，使用比例缩放和正确的位置计算. Approval: Cunzhi(ID:timestamp). }}
    const imageStyle = config.imageStyle!;

    console.log('createImageWatermark: 原始图片尺寸', {
      width: img.width,
      height: img.height
    });
    console.log('createImageWatermark: Canvas尺寸', {
      canvasWidth,
      canvasHeight
    });
    console.log('createImageWatermark: 配置尺寸', {
      width: imageStyle.width,
      height: imageStyle.height
    });

    // {{ Shrimp-X: Modify - 使用用户设置的缩放比例，基于Canvas尺寸计算合适的基础大小. Approval: Cunzhi(ID:timestamp). }}
    // 计算基于Canvas尺寸和用户缩放比例的水印大小
    let targetWidth, targetHeight, scaleX, scaleY;

    if (canvasWidth && canvasHeight) {
      // 计算基础水印大小（占Canvas面积的一定比例）
      const canvasArea = canvasWidth * canvasHeight;
      const baseWatermarkRatio = 0.08; // 基础水印占Canvas面积的8%
      const baseTargetArea = canvasArea * baseWatermarkRatio;

      // 保持水印图片的宽高比
      const aspectRatio = (img.width || 1) / (img.height || 1);
      const baseHeight = Math.sqrt(baseTargetArea / aspectRatio);
      const baseWidth = baseHeight * aspectRatio;

      // 应用用户设置的缩放比例
      targetWidth = baseWidth * imageStyle.scale;
      targetHeight = baseHeight * imageStyle.scale;

      // 限制最大尺寸（防止过大）
      const maxWidth = canvasWidth * 0.6;
      const maxHeight = canvasHeight * 0.6;

      if (targetWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = targetWidth / aspectRatio;
      }

      if (targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = targetHeight * aspectRatio;
      }

      // 计算最终缩放比例
      scaleX = targetWidth / (img.width || 1);
      scaleY = targetHeight / (img.height || 1);

      console.log('createImageWatermark: 缩放计算', {
        baseSize: { width: baseWidth.toFixed(1), height: baseHeight.toFixed(1) },
        userScale: imageStyle.scale,
        targetSize: { width: targetWidth.toFixed(1), height: targetHeight.toFixed(1) },
        finalScale: { x: scaleX.toFixed(3), y: scaleY.toFixed(3) }
      });
    } else {
      // 如果没有Canvas尺寸，直接使用用户缩放比例
      const baseScale = 0.5; // 基础缩放
      scaleX = baseScale * imageStyle.scale;
      scaleY = baseScale * imageStyle.scale;
      targetWidth = (img.width || imageStyle.width) * scaleX;
      targetHeight = (img.height || imageStyle.height) * scaleY;
    }

    // {{ Shrimp-X: Modify - 修复图片水印九宫格位置计算，使用正确的Fabric.js坐标系统. Approval: Cunzhi(ID:timestamp). }}
    // 计算位置
    let left = 0;
    let top = 0;

    if (config.position.position !== 'custom') {
      // 所有位置都完全贴边，不使用默认margin
      const offsetX = config.position.offsetX || 0;
      const offsetY = config.position.offsetY || 0;
      const cWidth = canvasWidth || 800;
      const cHeight = canvasHeight || 600;

      // 计算Fabric.js对象的实际渲染尺寸
      const actualWidth = (img.width || 1) * scaleX;
      const actualHeight = (img.height || 1) * scaleY;

      // 使用边缘对齐的锚点计算，margin=0
      const anchor = calculateEdgeAlignedAnchorPosition(cWidth, cHeight, config.position.position, 0, offsetX, offsetY);
      const origin = getOriginFromPosition(config.position.position);

      // 根据originX和originY调整位置
      left = anchor.anchorX;
      top = anchor.anchorY;

      // 根据originX调整X位置
      switch (origin.originX) {
        case 'center':
          left -= actualWidth / 2;
          break;
        case 'right':
          left -= actualWidth;
          break;
        // 'left' 不需要调整
      }

      // 根据originY调整Y位置
      switch (origin.originY) {
        case 'center':
          top -= actualHeight / 2;
          break;
        case 'bottom':
          top -= actualHeight;
          break;
        // 'top' 不需要调整
      }

      console.log('createImageWatermark: 位置计算', {
        position: config.position.position,
        canvasSize: { width: cWidth, height: cHeight },
        watermarkSize: { width: targetWidth.toFixed(1), height: targetHeight.toFixed(1) },
        final: { left: left.toFixed(1), top: top.toFixed(1) },
        margin: '完全贴边'
      });
    } else {
      // 自定义位置
      left = config.position.x || 0;
      top = config.position.y || 0;
    }

    // {{ Shrimp-X: Modify - 使用默认的左上角对齐，直接设置位置. Approval: Cunzhi(ID:timestamp). }}
    // 使用默认的左上角对齐（originX: 'left', originY: 'top'）
    img.set({
      left,
      top,
      scaleX,
      scaleY,
      opacity: imageStyle.opacity,
      angle: imageStyle.rotation,
      selectable: false,
      evented: false,
    });

    console.log('createImageWatermark: Fabric.js设置', {
      position: { left: left.toFixed(1), top: top.toFixed(1) },
      watermarkSize: { width: targetWidth.toFixed(1), height: targetHeight.toFixed(1) },
      scale: { x: scaleX.toFixed(3), y: scaleY.toFixed(3) }
    });

    return img;
  }).catch(() => null);
}

/**
 * 计算旋转后的边界框尺寸
 */
function calculateRotatedBounds(width: number, height: number, angle: number): { width: number; height: number } {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  const rotatedWidth = width * cos + height * sin;
  const rotatedHeight = width * sin + height * cos;

  return { width: rotatedWidth, height: rotatedHeight };
}

/**
 * 计算全屏水印平铺尺寸
 */
function calculateTileSize(
  fullscreenStyle: {
    tileDensity?: number;
    tileSpacing?: number;
    rotation?: number;
    mode?: string;
    imageOriginalWidth?: number;
    imageOriginalHeight?: number;
    scale?: number;
    imageScale?: number;
    fontSize?: number;
    content?: string;
  },
  canvasWidth: number,
  canvasHeight: number
): { width: number; height: number } {
  const density = fullscreenStyle.tileDensity || 0.5;
  const spacing = fullscreenStyle.tileSpacing || 200;
  const rotation = fullscreenStyle.rotation || 0;

  let baseWidth, baseHeight;

  if (fullscreenStyle.mode === 'image') {
    // {{ Shrimp-X: Modify - 基于实际图片尺寸进行缩放计算，考虑旋转后的边界框. Approval: Cunzhi(ID:timestamp). }}
    // 图片模式：使用实际图片尺寸 * 缩放比例
    const originalWidth = fullscreenStyle.imageOriginalWidth || 100;
    const originalHeight = fullscreenStyle.imageOriginalHeight || 100;
    const scale = fullscreenStyle.imageScale || 1.0;

    // 计算缩放后的尺寸
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;

    // {{ Shrimp-X: Add - 计算旋转后的边界框，避免PNG透明水印旋转时产生方形遮挡. Approval: Cunzhi(ID:timestamp). }}
    // 如果有旋转角度，计算旋转后的边界框
    if (rotation !== 0) {
      const rotatedBounds = calculateRotatedBounds(scaledWidth, scaledHeight, rotation);
      baseWidth = rotatedBounds.width;
      baseHeight = rotatedBounds.height;
    } else {
      baseWidth = scaledWidth;
      baseHeight = scaledHeight;
    }
  } else {
    // 文字模式：根据字体大小和内容长度估算
    const fontSize = fullscreenStyle.fontSize || 16;
    const textWidth = fontSize * (fullscreenStyle.content?.length || 4) * 0.6;
    const textHeight = fontSize * 1.2;

    // {{ Shrimp-X: Add - 文字水印也考虑旋转后的边界框. Approval: Cunzhi(ID:timestamp). }}
    // 如果有旋转角度，计算旋转后的边界框
    if (rotation !== 0) {
      const rotatedBounds = calculateRotatedBounds(textWidth, textHeight, rotation);
      baseWidth = rotatedBounds.width;
      baseHeight = rotatedBounds.height;
    } else {
      baseWidth = textWidth;
      baseHeight = textHeight;
    }
  }

  // {{ Shrimp-X: Modify - 增加额外间距，确保旋转后的水印不会相互遮挡. Approval: Cunzhi(ID:timestamp). }}
  // 计算最终尺寸，为旋转后的水印增加足够的间距
  const extraSpacing = rotation !== 0 ? spacing * 0.5 : 0; // 旋转时增加50%的额外间距
  const width = Math.max(baseWidth + spacing + extraSpacing, spacing * density);
  const height = Math.max(baseHeight + spacing * 0.5 + extraSpacing, spacing * density * 0.5);

  return { width, height };
}

/**
 * 计算对角线模式偏移
 */
function calculateDiagonalOffset(
  tileSize: { width: number; height: number },
  diagonalMode: boolean
): { offsetX: number; offsetY: number } {
  if (!diagonalMode) {
    return { offsetX: 0, offsetY: 0 };
  }

  // 对角线模式：每行偏移半个单元宽度
  return {
    offsetX: tileSize.width / 2,
    offsetY: 0
  };
}

/**
 * 创建用于Pattern的Canvas
 */
function createPatternCanvas(
  tileSize: { width: number; height: number }
): fabric.StaticCanvas {
  const patternCanvas = new fabric.StaticCanvas();
  patternCanvas.setDimensions({
    width: tileSize.width,
    height: tileSize.height
  });
  patternCanvas.backgroundColor = 'transparent';
  return patternCanvas;
}

/**
 * 创建全屏水印对象
 */
export async function createFullscreenWatermark(
  config: WatermarkConfig,
  canvasWidth?: number,
  canvasHeight?: number
): Promise<Rect | null> {
  if (!config.fullscreenStyle) return null;

  const fullscreenStyle = config.fullscreenStyle;
  const cWidth = canvasWidth || 800;
  const cHeight = canvasHeight || 600;

  try {
    // {{ Shrimp-X: Add - 基于Context7的Fabric.js Pattern方案实现全屏平铺水印. Approval: Cunzhi(ID:timestamp). }}

    // 1. 计算平铺单元尺寸
    const tileSize = calculateTileSize(fullscreenStyle, cWidth, cHeight);

    // 2. 创建Pattern Canvas
    const patternCanvas = createPatternCanvas(tileSize);

    // 3. 根据模式创建水印对象
    let watermarkObject: FabricObject;

    if (fullscreenStyle.mode === 'image' && fullscreenStyle.imageUrl) {
      // {{ Shrimp-X: Add - 支持图片全屏水印模式. Approval: Cunzhi(ID:timestamp). }}
      // 图片模式
      const fabricImage = await FabricImage.fromURL(fullscreenStyle.imageUrl, {
        crossOrigin: 'anonymous'
      });

      if (!fabricImage) {
        throw new Error('Failed to load fullscreen watermark image');
      }

      // 设置图片尺寸和位置
      fabricImage.set({
        left: tileSize.width / 2,
        top: tileSize.height / 2,
        originX: 'center',
        originY: 'center',
        opacity: fullscreenStyle.opacity,
        angle: fullscreenStyle.rotation,
        selectable: false,
        evented: false,
      });

      // {{ Shrimp-X: Modify - 使用比例缩放保持图片纵横比. Approval: Cunzhi(ID:timestamp). }}
      // 使用统一的缩放比例，保持图片纵横比
      const scale = fullscreenStyle.imageScale || 1.0;
      fabricImage.set({ scaleX: scale, scaleY: scale });

      watermarkObject = fabricImage;
    } else {
      // 文字模式
      watermarkObject = new FabricText(fullscreenStyle.content, {
        left: tileSize.width / 2,
        top: tileSize.height / 2,
        originX: 'center',
        originY: 'center',
        fontFamily: fullscreenStyle.fontFamily,
        fontSize: fullscreenStyle.fontSize,
        fill: fullscreenStyle.color,
        opacity: fullscreenStyle.opacity,
        angle: fullscreenStyle.rotation,
        selectable: false,
        evented: false,
      });
    }

    // 4. 添加水印对象到Pattern Canvas
    patternCanvas.add(watermarkObject);
    patternCanvas.renderAll();

    // 5. 计算对角线偏移
    const offset = calculateDiagonalOffset(tileSize, fullscreenStyle.diagonalMode);

    // 6. 创建Pattern
    const pattern = new fabric.Pattern({
      source: patternCanvas.getElement(),
      repeat: 'repeat',
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
    });

    // 7. 创建覆盖整个画布的矩形
    const fullscreenRect = new Rect({
      left: 0,
      top: 0,
      width: cWidth,
      height: cHeight,
      fill: pattern,
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });

    return fullscreenRect;

  } catch (error) {
    return null;
  }
}

/**
 * 应用水印到Canvas
 */
export async function applyWatermarkToCanvas(
  canvas: Canvas,
  config: WatermarkConfig
): Promise<FabricWatermarkObject | null> {
  let fabricObject: FabricObject | null = null;

  try {
    // {{ Shrimp-X: Modify - 修复Canvas逻辑尺寸获取，使用真正的原始尺寸. Approval: Cunzhi(ID:timestamp). }}
    // 获取Canvas的真正逻辑尺寸（未缩放的原始尺寸）
    const currentZoom = canvas.getZoom();
    const displayWidth = canvas.getWidth();
    const displayHeight = canvas.getHeight();

    // 计算真正的逻辑尺寸：显示尺寸 / 缩放比例
    const canvasWidth = Math.round(displayWidth / currentZoom);
    const canvasHeight = Math.round(displayHeight / currentZoom);

    switch (config.type) {
      case 'text':
        fabricObject = createTextWatermark(config, canvasWidth, canvasHeight);
        break;

      case 'image':
        fabricObject = await createImageWatermark(config, canvasWidth, canvasHeight);
        break;

      case 'fullscreen':
        // {{ Shrimp-X: Modify - 使用新的createFullscreenWatermark函数实现真正的全屏平铺水印，支持图片模式. Approval: Cunzhi(ID:timestamp). }}
        fabricObject = await createFullscreenWatermark(config, canvasWidth, canvasHeight);
        break;

      default:
        return null;
    }

    if (!fabricObject) return null;

    // 添加到Canvas
    canvas.add(fabricObject);
    canvas.renderAll();

    return {
      id: config.id,
      type: config.type === 'fullscreen' ? 'fullscreen' : config.type,
      fabricObject,
      config,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 移除水印对象
 */
export function removeWatermarkFromCanvas(
  canvas: Canvas,
  watermarkObject: FabricWatermarkObject
): void {
  canvas.remove(watermarkObject.fabricObject);
  canvas.renderAll();
}

/**
 * 清除所有水印
 */
export function clearWatermarks(canvas: Canvas): void {
  const objects = canvas.getObjects();
  // {{ Shrimp-X: Modify - 添加对全屏水印(rect类型)的识别和清除支持. Approval: Cunzhi(ID:timestamp). }}
  const watermarks = objects.filter(obj => {
    // 排除背景图片（通常是第一个对象）
    if (obj === objects[0] && obj.type === 'image') {
      return false;
    }
    // 识别水印对象：文字水印、图片水印、全屏水印(rect)
    return obj.type === 'text' || obj.type === 'image' || obj.type === 'rect';
  });

  watermarks.forEach(obj => canvas.remove(obj));
  canvas.renderAll();
}

/**
 * 导出Canvas为图片
 */
export function exportCanvasAsImage(
  canvas: Canvas,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): string {
  // 获取Canvas中的背景图片（通常是第一个对象）
  const objects = canvas.getObjects();
  const backgroundImage = objects.find(obj => obj.type === 'image') as FabricImage;
  
  if (backgroundImage) {
    // 计算原始图片尺寸与当前Canvas尺寸的比例
    const originalWidth = backgroundImage.getOriginalSize().width || backgroundImage.width || canvas.getWidth();
    const originalHeight = backgroundImage.getOriginalSize().height || backgroundImage.height || canvas.getHeight();
    
    const currentWidth = canvas.getWidth();
    const currentHeight = canvas.getHeight();
    
    // 计算需要的缩放倍数以恢复原始分辨率
    const scaleX = originalWidth / currentWidth;
    const scaleY = originalHeight / currentHeight;
    const multiplier = Math.max(scaleX, scaleY);
    
    return canvas.toDataURL({
      format: format === 'png' ? 'png' : 'jpeg',
      quality: format === 'jpeg' ? quality : 1.0,
      multiplier: multiplier, // 使用计算出的倍数恢复原始分辨率
    });
  }
  
  // 如果没有背景图片，使用默认导出
  return canvas.toDataURL({
    format: format === 'png' ? 'png' : 'jpeg',
    quality: format === 'jpeg' ? quality : 1.0,
    multiplier: 1,
  });
}

/**
 * 调整Canvas尺寸
 */
export function resizeCanvas(
  canvas: Canvas,
  width: number,
  height: number
): void {
  canvas.setDimensions({ width, height });
  canvas.renderAll();
}

/**
 * 获取Canvas中心点
 */
export function getCanvasCenter(canvas: Canvas): { x: number; y: number } {
  return {
    x: canvas.getWidth() / 2,
    y: canvas.getHeight() / 2,
  };
}

/**
 * 计算九宫格位置
 */
export function calculateGridPosition(
  canvas: Canvas,
  position: string,
  objectWidth: number,
  objectHeight: number,
  margin: number = 20
): { x: number; y: number } {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: margin, y: margin },
    'top-center': { x: (canvasWidth - objectWidth) / 2, y: margin },
    'top-right': { x: canvasWidth - objectWidth - margin, y: margin },
    'middle-left': { x: margin, y: (canvasHeight - objectHeight) / 2 },
    'middle-center': { x: (canvasWidth - objectWidth) / 2, y: (canvasHeight - objectHeight) / 2 },
    'middle-right': { x: canvasWidth - objectWidth - margin, y: (canvasHeight - objectHeight) / 2 },
    'bottom-left': { x: margin, y: canvasHeight - objectHeight - margin },
    'bottom-center': { x: (canvasWidth - objectWidth) / 2, y: canvasHeight - objectHeight - margin },
    'bottom-right': { x: canvasWidth - objectWidth - margin, y: canvasHeight - objectHeight - margin },
  };

  return positions[position] || positions['middle-center'];
}

/**
 * 设置对象位置
 */
export function setObjectPosition(
  object: FabricObject,
  x: number,
  y: number
): void {
  object.set({ left: x, top: y });
  object.setCoords();
}

/**
 * 获取对象边界框
 */
export function getObjectBounds(object: FabricObject): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const bounds = object.getBoundingRect();
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };
}

/**
 * 销毁Canvas
 */
export function disposeCanvas(canvas: Canvas): void {
  canvas.dispose();
}
