import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Select, DatePicker, Tag, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { alarmRecordApi, deviceApi, thingModelApi } from '../utils/api.js';

function AlarmDataQuery() {
  const [alarmRecords, setAlarmRecords] = useState([]);
  const [devices, setDevices] = useState([]);
  const [thingModels, setThingModels] = useState([]);
  const [searchParams, setSearchParams] = useState({
    deviceCode: '',
    deviceCodeInput: '',
    modelId: '',
    alarmLevel: '',
    status: '',
    startTime: null,
    endTime: null
  });

  const fetchDevices = useCallback(async () => {
    try {
      const data = await deviceApi.getAll();
      // 同时支持直接返回数组和包含value属性的对象
      setDevices(Array.isArray(data) ? data : data?.value || []);
    } catch (error) {
      console.error('获取设备列表失败:', error);
      message.error('获取设备列表失败');
      setDevices([]);
    }
  }, []);

  const fetchThingModels = useCallback(async () => {
    try {
      const data = await thingModelApi.getAll();
      // 同时支持直接返回数组和包含value属性的对象
      setThingModels(Array.isArray(data) ? data : data?.value || []);
    } catch (error) {
      message.error('获取物模型列表失败');
      setThingModels([]);
    }
  }, []);

  const fetchAlarmRecords = useCallback(async () => {
    try {
      // 创建查询参数，优先使用deviceCodeInput（直接输入的设备编码），如果没有则使用deviceCode（下拉选择的设备编码）
      const params = {
        ...searchParams,
        deviceCode: searchParams.deviceCodeInput || searchParams.deviceCode,
        startTime: searchParams.startTime ? searchParams.startTime.format('YYYY-MM-DD') : null,
        endTime: searchParams.endTime ? searchParams.endTime.format('YYYY-MM-DD') : null
      };
      
      // 删除不需要发送到后端的字段
      delete params.deviceCodeInput;
      
      const data = await alarmRecordApi.getByConditions(params);
      // 同时支持直接返回数组和包含value属性的对象
      setAlarmRecords(Array.isArray(data) ? data : data?.value || []);
    } catch (error) {
      message.error('获取告警记录失败');
      setAlarmRecords([]);
    }
  }, [searchParams]);

  // 初始加载数据
  useEffect(() => {
    fetchDevices();
    fetchThingModels();
    fetchAlarmRecords();
  }, [fetchDevices, fetchThingModels, fetchAlarmRecords]);

  // 当物模型变化时，更新设备列表
  useEffect(() => {
    if (searchParams.modelId) {
      // 当选择了物模型时，只显示该物模型下的设备
      deviceApi.getByModelId(searchParams.modelId)
        .then(data => {
          // 同时支持直接返回数组和包含value属性的对象
          setDevices(Array.isArray(data) ? data : data?.value || []);
        })
        .catch(error => {
          console.error('获取物模型下的设备失败:', error);
          message.error('获取设备列表失败');
          setDevices([]);
        });
    } else {
      // 当未选择物模型时，显示所有设备
      fetchDevices();
    }
  }, [searchParams.modelId, fetchDevices]);



  const handleSearch = () => {
    fetchAlarmRecords();
  };

  const handleReset = () => {
    setSearchParams({
      deviceCode: '',
      deviceCodeInput: '',
      modelId: '',
      alarmLevel: '',
      status: '',
      startTime: null,
      endTime: null
    });
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const resolveTime = status === 'resolved' ? new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-') : null;
      await alarmRecordApi.updateStatus(id, status, resolveTime);
      message.success('告警状态更新成功');
      fetchAlarmRecords();
    } catch (error) {
      message.error('告警状态更新失败');
    }
  };

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const columns = [
    {
      title: '设备编码',
      dataIndex: 'deviceCode',
      width: 150,
      key: 'deviceCode',
      // render: (deviceCode) => {
      //   const device = devices.find(d => d.deviceCode === deviceCode);
      //   return device ? device.deviceName : '-';
      // }
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      width: 150,
      key: 'deviceName',
      // render: (deviceCode) => {
      //   const device = devices.find(d => d.deviceCode === deviceCode);
      //   return device ? device.deviceName : '-';
      // }
    },
    // {
    //   title: '物模型',
    //   dataIndex: 'modelId',
    //   width: 150,
    //   key: 'modelId',
    //   // render: (modelId) => {
    //   //   const model = thingModels.find(m => m.id === modelId);
    //   //   return model ? model.modelName : '-';
    //   // }
    // },
    // {
    //   title: '点位名称',
    //   dataIndex: 'pointName',
    //   width: 120,
    //   key: 'pointName'
    // },
    // {
    //   title: '实际值',
    //   dataIndex: 'alarmValue',
    //   width: 100,
    //   key: 'alarmValue',
    //   render: (value) => value !== undefined && value !== null ? value.toFixed(2) : '-'
    // },
    {
      title: '告警条件',
      width: 120,
      key: 'condition',
      render: (text, record) => {
        return record.alarmMessage || '-';
      }
    },
    {
      title: '告警级别',
      dataIndex: 'alarmLevel',
      width: 120,
      key: 'alarmLevel',
      render: (level) => {
        let color = '';
        switch (level) {
          case 'high':
            color = 'red';
            break;
          case 'medium':
            color = 'orange';
            break;
          case 'low':
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{level === 'high' ? '高级' : level === 'medium' ? '中级' : '低级'}</Tag>;
      }
    },
    {
      title: '告警状态',
      dataIndex: 'status',
      width: 120,
      key: 'status',
      render: (status) => {
        let color = status === 'active' ? 'red' : 'green';
        let text = status === 'active' ? '未处理' : '已处理';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '告警时间',
      dataIndex: 'alarmTime',
      width: 180,
      key: 'alarmTime',
      render: (time) => {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-');
      }
    },
    {
      title: '处理时间',
      dataIndex: 'resolveTime',
      width: 180,
      key: 'resolveTime',
      render: (time) => {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-');
      }
    },
    {
      title: '操作',
      width: 150,
      key: 'action',
      render: (text, record) => (
        <>
          {record.status === 'active' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckOutlined />} 
              onClick={() => handleUpdateStatus(record.id, 'resolved')}
              style={{ marginRight: '10px' }}
            >
              标记已处理
            </Button>
          )}
          {record.status === 'resolved' && (
            <Button 
              type="default" 
              size="small" 
              icon={<CloseOutlined />} 
              onClick={() => handleUpdateStatus(record.id, 'active')}
            >
              标记未处理
            </Button>
          )}
        </>
      )
    }
  ];

  const alarmLevelOptions = [
    { label: '高级', value: 'high' },
    { label: '中级', value: 'medium' },
    { label: '低级', value: 'low' }
  ];

  const statusOptions = [
    { label: '未处理', value: 'active' },
    { label: '已处理', value: 'resolved' }
  ];

  return (
    <div>
      <h1 className="page-title">告警数据查询</h1>
      
      {/* 查询表单 */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Form layout="inline" size="middle">
          <Form.Item label="物模型">
            <Select 
              placeholder="请选择物模型"
              value={searchParams.modelId}
              onChange={(value) => handleInputChange('modelId', value)}
              style={{ width: 200 }}
              allowClear
            >
              {thingModels.map(model => (
                <Select.Option key={model.id} value={model.id}>{model.modelName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="设备">
            <Select 
              placeholder="请选择设备"
              value={searchParams.deviceCode}
              onChange={(value) => handleInputChange('deviceCode', value)}
              style={{ width: 200 }}
              allowClear
              showSearch
              filterOption={false}
              onSearch={async (value) => {
                if (value) {
                  try {
                    let data;
                    // 根据是否选择了物模型，使用不同的搜索接口
                    if (searchParams.modelId) {
                      data = await deviceApi.searchByModelIdAndKeyword(searchParams.modelId, value);
                    } else {
                      data = await deviceApi.searchByName(value);
                    }
                    // 同时支持直接返回数组和包含value属性的对象
                    setDevices(Array.isArray(data) ? data : data?.value || []);
                  } catch (error) {
                    console.error('搜索设备失败:', error);
                    message.error('搜索设备失败');
                    setDevices([]);
                  }
                } else {
                  // 如果搜索词为空，根据是否选择了物模型来决定获取哪种设备列表
                  if (searchParams.modelId) {
                    deviceApi.getByModelId(searchParams.modelId)
                      .then(data => {
                        // 同时支持直接返回数组和包含value属性的对象
                        setDevices(Array.isArray(data) ? data : data?.value || []);
                      })
                      .catch(error => {
                        console.error('获取物模型下的设备失败:', error);
                        message.error('获取设备列表失败');
                        setDevices([]);
                      });
                  } else {
                    fetchDevices();
                  }
                }
              }}
            >
              {devices.map(device => (
                <Select.Option key={device.deviceCode} value={device.deviceCode}>{device.deviceName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="设备编码">
            <Input 
              placeholder="直接输入设备编码"
              value={searchParams.deviceCodeInput}
              onChange={(e) => handleInputChange('deviceCodeInput', e.target.value)}
              style={{ width: 200 }}
            />
          </Form.Item>
          
          <Form.Item label="告警级别">
            <Select 
              placeholder="请选择告警级别"
              value={searchParams.alarmLevel}
              onChange={(value) => handleInputChange('alarmLevel', value)}
              style={{ width: 150 }}
              allowClear
            >
              {alarmLevelOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="告警状态">
            <Select 
              placeholder="请选择告警状态"
              value={searchParams.status}
              onChange={(value) => handleInputChange('status', value)}
              style={{ width: 150 }}
              allowClear
            >
              {statusOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="告警时间">
            <DatePicker.RangePicker
              value={[searchParams.startTime, searchParams.endTime]}
              onChange={(value) => {
                handleInputChange('startTime', value ? value[0] : null);
                handleInputChange('endTime', value ? value[1] : null);
              }}
              style={{ width: 300 }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </Form.Item>
          
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
      </div>
      
      {/* 告警记录表格 */}
      <Table
        columns={columns}
        dataSource={alarmRecords}
        rowKey="id"
        bordered
        style={{ width: '100%' }}
        pagination={{
          total: alarmRecords.length,
          pageSize: 10
        }}
      />
    </div>
  );
}

export default AlarmDataQuery;