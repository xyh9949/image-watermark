import { getCopy, type Locale } from '@/app/lib/i18n';

export interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  removeMetadata: boolean;
}

export interface CodecRequest {
  file: File;
  quality: CompressionSettings['quality'];
}

export type CodecResult = { kind: 'encoded'; bytes: ArrayBuffer }
  | { kind: 'invalid' } | { kind: 'animation' } | { kind: 'fallback' };

// 每批串行复用一个 Worker，按格式懒加载 WASM，批次结束释放编码器内存。
export function createImageCompressor(locale: Locale) {
  const copy = getCopy(locale).compress.page;
  let worker: Worker | undefined;

  const dispose = () => {
    worker?.terminate();
    worker = undefined;
  };

  const encode = (request: CodecRequest) => new Promise<CodecResult>((resolve, reject) => {
    worker ??= new Worker(new URL('./compression.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<CodecResult>) => resolve(event.data);
    worker.onerror = worker.onmessageerror = () => {
      dispose();
      reject(new Error(copy.compressionFailed));
    };
    worker.postMessage(request);
  });

  async function compress(original: File, settings: CompressionSettings) {
    const outputs = { type: original.type, lastModified: original.lastModified };
    let originalEncoding = original;
    if (settings.removeMetadata) {
      const { stripCompressionMetadata } = await import('@/app/lib/metadata/exifToolEngine');
      const result = await stripCompressionMetadata(original);
      // 清理失败时禁止将带有隐私信息的原件作为回退结果提供下载。
      if (!result.success || !result.file) throw new Error(copy.metadataFailed);
      originalEncoding = new File([result.file], original.name, outputs);
      if (originalEncoding.size > original.size) throw new Error(copy.metadataFailed);
    }

    const result = await encode({ file: originalEncoding, quality: settings.quality });
    if (result.kind === 'invalid') throw new Error(copy.imageLoadFailed);
    if (result.kind === 'animation') return { file: originalEncoding, notice: copy.animationPreserved };
    if (result.kind === 'fallback') return { file: originalEncoding, warning: copy.encoderFallback };

    let candidate = new File([result.bytes], original.name, outputs);
    let warning: string | undefined;
    // PNG/APNG 直接优化容器并保留元数据；只有像素重新编码的格式需要写回。
    const reencodedPixels = original.type === 'image/jpeg' || original.type === 'image/webp';
    if (!settings.removeMetadata && reencodedPixels && candidate.size < originalEncoding.size) {
      const { copyWritableMetadata } = await import('@/app/lib/metadata/exifToolEngine');
      const metadata = await copyWritableMetadata(original, candidate, 'compressed').catch(() => null);
      if (!metadata?.success || !metadata.file) return { file: originalEncoding, warning: copy.metadataFallback };
      candidate = new File([metadata.file], original.name, outputs);
      if (metadata.failedTags.length) warning = copy.metadataPartial;
    }

    // 以最终可下载文件作比较，避免重新编码增大体积或给已优化图片带来额外损失。
    return candidate.size < originalEncoding.size
      ? { file: candidate, warning }
      : { file: originalEncoding, notice: copy.keptEncoding };
  }

  return { compress, dispose };
}
