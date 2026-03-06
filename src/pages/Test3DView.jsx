import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 测试立方体组件
const TestCube = ({ onDoubleClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <mesh
      position={[0, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        console.log('Cube悬停事件');
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        console.log('Cube离开事件');
        setIsHovered(false);
      }}
      onPointerDoubleClick={(e) => {
        e.stopPropagation();
        console.log('Cube双击事件');
        onDoubleClick({
          id: 'test-cube',
          position: [0, 0, 0],
          size: [1, 1, 1]
        });
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        console.log('Cube点击事件');
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={isHovered ? "#ff0000" : "#00ff00"}
        side={2}
      />
    </mesh>
  );
};

// 主测试组件
const Test3DView = () => {
  const [selectedObject, setSelectedObject] = React.useState(null);
  const [showDialog, setShowDialog] = React.useState(false);

  const handleDoubleClick = (objectInfo) => {
    console.log('双击事件被触发:', objectInfo);
    setSelectedObject(objectInfo);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSelectedObject(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Suspense fallback={<div>加载3D场景中...</div>}>
        <Canvas
          shadows={false}
          camera={{ position: [3, 3, 3], fov: 45 }}
          eventPrefix="pointer"
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={0.8}
            castShadow={false}
          />
          <TestCube onDoubleClick={handleDoubleClick} />
          <OrbitControls
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={50}
            enableDamping={true}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            enableDoubleClickZoom={false}
          />
        </Canvas>
      </Suspense>

      {showDialog && selectedObject && (
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
          <h3>对象信息</h3>
          <div style={{ marginBottom: 10 }}>
            <strong>ID:</strong> {selectedObject.id}
          </div>
          <div style={{ marginBottom: 20 }}>
            <strong>位置:</strong> X={selectedObject.position[0]}, Y={selectedObject.position[1]}, Z={selectedObject.position[2]}
          </div>
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

export default Test3DView;