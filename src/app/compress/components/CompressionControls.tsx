'use client';

import { useState, useEffect } from 'react';
import { useCompressStore } from '@/app/lib/stores/compressStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Info, Settings2 } from 'lucide-react';
import { OptimizationInfo } from '@/app/types/compress';

export function CompressionControls() {
  const {
    files,
    options,
    isProcessing,
    setOptions,
    startBatchCompression,
    engine
  } = useCompressStore();

  const [optimizationInfos, setOptimizationInfos] = useState<Map<string, OptimizationInfo>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 分析文件优化潜力
  useEffect(() => {
    const analyzeFiles = async () => {
      if (files.length === 0) return;
      
      setIsAnalyzing(true);
      const infos = new Map<string, OptimizationInfo>();
      
      for (const file of files) {
        try {
          const info = await engine.getOptimizationInfo(file);
          infos.set(file.name, info);
        } catch (error) {
          console.error(`分析文件 ${file.name} 失败:`, error);
        }
      }
      
      setOptimizationInfos(infos);
      setIsAnalyzing(false);
    };

    analyzeFiles();
  }, [files, engine]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalEstimatedSaving = files.reduce((total, file) => {
    const info = optimizationInfos.get(file.name);
    return total + (info ? file.size * info.estimatedSaving : 0);
  }, 0);

  const averageCompressionRatio = files.length > 0 
    ? Array.from(optimizationInfos.values()).reduce((sum, info) => sum + info.estimatedSaving, 0) / files.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Compression Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            压缩设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quality Level */}
          <div className="space-y-3">
            <Label htmlFor="quality">压缩级别</Label>
            <Select
              value={options.quality}
              onValueChange={(value: 'light' | 'standard' | 'deep') => 
                setOptions({ quality: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">轻度</Badge>
                    <span>仅移除冗余数据，最快速度</span>
                  </div>
                </SelectItem>
                <SelectItem value="standard">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">标准</Badge>
                    <span>平衡压缩比和处理时间</span>
                  </div>
                </SelectItem>
                <SelectItem value="deep">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">深度</Badge>
                    <span>最大化压缩比，处理时间较长</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metadata Options */}
          <div className="space-y-4">
            <Label>元数据处理</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="remove-metadata">移除元数据</Label>
                <p className="text-sm text-muted-foreground">
                  移除 EXIF、XMP 等非必要信息以减小文件大小
                </p>
              </div>
              <Switch
                id="remove-metadata"
                checked={options.removeMetadata}
                onCheckedChange={(checked) => setOptions({ removeMetadata: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="preserve-exif">保留 EXIF 信息</Label>
                <p className="text-sm text-muted-foreground">
                  保留拍摄参数、GPS 等 EXIF 信息
                </p>
              </div>
              <Switch
                id="preserve-exif"
                checked={options.preserveExif}
                onCheckedChange={(checked) => setOptions({ preserveExif: checked })}
                disabled={options.removeMetadata}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="preserve-color-profile">保留色彩配置文件</Label>
                <p className="text-sm text-muted-foreground">
                  保留 ICC 色彩配置文件以确保颜色准确性
                </p>
              </div>
              <Switch
                id="preserve-color-profile"
                checked={options.preserveColorProfile}
                onCheckedChange={(checked) => setOptions({ preserveColorProfile: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Preview */}
      {!isAnalyzing && optimizationInfos.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              优化预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(averageCompressionRatio * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">平均压缩率</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatFileSize(totalEstimatedSaving)}
                </div>
                <div className="text-sm text-muted-foreground">预计节省空间</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {files.length}
                </div>
                <div className="text-sm text-muted-foreground">待处理文件</div>
              </div>
            </div>

            {/* File-specific optimization info */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => {
                const info = optimizationInfos.get(file.name);
                if (!info || !info.canOptimize) return null;

                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      {info.warnings.length > 0 && (
                        <p className="text-xs text-amber-600">
                          {info.warnings[0]}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      -{(info.estimatedSaving * 100).toFixed(1)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => startBatchCompression(false)}
          disabled={isProcessing || files.length === 0}
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          开始压缩
        </Button>
        
        <Button
          variant="outline"
          onClick={() => startBatchCompression(true)}
          disabled={isProcessing || files.length === 0}
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          并行压缩 (更快)
        </Button>
      </div>

      {isAnalyzing && (
        <div className="text-center text-sm text-muted-foreground">
          正在分析文件优化潜力...
        </div>
      )}
    </div>
  );
}