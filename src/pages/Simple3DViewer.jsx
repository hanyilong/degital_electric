import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 轨道控制器-支持鼠标拖拽/缩放模型
import defaultModel from '../assets/10kv_high-voltage.glb?url';
const Simple3DViewer = () => {
  // 1. 定义ref获取画布DOM元素，定义状态存储加载进度/失败信息
  const canvasRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [autoRotate, setAutoRotate] = useState(false); // 自动旋转开关
  const [showModelInfo, setShowModelInfo] = useState(false); // 控制模型信息弹窗显示
  const [modelInfo, setModelInfo] = useState(null); // 存储模型信息
  // 声明three核心对象ref，防止组件重渲染丢失引用
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null); // 用于取消动画帧
  const raycasterRef = useRef(null); // 射线投射器，用于检测鼠标点击的对象
  const mouseRef = useRef(null); // 鼠标位置向量

  // 2. 初始化Three.js场景+加载GLB模型 核心逻辑
  useEffect(() => {
    // --- 【第一步】初始化三大核心：场景、相机、渲染器 ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // 设置场景背景色
    scene.background = new THREE.Color(0xf5f5f5);

    // 透视相机：参数(视角, 宽高比, 近截面, 远截面) - 减小视角能看到更广阔范围
    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20000); // 减小视场角到30度，增加远截面到20000
    cameraRef.current = camera;
    camera.position.set(0, 5, 20); // 初始相机位置，会被模型加载后的自动计算覆盖

    // 渲染器：绑定画布DOM、开启抗锯齿、设置画布大小
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // 适配高清屏

    // --- 【第二步】添加灯光（必须！GLB模型无灯光会全黑看不见） ---
    // 环境光：照亮整个场景，无阴影，基础光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    // 方向光：模拟太阳光，有明暗对比，让模型有立体感
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- 【第三步】添加轨道控制器：鼠标拖拽旋转、滚轮缩放、右键平移 ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // 基础控制设置
    controls.enableDamping = true; // 阻尼效果，拖拽更顺滑
    controls.dampingFactor = 0.08; // 阻尼系数，值越大越难拖拽

    // 鼠标操作配置
    controls.enableRotate = true; // 允许鼠标拖拽旋转
    controls.enableZoom = true; // 允许滚轮缩放
    controls.enablePan = true; // 允许右键平移

    // 缩放限制
    controls.minDistance = 0.1; // 最小缩放距离（模型放大的极限）
    controls.maxDistance = 30000; // 最大缩放距离（模型缩小的极限）

    // 移除旋转限制，让用户可以完全自由地查看模型的任何角度
    controls.minPolarAngle = 0; // 允许从底部看
    controls.maxPolarAngle = Math.PI; // 允许从顶部看

    // 缩放速度
    controls.zoomSpeed = 1.2;

    // 旋转速度
    controls.rotateSpeed = 0.8;

    // 平移速度
    controls.panSpeed = 0.8;

    // 控制器聚焦点，对应模型中心
    controls.target.set(0, 1, 0);

    // 自动旋转设置
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5; // 自动旋转速度

    // 初始化射线投射器和鼠标位置向量
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // --- 【第四步】加载 GLB/GLTF 模型 核心代码 ---
    const loader = new GLTFLoader();
    // 【修改这里】替换成你的GLB模型路径！！！
    const modelUrl = defaultModel;

    loader.load(
      // 模型地址
      modelUrl,
      // 加载成功回调
      (gltf) => {
        modelRef.current = gltf.scene;
        scene.add(gltf.scene); // 将模型添加到场景

        // --- 直接将相机放置在极远位置，确保完整显示模型 ---
        const model = gltf.scene;
        
        // 强制重置模型位置、旋转和缩放，确保它在原点且大小合适
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        
        // 直接将相机放置在非常远的位置，确保能看到完整模型
        camera.position.set(0, 700, 1400); // 极远位置
        
        // 设置控制器目标看向模型中心（原点）
        controls.target.set(0, 0, 0);
        controls.update();
        
        console.log('相机位置:', camera.position);
        console.log('相机远截面:', camera.far);

        setLoadingProgress(100);
        console.log('GLB模型加载成功✅', gltf.scene);
      },
      // 加载进度回调
      (progress) => {
        const percent = Math.floor((progress.loaded / progress.total) * 100);
        setLoadingProgress(percent);
        console.log(`模型加载中：${percent}%`);
      },
      // 加载失败回调
      (error) => {
        setLoadError('模型加载失败，请检查文件路径或文件格式');
        console.error('模型加载失败❌', error);
      }
    );

    // 处理双击事件
    const handleDoubleClick = (event) => {
      if (!canvasRef.current || !cameraRef.current || !sceneRef.current || !modelRef.current || !raycasterRef.current || !mouseRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const raycaster = raycasterRef.current;
      const mouse = mouseRef.current;

      // 计算鼠标在画布上的位置（归一化坐标）
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 更新射线投射器
      raycaster.setFromCamera(mouse, camera);

      // 检测与模型的交点
      const intersects = raycaster.intersectObject(modelRef.current, true);

      if (intersects.length > 0) {
        // 获取被点击的具体子部件
        const clickedObject = intersects[0].object;
        // 获取整个模型信息用于尺寸计算
        const model = modelRef.current;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        // 收集模型信息
        const info = {
          name: clickedObject.name || '未命名部件',
          uuid: clickedObject.uuid || '无UUID',
          size: {
            x: size.x.toFixed(2),
            y: size.y.toFixed(2),
            z: size.z.toFixed(2)
          },
          position: {
            x: clickedObject.position.x.toFixed(2),
            y: clickedObject.position.y.toFixed(2),
            z: clickedObject.position.z.toFixed(2)
          },
          rotation: {
            x: clickedObject.rotation.x.toFixed(2),
            y: clickedObject.rotation.y.toFixed(2),
            z: clickedObject.rotation.z.toFixed(2)
          },
          scale: {
            x: clickedObject.scale.x.toFixed(2),
            y: clickedObject.scale.y.toFixed(2),
            z: clickedObject.scale.z.toFixed(2)
          },
          url: defaultModel
        };

        setModelInfo(info);
        setShowModelInfo(true);
      }
    };

    // 添加双击事件监听
    canvasRef.current.addEventListener('dblclick', handleDoubleClick);

    // --- 【第五步】渲染循环+动画帧：让模型可以交互、画布实时渲染 ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update(); // 更新控制器
      renderer.render(scene, camera); // 渲染场景和相机
    };
    animate();

    // --- 【第六步】窗口自适应：改变窗口大小时，画布和相机同步缩放 ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- 【第七步】组件卸载时：销毁所有Three资源，防止内存泄漏 ✅ 重中之重 ---
    return () => {
      // 1. 首先取消动画帧，停止渲染循环
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // 2. 移除事件监听器
      window.removeEventListener('resize', handleResize);
      // 移除双击事件监听器
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('dblclick', handleDoubleClick);
      }

      // 3. 清理Three.js资源
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      // 4. 清理场景资源
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }

      cameraRef.current = null;
      modelRef.current = null;
    };
  }, []); // 空依赖数组：只执行一次，相当于React的mounted

  // 监听自动旋转状态变化，更新控制器
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // 重置相机位置的功能
  const resetCameraPosition = () => {
    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      
      // 将相机重置到一个能看到完整模型的位置
      camera.position.set(0, 700, 1400);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  // JSX渲染：画布+加载进度+错误提示
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 3D画布容器 */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

      {/* 加载进度提示 */}
      {loadingProgress < 100 && !loadError && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '20px', color: '#333' }}>
          模型加载中：{loadingProgress}%
        </div>
      )}

      {/* 加载失败提示 */}
      {loadError && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '20px', color: 'red' }}>
          {loadError}
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: autoRotate ? '#4caf50' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {autoRotate ? '停止自动旋转' : '开启自动旋转'}
        </button>
        <button
          onClick={resetCameraPosition}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重置相机位置
        </button>
      </div>

      {/* 模型信息弹窗 */}
      {showModelInfo && modelInfo && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          padding: '20px',
          width: '350px',
          zIndex: 100,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            模型信息
          </h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '8px 0' }}>
              <strong>名称：</strong>{modelInfo.name}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>UUID：</strong>{modelInfo.uuid}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>尺寸：</strong>X: {modelInfo.size.x}, Y: {modelInfo.size.y}, Z: {modelInfo.size.z}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>位置：</strong>X: {modelInfo.position.x}, Y: {modelInfo.position.y}, Z: {modelInfo.position.z}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>旋转：</strong>X: {modelInfo.rotation.x}, Y: {modelInfo.rotation.y}, Z: {modelInfo.rotation.z}
            </p>
            <p style={{ margin: '8px 0 15px 0' }}>
              <strong>缩放：</strong>X: {modelInfo.scale.x}, Y: {modelInfo.scale.y}, Z: {modelInfo.scale.z}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => setShowModelInfo(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 弹窗遮罩 */}
      {showModelInfo && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 99
        }} onClick={() => setShowModelInfo(false)} />
      )}
    </div>
  );
};

export default Simple3DViewer;