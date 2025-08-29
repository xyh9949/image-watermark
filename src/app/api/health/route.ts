import { NextRequest, NextResponse } from 'next/server';

/**
 * 健康检查 API 端点
 * 用于监控应用状态和系统资源
 */

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  services: {
    database?: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    redis?: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    storage?: {
      status: 'available' | 'unavailable' | 'error';
      freeSpace?: number;
    };
  };
  checks: {
    memory: boolean;
    disk: boolean;
    dependencies: boolean;
  };
}

/**
 * 检查内存使用情况
 */
function checkMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.rss + memoryUsage.heapTotal + memoryUsage.external;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(memoryPercentage * 100) / 100,
  };
}

/**
 * 检查 CPU 使用情况
 */
function checkCpuUsage() {
  const cpuUsage = process.cpuUsage();
  return {
    user: cpuUsage.user,
    system: cpuUsage.system,
  };
}

/**
 * 检查系统信息
 */
function getSystemInfo() {
  return {
    memory: checkMemoryUsage(),
    cpu: checkCpuUsage(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  };
}

/**
 * 检查数据库连接（如果配置了）
 */
async function checkDatabase() {
  try {
    // 这里可以添加实际的数据库连接检查
    // 例如 MongoDB 或其他数据库的 ping 操作
    
    if (process.env.MONGODB_URI) {
      // 模拟数据库检查
      const startTime = Date.now();
      // await mongoClient.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected' as const,
        responseTime,
      };
    }
    
    return undefined;
  } catch (error) {
    return {
      status: 'error' as const,
      responseTime: undefined,
    };
  }
}

/**
 * 检查 Redis 连接（如果配置了）
 */
async function checkRedis() {
  try {
    if (process.env.REDIS_URL) {
      // 模拟 Redis 检查
      const startTime = Date.now();
      // await redisClient.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected' as const,
        responseTime,
      };
    }
    
    return undefined;
  } catch (error) {
    return {
      status: 'error' as const,
      responseTime: undefined,
    };
  }
}

/**
 * 检查存储空间
 */
async function checkStorage() {
  try {
    // 这里可以添加磁盘空间检查
    // 例如检查上传目录的可用空间
    
    return {
      status: 'available' as const,
      freeSpace: undefined, // 可以添加实际的空间检查
    };
  } catch (error) {
    return {
      status: 'error' as const,
      freeSpace: undefined,
    };
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(): Promise<HealthCheckResponse> {
  const systemInfo = getSystemInfo();
  
  // 检查各种服务
  const [database, redis, storage] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
  ]);

  // 执行基本检查
  const memoryCheck = systemInfo.memory.percentage < 90; // 内存使用率低于 90%
  const diskCheck = true; // 可以添加实际的磁盘检查
  const dependenciesCheck = true; // 可以添加依赖检查

  const allChecksPass = memoryCheck && diskCheck && dependenciesCheck;

  return {
    status: allChecksPass ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: systemInfo,
    services: {
      ...(database && { database }),
      ...(redis && { redis }),
      ...(storage && { storage }),
    },
    checks: {
      memory: memoryCheck,
      disk: diskCheck,
      dependencies: dependenciesCheck,
    },
  };
}

/**
 * GET 请求处理器
 */
export async function GET(request: NextRequest) {
  try {
    const healthCheck = await performHealthCheck();
    
    // 根据健康检查结果返回相应的状态码
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}

/**
 * HEAD 请求处理器（用于简单的存活检查）
 */
export async function HEAD() {
  try {
    // 简单的存活检查，不返回详细信息
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
