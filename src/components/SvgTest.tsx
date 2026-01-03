import React, { useRef, useEffect } from 'react';
import { Graph } from '@antv/x6';
import { Form, Input, Button, Card, Flex } from 'antd';

type FieldType = { path?: string };

export default function SvgTest() {
    const [form] = Form.useForm<FieldType>(); // 创建 Form 实例
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);

    // 初始化 X6 画布（替代 componentDidMount）
    useEffect(() => {
        if (containerRef.current) {
            graphRef.current = new Graph({
                container: containerRef.current,
                background: { color: '#F2F7FA' },
                width: 400,
                height: 400,
                interacting: {  // 交互配置（确保画布可聚焦）
                    nodeMovable: false,    // 禁止节点移动
                    edgeMovable: false,    // 禁止连线移动
                    nodeSelectable: false, // 禁止节点选中
                    edgeSelectable: false, // 禁止连线选中
                    nodeResizable: false,  // 禁止节点调整大小
                    edgeResizable: false,  // 禁止连线调整
                    arrowheadMovable: false,// 禁止连线端点移动
                },
            });
            // 初始生成默认节点
            addPathNode("M 0 0 0 20 20 20 20 0 0 0 Z");

        }
    }, []);

    // 封装添加 Path 节点方法
    const addPathNode = (pathValue: string) => {
        if (!graphRef.current) return;
        graphRef.current.clearCells();
        graphRef.current.addNode({
            id: 'custom-path-node',
            shape: 'path',
            x: 0,
            y: 0,
            width: 400,
            height: 400,
            attrs: { path: { d: pathValue, } },
            //   attrs: { path: { d: pathValue, }, body: { fill: '#d43333ff', stroke: '#000000', strokeWidth: 1, }},
        });
    };

    // 绘制 Path 节点
    const drawPath = async () => {
        try {
            const values = await form.validateFields(['path']);
            addPathNode(values.path || '');
        } catch (e) {
            console.log('表单校验失败', e);
        }
    };

    return (
        <div style={{ width: 900, padding: '0px' }}>
            <Form
                form={form}
                initialValues={{ path: "M 0 5 10 0 C 20 0 20 20 10 20 L 0 15 Z" }}
            >
                <Flex >
                    <Form.Item<FieldType>
                        name="path"
                        label=""
                        rules={[{ required: true, message: '请输入路径' }]}
                    >
                        <div style={{ width: 800 }}><Input.TextArea rows={4} /></div>

                    </Form.Item>
                    <Button onClick={drawPath}>生成</Button>
                </Flex>
            </Form>
            <Flex >
                <div ref={containerRef} style={{ width: 400, height: 600, border: '1px solid #eee' }} />
                <div></div>
                <div  style={{ width: 400, height: 400, border: '1px solid #eee' }} ><Input.TextArea value={ "学习网站：https://svg.m.mw/chinese ，https://segmentfault.com/a/1190000047283095\r\n" +
                    "线条：M 0 5 0 10 Z, 或者 M 0 5 10 5 Z, 或者 M 0 5 10 0 Z\r\n" +
                    "方形：M 0 5 10 0 C 20 0 20 20 10 20 L 0 15 Z,菱形：M 10,5 L 15,10 L 10,15 L 5,10 Z\r\n" +
                    "圆形：M 0 0 A 10 10 0 1 1 20 0 A 10 10 0 1 1 0 0 Z,椭圆：M 0 0 A 10 20 0 1 1 20 0 A 10 20 0 1 1 0 0 Z, 三角形：M 0 0 L 10 20 L 20 0 Z,\r\n" +
                    "心形： M24.85,10.126c2.018-4.783,6.628-8.125,11.99-8.125c7.223,0,12.425,6.179,13.079,13.543c0,0,0.353,1.828-0.424,5.119c-1.058,4.482-3.545,8.464-6.898,11.503L24.85,48L7.402,32.165c-3.353-3.038-5.84-7.021-6.898-11.503c-0.777-3.291-0.424-5.119-0.424-5.119C0.734,8.179,5.936,2,13.159,2C18.522,2,22.832,5.343,24.85,10.126z,\r\n" +
                    "五角星：M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956C22.602,0.567,25.338,0.567,26.285,2.486z"

                    } rows={7}>  </Input.TextArea></div></Flex>
        </div>
    );
}