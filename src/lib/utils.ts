import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 安全的 UUID 生成（兼容不支持 crypto.randomUUID 的环境）
export function safeUUID(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  try {
    if (typeof g?.crypto?.randomUUID === 'function') {
      return g.crypto.randomUUID();
    }
    if (g?.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      g.crypto.getRandomValues(bytes);
      // RFC 4122 version 4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch { }
  // 最后兜底（Math.random），不保证强随机，仅作 ID 用途
  let ts = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (ts + Math.random() * 16) % 16 | 0;
    ts = Math.floor(ts / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
