import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import { DatabaseOutlined, SettingOutlined, AlertOutlined, ExclamationCircleOutlined, UserOutlined, DashboardOutlined, MenuOutlined, BarChartOutlined, EditOutlined, PictureOutlined, HighlightOutlined, TableOutlined, EyeOutlined, CodepenOutlined } from '@ant-design/icons';
import ThingModelList from './pages/ThingModelList.jsx';
import DeviceList from './pages/DeviceList.jsx';
import AlarmRuleSetting from './pages/AlarmRuleSetting.jsx';
import AlarmDataQuery from './pages/AlarmDataQuery.jsx';
import IframePage from './pages/IframePage.jsx';
import Login from './pages/Login.jsx';
import Test2 from './pages/Test2.jsx';
import MainGraphApp from './pages/GraphApp.tsx';
import NodeTemplate from './pages/NodeTemplate.tsx'
import TimeSeriesDataQuery from './pages/TimeSeriesDataQuery.jsx'
import ModelViewer from './pages/ModelViewer.jsx'
import { menuApi } from './utils/api.js';

// 图标组件映射表
const iconMap = {
  DatabaseOutlined,
  SettingOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  DashboardOutlined,
  MenuOutlined,
  BarChartOutlined,
  EditOutlined,
  PictureOutlined,
  HighlightOutlined,
  TableOutlined,
  EyeOutlined,
  CodepenOutlined
};

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  // 测试环境中总是显示子组件，方便测试菜单
  return children;
  // const isAuthenticated = localStorage.getItem('user');
  // return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 主应用布局组件
