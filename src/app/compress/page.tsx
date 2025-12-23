'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TopNavigation } from '@/components/TopNavigation';
import { Upload, FileImage, Download, FileArchive, CheckCircle, XCircle, PackageOpen, Settings, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompressedFile {
  id: string;
  originalFile: File;
  compressedFile: File | null;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  removeMetadata: boolean;
  preserveFormat: boolean;
}

// 文件上传组件
function FileUploadPanel({
  files,
  onDrop,
  onClear,
  onRemoveFile,
  isProcessing
}: {
  files: File[];
  onDrop: (files: File[]) => void;
  onClear: () => void;
  onRemoveFile: (index: number) => void;
  isProcessing: boolean;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    multiple: true
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
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
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
              <h2 className="text-lg font-semibold">文件上传</h2>
            </div>
            {files.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {files.length} 个文件
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
            className={cn(
              "border-2 border-dashed rounded-lg text-center transition-all duration-200 cursor-pointer",
              files.length > 0 ? 'p-4' : 'p-8',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />
            <div className={files.length > 0 ? 'space-y-2' : 'space-y-4'}>
              <Upload className={`mx-auto text-muted-foreground ${files.length > 0 ? 'h-6 w-6' : 'h-12 w-12'}`} />
              <div className="space-y-2">
                <p className={`text-muted-foreground ${files.length > 0 ? 'text-xs' : 'text-sm'}`}>
                  {isDragActive
                    ? '释放文件开始上传'
                    : files.length > 0
                      ? '拖拽或点击添加更多文件'
                      : '拖拽图片到此处或点击上传'
                  }
                </p>
                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    支持 JPEG、PNG、WebP、GIF 格式
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Button variant="outline" size={files.length > 0 ? 'sm' : 'default'} disabled={isProcessing}>
                  <Plus className="h-4 w-4 mr-2" />
                  {files.length > 0 ? '添加更多' : '选择文件'}
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
              待处理文件 ({files.length})
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
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        // 清理 blob URL，避免内存泄漏
                        URL.revokeObjectURL((e.target as HTMLImageElement).src);
                      }}
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
  onStartCompression
}: {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  files: File[];
  results: CompressedFile[];
  isProcessing: boolean;
  progress: number;
  onStartCompression: () => void;
}) {
  const completedResults = results.filter(r => r.status === 'completed');
  const totalSaved = completedResults.reduce((sum, r) => sum + (r.originalSize - r.compressedSize), 0);
  const averageCompression = completedResults.length > 0
    ? completedResults.reduce((sum, r) => sum + r.compressionRatio, 0) / completedResults.length
    : 0;

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    if (bytes < 0) return '-' + formatFileSize(-bytes);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 压缩设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            压缩设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 压缩质量 */}
          <div className="space-y-2">
            <Label className="text-sm">压缩质量</Label>
            <Select
              value={settings.quality}
              onValueChange={(value: 'high' | 'medium' | 'low') =>
                onSettingsChange({ ...settings, quality: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">高质量 (95%)</SelectItem>
                <SelectItem value="medium">中等质量 (85%)</SelectItem>
                <SelectItem value="low">高压缩 (70%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 选项开关 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="remove-metadata" className="text-sm">移除元数据</Label>
              <Switch
                id="remove-metadata"
                checked={settings.removeMetadata}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, removeMetadata: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-format" className="text-sm">保持原格式</Label>
              <Switch
                id="preserve-format"
                checked={settings.preserveFormat}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, preserveFormat: checked })
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
              <div>PNG: 无损</div>
              <div>元数据: {settings.removeMetadata ? '移除' : '保留'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardContent className="pt-6">
          <Button
            className="w-full"
            size="lg"
            onClick={onStartCompression}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                压缩中... {Math.round(progress)}%
              </>
            ) : (
              <>
                <PackageOpen className="w-4 h-4 mr-2" />
                开始压缩 ({files.length} 个文件)
              </>
            )}
          </Button>

          {/* 进度条 */}
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 压缩统计 */}
      {completedResults.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">压缩统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                <div className="text-base font-bold text-green-600 dark:text-green-400">
                  {(averageCompression * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">压缩率</div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {formatFileSize(totalSaved)}
                </div>
                <div className="text-xs text-muted-foreground">节省</div>
              </div>
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                  {completedResults.length}
                </div>
                <div className="text-xs text-muted-foreground">完成</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 处理结果预览组件
function ResultsPreviewPanel({
  results,
  isDownloading,
  onDownloadFile,
  onDownloadAll
}: {
  results: CompressedFile[];
  isDownloading: boolean;
  onDownloadFile: (result: CompressedFile) => void;
  onDownloadAll: () => void;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const completedResults = results.filter(r => r.status === 'completed');

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
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setPreviewName('');
  };

  // 空状态
  if (results.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <FileArchive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">等待处理</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            上传图片文件后点击"开始压缩"，压缩结果将显示在这里
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            处理结果 ({completedResults.length}/{results.length})
          </h3>
          {completedResults.length > 0 && (
            <Button
              onClick={onDownloadAll}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  打包中...
                </>
              ) : (
                <>
                  <PackageOpen className="w-4 h-4 mr-2" />
                  下载全部
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 p-2 bg-muted/30 border rounded-lg text-sm group hover:bg-muted/50 transition-colors"
            >
              {/* 缩略图 */}
              <div
                className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer relative"
                onClick={() => handlePreview(result)}
              >
                <img
                  src={URL.createObjectURL(result.compressedFile || result.originalFile)}
                  alt={result.originalFile.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    URL.revokeObjectURL((e.target as HTMLImageElement).src);
                  }}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatFileSize(result.originalSize)}
                    {result.status === 'completed' && (
                      <> → {formatFileSize(result.compressedSize)}</>
                    )}
                  </span>
                  {result.status === 'completed' && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                      -{(result.compressionRatio * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {result.error && (
                  <p className="text-xs text-red-600 mt-1">{result.error}</p>
                )}
              </div>

              {/* 下载按钮 */}
              {result.status === 'completed' && result.compressedFile && (
                <Button size="sm" variant="outline" onClick={() => onDownloadFile(result)}>
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
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    removeMetadata: true,
    preserveFormat: true
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file =>
      file.type.startsWith('image/') &&
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const compressFile = async (file: File): Promise<CompressedFile> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        let quality = 0.9;
        const outputType = file.type;

        if (file.type === 'image/png') {
          quality = 1.0;
        } else if (file.type === 'image/jpeg') {
          switch (settings.quality) {
            case 'high': quality = 0.95; break;
            case 'medium': quality = 0.85; break;
            case 'low': quality = 0.7; break;
          }
        } else if (file.type === 'image/webp') {
          switch (settings.quality) {
            case 'high': quality = 0.92; break;
            case 'medium': quality = 0.8; break;
            case 'low': quality = 0.65; break;
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: file.lastModified
              });

              const compressionRatio = 1 - (blob.size / file.size);

              resolve({
                id: `${file.name}_${Date.now()}`,
                originalFile: file,
                compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio,
                status: 'completed'
              });
            } else {
              resolve({
                id: `${file.name}_${Date.now()}`,
                originalFile: file,
                compressedFile: null,
                originalSize: file.size,
                compressedSize: 0,
                compressionRatio: 0,
                status: 'error',
                error: '压缩失败'
              });
            }
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          id: `${file.name}_${Date.now()}`,
          originalFile: file,
          compressedFile: null,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          status: 'error',
          error: '图片加载失败'
        });
      };

      img.src = URL.createObjectURL(file);
    });
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

      for (const result of completedFiles) {
        if (result.compressedFile) {
          const arrayBuffer = await result.compressedFile.arrayBuffer();
          zipFiles[result.compressedFile.name] = new Uint8Array(arrayBuffer);
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
    <div className="min-h-dvh flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <TopNavigation />

      {/* 移动端：垂直布局 */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">批量图片压缩</h1>
            <p className="text-sm text-muted-foreground">
              专业的图片压缩工具，支持多种格式
            </p>
          </div>
        </div>

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="upload" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 m-4">
              <TabsTrigger value="upload">上传</TabsTrigger>
              <TabsTrigger value="preview">结果</TabsTrigger>
              <TabsTrigger value="controls">控制</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1 overflow-auto p-4">
              <FileUploadPanel
                files={files}
                onDrop={onDrop}
                onClear={clearFiles}
                onRemoveFile={removeFile}
                isProcessing={isProcessing}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-auto">
              <ResultsPreviewPanel
                results={results}
                isDownloading={isDownloading}
                onDownloadFile={downloadFile}
                onDownloadAll={downloadAllFiles}
              />
            </TabsContent>

            <TabsContent value="controls" className="flex-1 overflow-auto p-4">
              <CompressionControlPanel
                settings={settings}
                onSettingsChange={setSettings}
                files={files}
                results={results}
                isProcessing={isProcessing}
                progress={progress}
                onStartCompression={startCompression}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 桌面端：固定三栏布局 */}
      <div className="hidden lg:flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">批量图片压缩</h1>
            <p className="text-sm text-muted-foreground">
              专业的图片压缩工具，支持 JPEG、PNG、WebP、GIF 格式
            </p>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：文件上传区域 - 使用3/12的比例 */}
          <div className="flex-[3] min-w-0 border-r bg-background">
            <div className="h-full overflow-auto">
              <div className="p-4">
                <FileUploadPanel
                  files={files}
                  onDrop={onDrop}
                  onClear={clearFiles}
                  onRemoveFile={removeFile}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* 中间：结果预览区域 - 使用6/12的比例 */}
          <div className="flex-[6] min-w-0 overflow-hidden bg-muted/20">
            <ResultsPreviewPanel
              results={results}
              isDownloading={isDownloading}
              onDownloadFile={downloadFile}
              onDownloadAll={downloadAllFiles}
            />
          </div>

          {/* 右侧：控制面板 - 使用3/12的比例 */}
          <div className="flex-[3] min-w-0 border-l bg-background">
            <div className="h-full overflow-auto">
              <div className="p-4">
                <CompressionControlPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                  files={files}
                  results={results}
                  isProcessing={isProcessing}
                  progress={progress}
                  onStartCompression={startCompression}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
