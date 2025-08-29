#!/usr/bin/env node

/**
 * 健康检查脚本
 * 用于 Docker 容器和负载均衡器的健康检查
 */

const http = require('http');
const process = require('process');

// 配置
const config = {
  host: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  timeout: 5000,
  path: '/api/health'
};

/**
 * 执行健康检查
 */
function healthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: config.path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'HealthCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.status === 'ok') {
            resolve({
              status: 'healthy',
              statusCode: res.statusCode,
              response: response,
              timestamp: new Date().toISOString()
            });
          } else {
            reject({
              status: 'unhealthy',
              statusCode: res.statusCode,
              response: response,
              error: 'Invalid response',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          reject({
            status: 'unhealthy',
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            data: data,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        status: 'unhealthy',
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        status: 'unhealthy',
        error: 'Request timeout',
        timeout: config.timeout,
        timestamp: new Date().toISOString()
      });
    });

    req.setTimeout(config.timeout);
    req.end();
  });
}

/**
 * 检查系统资源
 */
function checkSystemResources() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: Math.round(process.uptime()),
    pid: process.pid,
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting health check...`);
    
    // 执行健康检查
    const healthResult = await healthCheck();
    
    // 获取系统资源信息
    const systemInfo = checkSystemResources();
    
    // 输出结果
    const result = {
      ...healthResult,
      system: systemInfo
    };
    
    console.log(`[${new Date().toISOString()}] Health check passed:`, JSON.stringify(result, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check failed:`, JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  healthCheck,
  checkSystemResources
};