const AppLayout = () => {
  const { Sider, Content, Header } = Layout;
  const location = useLocation();
  const navigate = useNavigate();
  
  // 菜单数据状态
  const [menus, setMenus] = useState([]);
  
  // 侧边栏收起/展开状态
  const [collapsed, setCollapsed] = useState(false);
  
  // 用户信息状态
  const [user, setUser] = useState(() => {
    // 初始化时从localStorage获取用户信息
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  
  // 加载用户信息和菜单数据
  useEffect(() => {
    // 检查用户信息，如果不存在则创建测试用户
    if (!user) {
      const testUser = {
        id: 1,
        username: 'testuser',
        projectName: '测试项目'
      };
      localStorage.setItem('user', JSON.stringify(testUser));
      setUser(testUser);
      return;
    }
    
    // 加载菜单数据
    const loadMenuData = async () => {
      try {
        // 调用真实的API获取菜单数据
        const menuData = await menuApi.getAll();
        
        // 如果API返回数据，则使用API数据；否则使用默认测试数据
        if (menuData && menuData.length > 0) {
          // 将扁平的菜单数据转换为嵌套的父子结构
          const buildMenuTree = (menuList, parentId = 0) => {
            const children = menuList.filter(menu => menu.parentId === parentId);
            return children.map(menu => {
              // 移除路径中的前导斜杠，确保与前端路由配置一致
              const path = menu.path ? menu.path.replace(/^\//, '') : '';
              return {
                ...menu,
                path,
                children: buildMenuTree(menuList, menu.id)
              };
            });
          };
          
          // 构建嵌套菜单结构
          const nestedMenus = buildMenuTree(menuData);
          setMenus(nestedMenus);
        } else {
          // 使用默认测试数据作为备选
          const defaultMenus = [
            {
              "id": 6,
              "name": "可视化",
              "key": "level1",
              "path": "",
              "icon": "MenuOutlined",
              "component": "",
              "parentId": 0,
              "sortOrder": null,
              "status": 1,
              "createTime": null,
              "updateTime": null,
              "children": [
                {
                  "id": 7,
                  "name": "可视化制作",
                  "key": "graph-create",
                  "path": "graph-create",
                  "icon": "",
                  "component": "MainGraphApp",
                  "parentId": 6,
                  "sortOrder": null,
                  "status": 1,
                  "createTime": null,
                  "updateTime": null,
                  "children": []
                },
                {
                  "id": 8,
                  "name": "图形库",
                  "key": "graph-node",
                  "path": "graph-node",
                  "icon": "",
                  "component": "NodeTemplate",
                  "parentId": 6,
                  "sortOrder": null,
                  "status": 1,
                  "createTime": null,
                  "updateTime": null,
                  "children": []
                },
                {
                  "id": 9,
                  "name": "矢量图制作",
                  "key": "svg-editor",
                  "path": "svg-editor",
                  "icon": "",
                  "component": "IframePage",
                  "parentId": 6,
                  "sortOrder": null,
                  "status": 1,
                  "createTime": null,
                  "updateTime": null,
                  "children": []
                }
              ]
            }
          ];
          setMenus(defaultMenus);
        }
      } catch (error) {
        // 出错时使用默认测试数据
        const defaultMenus = [
          {
            "id": 6,
            "name": "可视化",
            "key": "level1",
            "path": "",
            "icon": "MenuOutlined",
            "component": "",
            "parentId": 0,
            "sortOrder": null,
            "status": 1,
            "createTime": null,
            "updateTime": null,
            "children": [
              {
                "id": 7,
                "name": "可视化制作",
                "key": "graph-create",
                "path": "graph-create",
                "icon": "",
                "component": "MainGraphApp",
                "parentId": 6,
                "sortOrder": null,
                "status": 1,
                "createTime": null,
                "updateTime": null,
                "children": []
              },
              {
                "id": 8,
                "name": "图形库",
                "key": "graph-node",
                "path": "graph-node",
                "icon": "",
                "component": "NodeTemplate",
                "parentId": 6,
                "sortOrder": null,
                "status": 1,
                "createTime": null,
                "updateTime": null,
                "children": []
              },
              {
                "id": 9,
                "name": "矢量图制作",
                "key": "svg-editor",
                "path": "svg-editor",
                "icon": "",
                "component": "IframePage",
                "parentId": 6,
                "sortOrder": null,
                "status": 1,
                "createTime": null,
                "updateTime": null,
                "children": []
              }
            ]
          }
        ];
        setMenus(defaultMenus);
      }
    };
    
    loadMenuData();
  }, [user]);
  
  // 递归生成菜单items配置
  const generateMenuItems = (menuList) => {
    if (!menuList || menuList.length === 0) {
      return [];
    }
    
    return menuList.map(menu => {
      // 获取图标组件
      const IconComponent = menu.icon ? iconMap[menu.icon] : null;
      // 创建菜单项配置
      const menuItem = {
        key: menu.key,
        label: menu.name,
        icon: IconComponent ? <IconComponent /> : null
      };
      
      // 如果有子菜单，添加children配置，但不添加点击事件（父菜单项应该是展开/折叠子菜单）
      if (menu.children && menu.children.length > 0) {
        menuItem.children = generateMenuItems(menu.children);
      } else {
        // 叶子节点，无论是否有path都显示在日志中
        if (menu.path) {
          // 只有有path的叶子节点才添加点击事件
          menuItem.onClick = () => {
            try {
              navigate(menu.path);
            }
            catch (error) {
              console.error('跳转失败:', error);
            }
          };
        }
      }
      
      return menuItem;
    });
  };
  
  // 根据当前路由设置选中的菜单项
  const getSelectedKey = () => {
    const { pathname } = location;
    // 处理特殊路由映射
    if (pathname === '/') return 'thing-models';
    return pathname.substring(1); // 移除开头的斜杠
  };
  
  // 生成菜单items
  const menuItems = generateMenuItems(menus);
  
  // 退出登录功能
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };
  
  // 用户下拉菜单
  const menu = {
    items: [
      {
        key: 'project',
        label: `当前项目: ${user?.projectName || '未知项目'}`,
      },
      {
        key: 'profile',
        label: `当前用户: ${user?.username || '未知用户'}`,
      },
      {
        key: 'logout',
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        theme="dark" 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{ padding: '16px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          {collapsed ? '设备管理' : '物联&孪生'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[getSelectedKey()]} items={[
          ...menuItems,
        ]} defaultOpenKeys={['level1']} />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={menu} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user?.username || '未知用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: '20px', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 登录路由 */}
        <Route path="/login" element={<Login />} />
        
        {/* 受保护的路由 */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<ThingModelList />} />
          <Route path="thing-models" element={<ThingModelList />} />
          <Route path="devices" element={<DeviceList />} />
          <Route path="alarm-rules" element={<AlarmRuleSetting />} />
          <Route path="alarm-records" element={<AlarmDataQuery />} />
          <Route path="visualization" element={<IframePage />} />
          <Route path="test2" element={<Test2 />} />
          <Route path="graph-create" element={<MainGraphApp />} />
          <Route path="graph-node" element={<NodeTemplate />} />
          <Route path="svg-editor" element={<IframePage />} />
          <Route path="graph-svg" element={<IframePage />} />
          <Route path="time-series-data-query" element={<TimeSeriesDataQuery />} />
          <Route path="graph-3d" element={<ModelViewer />} />
        </Route>
        
        {/* 重定向所有未匹配的路由到主页面 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;