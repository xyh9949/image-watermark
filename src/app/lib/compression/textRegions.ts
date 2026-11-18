export interface TextRegion {
  x: number;
  y: number;
  strength: number;
}

const BLOCK_WIDTH = 48;
const BLOCK_HEIGHT = 24;

// 在平坦底色上查找沿横向重复的窄笔画，并要求至少两个区块命中。
// 慎重筛选疑似文字区域，保留照片、粗边框和不确定图片的默认压缩结果。
export function findTextRegions({ data, width, height }: ImageData): TextRegion[] {
  const matches: TextRegion[] = [];
  for (let top = 0; top + BLOCK_HEIGHT <= height; top += BLOCK_HEIGHT) {
    for (let left = 0; left + BLOCK_WIDTH <= width; left += BLOCK_WIDTH / 2) {
      let rows = 0;
      let flat = 0;
      let totalStrokes = 0;
      for (let y = top; y < top + BLOCK_HEIGHT; y += 2) {
        let previous = 0;
        let lastEdge = -10;
        let lastSign = 0;
        let strokes = 0;
        for (let x = left; x < left + BLOCK_WIDTH; x++) {
          const p = (y * width + x) * 4;
          const luma = (54 * data[p] + 183 * data[p + 1] + 19 * data[p + 2]) >> 8;
          const delta = luma - previous;
          previous = luma;
          if (x === left) continue;
          if (Math.abs(delta) <= 5) flat++;
          if (Math.abs(delta) < 27) continue;
          const sign = Math.sign(delta);
          if (sign !== lastSign && x - lastEdge <= 7) strokes++;
          lastEdge = x;
          lastSign = sign;
        }
        if (strokes >= 3) {
          rows++;
          totalStrokes += strokes;
        }
      }
      if (rows >= 3 && rows <= 10 && totalStrokes >= 48 && flat >= 0.64 * 12 * (BLOCK_WIDTH - 1)) {
        matches.push({ x: left + BLOCK_WIDTH / 2, y: top + BLOCK_HEIGHT / 2, strength: totalStrokes });
      }
    }
  }
  matches.sort((a, b) => b.strength - a.strength);
  if (!matches.length) return [];
  const first = matches[0];
  const other = matches.find(({ x, y }) => Math.abs(x - first.x) >= 96 || Math.abs(y - first.y) >= 64);
  return other ? [first, other] : [];
}
