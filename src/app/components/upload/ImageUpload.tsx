// 图片上传主组件

'use client';

import React, { useCallback, useState } from 'react';
import { LocalUpload } from '@/components/ui/local-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { useImageStore } from '@/app/lib/stores';
import { FilePreviewList } from './FilePreview';
import {
  validateFiles,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  formatFileSize
} from '@/app/lib/utils/fileValidation';
import { DEFAULT_LOCALE, getCopy, type Locale } from '@/app/lib/i18n';

interface ImageUploadProps {
  className?: string;
  maxFiles?: number;
  disabled?: boolean;
  locale?: Locale;
}

export function ImageUpload({
  className = '',
  maxFiles = Infinity,
  disabled = false,
  locale = DEFAULT_LOCALE
}: ImageUploadProps) {
  const {
    images,
    selectedImageIds,
    isUploading,
    uploadProgress,
    addImages,
    removeImage,
    removeImages,
    selectImage,
    selectImages,
    clearSelection,
    setCurrentImage,
    hasImages,
    hasSelectedImages,
    getImageCount
  } = useImageStore();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const labels = getCopy(locale).upload;

  // 处理文件上传
  const handleFilesUpload = useCallback(async (files: File[]) => {
    if (disabled || isUploading) return;

    // 检查文件数量限制 (已解除限制)
    const currentCount = getImageCount();
    const totalCount = currentCount + files.length;

    if (maxFiles !== Infinity && totalCount > maxFiles) {
      setValidationErrors([labels.maxFiles(maxFiles, currentCount)]);
      return;
    }

    // 验证文件
    const validationResults = await validateFiles(files);
    const errors: string[] = [];
    const warnings: string[] = [];
    const validFiles: File[] = [];

    Object.entries(validationResults).forEach(([filename, result]) => {
      if (result.isValid) {
        const file = files.find(f => f.name === filename);
        if (file) validFiles.push(file);
        warnings.push(...result.warnings);
      } else {
        errors.push(`${filename}: ${result.errors.join(', ')}`);
      }
    });

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    // 上传有效文件
    if (validFiles.length > 0) {
      try {
        await addImages(validFiles);

        // 如果只上传了一张图片，自动选中
        if (validFiles.length === 1 && !hasImages()) {
          setTimeout(() => {
            const newImages = useImageStore.getState().images;
            if (newImages.length > 0) {
              setCurrentImage(newImages[newImages.length - 1].id);
            }
          }, 100);
        }
      } catch (error) {
        setValidationErrors([labels.uploadFailed(error instanceof Error ? error.message : labels.unknownError)]);
      }
    }
  }, [disabled, isUploading, maxFiles, addImages, getImageCount, hasImages, setCurrentImage, labels]);

  // 移除选中的图片
  const handleRemoveSelected = useCallback(() => {
    if (hasSelectedImages()) {
      removeImages(selectedImageIds);
      clearSelection();
    }
  }, [hasSelectedImages, removeImages, selectedImageIds, clearSelection]);

  // 清除错误和警告
  const clearMessages = useCallback(() => {
    setValidationErrors([]);
    setValidationWarnings([]);
  }, []);

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      {/* 上传区域 */}
      <Card className={`flex-shrink-0 ${hasImages() ? 'p-4' : 'p-6'}`}>
        <div className="space-y-4">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{labels.title}</h2>
            </div>
            {hasImages() && (
              <span className="text-sm text-muted-foreground">
                {maxFiles === Infinity ? labels.count(getImageCount()) : labels.limitedCount(getImageCount(), maxFiles)}
              </span>
            )}
          </div>

          {/* {{ Shrimp-X: Modify - 优化拖拽上传区域，支持紧凑模式. Approval: Cunzhi(ID:timestamp). }} */}
          {/* 拖拽上传区域 */}
          <LocalUpload accept={SUPPORTED_IMAGE_TYPES.join(',')} compact={hasImages()} disabled={disabled || isUploading} onFiles={handleFilesUpload}>


            <div className={hasImages() ? 'space-y-2' : 'space-y-4'}>
              {isUploading ? (
                <>
                  <Upload className={`mx-auto text-primary animate-bounce ${hasImages() ? 'h-6 w-6' : 'h-12 w-12'}`} />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{labels.uploading}</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={`mx-auto text-muted-foreground ${hasImages() ? 'h-6 w-6' : 'h-12 w-12'}`} />
                  <div className="space-y-2">
                    <p className={`text-muted-foreground ${hasImages() ? 'text-xs' : 'text-sm'}`}>
                      {(hasImages()
                          ? labels.addMoreHint
                          : labels.emptyHint)
                      }
                    </p>
                    {!hasImages() && (
                      <p className="text-xs text-muted-foreground">
                        {labels.support} {formatFileSize(MAX_FILE_SIZE)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <Button variant="outline" size={hasImages() ? 'sm' : 'default'} disabled={disabled}>
                      <Plus className="h-4 w-4 mr-2" />
                      {hasImages() ? labels.addMore : labels.choose}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </LocalUpload>

        </div>
      </Card>

      {/* 错误和警告信息 */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="space-y-2">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearMessages}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}

          {validationWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearMessages}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}
        </div>
      )}

      {/* {{ Shrimp-X: Modify - 优化图片列表布局，增加内置滚动条. Approval: Cunzhi(ID:timestamp). }} */}
      {/* 图片列表 - 带内置滚动条，避免页面整体滚动 */}
      {hasImages() && (
        <Card className="flex flex-col max-h-[60vh]">
          {/* 列表标题和操作 - 固定在顶部 */}
          <div className="flex-shrink-0 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {labels.uploaded} ({getImageCount()})
              </h3>
              {hasSelectedImages() && (
                <Button
                  variant="ghost"
                  size="icon"
                  title={labels.deleteSelected}
                  aria-label={labels.deleteSelected}
                  onClick={handleRemoveSelected}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 文件预览列表 - 内置滚动区域 */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* {{ Shrimp-X: Modify - 修复图片切换问题，点击图片时同时选择和设置为当前图片. Approval: Cunzhi(ID:timestamp). }} */}
            <FilePreviewList
              images={images}
              selectedIds={selectedImageIds}
              showProgress={isUploading}
              onSelect={(imageId) => {
                selectImage(imageId);
                setCurrentImage(imageId); // 同时设置为当前图片
              }}
              onSelectMultiple={selectImages}
              onRemove={removeImage}
              onPreview={setCurrentImage}
              locale={locale}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
