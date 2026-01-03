// 定义请求方法类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 定义请求配置接口
interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  data?: any; // 请求体数据，会自动转为JSON字符串
  timeout?: number; // 超时时间(毫秒)
}

/**
 * 全局 API 请求函数
 * @param config 请求配置
 * @returns Promise 响应数据
 */
export const requestApi = async <T = any>(config: RequestConfig): Promise<T> => {
  const {
    url,
    method = 'GET',
    headers = {},
    data,
    timeout = 5000 // 默认10秒超时
  } = config;

  // 默认请求头
  const defaultHeaders = {
    'content-type': 'application/json',
    ...headers
  };

  // 请求参数
  const fetchOptions: RequestInit = {
    method,
    headers: defaultHeaders,
    // 对于GET等方法，不设置body
    ...(method !== 'GET' && method !== 'HEAD' && { body: JSON.stringify(data) })
  };

  try {
    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    // 清除超时定时器
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      throw new Error(
        `HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Unknown error'}`
      );
    }

    // 处理空响应
    if (response.status === 204) {
      return {} as T;
    }

    // 解析响应数据
    const responseData = await response.json();
    return responseData as T;
  } catch (error) {
    // 处理超时错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    
    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`API request failed: ${errorMessage}`);
  }
};

// 便捷的请求方法
export const api = {
  get: <T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => 
    requestApi<T>({ ...config, url, method: 'GET' }),
  
  post: <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => 
    requestApi<T>({ ...config, url, method: 'POST', data }),
  
  put: <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => 
    requestApi<T>({ ...config, url, method: 'PUT', data }),
  
  delete: <T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => 
    requestApi<T>({ ...config, url, method: 'DELETE' })
};

function getValueByPath(data: Record<string, any>, path: string): any | undefined {
  // 将路径按点分割成数组
  const pathSegments = path.split('.');

  // 递归或循环查找值
  let current: any = data;
  for (const segment of pathSegments) {
    // 如果当前节点不存在或不是对象，直接返回undefined
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    // 进入下一级节点
    current = current[segment];
  }

  return current;
}
export function extractJsonValue(jsonData: Record<string, any>, extractPath: string){
    const value = getValueByPath(jsonData, extractPath);
    return value
};    