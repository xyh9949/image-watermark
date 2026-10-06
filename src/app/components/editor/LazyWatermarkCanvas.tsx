'use client';

import dynamic from 'next/dynamic';
import { Plus, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="tool-empty">
      <Upload aria-hidden="true" />
      <h2>{getCopy(locale).workspace.chooseFirst}</h2>
      <p>{getCopy(locale).workspace.emptySupport}</p>
      <Button onClick={() => document.getElementById('tool-upload-input')?.click()}>
        <Plus className="size-4" />{getCopy(locale).upload.choose}
      </Button>
      <p>{getCopy(locale).workspace.local}</p>
    </div>
  );
}
