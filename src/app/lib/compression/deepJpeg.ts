import { createJpegQualityScorer } from './jpegQualityScore';
import type { TextRegion } from './textRegions';

const MAX_SEARCH_MS = 1200;
const MIN_SAVINGS = 0.02;
const MAX_OVERVIEW_LOSS = 0.6;
const MAX_TEXT_LOSS = 1;

// 固定为一张缩小概览和两个原像素文字局部。缩小图看整体，原尺寸局部保护细字笔画。
function sampler(width: number, height: number, regions: TextRegion[]) {
  const scale = Math.min(1, 256 / Math.max(width, height));
  const overviewWidth = Math.max(8, Math.round(width * scale));
  const overviewHeight = Math.max(8, Math.round(height * scale));
  const cropWidth = Math.min(144, width);
  const cropHeight = Math.min(88, height);
  const canvas = new OffscreenCanvas(Math.max(overviewWidth, cropWidth), Math.max(overviewHeight, cropHeight));
  const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
  if (!context) throw new Error('No JPEG scoring canvas');
  return (image: CanvasImageSource) => {
    context.drawImage(image, 0, 0, overviewWidth, overviewHeight);
    const overview = context.getImageData(0, 0, overviewWidth, overviewHeight);
    return [overview, ...regions.map(({ x, y }) => {
      const left = Math.max(0, Math.min(width - cropWidth, x - Math.floor(cropWidth / 2)));
      const top = Math.max(0, Math.min(height - cropHeight, y - Math.floor(cropHeight / 2)));
      context.drawImage(image, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      return context.getImageData(0, 0, cropWidth, cropHeight);
    })];
  };
}

export async function tryDeepJpeg(
  source: ImageBitmap, baseline: ArrayBuffer, regions: TextRegion[],
  encodeCandidate: () => Promise<ArrayBuffer>,
): Promise<ArrayBuffer | undefined> {
  const deadline = performance.now() + MAX_SEARCH_MS;
  // 只额外编码一次；不足 2% 的候选不加载评分 WASM，也不解码比较。
  const candidate = await encodeCandidate();
  if (performance.now() >= deadline || candidate.byteLength > baseline.byteLength * (1 - MIN_SAVINGS)) return;
  const score = await createJpegQualityScorer();
  if (performance.now() >= deadline) return;
  const sample = sampler(source.width, source.height, regions);
  const reference = sample(source);
  const scoreSamples = async (bytes: ArrayBuffer) => {
    const decoded = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    try {
      if (decoded.width !== source.width || decoded.height !== source.height) throw new Error('JPEG dimensions changed');
      return sample(decoded).map((part, index) => score(reference[index], part));
    } finally {
      decoded.close();
    }
  };
  const qualityFloor = await scoreSamples(baseline);
  if (performance.now() >= deadline) return;
  // 评分差值是 SSIMULACRA2 分数（相同图像为 100），不是百分比或无损保证。
  const scores = await scoreSamples(candidate);
  if (performance.now() < deadline && scores.every((value, index) =>
    value >= qualityFloor[index] - (index === 0 ? MAX_OVERVIEW_LOSS : MAX_TEXT_LOSS))) {
    return candidate;
  }
}
