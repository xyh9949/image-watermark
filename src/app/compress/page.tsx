'use client';

/* eslint-disable @next/next/no-img-element -- Local object URL previews cannot be optimized by next/image. */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { ToolWorkspace } from '@/components/ToolWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePathname } from 'next/navigation';
import { Upload, FileImage, Download, FileArchive, CheckCircle, XCircle, PackageOpen, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCopy, getLocaleFromPathname, type Locale } from '@/app/lib/i18n';

interface CompressedFile {
  id: string;
  originalFile: File;
  compressedFile: File | null;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  warning?: string;
}

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  removeMetadata: boolean;
}

const COMPRESS_METADATA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getOutputFileName(fileName: string, mimeType: string) {
  const currentExtension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'image/jpeg' && ['jpg', 'jpeg'].includes(currentExtension)) {
    return fileName;
  }

  const nextExtension = mimeType === 'image/jpeg'
    ? 'jpg'
    : mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : '';

  if (!nextExtension || currentExtension === nextExtension) return fileName;

  return fileName.includes('.')
    ? fileName.replace(/\.[^.]+$/, `.${nextExtension}`)
    : `${fileName}.${nextExtension}`;
}

async function finalizeCompressedFile(sourceFile: File, compressedFile: File, removeMetadata: boolean, locale: Locale) {
  const copy = getCopy(locale).compress.page;
  if (!COMPRESS_METADATA_MIME_TYPES.has(sourceFile.type) || !COMPRESS_METADATA_MIME_TYPES.has(compressedFile.type)) {
    return { file: compressedFile, warning: copy.staticFrameOnly };
  }

  try {
    const metadataEngine = await import('@/app/lib/metadata/exifToolEngine');
    const result = removeMetadata
      ? await metadataEngine.clearMetadata(compressedFile, 'compressed')
      : await metadataEngine.copyWritableMetadata(sourceFile, compressedFile, 'compressed');

    // 元数据清理失败必须阻止下载，不能把未确认清理的文件标记为成功。
    if (!result.success || !result.file) throw new Error(copy.metadataFailed);
    return {
      file: new File([result.file], compressedFile.name, { type: compressedFile.type, lastModified: compressedFile.lastModified }),
      warning: result.failedTags.length ? copy.metadataPartial : undefined,
    };
  } catch {
    throw new Error(copy.metadataFailed);
  }
}

