import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Select, message, Form, Tabs, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { thingModelApi } from '../utils/api.js';

function ThingModelList() {
  const [thingModels, setThingModels] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [formData, setFormData] = useState({
    modelName: '',
    modelDescription: '',
    modelType: '',
    attributes: '',
    functions: '',
    events: ''
  });
  
  // 用于列表+表单编辑的数据结构
  const [attributesList, setAttributesList] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  
  // 当前编辑的项
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [editingFunction, setEditingFunction] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // 表单编辑数据
  const [attributeForm, setAttributeForm] = useState({
    key: '',
    name: '',
    type: '',
    description: '',
    required: false
  });
  
  const [functionForm, setFunctionForm] = useState({
    key: '',
    name: '',
    input: '',
    output: '',
    description: ''
  });
  
  const [eventForm, setEventForm] = useState({
    key: '',
    name: '',
    parameters: '',
    description: ''
  });

  useEffect(() => {
    // 先修复JSON数据，然后再获取物模型列表
    const initData = async () => {
      try {
        // 调用后端修复接口修复所有物模型数据
        const fixResult = await thingModelApi.fixJsonData();
        
        // 获取修复后的物模型列表
        fetchThingModels();
      } catch (error) {
        console.error('初始化数据失败:', error);
        // 即使修复失败，也尝试获取物模型列表
        fetchThingModels();
      }
    };
    
    initData();
  }, []);

  const fetchThingModels = async () => {
    try {
      const data = await thingModelApi.getAll();
      setThingModels(data);
    } catch (error) {
      console.error('获取物模型列表失败的详细错误:', error);
      message.error('获取物模型列表失败');
    }
  };

    // JSON转列表
  const jsonToList = (jsonString, type = 'attribute') => {
    if (!jsonString) return [];
    try {
      // 添加详细调试信息
      console.log(`开始解析${type}数据:`);
      console.log(`原始数据:`, jsonString);
      console.log(`数据类型:`, typeof jsonString);
      
      let json;
      // 如果已经是对象，直接使用
      if (typeof jsonString === 'object' && jsonString !== null) {
        json = jsonString;
        console.log(`直接使用对象:`, json);
      } else {
        // 去除可能的前后空格和换行符
        let trimmedString = jsonString.trim();
        console.log(`去除空格后:`, trimmedString);
        
        try {
          // 尝试直接解析
          json = JSON.parse(trimmedString);
          console.log(`直接解析成功:`, json);
        } catch (error1) {
          console.log(`第一次解析失败，尝试修复JSON格式:`, error1.message);
          
          // 修复常见的JSON格式错误
          let fixedString = trimmedString;
          
          // 1. 修复嵌套JSON中的花括号转义问题
          fixedString = fixedString.replace(/"{/g, '{"')
            .replace(/}"/g, '"}');
          
          // 2. 修复属性名缺少引号的情况
          fixedString = fixedString.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');
          
          // 3. 修复字符串值缺少引号的情况（仅适用于简单值）
          fixedString = fixedString.replace(/:\s*([a-zA-Z0-9_]+)\s*([,}])/g, ':"$1"$2');
          
          // 4. 修复对象内部缺少引号的花括号
          fixedString = fixedString.replace(/}([^}])/g, '"}$1')
            .replace(/([^{]){/g, '$1{"');
          
          // 5. 修复JSON数组中的对象
          fixedString = fixedString.replace(/\[\s*{/g, '[{')
            .replace(/}\s*\]/g, '}]');
          
          // 6. 修复多余的逗号
          fixedString = fixedString.replace(/,\s*([}\]])/g, '$1');
          
          // 7. 修复未转义的双引号（在字符串内部）
          fixedString = fixedString.replace(/([^\\])"([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1"$2"');
          
          console.log(`修复后的JSON:`, fixedString);
          
          try {
            // 尝试解析修复后的字符串
            json = JSON.parse(fixedString);
            console.log(`修复后解析成功:`, json);
          } catch (error2) {
            console.log(`第二次解析失败，尝试基于字符遍历的修复方法:`, error2.message);
            
            // 使用更复杂的字符遍历方法修复
            let result = '';
            let inString = false;
            let escapeNext = false;
            
            for (let i = 0; i < fixedString.length; i++) {
              let char = fixedString.charAt(i);
              
              if (escapeNext) {
                result += char;
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                result += char;
                escapeNext = true;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                result += char;
                continue;
              }
              
              if (inString) {
                // 在字符串内部，转义花括号
                if (char === '{') {
                  result += '\\{';
                } else if (char === '}') {
                  result += '\\}';
                } else {
                  result += char;
                }
              } else {
                // 在字符串外部，正常添加字符
                result += char;
              }
            }
            
            console.log(`复杂修复后的JSON:`, result);
            
            // 最后尝试解析
            json = JSON.parse(result);
            console.log(`复杂修复后解析成功:`, json);
          }
        }
      }
      
      console.log(`解析结果类型:`, typeof json);
      
      // 检查json是否为对象
      if (typeof json !== 'object' || json === null) {
        console.error(`解析${type}数据失败: JSON不是有效的对象类型`, json);
        message.error(`解析${type}数据失败：JSON格式错误，必须是对象类型`);
        return [];
      }
      
      if (Array.isArray(json)) {
        console.error(`解析${type}数据失败: JSON是数组而不是对象`, json);
        message.error(`解析${type}数据失败：JSON格式错误，必须是对象类型，不能是数组`);
        return [];
      }
      
      return Object.keys(json).map(key => {
        const value = json[key];
        console.log(`处理键${key}，值类型:`, typeof value, `值:`, value);
        
        // 如果value是对象，展开它
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const processedValue = { ...value };
          
          // 处理从数据库读取的过度转义的JSON字符串
          const fixEscapedJson = (str) => {
            if (typeof str !== 'string') return str;
            // 修复过度转义的花括号
            let fixed = str.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
            // 修复过度转义的引号
            fixed = fixed.replace(/\\"/g, '"');
            return fixed;
          };
          
          // 将转义的JSON字符串字段解析回对象
          if (processedValue.input) {
            try {
              // 先修复可能的过度转义
              const fixedInput = fixEscapedJson(processedValue.input);
              processedValue.input = JSON.parse(fixedInput);
            } catch (error) {
              console.log('无法解析input字段为JSON对象:', processedValue.input, error.message);
              // 如果解析失败，保持原始字符串
            }
          }
          
          if (processedValue.output) {
            try {
              const fixedOutput = fixEscapedJson(processedValue.output);
              processedValue.output = JSON.parse(fixedOutput);
            } catch (error) {
              console.log('无法解析output字段为JSON对象:', processedValue.output, error.message);
            }
          }
          
          if (processedValue.parameters) {
            try {
              const fixedParams = fixEscapedJson(processedValue.parameters);
              processedValue.parameters = JSON.parse(fixedParams);
            } catch (error) {
              console.log('无法解析parameters字段为JSON对象:', processedValue.parameters, error.message);
            }
          }
          
          return {
            key,
            ...processedValue
          };
        } else {
          // 如果value不是对象，将其作为name属性（根据表单字段结构）
          return {
            key,
            name: value
          };
        }
      });
    } catch (error) {
      console.error(`解析${type}数据失败的详细错误:`, error);
      console.error(`解析失败的完整字符串:`, jsonString);
      console.error(`错误位置:`, error.stack);
      message.error(`解析${type}数据失败：${error.message}`);
      return [];
    }
  };

  // 列表转JSON
  const listToJson = (list) => {
    if (!list || list.length === 0) return '';
    const json = list.reduce((acc, item) => {
      const { key, ...rest } = item;
      
      // 处理可能包含嵌套JSON的字段（input, output, parameters）
      const processedRest = { ...rest };
      
      // 确保input字段是正确的JSON格式
      if (processedRest.input) {
        // 如果input是对象，直接使用（JSON.stringify会自动处理）
        // 如果input是字符串，确保它是有效的JSON字符串
        if (typeof processedRest.input === 'string') {
          try {
            // 尝试解析以确保是有效的JSON
            JSON.parse(processedRest.input);
            // 如果解析成功，直接使用该字符串
          } catch (error) {
            console.log('Input字段不是有效的JSON字符串，将被作为普通字符串处理:', processedRest.input);
          }
        }
        // 如果input是对象，JSON.stringify会自动将其转换为字符串
      }
      
      // 确保output字段是正确的JSON格式
      if (processedRest.output) {
        if (typeof processedRest.output === 'string') {
          try {
            JSON.parse(processedRest.output);
          } catch (error) {
            console.log('Output字段不是有效的JSON字符串，将被作为普通字符串处理:', processedRest.output);
          }
        }
      }
      
      // 确保parameters字段是正确的JSON格式
      if (processedRest.parameters) {
        if (typeof processedRest.parameters === 'string') {
          try {
            JSON.parse(processedRest.parameters);
          } catch (error) {
            console.log('Parameters字段不是有效的JSON字符串，将被作为普通字符串处理:', processedRest.parameters);
          }
        }
      }
      
      acc[key] = processedRest;
      return acc;
    }, {});
    return JSON.stringify(json, null, 2);
  };

  const handleAdd = () => {
    setEditingModel(null);
    setFormData({
      modelName: '',
      modelDescription: '',
      modelType: '',
      attributes: '',
      functions: '',
      events: ''
    });
    // 清空列表数据
    setAttributesList([]);
    setFunctionsList([]);
    setEventsList([]);
    // 清空编辑状态
    setEditingAttribute(null);
    setEditingFunction(null);
    setEditingEvent(null);
    // 重置表单
    setAttributeForm({ key: '', name: '', type: '', description: '', required: false });
    setFunctionForm({ key: '', name: '', input: '', output: '', description: '' });
    setEventForm({ key: '', name: '', parameters: '', description: '' });
    setVisible(true);
  };

  const handleEdit = (row) => {
    setEditingModel(row);
    setFormData({
      modelName: row.modelName || '',
      modelDescription: row.modelDescription || '',
      modelType: row.modelType || '',
      attributes: row.attributes || '',
      functions: row.functions || '',
      events: row.events || ''
    });
    // 解析JSON为列表
    setAttributesList(jsonToList(row.attributes || '', '属性'));
    setFunctionsList(jsonToList(row.functions || '', '功能'));
    setEventsList(jsonToList(row.events || '', '事件'));
    // 清空编辑状态
    setEditingAttribute(null);
    setEditingFunction(null);
    setEditingEvent(null);
    // 重置表单
    setAttributeForm({ key: '', name: '', type: '', description: '', required: false });
    setFunctionForm({ key: '', name: '', input: '', output: '', description: '' });
    setEventForm({ key: '', name: '', parameters: '', description: '' });
    setVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该物模型吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      async onOk() {
        try {
          await thingModelApi.delete(id);
          message.success('删除成功');
          fetchThingModels();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // 简单表单验证
      if (!formData.modelName) {
        message.error('请输入模型名称');
        return;
      }
      if (!formData.modelType) {
        message.error('请选择模型类型');
        return;
      }
      
      // 将列表数据转换为JSON格式
      const submitData = {
        ...formData,
        attributes: listToJson(attributesList),
        functions: listToJson(functionsList),
        events: listToJson(eventsList)
      };
      
      if (editingModel) {
        await thingModelApi.update(editingModel.id, submitData);
        message.success('更新成功');
      } else {
        await thingModelApi.create(submitData);
        message.success('创建成功');
      }
      setVisible(false);
      fetchThingModels();
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

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'modelName',
      width: 180,
      key: 'modelName'
    },
    {
      title: '模型描述',
      dataIndex: 'modelDescription',
      key: 'modelDescription'
    },
    {
      title: '模型类型',
      dataIndex: 'modelType',
      width: 120,
      key: 'modelType'
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

  return (
    <div>
      <h1 className="page-title">物模型管理</h1>
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加物模型</Button>
      </div>
      <Table
        columns={columns}
        dataSource={thingModels}
        rowKey="id"
        bordered
        style={{ width: '100%' }}
        pagination={{
          total: thingModels.length,
          pageSize: 10
        }}
      />

      <Modal
        title={editingModel ? '编辑物模型' : '添加物模型'}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={800}
      >
        <Form layout="vertical">
          <Form.Item
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input 
              placeholder="请输入模型名称" 
              value={formData.modelName}
              onChange={(e) => handleInputChange('modelName', e.target.value)}
            />
          </Form.Item>
          <Form.Item label="模型描述">
            <Input.TextArea 
              placeholder="请输入模型描述" 
              rows={3} 
              value={formData.modelDescription}
              onChange={(e) => handleInputChange('modelDescription', e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="模型类型"
            rules={[{ required: true, message: '请选择模型类型' }]}
          >
            <Select 
              placeholder="请选择模型类型"
              value={formData.modelType}
              onChange={(value) => handleInputChange('modelType', value)}
            >
              <Select.Option value="sensor">传感器</Select.Option>
              <Select.Option value="actuator">执行器</Select.Option>
              <Select.Option value="gateway">网关</Select.Option>
            </Select>
          </Form.Item>
          
          <Tabs defaultActiveKey="attributes" style={{ marginBottom: 20 }}>
            <Tabs.TabPane tab="属性" key="attributes">
              <Card title="属性列表" style={{ marginBottom: 16 }}>
                <Table 
                  columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    { title: '标识', dataIndex: 'key', key: 'key' },
                    { title: '类型', dataIndex: 'type', key: 'type' },
                    { title: '必填', dataIndex: 'required', key: 'required', render: (required) => required ? '是' : '否' },
                    { title: '描述', dataIndex: 'description', key: 'description' },
                    { 
                      title: '操作', 
                      key: 'action', 
                      render: (_, record) => (
                        <span>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<EditOutlined />} 
                            onClick={() => {
                              setEditingAttribute(record);
                              setAttributeForm(record);
                            }}
                          >
                            编辑
                          </Button>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => {
                              setAttributesList(prev => prev.filter(item => item.key !== record.key));
                            }}
                          >
                            删除
                          </Button>
                        </span>
                      ) 
                    }
                  ]} 
                  dataSource={attributesList} 
                  rowKey="key" 
                  pagination={false} 
                  bordered
                  style={{ marginBottom: 16 }}
                />
                
                <Card title={editingAttribute ? '编辑属性' : '添加属性'} size="small">
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="属性标识">
                          <Input 
                            value={attributeForm.key} 
                            onChange={(e) => setAttributeForm(prev => ({ ...prev, key: e.target.value }))} 
                            placeholder="请输入属性标识"
                            disabled={!!editingAttribute}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="属性名称">
                          <Input 
                            value={attributeForm.name} 
                            onChange={(e) => setAttributeForm(prev => ({ ...prev, name: e.target.value }))} 
                            placeholder="请输入属性名称"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="数据类型">
                          <Select 
                            value={attributeForm.type} 
                            onChange={(value) => setAttributeForm(prev => ({ ...prev, type: value }))} 
                            placeholder="请选择数据类型"
                          >
                            <Select.Option value="string">字符串</Select.Option>
                            <Select.Option value="number">数值</Select.Option>
                            <Select.Option value="boolean">布尔值</Select.Option>
                            <Select.Option value="array">数组</Select.Option>
                            <Select.Option value="object">对象</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="是否必填">
                          <Select 
                            value={attributeForm.required ? 'true' : 'false'} 
                            onChange={(value) => setAttributeForm(prev => ({ ...prev, required: value === 'true' }))} 
                          >
                            <Select.Option value="true">是</Select.Option>
                            <Select.Option value="false">否</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="描述">
                      <Input.TextArea 
                        value={attributeForm.description} 
                        onChange={(e) => setAttributeForm(prev => ({ ...prev, description: e.target.value }))} 
                        placeholder="请输入属性描述"
                        rows={2}
                      />
                    </Form.Item>
                    <Form.Item>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          style={{ marginRight: 8 }} 
                          onClick={() => {
                            setEditingAttribute(null);
                            setAttributeForm({ key: '', name: '', type: '', description: '', required: false });
                          }}
                        >
                          取消
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            if (!attributeForm.key || !attributeForm.name || !attributeForm.type) {
                              message.error('请填写必填字段');
                              return;
                            }
                            
                            if (editingAttribute) {
                              setAttributesList(prev => prev.map(item => 
                                item.key === editingAttribute.key ? attributeForm : item
                              ));
                            } else {
                              setAttributesList(prev => [...prev, attributeForm]);
                            }
                            
                            setEditingAttribute(null);
                            setAttributeForm({ key: '', name: '', type: '', description: '', required: false });
                          }}
                        >
                          {editingAttribute ? '更新' : '添加'}
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </Card>
              </Card>
            </Tabs.TabPane>
            <Tabs.TabPane tab="功能" key="functions">
              <Card title="功能列表" style={{ marginBottom: 16 }}>
                <Table 
                  columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    { title: '标识', dataIndex: 'key', key: 'key' },
                    { title: '输入', dataIndex: 'input', key: 'input', ellipsis: true },
                    { title: '输出', dataIndex: 'output', key: 'output', ellipsis: true },
                    { title: '描述', dataIndex: 'description', key: 'description' },
                    { 
                      title: '操作', 
                      key: 'action', 
                      render: (_, record) => (
                        <span>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<EditOutlined />} 
                            onClick={() => {
                              setEditingFunction(record);
                              // 将对象类型的input和output转换为JSON字符串
                              const formData = {
                                ...record,
                                input: record.input ? JSON.stringify(record.input, null, 2) : '',
                                output: record.output ? JSON.stringify(record.output, null, 2) : ''
                              };
                              setFunctionForm(formData);
                            }}
                          >
                            编辑
                          </Button>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => {
                              setFunctionsList(prev => prev.filter(item => item.key !== record.key));
                            }}
                          >
                            删除
                          </Button>
                        </span>
                      ) 
                    }
                  ]} 
                  dataSource={functionsList} 
                  rowKey="key" 
                  pagination={false} 
                  bordered
                  style={{ marginBottom: 16 }}
                />
                
                <Card title={editingFunction ? '编辑功能' : '添加功能'} size="small">
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="功能标识">
                          <Input 
                            value={functionForm.key} 
                            onChange={(e) => setFunctionForm(prev => ({ ...prev, key: e.target.value }))} 
                            placeholder="请输入功能标识"
                            disabled={!!editingFunction}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="功能名称">
                          <Input 
                            value={functionForm.name} 
                            onChange={(e) => setFunctionForm(prev => ({ ...prev, name: e.target.value }))} 
                            placeholder="请输入功能名称"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="输入参数">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', marginBottom: 8 }}>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            格式示例: {`{"param1": {"type": "string", "name": "参数1", "required": true}}`}
                          </span>
                          <Button 
                            type="link" 
                            size="small" 
                            style={{ marginLeft: 'auto', padding: 0 }}
                            onClick={() => {
                              setFunctionForm(prev => ({
                                ...prev,
                                input: JSON.stringify({
                                  param1: { type: "string", name: "参数1", required: true },
                                  param2: { type: "number", name: "参数2", required: false }
                                }, null, 2)
                              }));
                              message.success('已添加输入参数示例');
                            }}
                          >
                            例子
                          </Button>
                        </div>
                        <Input.TextArea 
                          value={functionForm.input} 
                          onChange={(e) => setFunctionForm(prev => ({ ...prev, input: e.target.value }))} 
                          placeholder='请输入输入参数JSON格式，例如: {"param1": {"type": "string", "name": "参数1", "required": true}}'
                          rows={3}
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </Form.Item>
                    <Form.Item label="输出参数">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', marginBottom: 8 }}>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            格式示例: {`{"result": {"type": "boolean", "name": "执行结果"}}`}
                          </span>
                          <Button 
                            type="link" 
                            size="small" 
                            style={{ marginLeft: 'auto', padding: 0 }}
                            onClick={() => {
                              setFunctionForm(prev => ({
                                ...prev,
                                output: JSON.stringify({
                                  result: { type: "boolean", name: "执行结果" },
                                  message: { type: "string", name: "返回消息" }
                                }, null, 2)
                              }));
                              message.success('已添加输出参数示例');
                            }}
                          >
                            例子
                          </Button>
                        </div>
                        <Input.TextArea 
                          value={functionForm.output} 
                          onChange={(e) => setFunctionForm(prev => ({ ...prev, output: e.target.value }))} 
                          placeholder='请输入输出参数JSON格式，例如: {"result": {"type": "boolean", "name": "执行结果"}}'
                          rows={3}
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </Form.Item>
                    <Form.Item label="描述">
                      <Input.TextArea 
                        value={functionForm.description} 
                        onChange={(e) => setFunctionForm(prev => ({ ...prev, description: e.target.value }))} 
                        placeholder="请输入功能描述"
                        rows={2}
                      />
                    </Form.Item>
                    <Form.Item>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          style={{ marginRight: 8 }} 
                          onClick={() => {
                            setEditingFunction(null);
                            setFunctionForm({ key: '', name: '', input: '', output: '', description: '' });
                          }}
                        >
                          取消
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            if (!functionForm.key || !functionForm.name) {
                              message.error('请填写必填字段');
                              return;
                            }
                            
                            // 解析JSON字符串为对象
                            let parsedInput = {};
                            let parsedOutput = {};
                            
                            try {
                              if (functionForm.input) {
                                parsedInput = JSON.parse(functionForm.input);
                              }
                              if (functionForm.output) {
                                parsedOutput = JSON.parse(functionForm.output);
                              }
                            } catch (error) {
                              message.error('JSON格式错误，请检查输入');
                              return;
                            }
                            
                            // 构建包含解析后对象的表单数据
                            const updatedForm = {
                              ...functionForm,
                              input: parsedInput,
                              output: parsedOutput
                            };
                            
                            if (editingFunction) {
                              setFunctionsList(prev => prev.map(item => 
                                item.key === editingFunction.key ? updatedForm : item
                              ));
                            } else {
                              setFunctionsList(prev => [...prev, updatedForm]);
                            }
                            
                            setEditingFunction(null);
                            setFunctionForm({ key: '', name: '', input: '', output: '', description: '' });
                          }}
                        >
                          {editingFunction ? '更新' : '添加'}
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </Card>
              </Card>
            </Tabs.TabPane>
            <Tabs.TabPane tab="事件" key="events">
              <Card title="事件列表" style={{ marginBottom: 16 }}>
                <Table 
                  columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    { title: '标识', dataIndex: 'key', key: 'key' },
                    { title: '参数', dataIndex: 'parameters', key: 'parameters', ellipsis: true },
                    { title: '描述', dataIndex: 'description', key: 'description' },
                    { 
                      title: '操作', 
                      key: 'action', 
                      render: (_, record) => (
                        <span>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<EditOutlined />} 
                            onClick={() => {
                              setEditingEvent(record);
                              // 将对象类型的parameters转换为JSON字符串
                              const formData = {
                                ...record,
                                parameters: record.parameters ? JSON.stringify(record.parameters, null, 2) : ''
                              };
                              setEventForm(formData);
                            }}
                          >
                            编辑
                          </Button>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => {
                              setEventsList(prev => prev.filter(item => item.key !== record.key));
                            }}
                          >
                            删除
                          </Button>
                        </span>
                      ) 
                    }
                  ]} 
                  dataSource={eventsList} 
                  rowKey="key" 
                  pagination={false} 
                  bordered
                  style={{ marginBottom: 16 }}
                />
                
                <Card title={editingEvent ? '编辑事件' : '添加事件'} size="small">
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="事件标识">
                          <Input 
                            value={eventForm.key} 
                            onChange={(e) => setEventForm(prev => ({ ...prev, key: e.target.value }))} 
                            placeholder="请输入事件标识"
                            disabled={!!editingEvent}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="事件名称">
                          <Input 
                            value={eventForm.name} 
                            onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))} 
                            placeholder="请输入事件名称"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="事件参数">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', marginBottom: 8 }}>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            格式示例: {`{"eventParam": {"type": "string", "name": "事件参数", "required": true}}`}
                          </span>
                          <Button 
                            type="link" 
                            size="small" 
                            style={{ marginLeft: 'auto', padding: 0 }}
                            onClick={() => {
                              setEventForm(prev => ({
                                ...prev,
                                parameters: JSON.stringify({
                                  eventParam1: { type: "string", name: "事件参数1", required: true },
                                  eventParam2: { type: "number", name: "事件参数2", required: false }
                                }, null, 2)
                              }));
                              message.success('已添加事件参数示例');
                            }}
                          >
                            例子
                          </Button>
                        </div>
                        <Input.TextArea 
                          value={eventForm.parameters} 
                          onChange={(e) => setEventForm(prev => ({ ...prev, parameters: e.target.value }))} 
                          placeholder='请输入事件参数JSON格式，例如: {"eventParam": {"type": "string", "name": "事件参数", "required": true}}'
                          rows={3}
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </Form.Item>
                    <Form.Item label="描述">
                      <Input.TextArea 
                        value={eventForm.description} 
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))} 
                        placeholder="请输入事件描述"
                        rows={2}
                      />
                    </Form.Item>
                    <Form.Item>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          style={{ marginRight: 8 }} 
                          onClick={() => {
                            setEditingEvent(null);
                            setEventForm({ key: '', name: '', parameters: '', description: '' });
                          }}
                        >
                          取消
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            if (!eventForm.key || !eventForm.name) {
                              message.error('请填写必填字段');
                              return;
                            }
                            
                            // 解析JSON字符串为对象
                            let parsedParameters = {};
                            
                            try {
                              if (eventForm.parameters) {
                                parsedParameters = JSON.parse(eventForm.parameters);
                              }
                            } catch (error) {
                              message.error('JSON格式错误，请检查输入');
                              return;
                            }
                            
                            // 构建包含解析后对象的表单数据
                            const updatedForm = {
                              ...eventForm,
                              parameters: parsedParameters
                            };
                            
                            if (editingEvent) {
                              setEventsList(prev => prev.map(item => 
                                item.key === editingEvent.key ? updatedForm : item
                              ));
                            } else {
                              setEventsList(prev => [...prev, updatedForm]);
                            }
                            
                            setEditingEvent(null);
                            setEventForm({ key: '', name: '', parameters: '', description: '' });
                          }}
                        >
                          {editingEvent ? '更新' : '添加'}
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </Card>
              </Card>
            </Tabs.TabPane>
          </Tabs>
          <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
            <Button onClick={() => setVisible(false)} style={{ marginRight: '10px' }}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>确定</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ThingModelList;