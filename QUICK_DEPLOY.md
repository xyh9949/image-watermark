# 🚀 快速部署指南

本指南提供了图片水印处理系统的快速部署方法，适合不同的部署场景。

## 📋 部署前准备

### 1. 系统要求检查
```bash
# 检查 Node.js 版本 (需要 18+)
node --version

# 检查 npm 版本
npm --version

# 检查可用内存 (推荐 4GB+)
free -h
```

### 2. 下载项目
```bash
git clone <your-repository-url>
cd image-watermark
```

## ⚡ 一键部署

### 方案一：Vercel 部署（推荐新手）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
vercel

# 4. 生产部署
vercel --prod
```

**优势**：
- ✅ 零配置部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动扩容

### 方案二：Docker 一键部署

```bash
# 1. 构建并启动
docker-compose up -d

# 2. 查看状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f app
```

**优势**：
- ✅ 环境隔离
- ✅ 易于扩展
- ✅ 包含数据库
- ✅ 监控工具

### 方案三：自动化脚本部署

```bash
# 1. 给脚本执行权限
chmod +x scripts/deploy.sh

# 2. 生产环境部署
./scripts/deploy.sh -e production -p

# 3. 开发环境部署
./scripts/deploy.sh -e development -c
```

**优势**：
- ✅ 自动化流程
- ✅ 多环境支持
- ✅ 健康检查
- ✅ 错误处理

## 🔧 环境配置

### 1. 复制环境变量文件
```bash
cp .env.example .env.local
```

### 2. 编辑关键配置
```bash
# 必须配置的变量
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# 可选配置
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_MAX_FILES_COUNT=50
```

## 🌐 部署方案对比

| 方案 | 难度 | 成本 | 性能 | 扩展性 | 推荐场景 |
|------|------|------|------|--------|----------|
| Vercel | ⭐ | 免费/付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 个人项目、快速原型 |
| Docker | ⭐⭐⭐ | 服务器成本 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 企业部署、微服务 |
| 传统部署 | ⭐⭐ | 服务器成本 | ⭐⭐⭐ | ⭐⭐⭐ | 简单应用、学习 |

## 🚀 5分钟快速上线

### 步骤 1：选择部署方式
```bash
# Vercel (最简单)
vercel --prod

# 或 Docker (最稳定)
docker-compose up -d

# 或 脚本 (最灵活)
./scripts/deploy.sh -e production -p
```

### 步骤 2：验证部署
```bash
# 检查应用状态
curl http://localhost:3000/api/health

# 或访问浏览器
open http://localhost:3000
```

### 步骤 3：配置域名（可选）
```bash
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查找占用进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

#### 2. 内存不足
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER .
chmod +x scripts/deploy.sh
```

#### 4. 依赖安装失败
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 日志查看

```bash
# PM2 日志
pm2 logs image-watermark

# Docker 日志
docker-compose logs -f app

# 系统日志
tail -f /var/log/nginx/error.log
```

## 📊 性能优化

### 1. 启用压缩
```bash
# 在 .env.local 中添加
ENABLE_COMPRESSION=true
```

### 2. 配置缓存
```bash
# Redis 缓存
REDIS_URL="redis://localhost:6379"
ENABLE_CACHING=true
```

### 3. CDN 配置
```bash
# Cloudflare 或其他 CDN
NEXT_PUBLIC_CDN_URL="https://cdn.your-domain.com"
```

## 🔒 安全配置

### 1. HTTPS 配置
```bash
# Let's Encrypt 证书
sudo certbot --nginx -d your-domain.com
```

### 2. 防火墙设置
```bash
# UFW 配置
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. 环境变量安全
```bash
# 使用强密码
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

## 📈 监控设置

### 1. 应用监控
```bash
# PM2 监控
pm2 monit

# 或使用 Docker 监控
docker stats
```

### 2. 日志监控
```bash
# 实时日志
tail -f logs/app.log

# 错误日志
grep ERROR logs/app.log
```

## 🔄 更新部署

### 1. 代码更新
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./scripts/deploy.sh -e production -p
```

### 2. 依赖更新
```bash
# 更新依赖
npm update

# 重新构建
npm run build
```

## 📞 获取帮助

### 部署脚本帮助
```bash
./scripts/deploy.sh --help
```

### 常用命令
```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart image-watermark

# 查看系统资源
htop
```

### 技术支持
- 📖 [完整部署文档](./DEPLOYMENT.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**提示**：首次部署建议使用 Vercel，生产环境推荐使用 Docker 或自动化脚本。
