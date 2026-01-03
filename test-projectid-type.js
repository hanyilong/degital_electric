// 测试前端projectId类型
const testProjectIdType = async () => {
  try {
    const projects = await projectApi.getAll();
    console.log('Projects:', projects);
    
    // 模拟登录表单提交
    const mockValues = {
      username: 'user1',
      password: '123456',
      projectId: projects[0]?.id
    };
    
    console.log('Mock projectId:', mockValues.projectId);
    console.log('Mock projectId type:', typeof mockValues.projectId);
    
    // 尝试转换为Number
    console.log('Converted projectId:', Number(mockValues.projectId));
    console.log('Converted projectId type:', typeof Number(mockValues.projectId));
  } catch (error) {
    console.error('Test error:', error);
  }
};

testProjectIdType();