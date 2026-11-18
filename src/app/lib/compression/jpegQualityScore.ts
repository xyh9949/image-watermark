interface ScoreExports {
  memory: WebAssembly.Memory;
  alloc: (length: number) => number;
  dealloc: (pointer: number, length: number) => void;
  score: (first: number, second: number, width: number, height: number) => number;
}

let engine: Promise<ScoreExports> | undefined;

async function loadEngine() {
  // 包的 JS API 专供 Node。Worker 直接使用锁定版本的 WASM，避免将 Node API 打入浏览器。
  const url = new URL('../../../../node_modules/bytecut-ssimulacra2/ssimulacra2.wasm', import.meta.url);
  const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
  if (!response.ok) throw new Error('JPEG quality metric unavailable');
  const compiled = await WebAssembly.compile(await response.arrayBuffer());
  const imports: Record<string, WebAssembly.ModuleImports> = {};
  for (const { module: namespace, name, kind } of WebAssembly.Module.imports(compiled)) {
    if (kind !== 'function') throw new Error('Unexpected JPEG metric import');
    (imports[namespace] ??= {})[name] = () => { throw new Error('Unexpected JPEG metric call'); };
  }
  const instance = await WebAssembly.instantiate(compiled, imports);
  return instance.exports as unknown as ScoreExports;
}

export async function createJpegQualityScorer() {
  // Worker 按批次创建；一批内复用初始化结果，网络失败时也不逐图反复下载。
  engine ??= loadEngine();
  const wasm = await engine;
  return (reference: ImageData, candidate: ImageData) => {
    const { width, height } = reference;
    const length = width * height * 3;
    const first = wasm.alloc(length);
    const second = wasm.alloc(length);
    try {
      if (!first || !second) throw new Error('Unable to allocate JPEG metric buffers');
      const memory = new Uint8Array(wasm.memory.buffer);
      // JPEG 无透明通道。WASM 接收连续 sRGB，每像素 3 字节。
      for (let i = 0, j = 0; j < length; i += 4, j += 3) {
        for (let channel = 0; channel < 3; channel++) {
          memory[first + j + channel] = reference.data[i + channel];
          memory[second + j + channel] = candidate.data[i + channel];
        }
      }
      const score = wasm.score(first, second, width, height);
      if (!Number.isFinite(score)) throw new Error('Invalid JPEG quality score');
      return score;
    } finally {
      if (first) wasm.dealloc(first, length);
      if (second) wasm.dealloc(second, length);
    }
  };
}
