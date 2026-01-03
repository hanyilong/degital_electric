import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Select, message, Form, Tag, DatePicker, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LineChartOutlined } from '@ant-design/icons';
import { deviceApi, thingModelApi, timeSeriesApi } from '../utils/api.js';
import dayjs from 'dayjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [thingModels, setThingModels] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceCode: '',
    deviceType: '',
    deviceStatus: '',
    modelId: '',
    deviceInfo: ''
  });

  // 查询条件状态
  const [searchConditions, setSearchConditions] = useState({
    deviceType: '',
    deviceCode: '',
    deviceName: '',
    deviceStatus: ''
  });

  // 用于设备信息JSON的列表+表单编辑
  const [deviceInfoList, setDeviceInfoList] = useState([]);
  const [editingDeviceInfoItem, setEditingDeviceInfoItem] = useState(null);
  const [deviceInfoForm, setDeviceInfoForm] = useState({
    key: '',
    value: '',
    description: ''
  });

  // 时序数据相关状态
  const [timeSeriesVisible, setTimeSeriesVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [pointNames, setPointNames] = useState([]);
  const [selectedPointName, setSelectedPointName] = useState('');
  const [timeRange, setTimeRange] = useState([
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs()
  ]);
  const [activeTabKey, setActiveTabKey] = useState('table'); // 'table' or 'chart'

  useEffect(() => {
    fetchDevices();
    fetchThingModels();
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await deviceApi.getAll();
      setDevices(data);
    } catch (error) {
      message.error('获取设备列表失败');
    }
  };

  // 处理查询条件变化
  const handleSearchConditionChange = (field, value) => {
    setSearchConditions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 执行查询
  const handleSearch = async () => {
    try {
      const data = await deviceApi.searchByConditions(searchConditions);
      setDevices(data);
      message.success('查询成功');
    } catch (error) {
      message.error('查询失败');
    }
  };

  // 重置查询条件
  const handleReset = async () => {
    setSearchConditions({
      deviceType: '',
      deviceCode: '',
      deviceName: '',
      deviceStatus: ''
    });
    // 重置后重新获取所有设备
    fetchDevices();
  };

  const fetchThingModels = async () => {
    try {
      const data = await thingModelApi.getAll();
      setThingModels(data);
    } catch (error) {
      message.error('获取物模型列表失败');
    }
  };

  // 获取点位的中文名称
  const getPointChineseName = (pointName) => {
    if (!selectedDevice || !selectedDevice.modelId) return pointName;

    // 找到设备对应的物模型
    const model = thingModels.find(m => m.id === selectedDevice.modelId);
    if (!model) return pointName;

    try {
      // 检查属性
      const attributes = JSON.parse(model.attributes || '{}');
      if (attributes[pointName] && attributes[pointName].name) {
        return attributes[pointName].name;
      }

      // 检查功能
      const functions = JSON.parse(model.functions || '{}');
      if (functions[pointName] && functions[pointName].name) {
        return functions[pointName].name;
      }

      // 检查事件
      const events = JSON.parse(model.events || '{}');
      if (events[pointName] && events[pointName].name) {
        return events[pointName].name;
      }

      return pointName;
    } catch (error) {
      console.error('解析物模型失败:', error);
      return pointName;
    }
  };

  // 获取设备的点位名称
  const fetchPointNames = async (deviceCode) => {
    try {
      console.log('获取点位名称，设备编码:', deviceCode);
      
      // 从设备列表中找到当前设备
      const device = devices.find(d => d.deviceCode === deviceCode);
      if (!device || !device.modelId) {
        console.error('设备不存在或未关联物模型');
        setPointNames([]);
        setSelectedPointName('');
        return;
      }

      // 根据设备的modelId获取物模型
      const model = thingModels.find(m => m.id === device.modelId);
      if (!model) {
        console.error('未找到对应的物模型');
        setPointNames([]);
        setSelectedPointName('');
        return;
      }

      // 从物模型中提取所有点位名称
      const pointNames = [];

      // 解析属性
      try {
        const attributes = JSON.parse(model.attributes || '{}');
        if (attributes) {
          Object.keys(attributes).forEach(key => {
            pointNames.push(key);
          });
        }
      } catch (error) {
        console.error('解析物模型属性失败:', error);
      }

      console.log('从物模型获取点位名称成功:', pointNames);
      setPointNames(pointNames);
      if (pointNames.length > 0) {
        setSelectedPointName(pointNames[0]);
      }
    } catch (error) {
      console.error('获取点位名称失败:', error);
      message.error('获取点位名称失败');
      setPointNames([]);
      setSelectedPointName('');
    }
  };

  // 获取时序数据
  const fetchTimeSeriesData = async () => {
    if (!selectedDevice) return;

    try {
      const startTime = timeRange[0].format('YYYY-MM-DD HH:mm:ss');
      const endTime = timeRange[1].format('YYYY-MM-DD HH:mm:ss');

      let data;
      if (selectedPointName) {
        // 使用InfluxDB API获取数据
        data = await timeSeriesApi.getFromInfluxDBByDeviceCodePointNameAndTimeRange(
          selectedDevice.deviceCode,
          selectedPointName,
          startTime,
          endTime
        );
      } else {
        // 使用InfluxDB API获取数据
        data = await timeSeriesApi.getFromInfluxDBByDeviceCodeAndTimeRange(
          selectedDevice.deviceCode,
          startTime,
          endTime
        );
      }

      setTimeSeriesData(data);
    } catch (error) {
      message.error('获取时序数据失败');
    }
  };

  // 快捷时间选择处理函数
  const handleQuickTimeSelect = (type) => {
    let endTime = dayjs().endOf('day'); // 设置为当天23:59:59
    let startTime;

    switch (type) {
      case '1h':
        startTime = endTime.subtract(1, 'hour');
        break;
      case '1d':
        startTime = endTime.subtract(1, 'day').startOf('day'); // 设置为昨天00:00:00
        break;
      case '7d':
        startTime = endTime.subtract(7, 'day').startOf('day'); // 设置为7天前00:00:00
        break;
      case '1m':
        startTime = endTime.subtract(1, 'month').startOf('day'); // 设置为1个月前00:00:00
        break;
      default:
        startTime = endTime.subtract(7, 'day').startOf('day');
    }

    setTimeRange([startTime, endTime]);
    // 自动查询数据
    fetchTimeSeriesData();
  };

  // 准备图表数据
  const prepareChartData = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // 对数据按时间排序
    const sortedData = [...timeSeriesData].sort((a, b) => {
      return new Date(a.recordTime) - new Date(b.recordTime);
    });

    // 提取时间标签
    const labels = sortedData.map(item => {
      return dayjs(item.recordTime).format('MM-DD HH:mm');
    });

    // 按点位名称分组数据
    const pointDataMap = {};
    sortedData.forEach(item => {
      if (!pointDataMap[item.pointName]) {
        pointDataMap[item.pointName] = [];
      }
      pointDataMap[item.pointName].push(item.pointValue);
    });

    // 生成不同颜色
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#8ACB88', '#F06595', '#64B5F6', '#4DD0E1', '#AED581', '#FFB74D'
    ];

    // 生成数据集
    const datasets = Object.keys(pointDataMap).map((pointName, index) => {
      return {
        label: getPointChineseName(pointName),
        data: pointDataMap[pointName],
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1,
        fill: false
      };
    });

    return {
      labels,
      datasets
    };
  };

  // 图表配置选项
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: '点位值'
        }
      },
      x: {
        title: {
          display: true,
          text: '时间'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedDevice?.deviceName || '设备'} 时序曲线`
      }
    }
  };

  // 打开时序数据查看模态框
  const handleOpenTimeSeries = (device) => {
    setSelectedDevice(device);
    setTimeSeriesVisible(true);
    fetchPointNames(device.deviceCode);
    // 默认查询最近7天的数据
    setTimeRange([
      dayjs().subtract(7, 'day').startOf('day'),
      dayjs()
    ]);
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      deviceName: '',
      deviceCode: '',
      deviceType: '',
      deviceStatus: '',
      modelId: '',
      deviceInfo: ''
    });
    setDeviceInfoList([]);
    setVisible(true);
  };

  const handleEdit = (row) => {
    setEditingDevice(row);
    setFormData({
      deviceName: row.deviceName || '',
      deviceCode: row.deviceCode || '',
      deviceType: row.deviceType || '',
      deviceStatus: row.deviceStatus || '',
      modelId: row.modelId || '',
      deviceInfo: row.deviceInfo || ''
    });
    // 将JSON转换为列表
    setDeviceInfoList(jsonToList(row.deviceInfo || ''));
    setVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该设备吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      async onOk() {
        try {
          await deviceApi.delete(id);
          message.success('删除成功');
          fetchDevices();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // 简单表单验证
      if (!formData.deviceName) {
        message.error('请输入设备名称');
        return;
      }
      if (!formData.deviceCode) {
        message.error('请输入设备编码');
        return;
      }
      if (!formData.deviceType) {
        message.error('请输入设备类型');
        return;
      }
      if (!formData.deviceStatus) {
        message.error('请选择设备状态');
        return;
      }
      if (!formData.modelId) {
        message.error('请选择物模型');
        return;
      }

      if (editingDevice) {
        await deviceApi.update(editingDevice.id, formData);
        message.success('更新成功');
      } else {
        await deviceApi.create(formData);
        message.success('创建成功');
      }
      setVisible(false);
      fetchDevices();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // JSON格式化功能
  // JSON转列表
  const jsonToList = (jsonString) => {
    if (!jsonString) return [];
    try {
      const json = JSON.parse(jsonString);
      return Object.keys(json).map(key => ({
        key,
        value: json[key],
        description: ''
      }));
    } catch (error) {
      message.error('解析JSON失败');
      return [];
    }
  };

  // 列表转JSON
  const listToJson = (list) => {
    if (!list || list.length === 0) return '';
    const json = list.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    return JSON.stringify(json, null, 2);
  };



  // 处理添加设备信息项
  const handleAddDeviceInfoItem = () => {
    setEditingDeviceInfoItem(null);
    setDeviceInfoForm({
      key: '',
      value: '',
      description: ''
    });
  };

  // 处理编辑设备信息项
  const handleEditDeviceInfoItem = (item) => {
    setEditingDeviceInfoItem(item);
    setDeviceInfoForm({
      key: item.key,
      value: item.value,
      description: item.description
    });
  };

  // 处理删除设备信息项
  const handleDeleteDeviceInfoItem = (key) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该设备信息项吗？',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk() {
        const newList = deviceInfoList.filter(item => item.key !== key);
        setDeviceInfoList(newList);
        // 更新JSON数据
        setFormData(prev => ({
          ...prev,
          deviceInfo: listToJson(newList)
        }));
      }
    });
  };

  // 处理设备信息表单数据变化
  const handleDeviceInfoFormChange = (field, value) => {
    setDeviceInfoForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理保存设备信息项
  const handleSaveDeviceInfoItem = () => {
    if (!deviceInfoForm.key) {
      message.error('请输入键名');
      return;
    }

    let newList;
    if (editingDeviceInfoItem) {
      // 更新现有项
      newList = deviceInfoList.map(item =>
        item.key === editingDeviceInfoItem.key ? deviceInfoForm : item
      );
    } else {
      // 检查键名是否已存在
      if (deviceInfoList.some(item => item.key === deviceInfoForm.key)) {
        message.error('键名已存在');
        return;
      }
      // 添加新项
      newList = [...deviceInfoList, deviceInfoForm];
    }

    setDeviceInfoList(newList);
    // 更新JSON数据
    setFormData(prev => ({
      ...prev,
      deviceInfo: listToJson(newList)
    }));
    // 重置表单
    setEditingDeviceInfoItem(null);
    setDeviceInfoForm({
      key: '',
      value: '',
      description: ''
    });
  };

  // 处理取消编辑设备信息项
  const handleCancelDeviceInfoItem = () => {
    setEditingDeviceInfoItem(null);
    setDeviceInfoForm({
      key: '',
      value: '',
      description: ''
    });
  };

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      width: 180,
      key: 'deviceName'
    },
    {
      title: '设备编码',
      dataIndex: 'deviceCode',
      width: 180,
      key: 'deviceCode'
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      width: 120,
      key: 'deviceType'
    },
    {
      title: '设备状态',
      dataIndex: 'deviceStatus',
      width: 120,
      key: 'deviceStatus',
      render: (status) => {
        let color = '';
        switch (status) {
          case 'online':
            color = 'green';
            break;
          case 'offline':
            color = 'red';
            break;
          default:
            color = 'orange';
        }
        return <Tag color={color}>{status === 'online' ? '在线' : status === 'offline' ? '离线' : '未知'}</Tag>;
      }
    },
    {
      title: '物模型',
      dataIndex: 'modelId',
      width: 150,
      key: 'modelId',
      render: (modelId) => {
        const model = thingModels.find(m => m.id === modelId);
        return model ? model.modelName : '-';
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      key: 'createTime',
      render: (time) => time ? time.substring(0, 16) : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      key: 'updateTime',
      render: (time) => time ? time.substring(0, 16) : '-'
    },
    {
      title: '操作',
      width: 250,
      key: 'action',
      render: (text, record) => (
        <>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: '10px' }}>编辑</Button>
          <Button type="danger" size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} style={{ marginRight: '10px' }}>删除</Button>
          <Button type="default" size="small" icon={<LineChartOutlined />} onClick={() => handleOpenTimeSeries(record)}>查看数据</Button>
        </>
      )
    }
  ];

  const statusOptions = [
    { label: '在线', value: 'online' },
    { label: '离线', value: 'offline' },
    { label: '未知', value: 'unknown' }
  ];

  const deviceTypeOptions = [
    { label: '传感器', value: 'sensor' },
    { label: '执行器', value: 'actuator' },
    { label: '网关', value: 'gateway' },
    { label: '控制器', value: 'controller' }
  ];

  // 时序数据表格列定义
  const timeSeriesColumns = [
    {
      title: '记录时间',
      dataIndex: 'recordTime',
      width: 200,
      key: 'recordTime'
    },
    {
      title: '点位名称',
      dataIndex: 'pointName',
      width: 150,
      key: 'pointName',
      render: (pointName) => getPointChineseName(pointName)
    },
    { title: '点位值', dataIndex: 'pointValue', width: 120, key: 'pointValue', render: (value) => value ? value.toFixed(2) : '-' }
  ];

  return (
    <div>
      <h1 className="page-title">设备管理</h1>

      {/* 查询表单 */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Form layout="inline" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Form.Item label="设备类型">
            <Select
              placeholder="请选择设备类型"
              value={searchConditions.deviceType}
              onChange={(value) => handleSearchConditionChange('deviceType', value)}
              style={{ width: 150 }}
            >
              {deviceTypeOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="设备编码">
            <Input
              placeholder="请输入设备编码"
              value={searchConditions.deviceCode}
              onChange={(e) => handleSearchConditionChange('deviceCode', e.target.value)}
              style={{ width: 150 }}
            />
          </Form.Item>

          <Form.Item label="设备名称">
            <Input
              placeholder="请输入设备名称"
              value={searchConditions.deviceName}
              onChange={(e) => handleSearchConditionChange('deviceName', e.target.value)}
              style={{ width: 150 }}
            />
          </Form.Item>

          <Form.Item label="在线状态">
            <Select
              placeholder="请选择状态"
              value={searchConditions.deviceStatus}
              onChange={(value) => handleSearchConditionChange('deviceStatus', value)}
              style={{ width: 150 }}
            >
              {statusOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSearch} style={{ marginRight: '8px' }}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加设备</Button>
      </div>
      <Table
        columns={columns}
        dataSource={devices}
        rowKey="id"
        bordered
        style={{ width: '100%' }}
        pagination={{
          total: devices.length,
          pageSize: 10
        }}
      />

      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={700}
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="主要信息" key="1">
            <Form layout="vertical">
              <Form.Item
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input
                  placeholder="请输入设备名称"
                  value={formData.deviceName}
                  onChange={(e) => handleInputChange('deviceName', e.target.value)}
                />
              </Form.Item>
              <Form.Item
                label="设备编码"
                rules={[{ required: true, message: '请输入设备编码' }]}
              >
                <Input
                  placeholder="请输入设备编码"
                  value={formData.deviceCode}
                  onChange={(e) => handleInputChange('deviceCode', e.target.value)}
                />
              </Form.Item>
              <Form.Item
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select
                  placeholder="请选择设备类型"
                  value={formData.deviceType}
                  onChange={(value) => handleInputChange('deviceType', value)}
                >
                  {deviceTypeOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="设备状态"
                rules={[{ required: true, message: '请选择设备状态' }]}
              >
                <Select
                  placeholder="请选择设备状态"
                  value={formData.deviceStatus}
                  onChange={(value) => handleInputChange('deviceStatus', value)}
                >
                  {statusOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="物模型"
                rules={[{ required: true, message: '请选择物模型' }]}
              >
                <Select
                  placeholder="请选择物模型"
                  value={formData.modelId}
                  onChange={(value) => handleInputChange('modelId', value)}
                >
                  {thingModels.map(model => (
                    <Select.Option key={model.id} value={model.id}>{model.modelName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                <Button onClick={() => setVisible(false)} style={{ marginRight: '10px' }}>取消</Button>
                <Button type="primary" onClick={handleSubmit}>确定</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="扩展信息" key="2">
            <div>
              <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddDeviceInfoItem}
                >
                  添加扩展信息项
                </Button>
              </div>
              <Table
                columns={[
                  { title: '键', dataIndex: 'key', key: 'key', width: 150 },
                  { title: '值', dataIndex: 'value', key: 'value', width: 200 },
                  { title: '描述', dataIndex: 'description', key: 'description', width: 200 },
                  {
                    title: '操作',
                    key: 'action',
                    width: 120,
                    render: (text, record) => (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleEditDeviceInfoItem(record)}
                        >
                          编辑
                        </Button>
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => handleDeleteDeviceInfoItem(record.key)}
                        >
                          删除
                        </Button>
                      </div>
                    )
                  }
                ]}
                dataSource={deviceInfoList}
                rowKey="key"
                bordered
                pagination={false}
                style={{ marginBottom: '20px' }}
              />
              <Form layout="vertical">
                <Form.Item
                  label="键"
                  rules={[{ required: true, message: '请输入键名' }]}
                >
                  <Input
                    placeholder="请输入键名"
                    value={deviceInfoForm.key}
                    onChange={(e) => handleDeviceInfoFormChange('key', e.target.value)}
                  />
                </Form.Item>
                <Form.Item
                  label="值"
                  rules={[{ required: true, message: '请输入值' }]}
                >
                  <Input
                    placeholder="请输入值"
                    value={deviceInfoForm.value}
                    onChange={(e) => handleDeviceInfoFormChange('value', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="描述">
                  <Input.TextArea
                    placeholder="请输入描述（可选）"
                    rows={2}
                    value={deviceInfoForm.description}
                    onChange={(e) => handleDeviceInfoFormChange('description', e.target.value)}
                  />
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                  <Button onClick={handleCancelDeviceInfoItem} style={{ marginRight: '10px' }}>取消</Button>
                  <Button type="primary" onClick={handleSaveDeviceInfoItem}>保存</Button>
                </Form.Item>
              </Form>
              <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>JSON预览：</h4>
                <pre style={{ margin: 0, padding: '10px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'auto', maxHeight: '150px', fontFamily: 'monospace' }}>
                  {formData.deviceInfo || '{}'}
                </pre>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Modal>

      {/* 时序数据查看模态框 */}
      <Modal
        title={`${selectedDevice?.deviceName || '设备'} 时序数据`}
        open={timeSeriesVisible}
        onCancel={() => setTimeSeriesVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <div style={{ marginBottom: '20px' }}>
          <Form layout="inline">
            <Form.Item label="点位名称">
              <Select
                value={selectedPointName}
                onChange={(value) => setSelectedPointName(value)}
                style={{ width: 150 }}
              >
                {pointNames.map(name => (
                  <Select.Option key={name} value={name}>{getPointChineseName(name)}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="时间范围">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <DatePicker.RangePicker
                  value={timeRange}
                  onChange={(value) => setTimeRange(value)}
                  showTime={{ format: 'HH:00' }}
                  format="YYYY-MM-DD HH:00"
                  style={{ width: 300 }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={() => handleQuickTimeSelect('1h')}>最近1小时</Button>
                  <Button onClick={() => handleQuickTimeSelect('1d')}>最近1天</Button>
                  <Button onClick={() => handleQuickTimeSelect('7d')}>最近7天</Button>
                  <Button onClick={() => handleQuickTimeSelect('1m')}>最近1个月</Button>
                </div>
              </div>
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={fetchTimeSeriesData}>查询</Button>
            </Form.Item>
          </Form>
        </div>

        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
          <Tabs.TabPane tab="表格" key="table">
            <Table
              columns={timeSeriesColumns}
              dataSource={timeSeriesData}
              rowKey="id"
              bordered
              style={{ width: '100%' }}
              pagination={{
                total: timeSeriesData.length,
                pageSize: 15
              }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="曲线" key="chart">
            <div style={{ height: 400 }}>
              <Line data={prepareChartData()} options={chartOptions} />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
}

export default DeviceList;