import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, InputNumber, Select, message, Form, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { alarmRuleApi, thingModelApi, deviceApi } from '../utils/api.js';

function AlarmRuleSetting() {
  const [alarmRules, setAlarmRules] = useState([]);
  const [thingModels, setThingModels] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [modelAttributes, setModelAttributes] = useState([]);
  const [formData, setFormData] = useState({
    ruleName: '',
    modelId: '',
    deviceCode: '',
    pointName: '',
    pointDescription: '',
    conditionType: '',
    thresholdValue: '',
    alarmLevel: '',
    isActive: true
  });

  useEffect(() => {
    fetchAlarmRules();
    fetchThingModels();
    fetchDevices();
  }, []);

  const fetchAlarmRules = async () => {
    try {
      const data = await alarmRuleApi.getAll();
      setAlarmRules(data);
    } catch (error) {
      message.error('获取告警规则列表失败');
    }
  };

  const fetchThingModels = async () => {
    try {
      const data = await thingModelApi.getAll();
      setThingModels(data);
    } catch (error) {
      message.error('获取物模型列表失败');
    }
  };

  const fetchDevices = async () => {
    try {
      const data = await deviceApi.getAll();
      setDevices(data);
    } catch (error) {
      message.error('获取设备列表失败');
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    setFormData({
      ruleName: '',
      modelId: '',
      deviceCode: '',
      pointName: '',
      conditionType: '',
      thresholdValue: '',
      alarmLevel: '',
      isActive: true
    });
    setVisible(true);
  };

  const handleEdit = async (row) => {
    setEditingRule(row);
    setFormData({
      ruleName: row.ruleName || '',
      modelId: row.modelId || '',
      deviceCode: row.deviceCode || '',
      pointName: row.pointName || '',
      conditionType: row.conditionType || '',
      thresholdValue: row.thresholdValue || '',
      alarmLevel: row.alarmLevel || '',
      isActive: row.isActive || true
    });
    
    // 解析编辑规则的物模型属性并筛选设备
    if (row.modelId) {
      const selectedModel = thingModels.find(model => model.id === row.modelId);
      if (selectedModel && selectedModel.attributes) {
        try {
          const attributes = JSON.parse(selectedModel.attributes);
          const attributeOptions = Object.keys(attributes).map(key => ({
            label: attributes[key].name || key,
            value: key
          }));
          setModelAttributes(attributeOptions);
        } catch (error) {
          console.error('解析物模型属性失败:', error);
          setModelAttributes([]);
        }
      } else {
        setModelAttributes([]);
      }
      
      // 根据物模型ID筛选设备
      try {
        const filtered = await deviceApi.getByModelId(row.modelId);
        setFilteredDevices(filtered);
      } catch (error) {
        console.error('获取物模型下设备失败:', error);
        setFilteredDevices([]);
      }
    }
    
    setVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条告警规则吗？删除后不可恢复。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await alarmRuleApi.delete(id);
          message.success('删除成功');
          fetchAlarmRules();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // 简单表单验证
      if (!formData.ruleName) {
        message.error('请输入规则名称');
        return;
      }
      if (!formData.modelId) {
        message.error('请选择物模型');
        return;
      }
      if (!formData.pointName) {
        message.error('请输入点位名称');
        return;
      }
      if (!formData.conditionType) {
        message.error('请选择条件类型');
        return;
      }
      if (!formData.thresholdValue) {
        message.error('请输入阈值');
        return;
      }
      if (!formData.alarmLevel) {
        message.error('请选择告警级别');
        return;
      }
      
      // 设置点位描述，根据点位名称从modelAttributes中获取
      const selectedAttribute = modelAttributes.find(attr => attr.value === formData.pointName);
      const pointDescription = selectedAttribute ? selectedAttribute.label : '';
      const completeFormData = { ...formData, pointDescription };

      if (editingRule) {
        await alarmRuleApi.update(editingRule.id, completeFormData);
        message.success('更新成功');
      } else {
        await alarmRuleApi.create(completeFormData);
        message.success('创建成功');
      }
      setVisible(false);
      fetchAlarmRules();
    } catch (error) {
      message.error('操作失败');
    }
  };
  
  const handleInputChange = async (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 当选择物模型时，解析其属性并筛选设备
    if (field === 'modelId') {
      const selectedModel = thingModels.find(model => model.id === value);
      if (selectedModel && selectedModel.attributes) {
        try {
          const attributes = JSON.parse(selectedModel.attributes);
          // 将属性转换为Select.Option需要的格式
          const attributeOptions = Object.keys(attributes).map(key => ({
            label: attributes[key].name || key,
            value: key
          }));
          setModelAttributes(attributeOptions);
        } catch (error) {
          console.error('解析物模型属性失败:', error);
          setModelAttributes([]);
        }
      } else {
        setModelAttributes([]);
      }
      
      // 根据物模型ID筛选设备
      if (value) {
        try {
          const filtered = await deviceApi.getByModelId(value);
          setFilteredDevices(filtered);
        } catch (error) {
          console.error('获取物模型下设备失败:', error);
          setFilteredDevices([]);
        }
      } else {
        setFilteredDevices([]);
      }
    }
  };

  const handleStatusChange = async (id, isActive) => {
    try {
      const rule = {
        id: id,
        isActive: isActive
      }
      await alarmRuleApi.updateStatus(id, rule);
      message.success('状态更新成功');
      fetchAlarmRules();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      width: 180,
      key: 'ruleName'
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
    {title: '设备',
      dataIndex: 'deviceCode',
      width: 150,
      key: 'deviceCode',
      render: (deviceCode) => {
        const device = devices.find(d => d.id === deviceCode);
        return device ? device.deviceName : '所有设备';
      }
    },
    {
      title: '点位名称',
      dataIndex: 'pointName',
      width: 120,
      key: 'pointName'
    },
    {
      title: '条件',
      width: 120,
      key: 'condition',
      render: (text, record) => {
        return `${record.conditionType} ${record.thresholdValue}`;
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
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      key: 'isActive',
      render: (isActive, record) => (
        <Switch 
          checked={isActive} 
          onChange={(checked) => handleStatusChange(record.id, checked)} 
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      key: 'createTime',
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
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      key: 'updateTime',
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
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: '10px' }}>编辑</Button>
          <Button type="danger" size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </>
      )
    }
  ];

  const conditionOptions = [
    { label: '大于', value: '>' },
    { label: '小于', value: '<' },
    { label: '等于', value: '=' },
    { label: '大于等于', value: '>=' },
    { label: '小于等于', value: '<=' },
    { label: '不等于', value: '!=' }
  ];

  const alarmLevelOptions = [
    { label: '高级', value: 'high' },
    { label: '中级', value: 'medium' },
    { label: '低级', value: 'low' }
  ];

  return (
    <div>
      <h1 className="page-title">告警规则设置</h1>
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加告警规则</Button>
      </div>
      <Table
        columns={columns}
        dataSource={alarmRules}
        rowKey="id"
        bordered
        style={{ width: '100%' }}
        pagination={{
          total: alarmRules.length,
          pageSize: 10
        }}
      />

      <Modal
        title={editingRule ? '编辑告警规则' : '添加告警规则'}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input 
              placeholder="请输入规则名称" 
              value={formData.ruleName}
              onChange={(e) => handleInputChange('ruleName', e.target.value)}
            />
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
          <Form.Item label="设备（可选）">
            <Select 
              placeholder="请选择设备（留空表示所有设备）"
              value={formData.deviceCode}
              onChange={(value) => handleInputChange('deviceCode', value)}
              allowClear
            >
              {filteredDevices.map(device => (
                <Select.Option key={device.deviceCode} value={device.deviceCode}>{device.deviceName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="点位名称"
            rules={[{ required: true, message: '请选择点位名称' }]}
          >
            <Select 
              placeholder="请选择点位名称" 
              value={formData.pointName}
              onChange={(value) => handleInputChange('pointName', value)}
            >
              {modelAttributes.map(attr => (
                <Select.Option key={attr.value} value={attr.value}>{attr.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="条件类型"
            rules={[{ required: true, message: '请选择条件类型' }]}
          >
            <Select 
              placeholder="请选择条件类型"
              value={formData.conditionType}
              onChange={(value) => handleInputChange('conditionType', value)}
            >
              {conditionOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber 
              placeholder="请输入阈值" 
              value={formData.thresholdValue}
              onChange={(value) => handleInputChange('thresholdValue', value)}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="告警级别"
            rules={[{ required: true, message: '请选择告警级别' }]}
          >
            <Select 
              placeholder="请选择告警级别"
              value={formData.alarmLevel}
              onChange={(value) => handleInputChange('alarmLevel', value)}
            >
              {alarmLevelOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="启用状态">
            <Switch 
              checked={formData.isActive} 
              onChange={(checked) => handleInputChange('isActive', checked)} 
            />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
            <Button onClick={() => setVisible(false)} style={{ marginRight: '10px' }}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>确定</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AlarmRuleSetting;