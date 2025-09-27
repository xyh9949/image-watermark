'use client';

import React, { useState } from 'react';
import { useCompressStore } from '@/app/lib/stores/compressStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  FileImage,
  ArrowDown,
  ArrowUp,
  Maximize2
} from 'lucide-react';
import { CompressedImage } from '@/app/types/compress';

export function ResultsList() {
  const { results, downloadResult } = useCompressStore();
  const [selectedImage, setSelectedImage] = useState<CompressedImage | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'ratio'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.originalFile.name.localeCompare(b.originalFile.name);
        break;
      case 'size':
        comparison = a.originalSize - b.originalSize;
        break;
      case 'ratio':
        comparison = a.compressionRatio - b.compressionRatio;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'name' | 'size' | 'ratio') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, children }: { field: 'name' | 'size' | 'ratio', children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleSort(field)}
      className="h-auto p-1 font-medium"
    >
      {children}
      {sortBy === field && (
        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
      )}
    </Button>
  );

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">还没有处理结果</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>处理结果</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sort Controls */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-muted-foreground">排序:</span>
            <SortButton field="name">文件名</SortButton>
            <SortButton field="size">文件大小</SortButton>
            <SortButton field="ratio">压缩率</SortButton>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {sortedResults.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {result.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {result.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{result.originalFile.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {result.format}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {formatFileSize(result.originalSize)}
                      {result.status === 'completed' && result.compressedFile && (
                        <> → {formatFileSize(result.compressedSize)}</>
                      )}
                    </span>
                    
                    {result.status === 'completed' && (
                      <Badge 
                        variant="secondary" 
                        className={
                          result.compressionRatio > 0.2 ? 'bg-green-100 text-green-800' :
                          result.compressionRatio > 0.1 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        -{(result.compressionRatio * 100).toFixed(1)}%
                      </Badge>
                    )}
                    
                    {result.processingTime && (
                      <span>{result.processingTime}ms</span>
                    )}
                  </div>
                  
                  {result.status === 'error' && result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                </div>

                {/* Actions */}
                {result.status === 'completed' && result.compressedFile && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(result)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Maximize2 className="w-4 h-4" />
                            图片对比预览
                          </DialogTitle>
                        </DialogHeader>
                        <ImageComparisonDialog result={result} />
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      onClick={() => downloadResult(result)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImageComparisonDialog({ result }: { result: CompressedImage }) {
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [compressedUrl, setCompressedUrl] = useState<string>('');

  React.useEffect(() => {
    const originalObjectUrl = URL.createObjectURL(result.originalFile);
    setOriginalUrl(originalObjectUrl);

    let compressedObjectUrl: string | undefined;
    if (result.compressedFile) {
      compressedObjectUrl = URL.createObjectURL(result.compressedFile);
      setCompressedUrl(compressedObjectUrl);
    }

    return () => {
      URL.revokeObjectURL(originalObjectUrl);
      if (compressedObjectUrl) {
        URL.revokeObjectURL(compressedObjectUrl);
      }
    };
  }, [result.originalFile, result.compressedFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Comparison Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {formatFileSize(result.originalSize)}
          </div>
          <div className="text-sm text-muted-foreground">原始大小</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            -{(result.compressionRatio * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">压缩率</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {formatFileSize(result.compressedSize)}
          </div>
          <div className="text-sm text-muted-foreground">压缩后大小</div>
        </div>
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-center">原始图片</h4>
          <div className="border rounded-lg overflow-hidden">
            <img
              src={originalUrl}
              alt="原始图片"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-center">压缩后图片</h4>
          <div className="border rounded-lg overflow-hidden">
            <img
              src={compressedUrl}
              alt="压缩后图片"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}