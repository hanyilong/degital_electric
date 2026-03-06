import React, { useEffect, useRef, useState } from 'react';
import { Layout, Tree, Button, Upload, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { UploadOutlined, FolderOpenOutlined, SaveOutlined, SafetyOutlined, FundViewOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { deviceApi, thingModelApi, timeSeriesApi } from '../utils/api.js';

// 导入默认模型文件（使用URL导入语法）
import defaultModel from '../assets/10kv_high-voltage.glb?url';

const { Content, Sider } = Layout;

const ModelViewer = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);
  const mixerRef = useRef(null);
  const composerRef = useRef(null);
  const outlinePassRef = useRef(null);
  const shaderPassRef = useRef(null);
  const raycasterRef = useRef(null); // 射线检测实例
  const mouseRef = useRef(null); // 鼠标位置向量

  const [treeData, setTreeData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [highlightedObject, setHighlightedObject] = useState(null);
  const [objectMap, setObjectMap] = useState(new Map()); // 存储key到3D对象的映射
  const [modelDataList, setModelDataList] = useState([

  ])
  const [modalVisible, setModalVisible] = useState(false); // 控制模态框显示
  const [selectedPartInfo, setSelectedPartInfo] = useState(null); // 存储选中部件的信息
  const [modelForm] = Form.useForm(); // 模型信息表单实例
  // 使用Map对象存储模型数据，以UUID为key
  const [modelDataMap, setModelDataMap] = useState(new Map());
  const [isFormVisible, setIsFormVisible] = useState(false); // 控制表单可见性
  const [deviceTypes, setDeviceTypes] = useState([]); // 存储设备类型列表
  const [devices, setDevices] = useState([]); // 存储设备列表
  const [loadingDeviceTypes, setLoadingDeviceTypes] = useState(false); // 设备类型加载状态
  const [loadingDevices, setLoadingDevices] = useState(false); // 设备加载状态


  // 组件挂载时加载默认模型
  useEffect(() => {
    loadModel(defaultModel);
  }, []);

  // 组件挂载时获取设备类型数据
  useEffect(() => {
    // 模拟调用项目物体模型API获取设备类型
    const fetchDeviceTypes = async () => {
      try {
        setLoadingDeviceTypes(true);
        // 这里应该是实际的API调用：
        const thingModels = await thingModelApi.getAll();
        await new Promise(resolve => setTimeout(resolve, 500));
        setDeviceTypes(thingModels);
      } catch (error) {
        console.error('获取设备类型失败:', error);
        message.error('获取设备类型失败，请稍后重试');
      } finally {
        setLoadingDeviceTypes(false);
      }
    };

    fetchDeviceTypes();
  }, []);


  // 初始化Three.js场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 创建后处理效果
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    // 添加渲染通道
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 添加轮廓高亮通道
    const outlinePass = new OutlinePass(
      new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight),
      scene,
      camera
    );
    outlinePass.edgeStrength = 4;
    outlinePass.edgeGlow = 0.2;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#190a05');
    composer.addPass(outlinePass);
    outlinePassRef.current = outlinePass;

    // 添加抗锯齿通道
    const shaderPass = new ShaderPass(FXAAShader);
    shaderPass.material.uniforms['resolution'].value.x = 1 / (containerRef.current.clientWidth * window.devicePixelRatio);
    shaderPass.material.uniforms['resolution'].value.y = 1 / (containerRef.current.clientHeight * window.devicePixelRatio);
    composer.addPass(shaderPass);
    shaderPassRef.current = shaderPass;

    // 创建射线检测实例和鼠标向量
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;
    const mouse = new THREE.Vector2();
    mouseRef.current = mouse;

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    controls.target.set(0, 2, 0); // 设置控制器目标点为模型中心上方一点

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    scene.add(gridHelper);

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 更新控制器
      controls.update();

      // 更新动画混合器
      if (mixerRef.current && isPlaying) {
        mixerRef.current.update(0.016);
      }

      // 渲染场景（使用后处理）
      composer.render();
    };
    animate();

    // 窗口大小调整处理
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current || !composerRef.current || !outlinePassRef.current || !shaderPassRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
      composerRef.current.setSize(width, height);

      // 更新轮廓高亮通道尺寸
      outlinePassRef.current.setSize(width, height);

      // 更新抗锯齿通道分辨率
      shaderPassRef.current.material.uniforms['resolution'].value.x = 1 / (width * window.devicePixelRatio);
      shaderPassRef.current.material.uniforms['resolution'].value.y = 1 / (height * window.devicePixelRatio);
    };

    // 为渲染器DOM元素添加点击事件监听器（仅单击）
    const canvas = rendererRef.current.domElement;
    canvas.addEventListener('dblclick', handleClick);

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      // 移除事件监听器
      window.removeEventListener('resize', handleResize);
      const canvas = rendererRef.current?.domElement;
      if (canvas) {
        canvas.removeEventListener('dblclick', handleClick);
      }

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      // 清理场景中的对象
      if (sceneRef.current) {
        while (sceneRef.current.children.length > 0) {
          const child = sceneRef.current.children[0];
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
          sceneRef.current.remove(child);
        }
      }
    };
  }, [isPlaying]);

  // 解析模型结构生成树形数据
  const parseModelStructure = (object, parentKey = '') => {
    const key = parentKey ? `${parentKey}-${object.uuid}` : object.uuid;
    const title = object.name || `Object-${object.uuid.slice(0, 8)}`;

    const node = {
      title,
      key,
      object: object,
      children: []
    };

    // 构建对象映射表
    const map = new Map();
    map.set(key, object);

    object.children.forEach(child => {
      const childNode = parseModelStructure(child, key);
      node.children.push(childNode);

      // 合并子节点的映射表
      childNode.objectMap.forEach((value, key) => {
        map.set(key, value);
      });
    });

    // 将映射表附加到节点上
    node.objectMap = map;

    return node;
  };

  // 加载GLB模型
  const loadModel = (source) => {
    const loader = new GLTFLoader();
    let url = null;
    let shouldRevokeURL = false;

    // 处理File对象或URL字符串
    if (source instanceof File) {
      url = URL.createObjectURL(source);
      shouldRevokeURL = true;
    } else if (typeof source === 'string') {
      url = source;
    } else {
      console.error('Invalid model source:', source);
      return;
    }

    loader.load(
      url,
      (gltf) => {
        // 移除旧模型
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
        }

        // 添加新模型
        const model = gltf.scene;
        sceneRef.current.add(model);
        modelRef.current = model;

        // 解析模型结构
        const structure = parseModelStructure(model);
        setTreeData([structure]);
        // 存储对象映射表用于双击定位
        setObjectMap(structure.objectMap);

        // 初始化动画混合器
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
          gltf.animations.forEach(animation => {
            mixerRef.current.clipAction(animation).play();
          });
          setIsPlaying(true);
        }

        // 自动定位相机
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // 增加一些余量

        cameraRef.current.position.set(center.x, center.y + size.y * 0.3, center.z + cameraZ);
        cameraRef.current.lookAt(center);
        controlsRef.current.target.copy(center);

        // 释放URL
        if (shouldRevokeURL) {
          URL.revokeObjectURL(url);
        }
      },
      (progress) => {
        // console.log(`Loading model: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };

  // 处理文件上传
  const handleUpload = (file) => {
    if (file.type === 'model/gltf-binary' || file.name.endsWith('.glb')) {
      loadModel(file);
    } else {
      console.error('Please upload a GLB file');
    }
    return false; // 阻止默认上传行为
  };

  // 重置模型
  const resetModel = () => {
    if (modelRef.current) {
      modelRef.current.rotation.set(0, 0, 0);
      modelRef.current.position.set(0, 0, 0);
      modelRef.current.scale.set(1, 1, 1);
    }
  };

  const previewModel = () => {

    console.log('预览模型', modelDataList);
    // 新打开一个窗口预览模型
    window.open(`${window.location.origin}/preview3d.html`, '_blank');

  }

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys) => {
    setSelectedKey(selectedKeys[0]);

    // 直接从objectMap中获取对应的对象
    const selectedObject = objectMap.get(selectedKeys[0]);
    if (selectedObject) {
      // 高亮选中的对象
      console.log('Selected object:', selectedObject.name);

      // 从 modelDataMap 中获取额外信息，避免未定义错误
      const extraInfo = modelDataMap.get(selectedObject.uuid) || {};

      // 收集对象的基本信息
      const partInfo = {
        name: selectedObject.name || '',
        uuid: selectedObject.uuid,
        type: selectedObject.type,
        modelType: extraInfo.modelType,
        deviceCode: extraInfo.deviceCode,
        deviceName: extraInfo.deviceName,
        installationDate: extraInfo.installationDate,
        manufacturer: extraInfo.manufacturer
      };
      // 从modelDataList中查找对应的数据
      const modelData = modelDataList.find(item => item.uuid === selectedObject.uuid);
      if (modelData) {
        Object.assign(partInfo, modelData);
      }
      modelForm.setFieldsValue(partInfo);
      setIsFormVisible(true);
      // 更新选中部件信息
      setSelectedPartInfo(selectedObject);
    }
  };

  // 处理树节点双击
  const handleTreeDoubleClick = (event, node) => {
    setSelectedKey(node.key);

    // 直接从objectMap中获取对应的对象
    const selectedObject = objectMap.get(node.key);
    if (selectedObject) {
      console.log('Double-clicked object:', selectedObject.name);

      // 计算目标对象的包围盒
      const box = new THREE.Box3().setFromObject(selectedObject);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 2; // 增加一些余量

      // 调整相机位置
      cameraRef.current.position.set(center.x, center.y + size.y * 0.5, center.z + cameraZ);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);

      // 高亮显示选中的对象
      if (outlinePassRef.current) {
        outlinePassRef.current.selectedObjects = [selectedObject];
      }

      setHighlightedObject(selectedObject);
    }
  };

  // 处理3D视图点击事件
  const handleClick = (event) => {
    if (!containerRef.current || !cameraRef.current || !raycasterRef.current || !modelRef.current) return;

    // 计算鼠标位置归一化坐标
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 设置射线检测参数
    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;
    mouse.set(x, y);
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 获取模型对象数组
    const objects = [];
    modelRef.current.traverse((child) => {
      if (child.isMesh) {
        objects.push(child);
      }
    });

    // 执行射线检测
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;

      // 收集部件信息用于模态框
      const modalPartInfo = {
        name: selectedObject.name,
        uuid: selectedObject.uuid,
        type: selectedObject.type
      };

      // 计算尺寸
      const box = new THREE.Box3().setFromObject(selectedObject);
      const size = box.getSize(new THREE.Vector3());
      modalPartInfo.size = size;

      // 获取位置和旋转信息
      modalPartInfo.position = selectedObject.position;
      modalPartInfo.rotation = selectedObject.rotation;

      // 检查modelDataList中是否有对应的存储数据
      const storedData = modelDataList.find(item => item.uuid === selectedObject.uuid);
      if (storedData) {
        // 如果有存储数据，合并到modalPartInfo中
        Object.assign(modalPartInfo, storedData);
        console.log('从modelDataList加载存储的数据:', storedData);
      }

      // 设置选中部件信息并显示模态框
      setSelectedPartInfo(modalPartInfo);
      setModalVisible(true);

    }
  };

  // 递归格式化树形数据
  const formatTreeData = (nodes) => {
    return nodes.map(node => ({
      title: node.title,
      key: node.key,
      children: node.children.length > 0 ? formatTreeData(node.children) : undefined
    }));
  };

  // 处理表单字段变化
  const handleValuesChange = () => {
    if (!selectedKey) return;

    // 获取选中的对象
    const selectedObject = objectMap.get(selectedKey);
    if (!selectedObject) return;

    // 获取当前表单的所有值
    const values = modelForm.getFieldsValue();

    // 准备保存的数据
    const modelData = {
      name: values.name || '',
      modelType: values.modelType || '',
      deviceCode: values.deviceCode || '',
      deviceName: values.deviceName || '',
      installationDate: values.installationDate || null,
      manufacturer: values.manufacturer || ''
    };
    const existingIndex = modelDataList.findIndex(item => item.uuid === selectedObject.uuid);
    // 更新或添加模型数据
    if (existingIndex !== -1) {
      modelDataList[existingIndex] = { ...modelData, uuid: selectedObject.uuid };
    } else {
      modelDataList.push({ ...modelData, uuid: selectedObject.uuid });
    }
  };
  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Content style={{ padding: 0, margin: 0, overflow: 'hidden', position: 'relative' }}>
        {/* 顶部按钮导航栏 */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid #e8e8e8',
          padding: '12px 20px',
          display: 'flex',
          gap: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          zIndex: 1000
        }}>
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".glb"
          >
            <Button icon={<UploadOutlined />} type="primary">上传GLB模型</Button>
          </Upload>
          <Button icon={<FolderOpenOutlined />} onClick={resetModel}>
            打开历史页面
          </Button>
          <Button icon={<SafetyOutlined />} onClick={resetModel}>
            保存
          </Button>
          <Button icon={<SaveOutlined />} onClick={resetModel}>
            另存为
          </Button>
          <Button icon={<FundViewOutlined />} onClick={previewModel}>
            预览
          </Button>
        </div>

        {/* 3D视图区域 */}
        <div ref={containerRef} style={{ width: '100%', height: 'calc(100% - 60px)' }} />
      </Content>
      <Sider width={300} theme="light" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 上半部分：模型结构 */}
        <div style={{ height: '30%', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <h3 style={{ margin: 0 }}>模型结构</h3>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16, boxSizing: 'border-box' }}>
            {treeData.length > 0 ? (
              <Tree
                treeData={formatTreeData(treeData)}
                defaultExpandAll
                selectedKeys={selectedKey ? [selectedKey] : []}
                onSelect={handleTreeSelect}
                onDoubleClick={handleTreeDoubleClick}
                showLine
              />
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                请上传GLB模型
              </div>
            )}
          </div>
        </div>

        {/* 下半部分：模型信息表单 */}
        <div style={{ height: '70%', display: 'flex', flexDirection: 'column', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa', overflow: 'hidden' }}>
          <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
            <h3 style={{ margin: 0, marginBottom: 16 }}>模型信息</h3>
            {isFormVisible ? (
              <Form
                form={modelForm}
                layout="vertical"
                size="small"
                onValuesChange={handleValuesChange}
              >
                <h4 style={{ marginBottom: 12, color: '#666' }}>基本信息</h4>
                <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input placeholder="部件名称" />
                </Form.Item>
                <Form.Item name="uuid" label="UUID">
                  <Input disabled placeholder="部件UUID" />
                </Form.Item>
                <Form.Item name="type" label="类型">
                  <Input disabled placeholder="部件类型" />
                </Form.Item>

                <h4 style={{ marginBottom: 12, color: '#666', marginTop: 16 }}>额外信息</h4>
                <Form.Item name="modelType" label="设备类型">
                  <Select placeholder="请选择设备类型" loading={loadingDeviceTypes}
                    onChange={(value) => {
                      // 根据设备类型ID，找到对应的设备数据
                      const fetchDevices = async () => {
                        try {
                          setLoadingDevices(true);
                          // 这里应该是实际的API调用：
                          const devices = await deviceApi.getByModelId(value);
                          // 模拟网络延迟
                          await new Promise(resolve => setTimeout(resolve, 700));
                          setDevices(devices);
                        } catch (error) {
                          console.error('获取设备列表失败:', error);
                          message.error('获取设备列表失败，请稍后重试');
                        } finally {
                          setLoadingDevices(false);
                        }
                      };
                      fetchDevices();
                    }}>
                    {deviceTypes.map(type => (
                      <Select.Option key={type.id} value={type.id}>{type.modelName}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="deviceCode" label="选择设备">
                  <Select
                    placeholder="请选择设备"
                    loading={loadingDevices}
                    onChange={(value) => {

                    }}
                  >
                    {devices.map(device => (
                      <Select.Option key={device.id} value={device.deviceCode}>{device.deviceName}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                请选择一个模型部件查看信息
              </div>
            )}
          </div>
        </div>
      </Sider>

      {/* 部件信息模态框 */}
      <Modal
        title="部件信息"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedPartInfo && (
          <div>
            <p><strong>名称：</strong>{selectedPartInfo.name}</p>
            <p><strong>UUID：</strong>{selectedPartInfo.uuid}</p>
            <p><strong>类型：</strong>{selectedPartInfo.type}</p>
            {selectedPartInfo.size && (
              <p><strong>尺寸：</strong>{selectedPartInfo.size.x.toFixed(3)}x{selectedPartInfo.size.y.toFixed(3)}x{selectedPartInfo.size.z.toFixed(3)}</p>
            )}
            {selectedPartInfo.position && (
              <p><strong>位置：</strong>({selectedPartInfo.position.x.toFixed(3)}, {selectedPartInfo.position.y.toFixed(3)}, {selectedPartInfo.position.z.toFixed(3)})</p>
            )}
            {selectedPartInfo.rotation && (
              <p><strong>旋转：</strong>({selectedPartInfo.rotation.x.toFixed(3)}, {selectedPartInfo.rotation.y.toFixed(3)}, {selectedPartInfo.rotation.z.toFixed(3)})</p>
            )}

            {/* 显示扩展信息 */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>扩展信息</h4>
              {selectedPartInfo.modelType && (
                <p><strong>设备类型：</strong>{selectedPartInfo.modelType}</p>
              )}
              {selectedPartInfo.deviceCode && (
                <p><strong>设备编码：</strong>{selectedPartInfo.deviceCode}</p>
              )}
              {selectedPartInfo.deviceName && (
                <p><strong>设备名称：</strong>{selectedPartInfo.deviceName}</p>
              )}
              {selectedPartInfo.installationDate && (
                <p><strong>安装日期：</strong>{selectedPartInfo.installationDate.format ? selectedPartInfo.installationDate.format('YYYY-MM-DD') : selectedPartInfo.installationDate}</p>
              )}
              {selectedPartInfo.manufacturer && (
                <p><strong>制造商：</strong>{selectedPartInfo.manufacturer}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default ModelViewer;