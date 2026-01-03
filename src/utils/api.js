import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiBaseURL = api.defaults.baseURL;

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从localStorage获取projectId
    const localStorageProjectId = localStorage.getItem('projectId');
    
    // 如果存在projectId且请求中没有显式传递，则添加到请求参数中
    if (localStorageProjectId) {
      // GET请求添加到params（仅当params中没有projectId时）
      if (config.method === 'get') {
        if (!config.params || !config.params.projectId) {
          config.params = { ...config.params, projectId: localStorageProjectId };
        }
      }
      // POST/PUT请求添加到data（仅当data中没有projectId时）
      else if (config.method === 'post' || config.method === 'put') {
        if (!config.data || !config.data.projectId) {
          config.data = { ...config.data, projectId: localStorageProjectId };
        }
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 物模型API
export const thingModelApi = {
  getAll: () => api.get('/thing-model'),
  getById: (id) => api.get(`/thing-model/${id}`),
  create: (data) => api.post('/thing-model', data),
  update: (id, data) => api.put(`/thing-model/${id}`, data),
  delete: (id) => api.delete(`/thing-model/${id}`),
  fixJsonData: () => api.post('/thing-model/fix-json')
};

// 设备API
export const deviceApi = {
  getAll: () => api.get('/device'),
  getById: (id) => api.get(`/device/${id}`),
  getByModelId: (modelId) => api.get(`/device/model/${modelId}`),
  searchByName: (keyword) => api.get(`/device/search`, { params: { keyword } }),
  searchByModelIdAndKeyword: (modelId, keyword) => api.get(`/device/model/${modelId}/search`, { params: { keyword } }),
  searchByConditions: (conditions) => api.get(`/device/search/conditions`, { params: conditions }),
  create: (data) => api.post('/device', data),
  update: (id, data) => api.put(`/device/${id}`, data),
  delete: (id) => api.delete(`/device/${id}`)
};

// 时序数据API
export const timeSeriesApi = {
  // 根据设备编码查询时序数据
  getByDeviceCode: (deviceCode) => api.get(`/time-series/device/${deviceCode}`),
  // 根据设备编码和点位名称查询时序数据
  getByDeviceCodeAndPointName: (deviceCode, pointName) => api.get(`/time-series/device/${deviceCode}/point/${pointName}`),
  // 根据设备编码和时间范围查询时序数据
  getByDeviceCodeAndTimeRange: (deviceCode, startTime, endTime) => {
    return api.get(`/time-series/device/${deviceCode}/time-range`, {
      params: {
        startTime,
        endTime
      }
    });
  },
  // 根据设备编码、点位名称和时间范围查询时序数据
  getByDeviceCodePointNameAndTimeRange: (deviceCode, pointName, startTime, endTime) => {
    return api.get(`/time-series/device/${deviceCode}/point/${pointName}/time-range`, {
      params: {
        startTime,
        endTime
      }
    });
  },
  // 查询设备的所有点位名称
  getPointNamesByDeviceCode: (deviceCode) => api.get(`/time-series/device/${deviceCode}/points`),
  
  // InfluxDB相关API
  // 从InfluxDB根据设备编码、点位名称和时间范围查询时序数据
  getFromInfluxDBByDeviceCodePointNameAndTimeRange: (deviceCode, pointName, startTime, endTime) => {
    return api.get(`/time-series/influxdb/device/${deviceCode}/point/${pointName}/time-range`, {
      params: {
        startTime,
        endTime
      }
    });
  },
  // 从InfluxDB根据设备编码和时间范围查询所有点位数据
  getFromInfluxDBByDeviceCodeAndTimeRange: (deviceCode, startTime, endTime) => {
    return api.get(`/time-series/influxdb/device/${deviceCode}/time-range`, {
      params: {
        startTime,
        endTime
      }
    });
  },
  // 从InfluxDB查询设备的所有点位名称
  getPointNamesFromInfluxDBByDeviceCode: (deviceCode) => {
    return api.get(`/time-series/influxdb/device/${deviceCode}/points`);
  },
  
  // SQL查询时序数据
  queryBySql: (params) => api.post('/time-series/sql-query', params)
};

// 告警规则API
export const alarmRuleApi = {
  getAll: () => api.get('/alarm-rule'),
  getById: (id) => api.get(`/alarm-rule/${id}`),
  getByModelId: (modelId) => api.get(`/alarm-rule/model/${modelId}`),
  getByDeviceCode: (deviceCode) => api.get(`/alarm-rule/device/${deviceCode}`),
  create: (data) => api.post('/alarm-rule', data),
  update: (id, data) => api.put(`/alarm-rule/${id}`, data),
  delete: (id) => api.delete(`/alarm-rule/${id}`),
  updateStatus: (id, isActive) => api.put(`/alarm-rule/${id}/status`, isActive)
};

// 告警记录API
export const alarmRecordApi = {
  getAll: () => api.get('/alarm-record'),
  getById: (id) => api.get(`/alarm-record/${id}`),
  getByDeviceCode: (deviceCode) => api.get(`/alarm-record/device/${deviceCode}`),
  getByConditions: (params) => api.post('/alarm-record/search', params),
  updateStatus: (id, status, resolveTime) => {
    return api.put(`/alarm-record/${id}/status`, { status, resolveTime });
  }
};

// 项目API
export const projectApi = {
  getAll: () => api.get('/project/all'),
  getById: (id) => api.get(`/project/${id}`)
};

// 用户API
export const userApi = {
  login: (data) => api.post('/user/login', data)
};

// 菜单API
export const menuApi = {
  getAll: () => api.get('/menu/all'),
  getByUser: () => api.get('/menu/user')
};

// NodeTemplate API
export const nodeTemplateApi = {
  listByFolder: (folderName) => api.get(`/node-template/listByFolder?folderName=${folderName}`),
  getById: (id) => api.get(`/node-template/${id}`),
  getByFolder: (folderName) => api.get(`/node-template/folder/${folderName}`),
  create: (data) => api.post('/node-template', data),
  update: (id, data) => api.post(`/node-template/${id}`, data),
  delete: (id) => api.delete(`/node-template/${id}`)
};


export const graphApi = {
  listByProjectAndName: (name) => api.get(`/graph/search?&name=${name}`),
  getById: (id) => api.get(`/graph/${id}`),
  create: (data) => api.post('/graph', data),
  update: (id, data) => api.post(`/graph/${id}`, data),
  delete: (id) => api.delete(`/graph/${id}`)
};