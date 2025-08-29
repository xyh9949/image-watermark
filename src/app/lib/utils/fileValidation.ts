// 文件验证工具函数

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/svg+xml',
  'image/webp'
] as const;

// 支持的文件扩展名
export const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp'
] as const;

// 文件大小限制（字节）
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MIN_FILE_SIZE = 1024; // 1KB

// 图片尺寸限制
export const MAX_IMAGE_DIMENSION = 8000; // 8000px
export const MIN_IMAGE_DIMENSION = 10; // 10px

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 文件信息接口
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 检查MIME类型
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    result.isValid = false;
    result.errors.push(`不支持的文件类型: ${file.type}`);
  }

  // 检查文件扩展名
  const extension = getFileExtension(file.name).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number])) {
    result.isValid = false;
    result.errors.push(`不支持的文件扩展名: ${extension}`);
  }

  return result;
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (file.size > MAX_FILE_SIZE) {
    result.isValid = false;
    result.errors.push(`文件过大: ${formatFileSize(file.size)}，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  if (file.size < MIN_FILE_SIZE) {
    result.isValid = false;
    result.errors.push(`文件过小: ${formatFileSize(file.size)}，最小需要 ${formatFileSize(MIN_FILE_SIZE)}`);
  }

  // 大文件警告
  if (file.size > 10 * 1024 * 1024) { // 10MB
    result.warnings.push(`文件较大 (${formatFileSize(file.size)})，处理可能需要更长时间`);
  }

  return result;
}

/**
 * 验证图片尺寸
 */
export function validateImageDimensions(width: number, height: number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    result.isValid = false;
    result.errors.push(`图片尺寸过大: ${width}x${height}，最大支持 ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`);
  }

  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    result.isValid = false;
    result.errors.push(`图片尺寸过小: ${width}x${height}，最小需要 ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}`);
  }

  // 超高分辨率警告
  if (width * height > 16000000) { // 16MP
    result.warnings.push(`图片分辨率很高 (${width}x${height})，处理可能消耗较多资源`);
  }

  return result;
}

/**
 * 综合验证文件
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 验证文件类型
  const typeValidation = validateFileType(file);
  result.errors.push(...typeValidation.errors);
  result.warnings.push(...typeValidation.warnings);

  // 验证文件大小
  const sizeValidation = validateFileSize(file);
  result.errors.push(...sizeValidation.errors);
  result.warnings.push(...sizeValidation.warnings);

  // 如果基础验证失败，直接返回
  if (result.errors.length > 0) {
    result.isValid = false;
    return result;
  }

  // 验证图片尺寸（需要加载图片）
  try {
    const dimensions = await getImageDimensions(file);
    const dimensionValidation = validateImageDimensions(dimensions.width, dimensions.height);
    result.errors.push(...dimensionValidation.errors);
    result.warnings.push(...dimensionValidation.warnings);
  } catch (error) {
    result.errors.push('无法读取图片信息，可能文件已损坏');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * 批量验证文件
 */
export async function validateFiles(files: File[]): Promise<Record<string, ValidationResult>> {
  const results: Record<string, ValidationResult> = {};
  
  for (const file of files) {
    results[file.name] = await validateFile(file);
  }
  
  return results;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]);
}

/**
 * 生成文件预览URL
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 清理预览URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
