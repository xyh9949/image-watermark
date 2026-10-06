'use client';

import dynamic from 'next/dynamic';
import { Eye, Loader2 } from 'lucide-react';
import { useImageStore } from '@/app/lib/stores';
import { getCopy, type Locale } from '@/app/lib/i18n';

const Editor = dynamic(() => import('./WatermarkCanvas').then((module) => module.WatermarkCanvas), {
  ssr: false,
  loading: () => <div className="min-h-96 grid place-items-center" aria-busy="true"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});

export function LazyWatermarkCanvas({ locale }: { locale: Locale }) {
  const hasImage = useImageStore((state) => state.images.some((image) => image.id === state.currentImageId));

  // 用户选择图片后才下载 Fabric，空白首页无需初始化画布。
  if (hasImage) return <Editor locale={locale} />;

  return (
    <div className="min-h-96 grid place-items-center text-center text-muted-foreground">
      <div>
        <Eye className="h-16 w-16 mx-auto mb-4" />
        <p>{getCopy(locale).watermarkCanvas.selectImage}</p>
      </div>
    </div>
  );
}
