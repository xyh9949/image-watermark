# 图片水印处理系统 - 部署文档

## 📋 部署概览

本文档提供了图片水印处理系统的完整部署指南，包括开发环境、测试环境和生产环境的部署方案。

## 🛠️ 系统要求

### 基础环境
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本（或 yarn 1.22+、pnpm 7.0+）
- **内存**: 最低 2GB RAM，推荐 4GB+
- **存储**: 最低 1GB 可用空间
- **操作系统**: Windows 10+、macOS 10.15+、Linux (Ubuntu 18.04+)

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 快速部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd image-watermark
```

### 2. 安装依赖
```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install
```

### 3. 环境配置
创建环境变量文件：
```bash
cp .env.example .env.local
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 🔧 环境配置

### 环境变量说明

创建 `.env.local` 文件并配置以下变量：

```bash
# 应用配置
NEXT_PUBLIC_APP_NAME="图片水印处理系统"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 文件上传配置
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_MAX_FILES_COUNT=50
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"

# 处理配置
NEXT_PUBLIC_MAX_IMAGE_WIDTH=4096
NEXT_PUBLIC_MAX_IMAGE_HEIGHT=4096
NEXT_PUBLIC_DEFAULT_OUTPUT_QUALITY=90

# 存储配置（可选）
UPLOAD_DIR="./public/uploads"
TEMP_DIR="./temp"
OUTPUT_DIR="./public/outputs"

# 性能配置
NEXT_PUBLIC_WORKER_THREADS=4
NEXT_PUBLIC_BATCH_SIZE=10
NEXT_PUBLIC_PROCESSING_TIMEOUT=30000

# 开发模式配置
NODE_ENV="development"
NEXT_PUBLIC_DEBUG=true
```

### 生产环境变量
```bash
# 生产环境配置
NODE_ENV="production"
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# 安全配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# CDN 配置（可选）
NEXT_PUBLIC_CDN_URL="https://cdn.your-domain.com"
NEXT_PUBLIC_STATIC_URL="https://static.your-domain.com"
```

## 🏗️ 构建和部署

### 本地构建
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

### 构建优化
项目已配置以下优化：
- **代码分割**: 自动按路由分割
- **图片优化**: Next.js Image 组件
- **CSS 优化**: Tailwind CSS 自动清理
- **Bundle 分析**: 可选择启用

### 构建验证
```bash
# 检查构建输出
npm run build

# 验证 ESLint
npm run lint

# 类型检查
npx tsc --noEmit
```

## 🌐 部署方案

### 方案一：Vercel 部署（推荐）

#### 1. 准备工作
- 确保代码已推送到 GitHub/GitLab
- 注册 Vercel 账号

#### 2. 部署步骤
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产部署
vercel --prod
```

#### 3. Vercel 配置
创建 `vercel.json`：
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 方案二：Docker 部署

#### 1. Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
      - ./temp:/app/temp
    restart: unless-stopped
```

#### 3. 构建和运行
```bash
# 构建镜像
docker build -t image-watermark .

# 运行容器
docker run -p 3000:3000 image-watermark

# 使用 Docker Compose
docker-compose up -d
```

### 方案三：传统服务器部署

#### 1. 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

#### 2. 部署脚本
创建 `deploy.sh`：
```bash
#!/bin/bash

# 设置变量
APP_NAME="image-watermark"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="your-git-repository-url"

# 创建应用目录
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 克隆或更新代码
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git pull origin main
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 安装依赖
npm ci

# 构建应用
npm run build

# 使用 PM2 启动
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 3. PM2 配置
创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'image-watermark',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/image-watermark',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

## 🔒 安全配置

### 1. HTTPS 配置
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

### 3. 防火墙配置
```bash
# UFW 配置
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 监控和日志

### 1. 应用监控
```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs image-watermark

# 重启应用
pm2 restart image-watermark
```

### 2. 系统监控
推荐使用以下工具：
- **Uptime**: 服务可用性监控
- **New Relic**: 应用性能监控
- **Sentry**: 错误追踪
- **LogRocket**: 用户行为分析

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
npm run clean
rm -rf .next node_modules
npm install
npm run build
```

#### 2. 内存不足
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 3. 端口冲突
```bash
# 查找占用端口的进程
lsof -i :3000
kill -9 <PID>
```

### 性能优化

#### 1. 图片处理优化
- 启用图片压缩
- 使用 WebP 格式
- 实现图片懒加载

#### 2. 缓存策略
- 静态资源缓存
- API 响应缓存
- 浏览器缓存

## 📝 维护指南

### 定期维护任务
1. **依赖更新**: 每月检查并更新依赖
2. **安全补丁**: 及时应用安全更新
3. **日志清理**: 定期清理应用日志
4. **备份**: 定期备份配置和数据

### 更新流程
```bash
# 1. 备份当前版本
pm2 save

