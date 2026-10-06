import type { NextConfig } from "next";
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// 内容变化时自动更换 URL；只有哈希地址使用长期缓存，旧客户端仍可访问原地址。
const wasmHash = createHash('sha256').update(readFileSync('public/zeroperl.wasm')).digest('hex').slice(0, 16);
const wasmUrl = `/metadata-engine/zeroperl-${wasmHash}.wasm`;

const nextConfig: NextConfig = {
  output: "standalone",
  env: { NEXT_PUBLIC_METADATA_WASM_URL: wasmUrl },

  async rewrites() {
    return [{ source: wasmUrl, destination: '/zeroperl.wasm' }];
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  compress: true,
  poweredByHeader: false,

  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  async headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        source: wasmUrl,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
