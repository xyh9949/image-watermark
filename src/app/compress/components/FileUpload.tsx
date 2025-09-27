'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCompressStore } from '@/app/lib/stores/compressStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FileUpload() {
  const { files, addFiles, removeFile, engine } = useCompressStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 过滤支持的文件格式
    const supportedFiles = acceptedFiles.filter(file => engine.isSupported(file));
    const unsupportedFiles = acceptedFiles.filter(file => !engine.isSupported(file));
    
    if (unsupportedFiles.length > 0) {
      console.warn('不支持的文件格式:', unsupportedFiles.map(f => f.name));
    }
    
    if (supportedFiles.length > 0) {
      addFiles(supportedFiles);
    }
  }, [addFiles, engine]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif']
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

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium">释放文件开始上传</p>
                <p className="text-sm text-muted-foreground mt-2">
                  支持批量上传多个图片文件
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  拖拽图片文件到此处，或点击选择文件
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  支持 JPEG、PNG、WebP、GIF、BMP、TIFF 格式
                </p>
                <Button variant="outline">
                  选择文件
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium">支持的格式</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>• JPEG/JPG - 无损重编码</div>
                <div>• PNG - 调色板优化</div>
                <div>• WebP - 压缩参数优化</div>
                <div>• GIF - LZW 压缩优化</div>
                <div>• BMP - 编码优化</div>
                <div>• TIFF - 压缩算法优化</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                已选择文件 ({files.length})
              </h3>
              <div className="text-sm text-muted-foreground">
                总大小: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <FileImage className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}