# 2. 拉取最新代码
git pull origin main

# 3. 安装新依赖
npm ci

# 4. 构建新版本
npm run build

# 5. 重启应用
pm2 restart image-watermark

# 6. 验证部署
curl -f http://localhost:3000/api/health || pm2 restart image-watermark
```

## 🚀 高级部署配置

### CDN 集成

#### 1. Cloudflare 配置
```javascript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    loader: 'cloudflare',
    path: 'https://your-domain.com/cdn-cgi/image/',
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' }
        ],
      },
    ]
  },
}
```

#### 2. AWS CloudFront 配置
```json
{
  "DistributionConfig": {
    "Origins": [{
      "Id": "image-watermark-origin",
      "DomainName": "your-app.vercel.app",
      "CustomOriginConfig": {
        "HTTPPort": 443,
        "OriginProtocolPolicy": "https-only"
      }
    }],
    "DefaultCacheBehavior": {
      "TargetOriginId": "image-watermark-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized"
    }
  }
}
```

### 数据库集成（可选）

#### 1. MongoDB 配置
```bash
# 环境变量
MONGODB_URI="mongodb://localhost:27017/image-watermark"
MONGODB_DB="image-watermark"
```

```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
```

#### 2. Redis 缓存配置
```bash
# 环境变量
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-password"
```

### 文件存储方案

#### 1. AWS S3 配置
```bash
# 环境变量
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="image-watermark-uploads"
```

```javascript
// lib/s3.js
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export const uploadToS3 = async (file, key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type,
  }

  return s3.upload(params).promise()
}
```

#### 2. 阿里云 OSS 配置
```bash
# 环境变量
ALICLOUD_ACCESS_KEY_ID="your-access-key"
ALICLOUD_ACCESS_KEY_SECRET="your-secret-key"
ALICLOUD_OSS_REGION="oss-cn-hangzhou"
ALICLOUD_OSS_BUCKET="image-watermark"
```

### 负载均衡配置

#### 1. Nginx 负载均衡
```nginx
upstream image_watermark {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://image_watermark;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 2. HAProxy 配置
```
global
    daemon

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend image_watermark_frontend
    bind *:80
    default_backend image_watermark_backend

backend image_watermark_backend
    balance roundrobin
    server app1 127.0.0.1:3000 check
    server app2 127.0.0.1:3001 check
    server app3 127.0.0.1:3002 check
```

## 🔐 安全最佳实践

### 1. 环境变量安全
```bash
# 使用 dotenv-vault 加密环境变量
npm install dotenv-vault
npx dotenv-vault new
npx dotenv-vault push
```

### 2. API 安全
```javascript
// middleware/security.js
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

export const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
]
```

### 3. 文件上传安全
```javascript
// lib/upload-security.js
export const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  if (file.size > maxSize) {
    throw new Error('File too large')
  }

  return true
}
```

## 📈 性能监控

### 1. 应用性能监控
```javascript
// lib/monitoring.js
import { performance } from 'perf_hooks'

export const trackPerformance = (operation) => {
  return async (req, res, next) => {
    const start = performance.now()

    res.on('finish', () => {
      const duration = performance.now() - start
      console.log(`${operation}: ${duration.toFixed(2)}ms`)
    })

    next()
  }
}
```

### 2. 错误追踪
```javascript
// lib/error-tracking.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

export const captureError = (error, context) => {
  Sentry.captureException(error, { extra: context })
}
```

### 3. 健康检查端点
```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    }
  }

  res.status(200).json(healthcheck)
}
```

## 🔄 CI/CD 配置

### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 2. GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run lint
    - npm run test
  cache:
    paths:
      - node_modules/

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: node:$NODE_VERSION
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
```

## 📞 技术支持

### 故障排除清单
1. **构建问题**
   - 检查 Node.js 版本 (≥18.0.0)
   - 清理 node_modules 和 .next 目录
   - 验证 package.json 依赖版本

2. **运行时问题**
   - 检查环境变量配置
   - 验证端口可用性
   - 查看应用日志

3. **性能问题**
   - 监控内存使用情况
   - 检查图片处理队列
   - 优化批处理大小

4. **安全问题**
   - 更新依赖到最新版本
   - 检查文件上传限制
   - 验证 HTTPS 配置

### 联系支持
- 📧 Email: support@your-domain.com
- 📱 GitHub Issues: [项目仓库](https://github.com/your-repo)
- 📖 文档: [完整文档](./README.md)

### 版本历史
- v1.0.0: 初始发布版本
- v1.1.0: 添加比例模式功能
- v1.2.0: 性能优化和安全增强

---

**最后更新**: 2025-08-29
**文档版本**: 1.0.0
