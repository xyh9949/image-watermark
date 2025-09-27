'use client';

import { useCompressStore } from '@/app/lib/stores/compressStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export function ProcessingStatus() {
  const { isProcessing, progress, currentFile, results } = useCompressStore();

  if (!isProcessing && results.length === 0) return null;

  const completedCount = results.filter(r => r.status === 'completed').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const processingCount = results.filter(r => r.status === 'processing').length;
  const totalCount = results.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {isProcessing ? '正在处理' : '处理完成'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>总体进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current File */}
        {isProcessing && currentFile && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm">
              正在处理: <span className="font-medium">{currentFile}</span>
            </span>
          </div>
        )}

        {/* Status Summary */}
        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {completedCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                已完成 {completedCount}
              </Badge>
            )}
            
            {processingCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                处理中 {processingCount}
              </Badge>
            )}
            
            {errorCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                失败 {errorCount}
              </Badge>
            )}
          </div>
        )}

        {/* Processing Details */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {result.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  {result.status === 'processing' && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {result.status === 'pending' && (
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  
                  <span className="truncate">{result.originalFile.name}</span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {result.status === 'completed' && (
                    <Badge variant="outline" className="text-xs">
                      -{(result.compressionRatio * 100).toFixed(1)}%
                    </Badge>
                  )}
                  {result.status === 'error' && result.error && (
                    <span className="text-xs text-red-600 max-w-32 truncate">
                      {result.error}
                    </span>
                  )}
                  {result.processingTime && (
                    <span className="text-xs text-muted-foreground">
                      {result.processingTime}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}