function ObjectUrlImage({
  file,
  alt,
  className
}: {
  file: Blob;
  alt: string;
  className?: string;
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return <img src={url} alt={alt} className={className} />;
}

// 文件上传组件
function FileUploadPanel({
  files,
  onDrop,
  onClear,
  onRemoveFile,
  isProcessing,
  locale
}: {
  files: File[];
  onDrop: (files: File[]) => void;
  onClear: () => void;
  onRemoveFile: (index: number) => void;
  isProcessing: boolean;
  locale: Locale;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const labels = getCopy(locale).compress.fileUpload;

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    multiple: true,
    disabled: isProcessing,
  });

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    if (bytes < 0) return '-' + formatFileSize(-bytes);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 预览图片
  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setPreviewName(file.name);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewName('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 上传区域 */}
      <Card className={`flex-shrink-0 ${files.length > 0 ? 'p-4' : 'p-6'}`}>
        <div className="space-y-4">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{labels.title}</h2>
            </div>
            {files.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {labels.fileCount(files.length)}
                </span>
                <Button variant="ghost" size="sm" onClick={onClear} disabled={isProcessing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 拖拽上传区域 */}
          <div
            {...getRootProps()}
            data-compact={files.length > 0}
            className={cn(
              "upload-dropzone border-2 border-dashed rounded-lg text-center transition-all duration-200 cursor-pointer",
              files.length > 0 ? 'p-4' : 'p-8',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps({ id: 'tool-upload-input' })} />
            <div className={files.length > 0 ? 'space-y-2' : 'space-y-4'}>
              <Upload className={`mx-auto text-muted-foreground ${files.length > 0 ? 'h-6 w-6' : 'h-12 w-12'}`} />
              <div className="space-y-2">
                <p className={`text-muted-foreground ${files.length > 0 ? 'text-xs' : 'text-sm'}`}>
                  {isDragActive
                    ? labels.release
                    : files.length > 0
                      ? labels.addMoreHint
                      : labels.emptyHint
                  }
                </p>
                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {labels.support}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Button variant="outline" size={files.length > 0 ? 'sm' : 'default'} disabled={isProcessing}>
                  <Plus className="h-4 w-4 mr-2" />
                  {files.length > 0 ? labels.addMore : labels.choose}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 文件列表 - 带内置滚动条 */}
      {files.length > 0 && (
        <Card className="flex flex-col max-h-[60vh]">
          <div className="flex-shrink-0 p-4 border-b">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {labels.pending} ({files.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm group hover:bg-muted/70 transition-colors"
                >
                  {/* 缩略图预览 */}
                  <div
                    className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                    onClick={() => handlePreview(file)}
                  >
                    <ObjectUrlImage
                      file={file}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 文件信息 */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePreview(file)}
                  >
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* 删除按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    aria-label={`${getCopy(locale).workspace.removeFile}: ${file.name}`}
                    title={getCopy(locale).workspace.removeFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closePreview}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={previewImage}
              alt={previewName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2 rounded-b-lg text-center truncate">
              {previewName}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={closePreview}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// 压缩控制面板组件
function CompressionControlPanel({
  settings,
  onSettingsChange,
  files,
  results,
  isProcessing,
  progress,
  onStartCompression,
  onDownloadAll,
  isDownloading,
  locale
}: {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  files: File[];
  results: CompressedFile[];
  isProcessing: boolean;
  progress: number;
  onStartCompression: () => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
  locale: Locale;
}) {
  const completedResults = results.filter(r => r.status === 'completed');
  const labels = getCopy(locale).compress.controls;

  return (
    <div className="tool-control-panel">
      <div className="tool-panel-heading"><h2>{labels.settings}</h2></div>
      <div className="tool-control-body space-y-5">
      {/* 压缩设置 */}
      <Card>
        <CardContent className="space-y-4">
          {/* 压缩质量 */}
          <div className="space-y-2">
            <Label className="text-sm">{labels.quality}</Label>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={labels.quality}>
              {(['high', 'medium', 'low'] as const).map((quality) => <Button key={quality}
                variant="outline" disabled={isProcessing} aria-pressed={settings.quality === quality}
                className={cn('h-auto min-h-12 whitespace-normal px-2 text-xs', settings.quality === quality && 'border-primary bg-accent text-primary')}
                onClick={() => onSettingsChange({ ...settings, quality })}>{labels[quality]}</Button>)}
            </div>
          </div>

          {/* 选项开关 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="remove-metadata" className="text-sm">{labels.removeMetadata}</Label>
              <Switch
                id="remove-metadata"
                disabled={isProcessing}
                checked={settings.removeMetadata}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, removeMetadata: checked })
                }
              />
            </div>
          </div>

          {/* 质量预览 */}
          <div className="p-3 bg-muted/30 rounded text-xs">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>JPEG: {
                settings.quality === 'high' ? '95%' :
                  settings.quality === 'medium' ? '85%' : '70%'
              }</div>
              <div>WebP: {
                settings.quality === 'high' ? '92%' :
                  settings.quality === 'medium' ? '80%' : '65%'
              }</div>
              <div>PNG: {labels.lossless}</div>
              <div>{labels.metadata}: {settings.removeMetadata ? labels.remove : labels.keep}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      <div className="tool-action-bar space-y-2">
          <Button
            className="w-full"
            variant={completedResults.length > 0 && !isProcessing ? 'outline' : 'default'}
            size="lg"
            onClick={onStartCompression}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {labels.compressing(progress)}
              </>
            ) : (
              <>
                <PackageOpen className="w-4 h-4 mr-2" />
                {labels.start(files.length)}
              </>
            )}
          </Button>

          {/* 进度条 */}
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        {completedResults.length > 0 && !isProcessing && <Button className="w-full" onClick={onDownloadAll} disabled={isDownloading}>
          <Download className="size-4" />{isDownloading ? getCopy(locale).compress.results.packaging : getCopy(locale).compress.results.downloadAll}
        </Button>}
        <small>{getCopy(locale).workspace.originalSafe}</small>
      </div>
    </div>
  );
}

// 处理结果预览组件
function ResultsPreviewPanel({
  results,
  onDownloadFile,
  locale
}: {
  results: CompressedFile[];
  onDownloadFile: (result: CompressedFile) => void;
  locale: Locale;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const completedResults = results.filter(r => r.status === 'completed');
  const labels = getCopy(locale).compress.results;
  // 汇总沿用按原始字节加权的口径，避免大小不同的文件被等权计算。
  const originalTotal = completedResults.reduce((sum, result) => sum + result.originalSize, 0);
  const compressedTotal = completedResults.reduce((sum, result) => sum + result.compressedSize, 0);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    if (bytes < 0) return '-' + formatFileSize(-bytes);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 预览图片
  const handlePreview = (result: CompressedFile) => {
    // 优先显示压缩后的图片，否则显示原图
    const file = result.compressedFile || result.originalFile;
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setPreviewName(file.name);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewName('');
  };

  // 空状态
  if (results.length === 0) {
    return (
      <div className="tool-empty">
        <div className="text-center p-8">
          <FileArchive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">{labels.waiting}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {labels.waitingDescription}
          </p>
          <Button className="mt-5" onClick={() => document.getElementById('tool-upload-input')?.click()}>
            <Plus className="size-4" />{getCopy(locale).compress.fileUpload.choose}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-preview-shell bg-background">
      <div className="tool-result-stats">
        <div><span>{labels.original}</span><strong>{formatFileSize(originalTotal)}</strong></div>
        <div><span>{labels.compressed}</span><strong>{formatFileSize(compressedTotal)}</strong></div>
        <div><span>{getCopy(locale).compress.controls.ratio}</span><strong className={originalTotal >= compressedTotal ? 'text-primary' : 'text-amber-700'}>{originalTotal ? ((1 - compressedTotal / originalTotal) * 100).toFixed(1) : '0'}%</strong></div>
      </div>
      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {labels.results} ({completedResults.length}/{results.length})
          </h3>
        </div>
      </div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.id}
              className="tool-result-row text-sm group"
            >
              {/* 缩略图 */}
              <div
                className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer relative"
                onClick={() => handlePreview(result)}
              >
                <ObjectUrlImage
                  file={result.compressedFile || result.originalFile}
                  alt={result.originalFile.name}
                  className="w-full h-full object-cover"
                />
                {/* 状态图标覆盖层 */}
                <div className="absolute bottom-0 right-0 p-0.5 bg-background rounded-tl">
                  {result.status === 'completed' && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  {result.status === 'processing' && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* 文件信息 */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handlePreview(result)}
              >
                <p className="font-medium truncate">{result.originalFile.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatFileSize(result.originalSize)}
                    {result.status === 'completed' && (
                      <> → {formatFileSize(result.compressedSize)}</>
                    )}
                  </span>
                  {result.status === 'completed' && (
                    <Badge variant="secondary" className={cn('text-xs', result.compressionRatio >= 0
                      ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300')}>
                      {result.compressionRatio >= 0 ? '-' : '+'}{Math.abs(result.compressionRatio * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {result.error && (
                  <p className="text-xs text-red-600 mt-1">{result.error}</p>
                )}
                {result.warning && (
                  <p className="text-xs text-amber-700 mt-1" role="status">{result.warning}</p>
                )}
              </div>

              {/* 下载按钮 */}
              {result.status === 'completed' && result.compressedFile && (
                <Button size="icon" variant="ghost" title={getCopy(locale).watermarkCanvas.exportTitle} aria-label={`${getCopy(locale).watermarkCanvas.exportTitle}: ${result.originalFile.name}`} onClick={() => onDownloadFile(result)}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closePreview}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={previewImage}
              alt={previewName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2 rounded-b-lg text-center truncate">
              {previewName}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={closePreview}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Compress() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const pageCopy = getCopy(locale).compress.page;
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    removeMetadata: true
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file =>
      file.type.startsWith('image/') &&
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const compressFile = async (file: File): Promise<CompressedFile> => {
    const canvas = document.createElement('canvas');
    const objectUrl = URL.createObjectURL(file);
    const baseResult = {
      id: crypto.randomUUID(),
      originalFile: file,
      originalSize: file.size,
    };

    // 统一捕获解码、编码和元数据失败，确保每个文件结束后都能继续处理队列。
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(pageCopy.imageLoadFailed));
        img.src = objectUrl;
      });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(pageCopy.compressionFailed);
      ctx.drawImage(img, 0, 0);

      const quality = file.type === 'image/jpeg'
        ? { high: 0.95, medium: 0.85, low: 0.7 }[settings.quality]
        : file.type === 'image/webp'
          ? { high: 0.92, medium: 0.8, low: 0.65 }[settings.quality]
          : 1;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((output) => output ? resolve(output) : reject(new Error(pageCopy.compressionFailed)), file.type, quality);
      });
      const outputType = blob.type || file.type;
      const compressedFile = new File([blob], getOutputFileName(file.name, outputType), {
        type: outputType, lastModified: file.lastModified,
      });
      const finalized = await finalizeCompressedFile(file, compressedFile, settings.removeMetadata, locale);
      return {
        ...baseResult, compressedFile: finalized.file, compressedSize: finalized.file.size,
        compressionRatio: 1 - finalized.file.size / file.size, status: 'completed', warning: finalized.warning,
      };
    } catch (error) {
      return {
        ...baseResult, compressedFile: null, compressedSize: 0, compressionRatio: 0, status: 'error',
        error: error instanceof Error ? error.message : pageCopy.compressionFailed,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const startCompression = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const newResults: CompressedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(((i + 0.5) / files.length) * 100);

      const result = await compressFile(file);
      newResults.push(result);
      setResults([...newResults]);

      setProgress(((i + 1) / files.length) * 100);
    }

    setIsProcessing(false);
  };

  const downloadFile = (result: CompressedFile) => {
    if (!result.compressedFile) return;

    const url = URL.createObjectURL(result.compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = async () => {
    const completedFiles = results.filter(r => r.status === 'completed' && r.compressedFile);

    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      downloadFile(completedFiles[0]);
      return;
    }

    setIsDownloading(true);

    try {
      const { zip } = await import('fflate');

      const zipFiles: Record<string, Uint8Array> = {};

      for (const [index, result] of completedFiles.entries()) {
        if (result.compressedFile) {
          const arrayBuffer = await result.compressedFile.arrayBuffer();
          // 与元数据页一致，为同名图片加序号，避免 ZIP 中后一个文件覆盖前一个。
          zipFiles[`${String(index + 1).padStart(2, '0')}_${result.compressedFile.name}`] = new Uint8Array(arrayBuffer);
        }
      }

      zip(zipFiles, (err, data) => {
        if (err) {
          console.error('ZIP 创建失败:', err);
          completedFiles.forEach((file, index) => {
            setTimeout(() => downloadFile(file), index * 500);
          });
        } else {
          const blob = new Blob([data as BlobPart], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `compressed_images_${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setIsDownloading(false);
      });

    } catch (error) {
      console.error('批量下载失败:', error);
      for (let i = 0; i < completedFiles.length; i++) {
        downloadFile(completedFiles[i]);
        if (i < completedFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      setIsDownloading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setResults([]);
    setProgress(0);
  };

  // 删除单个文件
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col min-w-0">
      <h1 className="sr-only">{pageCopy.srTitle}</h1>

      <ToolWorkspace title={getCopy(locale).workspace.compressTitle} fileCount={files.length} locale={locale} busy={isProcessing} panels={[
        {
          id: 'upload', label: pageCopy.uploadTab,
          content: <FileUploadPanel files={files} onDrop={onDrop} onClear={clearFiles}
            onRemoveFile={removeFile} isProcessing={isProcessing} locale={locale} />,
        },
        {
          id: 'preview', label: pageCopy.resultsTab,
          content: <ResultsPreviewPanel results={results} onDownloadFile={downloadFile} locale={locale} />,
        },
        {
          id: 'controls', label: pageCopy.controlsTab,
          content: <CompressionControlPanel settings={settings} onSettingsChange={setSettings}
            files={files} results={results} isProcessing={isProcessing} progress={progress}
            onStartCompression={startCompression} onDownloadAll={downloadAllFiles} isDownloading={isDownloading} locale={locale} />,
        },
      ]} />
      <CompressGeoContent locale={locale} />
    </div>
  );
}

function CompressGeoContent({ locale }: { locale: Locale }) {
  const copy = getCopy(locale).compress.geo;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="border-t bg-muted/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">{copy.heading}</h2>
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground leading-7">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {copy.features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{copy.faqHeading}</h2>
          <div className="divide-y rounded border bg-background">
            {copy.faqs.map((item) => (
              <details key={item.question} className="group p-4">
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-3 text-sm text-muted-foreground leading-6">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
