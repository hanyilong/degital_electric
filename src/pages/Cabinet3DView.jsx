import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// API基础URL
const API_BASE_URL = 'http://localhost:8081/api';

// 纹理加载器（全局使用）
const textureLoader = new THREE.TextureLoader();

// 柜子组件：1.5m(长/X) × 1.2m(宽/Z) × 2m(高/Y)
const Cabinet = ({ position, color = "#6688aa", onDoubleClick, cabinetId, cabinetData, rowName }) => {
  // 尺寸：width=长(1.5m)，depth=宽(1.2m)，height=高(2m)
  const cabinetSize = [cabinetData?.length || 1.5, cabinetData?.height || 2, cabinetData?.width || 1.2];
  const [isHovered, setIsHovered] = React.useState(false);
  const [cabinetTexture, setCabinetTexture] = React.useState(null);
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const defaultCabinetImage = 'https://neeko-copilot.bytedance.net/api/text2image?prompt=modern%20cabinet%20texture%20metal%20door%20with%20handle&image_size=square_hd';

  // 直接获取纹理URL
  const textureUrl = cabinetData?.type && cabinetData.type.image !== 'default' 
    ? cabinetData.type.image 
    : defaultCabinetImage;

  // 基础高度和悬停时的高度
  const baseHeight = cabinetData?.height || 2;
  const hoverHeight = baseHeight + 0.3; // 增加0.3m高度
  const currentHeight = isHovered ? hoverHeight : baseHeight;
  const heightHalf = currentHeight / 2;
  
  // 添加一个状态来跟踪纹理是否加载完成
  const [textureLoaded, setTextureLoaded] = React.useState(false);

  // 为顶部标签生成画布纹理（面向摄像头的 sprite）
  const labelTexture = useMemo(() => {
    if (!rowName) return null;
    const canvas = document.createElement('canvas');
    const width = 256;
    const height = 64;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 0, width, height);
    // 文本
    ctx.font = '28px Arial';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cabinetData?.name, width / 2, height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [rowName]);

  // 事件处理函数
  const handlePointerOver = (e) => {
    e.stopPropagation();
    console.log('悬停事件:', cabinetId);
    setIsHovered(true);
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    console.log('离开事件:', cabinetId);
    setIsHovered(false);
  };

  const handleDoubleClick = (e) => {
    // 阻止事件冒泡
    e.stopPropagation();
    console.log('双击事件触发:', cabinetId);
    console.log('事件对象:', e);
    
    // 确保onDoubleClick存在
    if (onDoubleClick) {
      console.log('调用onDoubleClick回调');
      onDoubleClick({
        id: cabinetId,
        position: position,
        size: cabinetSize,
        cabinetData: cabinetData
      });
    } else {
      console.error('onDoubleClick回调未定义');
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    console.log('点击事件:', cabinetId);
  };

  // 将柜子信息挂到 group 的 userData 上，供外部 raycast 识别
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = {
        id: cabinetId,
        position: position,
        size: cabinetSize,
        cabinetData: cabinetData,
      };
    }
  }, [groupRef, cabinetId, position, cabinetSize, cabinetData]);

  return (
    <group ref={groupRef} position={position}>
      {/* 透明交互包围盒（用于捕获所有面的鼠标事件）- 放在最外层 */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={(e) => console.log('click')}

        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        receiveShadow={false}
        castShadow={false}
      >
        <boxGeometry args={[(cabinetData?.length || 1.5) + 0.2, hoverHeight + 0.2, (cabinetData?.width || 1.2) + 0.2]} /> {/* 更大一点，确保完全包围 */}
        <meshStandardMaterial 
          transparent={true} 
          opacity={0.01} // 使用稍高的不透明度，确保能够捕获鼠标事件
          side={2} // DoubleSide，两面都渲染
          depthTest={false} // 禁用深度测试，确保总是能被鼠标检测到
          depthWrite={false} // 禁用深度写入，避免影响其他物体
        />
      </mesh>

      {/* 柜子主体 - 只在正面应用纹理 */}
      {/* 正面（Z轴正方向） */}
      <mesh
        castShadow
        onClick={(e) => console.log('click')}
        position={[0, 0, (cabinetData?.width || 1.2) / 2]}
      >
        <planeGeometry args={[cabinetData?.length || 1.5, currentHeight]} />
        <meshStandardMaterial
          map={textureUrl ? new THREE.TextureLoader().load(textureUrl) : null}
          color={textureUrl ? "#ffffff" : (cabinetData?.color || "#cccccc")}
          metalness={textureUrl ? 0.3 : 0.2}
          roughness={textureUrl ? 0.5 : 0.6}
          side={2} // DoubleSide，两面都渲染
          transparent={false}
          opacity={1}
        />
      </mesh>
      {/* 其他面（灰色填充） */}
      {/* 背面（Z轴负方向） */}
      <mesh castShadow position={[0, 0, -(cabinetData?.width || 1.2) / 2]}>
        <planeGeometry args={[cabinetData?.length || 1.5, currentHeight]} />
        <meshStandardMaterial
          color={cabinetData?.color || "#cccccc"}
          metalness={0.1}
          roughness={0.7}
          side={2} // DoubleSide，两面都渲染
        />
      </mesh>
      {/* 左侧面（X轴负方向） */}
      <mesh castShadow position={[-(cabinetData?.length || 1.5) / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[(cabinetData?.width || 1.2), currentHeight]} />
        <meshStandardMaterial
          color={cabinetData?.color || "#cccccc"}
          metalness={0.1}
          roughness={0.7}
          side={2} // DoubleSide，两面都渲染
        />
      </mesh>
      {/* 右侧面（X轴正方向） */}
      <mesh castShadow position={[(cabinetData?.length || 1.5) / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[(cabinetData?.width || 1.2), currentHeight]} />
        <meshStandardMaterial
          color={cabinetData?.color || "#cccccc"}
          metalness={0.1}
          roughness={0.7}
          side={2} // DoubleSide，两面都渲染
        />
      </mesh>
      {/* 上面（Y轴正方向） */}
      <mesh castShadow onClick={(e) => console.log('click')} position={[0, heightHalf, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(cabinetData?.length || 1.5), (cabinetData?.width || 1.2)]} />
        <meshStandardMaterial
          color={cabinetData?.color || "#cccccc"}
          metalness={0.1}
          roughness={0.7}
          side={2} // DoubleSide，两面都渲染
        />
      </mesh>
      {/* 下面（Y轴负方向） - 贴地，不需要阴影 */}
      <mesh position={[0, -heightHalf, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(cabinetData?.length || 1.5), (cabinetData?.width || 1.2)]} />
        <meshStandardMaterial
          color={cabinetData?.color || "#cccccc"}
          metalness={0.1}
          roughness={0.7}
          side={2} // DoubleSide，两面都渲染
        />
      </mesh>
      {/* 柜子边框（只显示外轮廓） */}
      <group>
        {/* 前面四个角 */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={8}
              array={new Float32Array([
                // 前面四个角
                -(cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isHovered ? "#ff0000" : "#333333"}
            transparent={true}
            opacity={isHovered ? 0.8 : 0.4}
          />
        </lineSegments>

        {/* 后面四个角 */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={8}
              array={new Float32Array([
                // 后面四个角
                -(cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isHovered ? "#ff0000" : "#333333"}
            transparent={true}
            opacity={isHovered ? 0.8 : 0.4}
          />
        </lineSegments>

        {/* 连接前后对应的角 */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={8}
              array={new Float32Array([
                // 左上角
                -(cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
                // 左下角
                -(cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                -(cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                // 右下角
                (cabinetData?.length || 1.5) / 2, -heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, -heightHalf, -(cabinetData?.width || 1.2) / 2,
                // 右上角
                (cabinetData?.length || 1.5) / 2, heightHalf, (cabinetData?.width || 1.2) / 2,
                (cabinetData?.length || 1.5) / 2, heightHalf, -(cabinetData?.width || 1.2) / 2,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isHovered ? "#ff0000" : "#333333"}
            transparent={true}
            opacity={isHovered ? 0.8 : 0.4}
          />
        </lineSegments>
      </group>
      {/* 顶部标签（面向摄像头） */}
      {rowName && labelTexture && (
        <sprite position={[0, heightHalf + 0.18, 0]} scale={[(cabinetData?.length || 1.5), 0.3, 1]}>
          <spriteMaterial map={labelTexture} transparent />
        </sprite>
      )}
    </group>
  );
};

// 地板组件
const Floor = () => {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[15, 12]} />
      <meshStandardMaterial
        color="#e0e0e0"
        metalness={0.1}
        roughness={0.8}
        side={2} // DoubleSide，两面都渲染
      />
    </mesh>
  );
};

// 柜子网格布局组件
const CabinetGrid = ({ onDoubleClick }) => {
  const [cabinetData, setCabinetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 API 获取数据
  useEffect(() => {
    const fetchCabinetData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/cabinet/roomCompleteConfig/1`);
        if (!response.ok) {
          throw new Error('Failed to fetch cabinet data');
        }
        const data = await response.json();
        console.log('API response:', data);
        if (data.rows) {
          const rowsData = JSON.parse(data.rows);
          console.log('Parsed rows data:', rowsData);
          setCabinetData(rowsData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching cabinet data:', err);
        // 使用模拟数据作为备用
        const mockData = {
          rows: JSON.stringify([
            {
              name: "第一排",
              cabinets: [
                { code: "aaa", name: "柜子1", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage },
                { code: "bbb", name: "柜子2", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage },
                { code: "ccc", name: "柜子3", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage },
                { code: "ddd", name: "柜子4", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage },
                { code: "eee", name: "柜子5", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage },
                { code: "fff", name: "柜子6", length: 1.5, height: 2, width: 1.2, color: "#6688aa", image: defaultCabinetImage }
              ]
            },
            {
              name: "第二排",
              cabinets: [
                { code: "aaa", name: "柜子7", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage },
                { code: "bbb", name: "柜子8", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage },
                { code: "ccc", name: "柜子9", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage },
                { code: "ddd", name: "柜子10", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage },  
                { code: "eee", name: "柜子11", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage },
                { code: "fff", name: "柜子12", length: 1.5, height: 2, width: 1.2, color: "#8866aa", image: defaultCabinetImage }
              ]
            },
            {
              name: "第三排",
              cabinets: [
                { code: "aaa", name: "柜子13", length: 1.5, height: 2, width: 1.2, color: "#aa6688", image: defaultCabinetImage },
                { code: "bbb", name: "柜子14", length: 1.5, height: 2, width: 1.2, color: "#aa6688", image: defaultCabinetImage },
                { code: "ccc", name: "柜子15", length: 1.5, height: 2, width: 1.2, color: "#aa6688", image: defaultCabinetImage }
              ]
            }
          ])
        };
        setCabinetData(JSON.parse(mockData.rows));
      } finally {
        setLoading(false);
      }
    };

    fetchCabinetData();
  }, []);

  // 计算布局
  const calculateLayout = () => {
    if (!cabinetData || cabinetData.length === 0) {
      return [];
    }

    const rowGapZ = 3; // 两排之间的距离6m（Z轴）
    const cabinetGapX = 0; // 柜子横向（X轴）间距0m（不留空间）
    
    const positions = [];
    
    // 为每排柜子计算位置
    cabinetData.forEach((row, rowIndex) => {
      if (row.cabinets && row.cabinets.length > 0) {
        // 计算单排总长度（柜子长度+间距）
        const singleRowTotalX = row.cabinets.reduce((total, cabinet) => {
          return total + (cabinet.length || 1.5) + cabinetGapX;
        }, -cabinetGapX); // 减去最后一个间距
        
        // 计算偏移量，让整排柜子居中
        const rowOffsetX = -singleRowTotalX / 2;
        
        // 计算Z轴位置（每排依次排列，第一排往前挪2米）
        const z = (rowGapZ / 2 + 2) - rowIndex * rowGapZ;
        
        // 为每个柜子计算位置
        let currentX = rowOffsetX;
        row.cabinets.forEach((cabinet, cabinetIndex) => {
          const cabinetLength = cabinet.length || 1.5;
          // 计算单个柜子的X轴中心位置
          const x = currentX + cabinetLength / 2;
          // Y轴居中（柜子底部贴地）
          const y = (cabinet.height || 2) / 2;
          
          positions.push({
            x,
            y,
            z,
            cabinetData: cabinet,
            rowIndex,
            cabinetIndex,
            rowName: row.name
          });
          
          // 更新下一个柜子的起始X位置
          currentX += cabinetLength + cabinetGapX;
        });
      }
    });
    
    return positions;
  };

  // 计算柜子位置
  const cabinetPositions = calculateLayout();

  // 渲染加载状态
  if (loading) {
    return (
      <group>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[3, 0.5]} />
          <meshStandardMaterial 
            color="#333333"
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <group>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[5, 0.5]} />
          <meshStandardMaterial 
            color="#ff0000"
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* 渲染所有柜子 */}
      {cabinetPositions.map((pos, index) => (
        <Cabinet
            key={`cabinet-${pos.rowIndex}-${pos.cabinetIndex}`}
            position={[pos.x, pos.y, pos.z]}
            color={pos.cabinetData.color}
            onDoubleClick={onDoubleClick}
            cabinetId={`cabinet-${pos.rowIndex}-${pos.cabinetIndex}`}
            cabinetData={pos.cabinetData}
            rowName={pos.rowName}
          />
      ))}
    </group>
  );
};

// WebGL上下文丢失处理组件
const WebGLContextHandler = () => {
  const { gl, canvas } = useThree();

  useEffect(() => {
    if (!gl || !canvas) return;

    // 监听WebGL上下文丢失事件
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost, attempting to restore...');
    };

    // 监听WebGL上下文恢复事件
    const handleContextRestored = () => {
      console.log('WebGL context restored');
    };

    // 添加事件监听器
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // 清理函数
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, canvas]);

  return null;
};

// 全局双击处理器：在 canvas 上监听 dblclick，使用 Raycaster 查找被双击的柜子
const DblClickHandler = ({ onDoubleClick }) => {
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    if (!gl || !camera || !scene) return;

    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleDbl = (event) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        for (const inter of intersects) {
          let obj = inter.object;
          while (obj) {
            if (obj.userData && obj.userData.id) {
              // 找到柜子，回调上层处理
              try {
                onDoubleClick && onDoubleClick(obj.userData);
              } catch (err) {
                console.error('onDoubleClick 回调执行出错', err);
              }
              return;
            }
            obj = obj.parent;
          }
        }
      }
    };

    dom.addEventListener('dblclick', handleDbl);
    return () => dom.removeEventListener('dblclick', handleDbl);
  }, [gl, camera, scene, onDoubleClick]);

  return null;
};

// 主组件
const Cabinet3DView = () => {
  const [selectedCabinet, setSelectedCabinet] = React.useState(null);
  const [showDialog, setShowDialog] = React.useState(false);

  // 处理柜子双击事件
  const handleCabinetDoubleClick = (cabinetInfo) => {
    console.log('双击事件被触发:', cabinetInfo);
    console.log('当前showDialog状态:', showDialog);
    setSelectedCabinet(cabinetInfo);
    setShowDialog(true);
    console.log('设置后showDialog状态:', true);
  };

  // 监听showDialog状态变化
  React.useEffect(() => {
    console.log('showDialog状态变化:', showDialog);
    if (showDialog && selectedCabinet) {
      console.log('对话框应该显示，选中的柜子:', selectedCabinet);
    }
  }, [showDialog, selectedCabinet]);

  // 关闭对话框
  const closeDialog = () => {
    setShowDialog(false);
    setSelectedCabinet(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Suspense fallback={<div>加载3D场景中...</div>}>
        <Canvas
          shadows={false} // 暂时禁用阴影以减轻渲染负担
          camera={{ position: [10, 6, 10], fov: 45 }} // 调整相机位置，更接近柜子
          eventPrefix="pointer" // 确保指针事件能够正确传递
          raycaster={{ computeDistance: true }} // 启用距离计算，确保射线检测更准确
        >
          {/* 环境光 */}
          <ambientLight intensity={0.6} />
          {/* 方向光（模拟太阳光） */}
          <directionalLight
            position={[10, 15, 10]}
            intensity={0.8}
            castShadow={false} // 暂时禁用阴影
          />
          {/* 地板 */}
          <Floor />
          {/* 柜子布局 */}
          <CabinetGrid
            onDoubleClick={handleCabinetDoubleClick}
          />
          {/* 轨道控制器：支持鼠标交互 */}
          <OrbitControls
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2} // 限制只能俯视，不能仰视
            minDistance={5} // 最小缩放距离
            maxDistance={50} // 最大缩放距离
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            enableDoubleClickZoom={false} // 禁用双击缩放，避免与我们的双击事件冲突
            makeDefault
          />
          {/* WebGL上下文处理 */}
          <WebGLContextHandler />
          <DblClickHandler onDoubleClick={handleCabinetDoubleClick} />
        </Canvas>
      </Suspense>

      {/* 页面说明文字*/}
      <div style={{
        position: "absolute",
        top: 80,
        left: 220,
        color: "#333",
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 10,
        borderRadius: 5
      }}>
        <h3>3D柜子布局展示</h3>
        <p>柜子尺寸：1.5m(长) × 1.2m(宽) × 2m(高)</p>
        <p>布局：2排×6个，两排间距3米，横向柜子间距0米</p>
        <p>操作：鼠标拖拽旋转，滚轮缩放，右键平移，双击查看柜子信息</p>
      </div> 

      {/* 柜子信息对话框 */}
      {showDialog && selectedCabinet && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: 300
        }}>
          <h3>柜子信息</h3>
          <div style={{ marginBottom: 10 }}>
            <strong>柜子ID:</strong> {selectedCabinet.id}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>位置:</strong> X={selectedCabinet.position[0].toFixed(2)}m, Y={selectedCabinet.position[1].toFixed(2)}m, Z={selectedCabinet.position[2].toFixed(2)}m
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>尺寸:</strong> 长{selectedCabinet.size[0]}m × 宽{selectedCabinet.size[2]}m × 高{selectedCabinet.size[1]}m
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>纹理信息:</strong> {selectedCabinet.cabinetData?.image ? '已加载' : '默认'}
          </div>
          {/* 显示来自 API 的柜子信息 */}
          {selectedCabinet.cabinetData && (
            <>
              <div style={{ marginBottom: 10 }}>
                <strong>柜子编码:</strong> {selectedCabinet.cabinetData.code}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>柜子名称:</strong> {selectedCabinet.cabinetData.name}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>颜色:</strong> <span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: selectedCabinet.cabinetData.color, marginLeft: 8 }}></span> {selectedCabinet.cabinetData.color}
              </div>
              {selectedCabinet.cabinetData.type.image && selectedCabinet.cabinetData.type.image !== 'default' && (
                <div style={{ marginBottom: 20 }}>
                  <strong>图片:</strong> 
                  <div style={{ marginTop: 8, width: 100, height: 100 }}>
                    <img 
                      src={selectedCabinet.cabinetData.type.image} 
                      alt={selectedCabinet.cabinetData.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                </div>
              )}
            </>
          )}
          <button
            onClick={closeDialog}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6688aa",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            关闭
          </button>
        </div>
      )}

      {/* 对话框背景遮罩 */}
      {showDialog && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999
        }} onClick={closeDialog}></div>
      )}
    </div>
  );
};

export default Cabinet3DView;