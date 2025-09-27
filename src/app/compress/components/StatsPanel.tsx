'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  FileImage, 
  HardDrive, 
  Clock, 
  TrendingDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CompressionStats } from '@/app/types/compress';

interface StatsPanelProps {
  stats: CompressionStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const successRate = stats.totalFiles > 0 ? (stats.processedFiles / stats.totalFiles) * 100 : 0;
  const failureRate = 100 - successRate;
  const averageFileSize = stats.processedFiles > 0 ? stats.totalOriginalSize / stats.processedFiles : 0;
  const averageProcessingTime = stats.processedFiles > 0 ? stats.processingTime / stats.processedFiles : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileImage className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">总文件数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.processedFiles}</div>
                <div className="text-sm text-muted-foreground">成功处理</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(stats.averageCompressionRatio * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">平均压缩率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatTime(stats.processingTime)}
                </div>
                <div className="text-sm text-muted-foreground">总处理时间</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Size Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              存储空间统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">原始总大小</span>
                <span className="text-sm">{formatFileSize(stats.totalOriginalSize)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">压缩后总大小</span>
                <span className="text-sm">{formatFileSize(stats.totalCompressedSize)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">节省空间</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatFileSize(stats.totalSavedSize)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">平均文件大小</span>
                <span className="text-sm">{formatFileSize(averageFileSize)}</span>
              </div>
            </div>

            {/* Compression Ratio Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>压缩效果</span>
                <span>{(stats.averageCompressionRatio * 100).toFixed(1)}% 减少</span>
              </div>
              <Progress 
                value={stats.averageCompressionRatio * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              处理统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">成功率</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {successRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              {failureRate > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">失败率</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {failureRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">平均处理时间</span>
                <span className="text-sm">{formatTime(averageProcessingTime)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">处理速度</span>
                <span className="text-sm">
                  {stats.processingTime > 0 
                    ? `${(stats.processedFiles / (stats.processingTime / 1000)).toFixed(1)} 文件/秒`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            {/* Success Rate Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>处理成功率</span>
                <span>{stats.processedFiles}/{stats.totalFiles}</span>
              </div>
              <Progress 
                value={successRate} 
                className="h-2"
              />
            </div>

            {/* Performance Metrics */}
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatFileSize(stats.totalOriginalSize / (stats.processingTime / 1000))}
                  </div>
                  <div className="text-xs text-muted-foreground">处理吞吐量/秒</div>
                </div>
                
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatFileSize(stats.totalSavedSize / (stats.processingTime / 1000))}
                  </div>
                  <div className="text-xs text-muted-foreground">节省空间/秒</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>处理摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p>
              本次批量压缩处理了 <strong>{stats.totalFiles}</strong> 个文件，
              其中 <strong>{stats.processedFiles}</strong> 个成功处理。
              总共节省了 <strong>{formatFileSize(stats.totalSavedSize)}</strong> 的存储空间，
              平均压缩率达到 <strong>{(stats.averageCompressionRatio * 100).toFixed(1)}%</strong>。
            </p>
            
            <p>
              整个处理过程耗时 <strong>{formatTime(stats.processingTime)}</strong>，
              平均每个文件处理时间为 <strong>{formatTime(averageProcessingTime)}</strong>。
            </p>
            
            {stats.averageCompressionRatio > 0.2 && (
              <p className="text-green-600">
                🎉 压缩效果非常好！节省了超过 20% 的存储空间。
              </p>
            )}
            
            {stats.averageCompressionRatio > 0.1 && stats.averageCompressionRatio <= 0.2 && (
              <p className="text-blue-600">
                👍 压缩效果良好，节省了 10-20% 的存储空间。
              </p>
            )}
            
            {stats.averageCompressionRatio <= 0.1 && (
              <p className="text-orange-600">
                💡 压缩效果有限，可能这些图片已经经过了较好的优化。
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}