// 文件预览组件

'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle,
  Clock,
  FileImage
} from 'lucide-react';
import { ImageInfo } from '@/app/types';
import { formatFileSize } from '@/app/lib/utils/fileValidation';

interface FilePreviewProps {
  image: ImageInfo;
  isSelected?: boolean;
  showProgress?: boolean;
  onSelect?: (imageId: string) => void;
  onRemove?: (imageId: string) => void;
  onPreview?: (imageId: string) => void;
  className?: string;
}

// 状态图标映射
const StatusIcon = {
  uploading: Clock,
  uploaded: CheckCircle,
  processing: Clock,
  completed: CheckCircle,
  error: AlertCircle,
};

// 状态颜色映射
const StatusColor = {
  uploading: 'bg-blue-500',
  uploaded: 'bg-green-500',
  processing: 'bg-yellow-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
};

// 状态文本映射
const StatusText = {
  uploading: '上传中',
  uploaded: '已上传',
  processing: '处理中',
  completed: '已完成',
  error: '错误',
};

export function FilePreview({
  image,
  isSelected = false,
  showProgress = false,
  onSelect,
  onRemove,
  onPreview,
  className = ''
}: FilePreviewProps) {
  const StatusIconComponent = StatusIcon[image.status];
  
  const handleSelect = () => {
    onSelect?.(image.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(image.id);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(image.id);
  };

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-md'}
        ${className}
      `}
      onClick={handleSelect}
    >
      {/* 图片预览区域 */}
      <div className="relative aspect-square bg-muted">
        {image.url ? (
          <Image
            src={image.url}
            alt={image.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileImage className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {/* 状态覆盖层 */}
        {(image.status === 'uploading' || image.status === 'processing') && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <StatusIconComponent className="h-6 w-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">{StatusText[image.status]}</p>
            </div>
          </div>
        )}
        
        {/* 错误覆盖层 */}
        {image.status === 'error' && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-red-700">上传失败</p>
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {image.status === 'uploaded' && (
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
              onClick={handlePreview}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="h-6 w-6 p-0 bg-red-500/80 hover:bg-red-500"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* 选中指示器 */}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
      
      {/* 文件信息 */}
      <div className="p-3 space-y-2">
        {/* 文件名 */}
        <div className="space-y-1">
          <p className="text-sm font-medium truncate" title={image.name}>
            {image.name}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(image.size)}</span>
            <span>{image.width} × {image.height}</span>
          </div>
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`text-xs ${StatusColor[image.status]} text-white`}
          >
            <StatusIconComponent className="h-3 w-3 mr-1" />
            {StatusText[image.status]}
          </Badge>
          
          {image.status === 'uploaded' && (
            <Button size="sm" variant="ghost" className="h-6 text-xs">
              <Download className="h-3 w-3 mr-1" />
              下载
            </Button>
          )}
        </div>
        
        {/* 进度条 */}
        {showProgress && (image.status === 'uploading' || image.status === 'processing') && (
          <div className="space-y-1">
            <Progress value={image.uploadProgress} className="h-1" />
            <p className="text-xs text-muted-foreground text-center">
              {image.uploadProgress}%
            </p>
          </div>
        )}
        
        {/* 错误信息 */}
        {image.status === 'error' && image.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {image.error}
          </div>
        )}
      </div>
    </Card>
  );
}

// 文件预览列表组件
interface FilePreviewListProps {
  images: ImageInfo[];
  selectedIds?: string[];
  showProgress?: boolean;
  onSelect?: (imageId: string) => void;
  onSelectMultiple?: (imageIds: string[]) => void;
  onRemove?: (imageId: string) => void;
  onPreview?: (imageId: string) => void;
  className?: string;
}

export function FilePreviewList({
  images,
  selectedIds = [],
  showProgress = false,
  onSelect,
  onSelectMultiple,
  onRemove,
  onPreview,
  className = ''
}: FilePreviewListProps) {
  const handleSelectAll = () => {
    const allIds = images.map(img => img.id);
    onSelectMultiple?.(selectedIds.length === images.length ? [] : allIds);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileImage className="h-12 w-12 mx-auto mb-2" />
        <p>暂无图片</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 批量操作 */}
      {images.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedIds.length === images.length ? '取消全选' : '全选'}
          </Button>
          <span className="text-sm text-muted-foreground">
            已选择 {selectedIds.length} / {images.length} 张图片
          </span>
        </div>
      )}
      
      {/* 图片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {images.map((image) => (
          <FilePreview
            key={image.id}
            image={image}
            isSelected={selectedIds.includes(image.id)}
            showProgress={showProgress}
            onSelect={onSelect}
            onRemove={onRemove}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}
