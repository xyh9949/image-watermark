// PM2 生态系统配置文件
// 用于生产环境部署和进程管理

module.exports = {
  apps: [
    {
      // 应用基本配置
      name: 'image-watermark',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/image-watermark',
      
      // 集群配置
      instances: 'max', // 使用所有可用 CPU 核心
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: 'https://your-domain.com'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        NEXT_PUBLIC_APP_URL: 'https://staging.your-domain.com'
      },
      
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      
      // 自动重启配置
      autorestart: true,
      watch: false, // 生产环境不建议开启文件监听
      max_memory_restart: '1G',
      
      // 重启策略
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 健康检查
      health_check_grace_period: 3000,
      
      // 高级配置
      node_args: '--max-old-space-size=2048',
      merge_logs: true,
      
      // 监控配置
      pmx: true,
      monitoring: true,
      
      // 实例配置
      instance_var: 'INSTANCE_ID',
      
      // 源码映射
      source_map_support: true,
      
      // 忽略监听的文件/目录
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        'uploads',
        'temp'
      ],
      
      // 环境特定配置
      env_file: '.env.production'
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/image-watermark.git',
      path: '/var/www/image-watermark',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/image-watermark.git',
      path: '/var/www/image-watermark-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
