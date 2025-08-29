/**
 * 百度推送API工具
 * 用于主动向百度提交URL，加快收录速度
 */

// 百度推送API配置
interface BaiduPushConfig {
  site: string;
  token: string;
  urls: string[];
}

// 推送结果接口
interface PushResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * 向百度推送URL
 * @param config 推送配置
 * @returns 推送结果
 */
export async function pushUrlsToBaidu(config: BaiduPushConfig): Promise<PushResult> {
  try {
    const { site, token, urls } = config;
    
    if (!site || !token || !urls.length) {
      return {
        success: false,
        message: '推送配置不完整',
      };
    }

    const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`;
    
    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: urls.join('\n'),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: '推送成功',
      data: result,
    };
  } catch (error) {
    console.error('百度推送失败:', error);
    return {
      success: false,
      message: `推送失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 快速收录推送
 * @param config 推送配置
 * @returns 推送结果
 */
export async function fastIndexPush(config: BaiduPushConfig): Promise<PushResult> {
  try {
    const { site, token, urls } = config;
    
    if (!site || !token || !urls.length) {
      return {
        success: false,
        message: '推送配置不完整',
      };
    }

    const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}&type=batch`;
    
    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: urls.join('\n'),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: '快速收录推送成功',
      data: result,
    };
  } catch (error) {
    console.error('百度快速收录推送失败:', error);
    return {
      success: false,
      message: `推送失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 获取推送配额
 * @param site 站点域名
 * @param token API token
 * @returns 配额信息
 */
export async function getBaiduQuota(site: string, token: string): Promise<PushResult> {
  try {
    if (!site || !token) {
      return {
        success: false,
        message: '站点或token不能为空',
      };
    }

    const quotaUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`;
    
    const response = await fetch(quotaUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: '获取配额成功',
      data: result,
    };
  } catch (error) {
    console.error('获取百度配额失败:', error);
    return {
      success: false,
      message: `获取配额失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 自动推送当前页面URL到百度
 * 在客户端调用，自动推送当前页面
 */
export function autoPushCurrentPage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || '';
  const token = process.env.NEXT_PUBLIC_BAIDU_PUSH_TOKEN || '';
  
  if (!site || !token) {
    console.warn('百度推送配置不完整，跳过自动推送');
    return;
  }

  const currentUrl = window.location.href;
  
  pushUrlsToBaidu({
    site,
    token,
    urls: [currentUrl],
  }).then(result => {
    if (result.success) {
      console.log('百度自动推送成功:', result.data);
    } else {
      console.warn('百度自动推送失败:', result.message);
    }
  });
}

/**
 * 批量推送站点地图中的所有URL
 * @param sitemapUrl sitemap.xml的URL
 * @returns 推送结果
 */
export async function pushSitemapUrls(sitemapUrl: string): Promise<PushResult> {
  try {
    const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || '';
    const token = process.env.NEXT_PUBLIC_BAIDU_PUSH_TOKEN || '';
    
    if (!site || !token) {
      return {
        success: false,
        message: '百度推送配置不完整',
      };
    }

    // 获取sitemap内容
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`获取sitemap失败: ${response.status}`);
    }

    const sitemapText = await response.text();
    
    // 简单解析sitemap中的URL（实际项目中建议使用XML解析器）
    const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g);
    if (!urlMatches) {
      return {
        success: false,
        message: 'sitemap中未找到URL',
      };
    }

    const urls = urlMatches.map(match => 
      match.replace(/<\/?loc>/g, '')
    );

    return await pushUrlsToBaidu({
      site,
      token,
      urls,
    });
  } catch (error) {
    console.error('推送sitemap URL失败:', error);
    return {
      success: false,
      message: `推送失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}
