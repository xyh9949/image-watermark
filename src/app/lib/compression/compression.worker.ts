import type { CodecRequest, CodecResult } from './imageCompression';

const jpegQuality = { high: 95, medium: 85, low: 72 };
const webpQuality = { high: 93, medium: 82, low: 68 };
const pngEffort = { high: 2, medium: 3, low: 4 };

function matches(bytes: Uint8Array, offset: number, signature: string) {
  return [...signature].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

async function encode({ file, quality }: CodecRequest): Promise<CodecResult> {
  const header = new Uint8Array(await file.slice(0, 21).arrayBuffer());
  const jpeg = file.type === 'image/jpeg' && header[0] === 0xff && header[1] === 0xd8;
  const png = (file.type === 'image/png' || file.type === 'image/apng') && matches(header, 0, '\x89PNG\r\n\x1a\n');
  const webp = file.type === 'image/webp' && matches(header, 0, 'RIFF') && matches(header, 8, 'WEBP');
  const gif = file.type === 'image/gif' && (matches(header, 0, 'GIF89a') || matches(header, 0, 'GIF87a'));
  if (!jpeg && !png && !webp && !gif) return { kind: 'invalid' };

  const image = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!image) return { kind: 'invalid' };

  try {
    // GIF 和动态 WebP 沿用原始帧，避免单帧 Canvas 编码丢失动画和时序。
    if (gif || (webp && matches(header, 12, 'VP8X') && (header[20] & 0x02))) {
      return { kind: 'animation' };
    }

    if (png) {
      // OxiPNG 直接操作 PNG/APNG 文件，保留位深、透明度和动画。透明像素的 RGB 也不改写。
      // 产品本身已运行在 Worker，使用单线程入口，避免 Turbopack 递归打包 Rayon 子 Worker。
      const { default: init, optimise } = await import('@jsquash/oxipng/codec/pkg/squoosh_oxipng.js');
      await init();
      const bytes = optimise(new Uint8Array(await file.arrayBuffer()), pngEffort[quality], false, false);
      return { kind: 'encoded', bytes: bytes.buffer as ArrayBuffer };
    }

    // 限制单张 RGBA 工作缓冲，超大图片保留原始编码，避免拖垮标签页。
    if (image.width * image.height > 32_000_000) return { kind: 'fallback' };
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    if (!context) return { kind: 'fallback' };
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height);

    if (jpeg) {
      const { default: encodeJpeg } = await import('@jsquash/jpeg/encode.js');
      // 画质优先使用 4:4:4，减少彩色文字和高对比边缘的色度模糊。
      const bytes = await encodeJpeg(pixels, {
        quality: jpegQuality[quality],
        auto_subsample: quality !== 'high',
        chroma_subsample: quality === 'high' ? 1 : 2,
      });
      return { kind: 'encoded', bytes };
    }

    const { default: encodeWebp } = await import('@jsquash/webp/encode.js');
    const bytes = await encodeWebp(pixels, {
      quality: webpQuality[quality], method: 5, use_sharp_yuv: 1, alpha_quality: 100,
    });
    return { kind: 'encoded', bytes };
  } catch {
    // 编码器不可用或拒绝特殊文件时，交由调用方返回已验证的原始编码。
    return { kind: 'fallback' };
  } finally {
    image.close();
  }
}

self.addEventListener('message', async (event: MessageEvent<CodecRequest>) => {
  const result = await encode(event.data).catch((): CodecResult => ({ kind: 'invalid' }));
  self.postMessage(result, { transfer: result.kind === 'encoded' ? [result.bytes] : [] });
});
