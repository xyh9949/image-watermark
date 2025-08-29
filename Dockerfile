# 图片水印处理系统 - Docker 配置文件

# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# ===================================
# 依赖安装阶段
# ===================================
FROM base AS deps

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 安装所有依赖 (包括开发依赖)
FROM base AS deps-dev
RUN npm ci

# ===================================
# 构建阶段
# ===================================
FROM base AS builder

# 复制所有依赖
COPY --from=deps-dev /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN npm run build

# ===================================
# 生产运行阶段
# ===================================
FROM base AS runner

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建必要的目录
RUN mkdir -p /app/uploads /app/temp /app/logs
RUN chown -R nextjs:nodejs /app

# 复制构建产物
COPY --from=builder /app/public ./public

# 复制 Next.js 构建输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制生产依赖
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["node", "server.js"]
