'use client';

import Image from 'next/image';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ImageInfo } from '@/app/types';
import { useImageStore } from '@/app/lib/stores';
import { formatFileSize } from '@/app/lib/utils/fileValidation';
import { DEFAULT_LOCALE, getCopy, type Locale } from '@/app/lib/i18n';

interface FilePreviewProps {
  image: ImageInfo; isSelected?: boolean; showProgress?: boolean; locale?: Locale;
  onSelect?: (id: string) => void; onRemove?: (id: string) => void;
  onPreview?: (id: string) => void; className?: string;
}

export function FilePreview({ image, isSelected = false, showProgress, locale = DEFAULT_LOCALE,
  onSelect, onRemove, onPreview, className = '' }: FilePreviewProps) {
  const currentId = useImageStore((state) => state.currentImageId);
  const copy = getCopy(locale);
  return (
    <div className={`tool-file-row ${className}`} data-active={currentId === image.id}>
      <input type="checkbox" checked={isSelected} onChange={() => onSelect?.(image.id)} aria-label={image.name} />
      <button className="tool-file-preview" type="button" onClick={() => (onPreview || onSelect)?.(image.id)} aria-pressed={currentId === image.id}>
        <span className="tool-file-thumbnail">
          {image.url ? <Image src={image.url} alt={image.name} fill sizes="48px" className="object-cover" /> : <ImageIcon className="m-3 size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="tool-file-name">{image.name}</span>
          <span className="tool-file-details">{formatFileSize(image.size)} · {image.width} × {image.height}</span>
          {image.status === 'error' && <span className="text-xs text-destructive">{image.error || copy.filePreview.uploadFailed}</span>}
          {showProgress && image.status === 'uploading' && <Progress value={image.uploadProgress} className="mt-2 h-1" />}
          {image.status === 'processing' && <Loader2 className="size-3 animate-spin" aria-label={copy.filePreview.statusText.processing} />}
        </span>
      </button>
      <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onRemove?.(image.id)}
        title={copy.workspace.removeFile} aria-label={`${copy.workspace.removeFile}: ${image.name}`}><X className="size-3.5" /></Button>
    </div>
  );
}

interface FilePreviewListProps {
  images: ImageInfo[]; selectedIds?: string[]; showProgress?: boolean; locale?: Locale;
  onSelect?: (id: string) => void; onSelectMultiple?: (ids: string[]) => void;
  onRemove?: (id: string) => void; onPreview?: (id: string) => void; className?: string;
}

export function FilePreviewList({ images, selectedIds = [], showProgress, locale = DEFAULT_LOCALE,
  onSelect, onSelectMultiple, onRemove, onPreview, className = '' }: FilePreviewListProps) {
  const copy = getCopy(locale).filePreview;
  // 文件预览和勾选各自独立；批量删除仍使用现有 selectedImageIds。
  const toggleSelection = (id: string) => onSelectMultiple
    ? onSelectMultiple(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])
    : onSelect?.(id);
  return (
    <div className={`tool-file-list ${className}`}>
      {images.length > 1 && <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-muted-foreground">
        <label className="flex items-center gap-2"><input type="checkbox" checked={selectedIds.length === images.length}
          onChange={() => onSelectMultiple?.(selectedIds.length === images.length ? [] : images.map((image) => image.id))} />{copy.selectAll}</label>
        <span>{selectedIds.length}/{images.length}</span>
      </div>}
      {images.map((image) => <FilePreview key={image.id} image={image} isSelected={selectedIds.includes(image.id)}
        showProgress={showProgress} onSelect={toggleSelection} onRemove={onRemove} onPreview={onPreview} locale={locale} />)}
    </div>
  );
}
