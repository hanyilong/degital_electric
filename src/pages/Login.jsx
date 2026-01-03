import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { projectApi, userApi } from '../utils/api.js';

const { Option } = Select;

const Login = () => {
  const [form] = Form.useForm();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      message.error('获取项目列表失败');
      console.error('Failed to fetch projects:', error);
    }
  };

  // 处理登录提交
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      // 转换projectId为数字类型
      const projectId = Number(values.projectId);
      
      // 调用登录API，传递项目ID（转换为数字类型）
      const response = await userApi.login({
        username: values.username,
        password: values.password,
        projectId: projectId
      });
      
      if (response) {
        // 获取当前选择的项目名称
        const selectedProject = projects.find(project => project.id === projectId);
        const projectName = selectedProject ? selectedProject.projectName : '未知项目';
        
        // 保存用户信息、项目ID和项目名称到localStorage
        localStorage.setItem('user', JSON.stringify({
          ...response,
          username: values.username,
          projectName: projectName
        }));
        localStorage.setItem('projectId', projectId.toString());
        
        // 跳转到主页面
        window.location.href = '/';
      } else {
        message.error('登录失败，用户名或密码错误或无该项目权限');
      }
    } catch (error) {
      message.error('登录失败，请重试');
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card title="物联&孪生登录" style={{ width: 400 }}>
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="projectId"
            label="项目"
            rules={[{ required: true, message: '请选择项目!' }]}
          >
            <Select placeholder="选择项目">
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.projectName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;