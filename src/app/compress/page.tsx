'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TopNavigation } from '@/components/TopNavigation';
import { Upload, FileImage, Download, FileArchive, CheckCircle, XCircle, PackageOpen } from 'lucide-react';
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

export default function Compress() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file =>
      file.type.startsWith('image/') &&
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        let outputType = file.type;

        if (file.type === 'image/png') {
          quality = 1.0;
        } else if (file.type === 'image/jpeg') {
          quality = 0.92;
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

      const files: Record<string, Uint8Array> = {};

      for (const result of completedFiles) {
        if (result.compressedFile) {
          const arrayBuffer = await result.compressedFile.arrayBuffer();
          files[result.compressedFile.name] = new Uint8Array(arrayBuffer);
        }
      }

      zip(files, (err, data) => {
        if (err) {
          console.error('ZIP 创建失败:', err);
          completedFiles.forEach((file, index) => {
            setTimeout(() => downloadFile(file), index * 500);
          });
        } else {
          const blob = new Blob([data], { type: 'application/zip' });
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

  const completedResults = results.filter(r => r.status === 'completed');
  const totalSaved = completedResults.reduce((sum, r) => sum + (r.originalSize - r.compressedSize), 0);
  const averageCompression = completedResults.length > 0
    ? completedResults.reduce((sum, r) => sum + r.compressionRatio, 0) / completedResults.length
    : 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Page Header */}
      <div className="flex-shrink-0 p-4 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-1">批量图片压缩工具</h1>
          <p className="text-sm text-muted-foreground">
            专业的无损图片压缩工具，支持 JPEG、PNG、WebP 等格式
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full p-4">
          {/* Processing Progress */}
          {isProcessing && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>压缩进度</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

            {/* Left Panel - Upload & Controls */}
            <div className="space-y-4">
              {/* File Upload */}
              <Card className="h-[200px]">
                <CardContent className="p-4 h-full">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors h-full flex flex-col justify-center",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />

                    {isDragActive ? (
                      <div>
                        <p className="font-medium">释放文件开始上传</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持批量上传多个图片文件
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-2">
                          拖拽图片文件到此处，或点击选择文件
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          支持 JPEG、PNG、WebP、GIF 格式
                        </p>
                        <Button variant="outline" size="sm">
                          选择文件
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File List */}
              {files.length > 0 && (
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">已选择文件 ({files.length})</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearFiles} disabled={isProcessing}>
                          清空
                        </Button>
                        <Button size="sm" onClick={startCompression} disabled={isProcessing || files.length === 0}>
                          {isProcessing ? '压缩中...' : '开始压缩'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm">
                          <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}


            </div>

            {/* Right Panel - Results */}
            <div className="space-y-4">
              {/* Statistics & Download */}
              {completedResults.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">压缩统计</CardTitle>
                      <Button
                        onClick={downloadAllFiles}
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
                            下载全部 ({completedResults.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {(averageCompression * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">平均压缩率</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {formatFileSize(totalSaved)}
                        </div>
                        <div className="text-xs text-muted-foreground">节省空间</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">
                          {completedResults.length}
                        </div>
                        <div className="text-xs text-muted-foreground">成功处理</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results List */}
              {results.length > 0 && (
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">处理结果</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {results.map((result) => (
                        <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                          <div className="flex-shrink-0">
                            {result.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {result.status === 'error' && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            {result.status === 'processing' && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.originalFile.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {formatFileSize(result.originalSize)}
                                {result.status === 'completed' && (
                                  <> → {formatFileSize(result.compressedSize)}</>
                                )}
                              </span>
                              {result.status === 'completed' && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  -{(result.compressionRatio * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                            {result.error && (
                              <p className="text-xs text-red-600">{result.error}</p>
                            )}
                          </div>

                          {result.status === 'completed' && result.compressedFile && (
                            <Button size="sm" variant="outline" onClick={() => downloadFile(result)}>
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {results.length === 0 && files.length === 0 && (
                <Card className="h-[200px]">
                  <CardContent className="p-4 h-full">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center h-full flex flex-col justify-center">
                      <FileArchive className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium mb-2">还没有上传文件</p>
                        <p className="text-xs text-muted-foreground">
                          上传图片文件开始压缩
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}