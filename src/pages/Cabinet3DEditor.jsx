import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Table, Form, Input, Select, Modal, Upload, ColorPicker, Space, message, Tabs, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SafetyOutlined, SaveOutlined, FolderOpenOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { Canvas } from '@react-three/fiber';
import { Box, Text, OrbitControls } from '@react-three/drei';

// API基础URL
const API_BASE_URL = 'http://localhost:8081/api';

// API调用函数
const api = {
  // 柜型相关API
  async getCabinetTypes() {
    const response = await fetch(`${API_BASE_URL}/cabinet/type`);
    if (!response.ok) throw new Error('获取柜型失败');
    return response.json();
  },
  
  async getCabinetType(code) {
    const response = await fetch(`${API_BASE_URL}/cabinet/type/${code}`);
    if (!response.ok) throw new Error('获取柜型失败');
    return response.json();
  },
  
  async createCabinetType(data) {
    const response = await fetch(`${API_BASE_URL}/cabinet/type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建柜型失败');
    return response.json();
  },
  
  async updateCabinetType(data) {
    const response = await fetch(`${API_BASE_URL}/cabinet/type`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新柜型失败');
    return response.json();
  },
  
  async deleteCabinetType(code) {
    const response = await fetch(`${API_BASE_URL}/cabinet/type/${code}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('删除柜型失败');
    return response.json();
  },
  
  // 柜排相关API
  async getCabinetRooms() {
    const response = await fetch(`${API_BASE_URL}/cabinet/room`);
    if (!response.ok) throw new Error('获取柜排失败');
    return response.json();
  },
  
  async getCabinetRoom(id) {
    const response = await fetch(`${API_BASE_URL}/cabinet/room/${id}`);
    if (!response.ok) throw new Error('获取柜排失败');
    return response.json();
  },
  
  async getCabinetRoomCompleteConfig(id) {
    const response = await fetch(`${API_BASE_URL}/cabinet/roomCompleteConfig/${id}`);
    if (!response.ok) throw new Error('获取柜排完整配置失败');
    return response.json();
  },
  
  async createCabinetRoom(data) {
    const response = await fetch(`${API_BASE_URL}/cabinet/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建柜排失败');
    return response.json();
  },
  
  async updateCabinetRoom(data) {
    const response = await fetch(`${API_BASE_URL}/cabinet/room`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('更新柜排失败');
    return response.json();
  },
  
  async deleteCabinetRoom(id) {
    const response = await fetch(`${API_BASE_URL}/cabinet/room/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('删除柜排失败');
    return response.json();
  },
};

const { Content } = Layout;
const { Dragger } = Upload;
const { TabPane } = Tabs;

// 3D预览组件
const Cabinet3DPreview = ({ type, data, cabinetTypes }) => {
  // 单个柜子预览
  if (type === 'cabinet') {
    return (
      <Canvas style={{ width: '100%', height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <Box
          args={[data.width, data.height, data.length]}
          position={[0, 0, 0]}
          material={{ color: data.color }}
        >
          <meshStandardMaterial color={data.color} />
        </Box>
        <Text position={[0, data.height / 2 + 0.5, 0]} fontSize={0.3}>
          {data.name}
        </Text>
      </Canvas>
    );
  }

  // 柜排预览
  if (type === 'row') {
    return (
      <Canvas style={{ width: '100%', height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {data.cabinets.map((cabinet, index) => {
          const cabinetType = cabinetTypes.find(type => type.code === cabinet.typeId);
          const x = (index - data.cabinets.length / 2 + 0.5) * (cabinetType?.width || 1) * 1.2;
          return (
            <Box
              key={cabinet.id}
              args={[cabinetType?.width || 1, cabinetType?.height || 2, cabinetType?.length || 1]}
              position={[x, 0, 0]}
              material={{ color: cabinetType?.color || '#d9d9d9' }}
            >
              <meshStandardMaterial color={cabinetType?.color || '#d9d9d9'} />
            </Box>
          );
        })}
        <Text position={[0, 2.5, 0]} fontSize={0.3}>
          {data.name}
        </Text>
      </Canvas>
    );
  }

  // 整体预览
  if (type === 'all') {
    return (
      <Canvas style={{ width: '100%', height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {data.cabinetRows.map((row, rowIndex) => {
          const z = (rowIndex - data.cabinetRows.length / 2 + 0.5) * 2;
          return row.cabinets.map((cabinet, cabinetIndex) => {
            const cabinetType = data.cabinetTypes.find(type => type.code === cabinet.typeId);
            const x = (cabinetIndex - row.cabinets.length / 2 + 0.5) * (cabinetType?.width || 1) * 1.2;
            return (
              <Box
                key={cabinet.id}
                args={[cabinetType?.width || 1, cabinetType?.height || 2, cabinetType?.length || 1]}
                position={[x, 0, z]}
                material={{ color: cabinetType?.color || '#d9d9d9' }}
              >
                <meshStandardMaterial color={cabinetType?.color || '#d9d9d9'} />
              </Box>
            );
          });
        })}
        <Text position={[0, 3, 0]} fontSize={0.3}>
          整体配电柜
        </Text>
      </Canvas>
    );
  }

  return null;
};

const Cabinet3DEditor = () => {
  // 柜形设置状态
  const [cabinetTypes, setCabinetTypes] = useState([
    { id: 1, name: '高压进线', length: 1.5, width: 1.2, height: 2, color: '#9c27b0', image: 'default' },
    { id: 2, name: '计量柜', length: 2, width: 1, height: 2, color: '#9c27b0', image: 'default' },
    { id: 3, name: '隔离柜', length: 2, width: 1, height: 2, color: '#9c27b0', image: 'default' },
  ]);

  // 柜排设置状态
  const [cabinetRows, setCabinetRows] = useState([
    {
      id: 1,
      name: '第一排',
      cabinets: [
        { id: 1, code: '1', type: '1', name: '高压进线'},
        { id: 2, code: '2', type: '2', name: '计量柜' },
        { id: 3, code: '3', type: '3', name: '隔离柜' },
      ]
    }
  ]);

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [addCabinetModalVisible, setAddCabinetModalVisible] = useState(false);
  const [previewType, setPreviewType] = useState(''); // 'cabinet', 'row', 'all'
  const [previewData, setPreviewData] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [form] = Form.useForm();
  const [addCabinetForm] = Form.useForm();
  const [editingCabinet, setEditingCabinet] = useState(null);

  // 从后端加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载柜型数据
        const types = await api.getCabinetTypes();
        if (types && types.length > 0) {
          setCabinetTypes(types);
        }

        // 加载柜排数据
        const room = await api.getCabinetRoomCompleteConfig(1);
        if (room) {
          // 转换柜排数据格式以匹配前端预期
          const formattedRooms = [];
          if (room.rows) {
            try {
              const rowsData = JSON.parse(room.rows);
              // 根据用户提供的 JSON 格式，rowsData 是一个数组，包含多个对象
              // 每个对象有 name 和 cabinets 字段
              if (Array.isArray(rowsData)) {
                rowsData.forEach((rowData, index) => {
                  if (rowData.name && Array.isArray(rowData.cabinets)) {
                    // 为每个排创建一个 cabinetRow 对象
                    const cabinetRow = {
                      id: formattedRooms.length + 1,
                      name: rowData.name,
                      cabinets: []
                    };
                    // 为每个柜子创建一个 cabinet 对象
                    rowData.cabinets.forEach((cabinetData, cabinetIndex) => {
                      // 从完整的柜子数据中提取信息
                      if (cabinetData.code) {
                        cabinetRow.cabinets.push({
                          id: cabinetRow.cabinets.length + 1,
                          code: cabinetData.code,
                          name: cabinetData.name || `柜型${cabinetData.name}`,
                          type: cabinetData.type.code,
                        });
                      }
                    });
                    formattedRooms.push(cabinetRow);
                  }
                });
              }
            } catch (error) {
              console.error('解析 rows 字段失败:', error);
            }
          }
          // 如果解析后没有数据，使用默认数据
          if (formattedRooms.length === 0) {
            // 使用默认的柜排数据
            setCabinetRows([]);
          } else {
            setCabinetRows(formattedRooms);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        message.error('加载数据失败，请刷新页面重试');
      }
    };

    loadData();
  }, []);

  // 处理增加柜型
  const handleAddCabinetType = () => {
    setEditingType(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑柜型
  const handleEditCabinetType = (type) => {
    setEditingType(type);
    form.setFieldsValue(type);
    setModalVisible(true);
  };

  // 处理删除柜型
  const handleDeleteCabinetType = async (code) => {
    try {
      await api.deleteCabinetType(code);
      setCabinetTypes(cabinetTypes.filter(type => type.code !== code));
      message.success('柜型已删除');
    } catch (error) {
      console.error('删除柜型失败:', error);
      message.error('删除柜型失败，请重试');
    }
  };

  // 处理预览柜型
  const handlePreviewCabinetType = (type) => {
    setPreviewType('cabinet');
    setPreviewData(type);
    setPreviewModalVisible(true);
  };

  // 处理保存柜型
  const handleSaveCabinetType = async (values) => {
    // 处理颜色值，将 Color 对象转换为字符串
    const processedValues = {
      ...values,
      color: values.color?.toHexString ? values.color.toHexString() : values.color
    };

    try {
      if (editingType) {
        // 编辑现有柜型，确保包含 code 字段
        const updateData = {
          ...processedValues,
          code: editingType.code // 从 editingType 中获取 code 字段
        };
        await api.updateCabinetType(updateData);
        setCabinetTypes(cabinetTypes.map(type =>
          type.code === editingType.code ? { ...type, ...processedValues } : type
        ));
        message.success('柜型已更新');
      } else {
        // 添加新柜型
        const newType = {
          code: Math.max(...cabinetTypes.map(type => parseInt(type.code || 0)), 0) + 1,
          ...processedValues,
          image: processedValues.image || 'default' // 使用上传的图片地址或默认值
        };
        await api.createCabinetType(newType);
        setCabinetTypes([...cabinetTypes, newType]);
        message.success('柜型已添加');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('保存柜型失败:', error);
      message.error('保存柜型失败，请重试');
    }
  };

  // 处理增加柜子到柜排
  const handleAddCabinetToRow = (rowId) => {
    if (cabinetTypes.length === 0) {
      message.error('请先添加柜型');
      return;
    }
    // ensure we're in "add" mode
    setEditingCabinet(null);
    setCurrentRowId(rowId);
    addCabinetForm.resetFields();
    // 默认选择第一个柜型
    addCabinetForm.setFieldsValue({
      cabinetTypeId: cabinetTypes[0].code,
      cabinetName: cabinetTypes[0].name
    });
    setAddCabinetModalVisible(true);
  };

  // 处理保存柜子到柜排
  const handleSaveCabinetToRow = (values) => {
    const cabinetType = cabinetTypes.find(type => type.code === values.cabinetTypeId);
    if (!cabinetType) {
      message.error('柜型不存在');
      return;
    }

    if (editingCabinet) {
      // Update existing cabinet
      const updatedRows = cabinetRows.map(row => {
        if (row.id === currentRowId) {
          const updatedCabinets = row.cabinets.map(c => {
            if (c.id === editingCabinet.id) {
              return {
                ...c,
                typeId: cabinetType.code,
                typeName: values.cabinetName || cabinetType.name,
                code: values.cabinetCode,
                type: cabinetType.code,
                name: values.cabinetName || cabinetType.name
              };
            }
            return c;
          });
          return { ...row, cabinets: updatedCabinets };
        }
        return row;
      });
      setCabinetRows(updatedRows);
      message.success('柜子已更新');
      setEditingCabinet(null);
      setAddCabinetModalVisible(false);
    } else {
      // Add new cabinet
      const newId = Math.max(...cabinetRows.flatMap(r => r.cabinets.map(c => c.id)), 0) + 1;
      const newCabinet = {
        id: newId,
        typeId: cabinetType.code,
        typeName: values.cabinetName || cabinetType.name,
        code: values.cabinetCode,
        type: cabinetType.code,
        name: values.cabinetName || cabinetType.name
      };
      const updatedRows = cabinetRows.map(row => {
        if (row.id === currentRowId) {
          return { ...row, cabinets: [...row.cabinets, newCabinet] };
        }
        return row;
      });
      setCabinetRows(updatedRows);
      message.success('柜子已添加到柜排');
      setAddCabinetModalVisible(false);
    }
  };

  const handleCabinetClick = (rowId, cabinet) => {
    // Open the add/edit modal prefilled with cabinet info
    setCurrentRowId(rowId);
    setEditingCabinet(cabinet);
    addCabinetForm.resetFields();
    addCabinetForm.setFieldsValue({
      cabinetTypeId: cabinet.typeId || cabinet.type,
      cabinetCode: cabinet.code,
      cabinetName: cabinet.name
    });
    setAddCabinetModalVisible(true);
  };
  // 处理从柜排删除柜子
  const handleRemoveCabinetFromRow = (rowId, cabinetId) => {
    const updatedRows = cabinetRows.map(row => {
      if (row.id === rowId) {
        return { ...row, cabinets: row.cabinets.filter(cabinet => cabinet.id !== cabinetId) };
      }
      return row;
    });
    setCabinetRows(updatedRows);
    message.success('柜子已从柜排移除');
  };

  // 处理删除柜排
  const handleDeleteRow = (rowId) => {
    setCabinetRows(cabinetRows.filter(row => row.id !== rowId));
    message.success('柜排已删除');
  };

  // 处理增加排数
  const handleAddRow = () => {
    const newRow = {
      id: Math.max(...cabinetRows.map(row => row.id), 0) + 1,
      name: `第${cabinetRows.length + 1}排`,
      cabinets: []
    };
    setCabinetRows([...cabinetRows, newRow]);
    message.success('柜排已添加');
  };

  const handleSave = async () => {
    try {
      // 准备保存的数据，将 cabinetRows 转换为后端预期的格式
      // 根据用户提供的 JSON 格式，应该是一个包含多个对象的数组
      // 每个对象有 name 和 cabinets 字段
      const rowsData = cabinetRows.map(row => ({
        name: row.name,
        cabinets: row.cabinets.map(cabinet => ({
          code: cabinet.code,
          type: cabinet.type,
          name: cabinet.name
        }))
      }));
      
      // 检查是否已有柜排数据
      if (cabinetRows.length > 0) {
        // 假设只有一个 cabinetRoom 记录，更新它
        const cabinetRoomData = {
          id: 1, // 假设使用 ID 为 1 的记录
          name: '配电柜', // 固定名称
          rows: JSON.stringify(rowsData) // 将整个柜排数据数组转换为 JSON 字符串
        };
        
        // 发送保存请求
        await api.updateCabinetRoom(cabinetRoomData);
        message.success('保存成功');
      } else {
        message.error('请先添加柜排数据');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleSaveAs = () => {
  }

  const handleOpen = () => {
  }

  // 处理预览柜排
  const handlePreviewRow = (row) => {
    setPreviewType('row');
    setPreviewData(row);
    setPreviewModalVisible(true);
  };

  // 处理整体预览
  const handlePreviewAll = () => {
    // 在新页面打开连接，连接地址为http://localhost:3001/preview3DCabinet.html，把localhost和端口替换为当前页面的host和port
    const previewUrl = `http://${window.location.hostname}:${window.location.port}/preview3DCabinet.html`;
    window.open(previewUrl, '_blank');
  };

  // 柜形设置表格列
  const cabinetTypeColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '长', dataIndex: 'length', key: 'length' },
    { title: '宽', dataIndex: 'width', key: 'width' },
    { title: '高', dataIndex: 'height', key: 'height' },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color) => <div style={{ width: 40, height: 20, backgroundColor: color }} />
    },
    {
      title: '正面图片',
      dataIndex: 'image',
      key: 'image',
      render: (image) => {
        if (image && image !== 'default') {
          return (
            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={image}
                alt="正面图片"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          );
        } else {
          return (
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EyeOutlined />
            </div>
          );
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCabinetType(record)}
          >
            编辑
          </Button>
          <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCabinetType(record.code)}
            >
              删除
            </Button>
        </div>
      ),
    },
  ];

  // 柜排设置表格列
  const cabinetRowColumns = [
    { title: '柜排名', dataIndex: 'name', key: 'name' },
    {
      title: '柜子',
      dataIndex: 'cabinets',
      key: 'cabinets',
      render: (cabinets, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cabinets.map(cabinet => (
            <Tag
              key={cabinet.id}
              closable
              onClose={() => handleRemoveCabinetFromRow(record.id, cabinet.id)}
              onClick={() => handleCabinetClick(record.id, cabinet)}
              style={{ margin: 0 }}
            >
              {cabinet.name}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => handleAddCabinetToRow(record.id)}
          >
            增加柜子
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRow(record.id)}
          >
            删除柜排
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'auto' }}>
      <Content style={{ padding: 24 }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="柜排设置" key="1">
            {/* 柜排设置部分 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'right', marginBottom: 16 }}>
                <Space>
                  <Button
                    type="default"
                    icon={<SafetyOutlined />}
                    onClick={handleSave}
                  >
                    保存
                  </Button>
                  <Button
                    type="default"
                    icon={<SaveOutlined />}
                    onClick={handleSaveAs}
                  >
                    另存为
                  </Button>
                  <Button
                    type="default"
                    icon={<FolderOpenOutlined />}
                    onClick={handleOpen}
                  >
                    打开
                  </Button>
                  <Button
                    icon={<AppstoreAddOutlined />}
                    onClick={handleAddRow}
                  >
                    增加排数
                  </Button>
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={handlePreviewAll}
                  >
                    效果预览
                  </Button>
                </Space>
              </div>

              <Table
                columns={cabinetRowColumns}
                dataSource={cabinetRows}
                rowKey="id"
                pagination={false}
              />
            </div>
            {/* 效果预览按钮 */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>

            </div>
          </TabPane>
          <TabPane tab="柜型设置" key="2">
            {/* 柜形设置部分 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={handleAddCabinetType}
                >
                  增加柜型
                </Button>
              </div>
              <Table
                columns={cabinetTypeColumns}
                dataSource={cabinetTypes}
            rowKey="code"
            pagination={false}
              />
            </div>
          </TabPane>
        </Tabs>



        {/* 柜型编辑模态框 */}
        <Modal
          title={editingType ? '编辑柜型' : '添加柜型'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveCabinetType}
          > <Form.Item
              name="code"
              label="编码"
              rules={[{ required: true, message: '请输入柜型编码' }]}
            >
              <Input placeholder="柜型编码" />
            </Form.Item>
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入柜型名称' }]}
            >
              <Input placeholder="柜型名称" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              
              <Form.Item
                name="length"
                label="长"
                rules={[{ required: true, message: '请输入长度' }]}
                style={{ flex: 1 }}
              >
                <Input type="number" placeholder="长度" />
              </Form.Item>

              <Form.Item
                name="width"
                label="宽"
                rules={[{ required: true, message: '请输入宽度' }]}
                style={{ flex: 1 }}
              >
                <Input type="number" placeholder="宽度" />
              </Form.Item>

              <Form.Item
                name="height"
                label="高"
                rules={[{ required: true, message: '请输入高度' }]}
                style={{ flex: 1 }}
              >
                <Input type="number" placeholder="高度" />
              </Form.Item>
            </div>

            <Form.Item
              name="color"
              label="颜色"
              rules={[{ required: true, message: '请选择颜色' }]}
            >
              <ColorPicker />
            </Form.Item>

            <Form.Item
              name="image"
              label="正面图片"
            >
              <Dragger
                name="file"
                multiple={false}
                action={`${API_BASE_URL}/graph/upload`}
                accept="image/*"
                showUploadList={false}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    // 上传成功，获取返回的图片URL
                    const response = info.file.response;
                    if (response && response.success && response.data) {
                      // 将图片URL设置到表单中
                      form.setFieldsValue({ image: response.data });
                      message.success(`${info.file.name} 上传成功`);
                    } else {
                      message.error('上传失败：服务器返回格式错误');
                    }
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} 上传失败：${info.file.error?.message || '网络错误'}`);
                  }
                }}
              >
                {form.getFieldValue('image') && form.getFieldValue('image') !== 'default' ? (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={form.getFieldValue('image')}
                      alt="正面图片"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <p className="ant-upload-text" style={{ marginTop: 8 }}>
                      点击或拖拽替换图片
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="ant-upload-drag-icon">
                      <PlusOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">
                      支持上传JPG、PNG等格式的图片
                    </p>
                  </>
                )}
              </Dragger>
            </Form.Item>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </div>
          </Form>
        </Modal>

        {/* 添加柜子到柜排模态框 */}
        <Modal
          title={editingCabinet ? '编辑柜子' : '添加柜子'}
          open={addCabinetModalVisible}
          onCancel={() => { setAddCabinetModalVisible(false); setEditingCabinet(null); }}
          footer={null}
        >
          <Form
            form={addCabinetForm}
            layout="vertical"
            onFinish={handleSaveCabinetToRow}
          >
            <Form.Item
              name="cabinetTypeId"
              label="柜形"
              rules={[{ required: true, message: '请选择柜形' }]}
            >
              <Select
                placeholder="请选择柜形"
                onChange={(value) => {
                  const selectedType = cabinetTypes.find(type => type.code === value);
                  if (selectedType) {
                    addCabinetForm.setFieldsValue({ cabinetName: selectedType.name });
                  }
                }}
              >
                {cabinetTypes.map(type => (
                  <Select.Option key={type.code} value={type.code}>{type.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="cabinetCode"
              label="柜子编码"
              rules={[{ required: true, message: '请输入柜子编码' }]}
            >
              <Input placeholder="请输入柜子编码" />
            </Form.Item>

            <Form.Item
              name="cabinetName"
              label="柜子名称"
              rules={[{ required: true, message: '请输入柜子名称' }]}
            >
              <Input placeholder="柜子名称" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setAddCabinetModalVisible(false); setEditingCabinet(null); }}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </div>
          </Form>
        </Modal>

        {/* 预览模态框 */}
        <Modal
          title={
            previewType === 'cabinet' ? `预览 ${previewData?.name}` :
              previewType === 'row' ? `预览 ${previewData?.name}` :
                '预览整体配电柜'
          }
          open={previewModalVisible}
          onCancel={() => setPreviewModalVisible(false)}
          footer={null}
          fullscreen={previewType === 'all' || previewType === 'row'}
          width={previewType === 'all' || previewType === 'row' ? '100%' : 800}
          bodyStyle={{ padding: 0, margin: 0, overflow: 'hidden' }}
        >
          <div style={{
            padding: 0,
            margin: 0,
            height: '100%',
            width: '100%',
            overflow: 'hidden'
          }}>
            {/* 3D预览 */}
            <div style={{
              margin: 0,
              padding: 0,
              height: '100%',
              width: '100%',
              overflow: 'hidden'
            }}>
              <Cabinet3DPreview
                type={previewType}
                data={previewData}
                cabinetTypes={cabinetTypes}
              />
            </div>
          </div>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Cabinet3DEditor;