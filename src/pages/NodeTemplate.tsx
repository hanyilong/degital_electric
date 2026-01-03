import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Select, Table, Spin } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import NodeTemplateModel from '../components/NodeTemplateModel';
import { nodeTemplateApi } from '../utils/api.js';

const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token;
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
          }
        }
      }
    `,
    tableContainer: css`
      margin-top: 16px;
      min-height: 400px;
      position: relative;
    `,
    spinContainer: css`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `,
  };
});

interface DataType {
  id: React.Key;
  folderName: string;
  folderLabel?: string;
  label: string;
  shape: string;
  imageDefaultBase64?: string;
  imageStopBase64?: string;
  imageStartBase64?: string;
  imageDefaultSvgBase64?: string;
  imageStopSvgBase64?: string;
  imageIconBase64?: string;
}

const NodeTemplate: React.FC = () => {
  const { styles } = useStyle();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DataType | undefined>();
  const [folderName, setFolderName] = useState<string>('group1');
  // 1. 将dataSource改为状态管理
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  // 2. 添加加载状态
  const [loading, setLoading] = useState<boolean>(true);
  const folderGroup = [
    { value: 'group1', label: '电力' },
    { value: 'group2', label: '空调' },
    { value: 'group3', label: '锅炉' },
    { value: 'group4', label: '园区' },
    { value: 'group5', label: '照明' },
    { value: 'group6', label: '供排水' },
  ]
  // 3. 定义接口请求函数
  const fetchNodeTemplateData = async (folder: string) => {
    try {
      setLoading(true);
      // 调用后台接口获取数据，你需要替换为实际的接口地址
      const res = await nodeTemplateApi.listByFolder(folder);

      // 遍历data，增加folderLabel字段
      res.forEach((item) => {
        item.folderLabel = folderGroup.find((group) => group.value === item.folderName)?.label || '';
      });
      setDataSource(res || []);

    } catch (error) {
      console.error('加载节点模板数据失败:', error);
      message.error('网络异常，数据加载失败');
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };


  // 4. 使用useEffect在组件挂载时加载数据
  useEffect(() => {
    // 页面初始化时调用接口
    fetchNodeTemplateData('group1');

    // 可选：监听folderName变化，实现按文件夹筛选数据
    // 如果需要根据选中的文件夹重新请求数据，可以取消下面的注释
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const columns: TableColumnsType<DataType> = [
    {
      title: '目录名称',
      width: 120,
      dataIndex: 'folderLabel',
      fixed: 'start',
    },
    { title: '节点类型', dataIndex: 'shape', key: '1' },
    { title: '名称', dataIndex: 'label', key: '2' },
    {
      title: '操作',
      fixed: 'end',
      width: 200,
      render: (record) => (
        <>
          <a onClick={() => handleEdit(record)}>编辑</a> &nbsp;
          <a onClick={() => handleDelete(record)}>删除</a>
        </>
      ),
    },
  ];

  const onChange = (value: string) => {

    setFolderName(value);
    console.log(`selected ${value}`);
    // 可选：如果需要根据选中的文件夹重新请求数据
    fetchNodeTemplateData(value);
  };

  const onSearch = (value: string) => {
    console.log('search:', value);
  };

  // 处理编辑按钮点击
  const handleEdit = (record: DataType) => {
    // 从后台获取record详细信息，然后调用setCurrentRecord
    const getNodeTemplateDetail = async (id: string) => {
      try {
        const res = await nodeTemplateApi.getById(id);
        return res
      } catch (error) {
        console.error('获取节点模板详情失败:', error);
        message.error('获取详情失败，请重试');
      }
    };
    getNodeTemplateDetail(record.id).then(data => {
      setCurrentRecord(data);
      setEditModalVisible(true);
    })
  };

  const handleDelete = (record: DataType) => {
    Modal.confirm({
      title: '确认删除',
      content: '是否确认删除该节点模板？',
      onOk: async () => {
        try {
          const res = await nodeTemplateApi.delete(record.id);
          if (res) {
            message.success('删除成功');
            fetchNodeTemplateData(folderName);
          } else {
            message.error(res);
          }
        } catch (error) {
          console.error('删除节点模板失败:', error);
          message.error('删除失败，请重试');
        }
      },
      onCancel: () => {
        console.log('取消删除');
      },
    });
  };

  // 处理编辑确认
  const handleEditOk = async (values: DataType) => {
    try {
      // 如果values的id为空，则为新增，否则为更新
      const res = values.id ? await nodeTemplateApi.update(values.id,values) : await nodeTemplateApi.create(values);
      if (res) {
        message.success('保存成功');
        setEditModalVisible(false);
        // 保存成功后重新加载数据
        fetchNodeTemplateData(folderName);
      } else {
        message.error(res);
      }
    } catch (error) {
      console.error('保存节点模板失败:', error);
      message.error('保存失败，请重试');
    }
  };

  return (
    <>
      <div>
        <Button
          type="primary"
          onClick={() => {
            setCurrentRecord({ folderName: folderName, shape: 'svgImage', label: '', imageDefaultBase64: '', 
              imageStopBase64: '', imageStartBase64: '', imageDefaultSvgBase64: '', imageStopSvgBase64: '', imageIconBase64: '' } as DataType);
            setEditModalVisible(true);
          }}
          style={{ marginRight: 16 }}
        >
          添加图形库
        </Button>
        <Select
          style={{ width: 200 }}
          showSearch={{ optionFilterProp: 'label', onSearch }}
          placeholder="请选择节点类型"
          defaultValue="group1"
          onChange={onChange}
          options={folderGroup}
        />
      </div>

      <div className={styles.tableContainer}>
        {/* 添加加载状态展示 */}
        {loading && (
          <div className={styles.spinContainer}>
            <Spin size="large" tip="正在加载数据..." />
          </div>
        )}

        <Table<DataType>
          bordered
          className={styles.customTable}
          columns={columns}
          dataSource={dataSource}
          scroll={{ x: 'max-content' }}
          pagination={false}
          loading={loading}
        />
      </div>

      <NodeTemplateModel
        visible={editModalVisible}
        initialValues={currentRecord}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditOk}
      />
    </>
  );
};

export default NodeTemplate;