'use client';

import { useCallback, useState } from 'react';
import { getCopy, type Locale } from '@/app/lib/i18n';
import { useImageStore } from '@/app/lib/stores';
import { validateFiles } from '@/app/lib/utils/fileValidation';

// 左栏和中间拖放共用校验及消息状态，防止入口不同导致漏校验或重复添加。
export function useImageUpload(locale: Locale, { maxFiles = Infinity, disabled = false } = {}) {
  const { isUploading, addImages, getImageCount } = useImageStore();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const labels = getCopy(locale).upload;

  const handleFilesUpload = useCallback(async (files: File[]) => {
    if (disabled || isUploading) return;

    const currentCount = getImageCount();
    if (maxFiles !== Infinity && currentCount + files.length > maxFiles) {
      setValidationErrors([labels.maxFiles(maxFiles, currentCount)]);
      return;
    }

    const validationResults = await validateFiles(files);
    const errors: string[] = [];
    const warnings: string[] = [];
    const validFiles: File[] = [];

    Object.entries(validationResults).forEach(([filename, result]) => {
      if (result.isValid) {
        const file = files.find((file) => file.name === filename);
        if (file) validFiles.push(file);
        warnings.push(...result.warnings);
      } else {
        errors.push(`${filename}: ${result.errors.join(', ')}`);
      }
    });

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    if (validFiles.length > 0) {
      try {
        // store 添加后会自动选择第一张图片，随后才懒加载编辑器。
        await addImages(validFiles);
      } catch (error) {
        setValidationErrors([labels.uploadFailed(error instanceof Error ? error.message : labels.unknownError)]);
      }
    }
  }, [disabled, isUploading, maxFiles, addImages, getImageCount, labels]);

  const clearMessages = useCallback(() => {
    setValidationErrors([]);
    setValidationWarnings([]);
  }, []);

  return {
    handleFilesUpload, validationErrors, validationWarnings, clearMessages,
    disabled: disabled || isUploading, maxFiles,
  };
}
