import { Graph } from '@antv/x6';
import React, { useRef, useEffect, useState, cache, use } from 'react';
import { Button, Modal, Form, Input, Table, Space, Flex, Select, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { TableProps } from 'antd';
import { graphApi, apiBaseURL } from '../utils/api.js';
import { useCounter, type BoardConfigure } from '../graph-context';
import '../main.css';
import SvgTest from './SvgTest.tsx';

interface TopMenuProps {
  graph: Graph | null;
}

interface DataType {
  id: number;
  name: string;
  bgColor: string;
  data: string;
  apiNodes: string;
  iotNodes: string;
  popupNodes: string;
}
interface FormState {
  sizeOption: string;
  width: number;
  height: number;
  showGrid: boolean;
  gridSizeOption: string;
  gridSize: number;
  showCrossLine: boolean;
  showDynamicFlow: boolean;
}
const info = () => {
  message.info('This is a normal message');
};

const TopMenu: React.FC<TopMenuProps> = ({ graph }) => {
  const [isNewboard, setNewBoard] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isSettingModalOpen, setSettingModalOpen] = useState(false);
  const [isSvgModalOpen, setSvgModalOpen] = useState(false);
  const [record, setRecord] = useState<DataType>();
  const [state, setState] = useState<FormState>({
    sizeOption: 'A4 尺寸(1050px*1500px)',
    width: '1500',
    height: '1000',
    showGrid: false,
    gridSizeOption: '正常',
    gridSize: 15,
    showCrossLine: false,
    showDynamicFlow: false,
  });
  const [color, setColor] = useState('#000000');
  const { increment, decrement, onCellSelect, displayRef, boardConfigure, storeBoardConfigureData } = useCounter(); // 从 Context 获取方法
  const routerOpentions = [{ routerId: "normal", routerName: '直线' }, { routerId: "manhattan", routerName: '智能' }];
  const [routerId, setRouterId] = useState("normal");


  const handleColorChange = (color: string) => {
    setColor(color);
    const graphContainer: HTMLDivElement | null = document.getElementById('graphCanvasContainer');
    if (graphContainer) {
      graphContainer.style.backgroundColor = color;
    }
  };

  const bgUploadProps: UploadProps = {
    name: 'file',
    action: `${apiBaseURL}/graph/upload`,
    headers: {
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        console.log(`${info.file.name} file uploaded successfully`);
        const response = info.file.response;
        if (response.code === 200) {
          const options = {
            image: response.data,
            size: "contain",
            repeat: "no-repeat",
            opacity: 0.5,
            quality: 1
          };
          boardConfigure.bgImage = response.data;
          graph?.drawBackground(options)
        }

      } else if (info.file.status === 'error') {
        console.log(`${info.file.name} file upload failed.`);
      }
    },
  };



  const handleShowGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, showGrid: e.target.checked }));
    if (!state.showGrid) {
      graph?.showGrid();
    } else {
      graph?.hideGrid();
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, width: e.target.value }));
    graph?.resize(e.target.value, state.height);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, height: e.target.value }));
    graph?.resize(state.width, e.target.value);
  };
  const [formData, setFormData] = useState({
    boardName: '',
  });

  const [searchFormData, setSearchFormData] = useState({
    boardId: '',
    boardName: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchFormChange = (e) => {
    const { name, value } = e.target;
    setSearchFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchBroad = () => {
    loadBroadList(searchFormData.boardId, searchFormData.boardName);
  }

  const showEditModal = () => {
    setEditModalOpen(true);

  };
  const handleEditModalOk = () => {
    setEditModalOpen(false);
    insertOrUpdateToDb();
  };
  const handleEditModalCancel = () => {
    setEditModalOpen(false);
  };
  const handleSettingModalOk = () => {
    setSettingModalOpen(false);
  };
  const handleSettingModalCancel = () => {
    setSettingModalOpen(false);
  };
  const handleSvgModalOk = () => {
    setSvgModalOpen(false);
  };
  const handleSvgModalCancel = () => {
    setSvgModalOpen(false);
  };
  const [dataSource, setDataSource] = useState([]);

  const [isListModalOpen, setListModalOpen] = useState(false);
  const newGraph = () => {
    console.log('newGraph');
    graph?.clearBackground();
    setNewBoard(true);
    setRecord(null);
    graph?.removeCells(graph?.getCells());
    graph?.centerContent();
    if (boardConfigure) {
      storeBoardConfigureData(null)
    }

  }

  const loadBroadList = (boardId: string, boardName: string) => {
    const boardResponse = async (): Promise<object> => {
      try {
        const data = await graphApi.listByProjectAndName(boardName);
        return data;
      } catch (error) {
        console.log('error', error)
      }
    }
    boardResponse().then(data => {
      setDataSource(data);
    })
  }

  const showListModal = () => {
    setListModalOpen(true);
    loadBroadList("", "");
  };


  const handleListModalOk = () => {
    setListModalOpen(false);
  };
  const handleListModalCancel = () => {
    setListModalOpen(false);
  };

  const handleDelay = (boardConfigure: BoardConfigure) => {
    // 找到当前画布中静态文本标签的节点，并设置为默认样式
    const staticTextNodes = graph?.getNodes().filter(node => node.shape === 'static-text-graph');
    staticTextNodes?.forEach(node => {
      const nd = node.getData();
      const nodeContainer = document.getElementById(node.id + 'container');
      if (nd?.textStyle && nd?.textStyle.html) {
        nodeContainer.innerHTML = nd?.textStyle.html;
      }
      const textStates = nd?.defaultStyle;
      const style = "font-family: " + textStates.font + "; font-size: " + textStates.size + "pt;font-weight: " + (textStates.isBold ? "bold" : "normal") + ";font-style: " + (textStates.isItalic ? "italic" : "normal") + ";text-decoration: " + (textStates.isUnderline ? "underline" : "none") + ";color: " + textStates.color;
      const containerId = node?.id + 'container';
      const container = document.getElementById(containerId)!;
      if (container) {
        container.style.cssText = style;
      }
    });

    const options = {
      image: boardConfigure.bgImage,
      // size: "cover",
      size: "contain",
      repeat: "no-repeat",
      opacity: 0.5,
      quality: 1
    };
    graph?.drawBackground(options)

  }

  const openGraph = (record: DataType) => {
    const boardResponse = async (): Promise<object> => {
      try {
        const data = await graphApi.getById(record.id);
        return data;
      } catch (error) {
        console.log('error', error)
      }
    }
    boardResponse().then(data => {
      const loadedData = data;
      setNewBoard(false);
      setRecord(loadedData);
      const c: HTMLDivElement = document.getElementById('graphCanvasContainer');
      c.style.backgroundColor = loadedData?.bgColor;
      if (boardConfigure) {
        boardConfigure.boardName = loadedData?.name;
        boardConfigure.bgColor = loadedData?.bgColor;
        boardConfigure.bgImage = loadedData?.bgImage;
        let router = loadedData?.router;
        if (!router) {
          router = 'manhattan'
        }
        setRouterId(router);
        boardConfigure.router = router;
        boardConfigure.width = loadedData?.width;
        boardConfigure.height = loadedData?.height;
        boardConfigure.data = JSON.parse(loadedData?.data);
        boardConfigure.nodeConfigs = JSON.parse(loadedData?.nodeConfigs);
        storeBoardConfigureData(boardConfigure);

      }
      const boardData = JSON.parse(loadedData?.data);
      graph?.fromJSON(boardData);
      // graph?.centerContent();
      graph?.resize(loadedData?.width, loadedData?.height);
      setState({
        ...state,
        width: loadedData?.width,
        height: loadedData?.height,
      })
      // 处理静态文本节点
      setTimeout(handleDelay, 2000, boardConfigure);
      setListModalOpen(false);
    })
  }

  useEffect(() => {
    let defaultOptions = graph?.options
    if (defaultOptions) {
      defaultOptions.connecting.router = routerId
      console.log('defaultOptions', defaultOptions);
    }

  }, [routerId]);

  const deleteGraph = (deleteRecord: DataType) => {
    console.log('deleteGraph', deleteRecord);
    const boardResponse = async (): Promise<object> => {
      try {
        const data = await graphApi.delete(deleteRecord?.id);
        return data;
      } catch (error) {
        console.log('error', error)
      }
    }
    boardResponse().then(data => {
      console.log('delete data success', data);
      loadBroadList(searchFormData.boardId, searchFormData.boardName);
    })

  }


  const columns: TableProps<DataType>['columns'] = [
    {
      title: '画布名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '背景色',
      dataIndex: 'bgColor',
      key: 'bgColor',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => openGraph(record)}>打开</Button>
          <Button type="link" onClick={() => deleteGraph(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleOpenLink = () => {
    if (!graph) {
      return;
    }
    if (boardConfigure) {
      boardConfigure.bgColor = graph.container.style.backgroundColor
      boardConfigure.bgImage = graph.background.options.background?.image;
      boardConfigure.boardData = graph.toJSON();
      boardConfigure.router = routerId;
      const cells = graph.getCells();
      const nodeDataConfigs = [];
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellData = cell.getData();
        if (cellData) {
          nodeDataConfigs.push(cellData);
        }
      }
      boardConfigure.nodeDataConfigs = nodeDataConfigs;
      boardConfigure.width = state.width;
      boardConfigure.height = state.height;
      // 检查graph是否包含system-component开头组件，如果包含，将组件的size，配置数据存储在node data中
      storeBoardConfigureData(boardConfigure);
    }
    window.open(`${window.location.origin}/preview.html`, '_blank');
  };

  const handleOpenNoteTemplate = () => {
    if (!graph) {
      return;
    }
    window.open(`${window.location.origin}/template.html`, '_blank');
  };

  const handlePageSetting = () => {
    setSettingModalOpen(true);
    setRouterId(boardConfigure?.router || "normal");
  }
  
  const handleTest = () => {
    if (graph) {
      graph.addNode({
      shape: 'hollow-arrow-node',
      x: 100,
      y: 100,
      width: 200, // 可手动调整宽度，尾部自适应
      height: 80,
      attrs: {
        label: {
          // text: '空心箭头节点',
        },
      },
    });
    }
  }

  // 置顶节点：设置zIndex为当前最大zIndex + 1
  const bringToFront = () => {
    const selectedCells = graph?.getSelectedCells();
    // const selectedNodes = selectedCells?.filter(cell => cell.isNode());
    if (selectedCells && selectedCells.length > 0) {
      selectedCells.forEach(cell => {
        const allZIndexes = graph?.getCells()?.map(cell => cell?.getZIndex() || 0) || [];
        const maxZIndex = Math.max(...allZIndexes, 0);
        const newZIndex = maxZIndex + 1;
        cell.setZIndex(newZIndex);
      });
    }

  };
  const saveGraph = () => {
    const data = graph?.toJSON();
    const json = JSON.stringify(data, null, 2);
    console.log('graph data', json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    console.log('url', url);
  };

  const saveGraphAs = () => {
    setNewBoard(true);
    setRecord(null);
    showEditModal();

  };

  const handleRouterChange = (eventType: string, e: any) => {
    if (eventType === "routerId") {
      console.log('routerId', e);
      setRouterId(e);
    }
  };

  const getNodeconfigs = () => {
    const cells = graph?.getCells();
    const nodeDataConfigs = [];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cellData = cell.getData();
      if (cellData) {
        nodeDataConfigs.push(cellData);
      }
    }
    return nodeDataConfigs;
  }

  const insertOrUpdateToDb = () => {

    const data = graph?.toJSON();
    const json = JSON.stringify(data, null, 2);
    console.log('表单值：', formData.boardName);
    const boardName = record?.name ? record.name : formData?.boardName;
    const boardData = {
      id: record?.id,
      name: boardName,
      bgColor: graph?.container.style.backgroundColor,
      bgImage: graph?.background.options.background?.image,
      width: state.width,
      height: state.height,
      data: json,
      nodeConfigs: JSON.stringify(getNodeconfigs()),
    }
    const boardResponse = async (): Promise<object> => {
      try {
        // 如果record存在，则更新，否则创建
        if (record && record.id) {
          const data = await graphApi.update(record.id, boardData);
          return data;
        }
        const data = await graphApi.create(boardData);
        return data;
      } catch (error) {
        console.log('error', error)
      }
    }
    boardResponse().then(data => {
      setNewBoard(false);
      console.log('save data success', data);
    })
  }
  const saveGraphToDb = () => {
    if (isNewboard) {
      showEditModal();
      return;
    }
    insertOrUpdateToDb();
  };

  // 置底节点：设置zIndex为0
  const sendToBack = () => {
    const selectedCells = graph?.getSelectedCells();
    if (selectedCells && selectedCells.length > 0) {
      selectedCells.forEach(cell => {
        cell.setZIndex(0);
      });
    }
  };


  return (
    <>
      <div className="app-header">
        <Button type="text" onClick={showListModal}>页面列表</Button>
        <Button type="text" onClick={newGraph}>
          新增页面
        </Button>
        <Button type="text" onClick={saveGraphToDb}>
          保存
        </Button>
        <Button type="text" onClick={saveGraphAs}>
          另存为
        </Button>
        <Button type="text" onClick={bringToFront}>
          置顶
        </Button>
        <Button type="text" onClick={sendToBack}>
          置底
        </Button>
        <Button type="text" onClick={handleOpenLink}>
          预览
        </Button>
        <Button type="text" onClick={handlePageSetting}>
          页面设置
        </Button>
        {/* <Button type="text" onClick={handleOpenNoteTemplate}>
          图形库配置
        </Button> */}
        {/* <Button type="text" onClick={handleSVGIcon}>
          矢量图制作
        </Button> */}
        {/* <Button type="text" onClick={handleTest}>
          测试
        </Button> */}
        {/* 
        <button onClick={handleOpenLinkDb}>
          加载后台数据
        </button> */}
      </div>
      <Modal
        title="画板列表"
        closable={{ 'aria-label': 'Custom Close Button' }}
        width={800}
        open={isListModalOpen}
        onOk={handleListModalOk}
        onCancel={handleListModalCancel}
      >
        <div style={{
          display: 'flex',
          gap: 16, // 间距
          width: '100%',
          maxWidth: 600,
          alignItems: 'center' // 垂直居中对齐
        }}>
          <Form
            name="boardSearchForm"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            autoComplete="off"
          ><Flex>
              <Input placeholder="画板编码" name="boardId" value={searchFormData.boardId} onChange={handleSearchFormChange} style={{ flex: 1 }} />
              <Input placeholder="画板名称" name="boardName" value={searchFormData.boardName} onChange={handleSearchFormChange} style={{ flex: 1 }} />
              <Button type="primary" onClick={handleSearchBroad}>搜索</Button>
            </Flex>
          </Form>
        </div>
        <div >
          <Table dataSource={dataSource} columns={columns} rowKey="id" />
        </div>
      </Modal>
      <Modal
        title="画板编辑"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isEditModalOpen}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
      >
        <div>
          <Form
            name="boardEditForm"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            autoComplete="off"
          >
            <input
              type="text"
              name="boardName" // 与状态字段名对应
              value={formData.boardName}
              onChange={handleChange}
              placeholder="画板名称"
            />
          </Form>
        </div>
      </Modal>

      <Modal
        title="页面设置"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isSettingModalOpen}
        onOk={handleSettingModalOk}
        onCancel={handleSettingModalCancel}
      >
        <div className="image-display-form">
          {/* 背景颜色选择区域 */}
          <div className="form-item">
            <label className="form-label">背景颜色</label>
            <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)} />
          </div>
          <div className="form-item">
            <label className="form-label">背景图片</label>
            <Upload {...bgUploadProps}>
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
          </div>

          {/* 尺寸选择区域 */}
          <div className="form-item">
            <label className="form-label">页面宽度</label>
            <input
              type="text"
              style={{ width: 50 }}
              value={state.width}
              onChange={handleWidthChange}
              className="form-input"
              placeholder="W"
            />
          </div>
          {/* 尺寸选择区域 */}
          <div className="form-item">
            <label className="form-label">页面高度</label>
            <input
              type="text"
              style={{ width: 50 }}
              value={state.height}
              onChange={handleHeightChange}
              className="form-input"
              placeholder="H"
            />
          </div>
          {/* 显示网格区域 */}
          <div className="form-item">
            <input
              type="checkbox"
              checked={state.showGrid}
              onChange={handleShowGridChange}
              id="showGrid"
            />
            <label htmlFor="showGrid" className="checkbox-label">显示网格</label>
          </div>
          <div className="form-item">
            <Select value={routerId} onChange={(e) => handleRouterChange("routerId", e)}
              style={{ width: 120 }}>
              <Select.OptGroup label="默认路由">
                {routerOpentions.map(f => (
                  <Select.Option key={f.routerId} value={f.routerId}>{f.routerName}</Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </div>
        </div>
      </Modal>
      <Modal
        title="SVG测试"
        width={1000}
        style={{ height: 800 }}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isSvgModalOpen}
        onOk={handleSvgModalOk}
        onCancel={handleSvgModalCancel}
      >
        <div id='svgGraphContainer'>
          <SvgTest />
        </div>
      </Modal>
    </>
  );
};

export default TopMenu;