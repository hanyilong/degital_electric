import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Input, Select, Tabs, type TabsProps, Card, Button } from 'antd';
import '../main.css';

// 定义数据类型（与表格的 DataType 保持一致）
interface DataType {
    id: number;
    folderName: string;
    shape: string;
    imageIcon: string;
    label: string;
    imageDefault: string;
    imageStop: string;
    imageStart: string;
    svgTemplate: string;
    svgDefaultStyle: string;
    svgStopStyle: string;
    svgStartStyle: string;
    // 可添加其他必要字段
    key?: string;
}

function parseSvgFormula(svgTemplate: string) {
    // 正则匹配{{}}中的公式（非贪婪匹配，支持任意空格和算术表达式）
    const formulaRegex = /\{\{(.+?)\}\}/g;

    // 替换并计算每个公式
    const parsedSvg = svgTemplate.replace(formulaRegex, (match, formula) => {
        try {
            // 去除公式中的多余空格，执行计算
            const cleanFormula = formula.trim();
            // 仅允许算术运算相关的字符（防止注入风险）
            const safeRegex = /^[\d+\-*/().\s]+$/;
            if (!safeRegex.test(cleanFormula)) {
                throw new Error(`非法公式内容：${cleanFormula}`);
            }
            // 执行公式计算并返回结果
            const result = Math.round(eval(cleanFormula));
            // 确保返回数值类型（避免非数值结果）
            return typeof result === 'number' ? result : match;
        } catch (error) {
            // 公式计算失败时，保留原{{}}内容并打印错误
            console.error(`公式计算失败：${formula}，错误信息：${error.message}`);
            return match;
        }
    });

    return parsedSvg;
}

// 编辑对话框属性
interface NodeTemplateModelProps {
    visible: boolean; // 对话框是否显示
    onCancel: () => void; // 取消回调
    onOk: (values: DataType) => void; // 确认回调（返回表单值）
    initialValues?: DataType; // 初始值（待编辑数据）
    title?: string; // 对话框标题，默认"编辑数据"
}
export const ESCAPED_SVG_TEMPLATE = `例：<svg viewBox="0 0  --width-- --height--" xmlns="http://www.w3.org/2000/svg">
  <circle cx="{{--width-- / 2}}" cy="{{--height-- / 2}}" r="{{ --height-- / 2 - 6}}" 
  stroke-width="--strokeWidth--" stroke="--stroke--" fill="--fillColor--"/>
</svg>，参考（https://svg.m.mw/chinese，https://yqnn.github.io/svg-path-editor/）`;
export const ESCAPED_SVG_STYLE = `例：{
            fillColor: "#ffffff",
            stroke: "#000000",
            strokeDasharray: "none",
            strokeWidth: 1,
            valueExp: "0",
          }`
// 语法合法的泛型函数
const parseJsObjectStr = (str: string): Record<string, any> => {
    // 1. 空值校验：避免空字符串导致解析失败
    if (!str || typeof str !== 'string') {
        return {};
    }
    try {
        // 2. 清理字符串并包装为合法函数体（适配原生JS对象语法）
        const cleanStr = str
            .trim() // 去除首尾空格/换行
            .replace(/^[{]\s*/, 'return {') // 开头 { 替换为 return {
            .replace(/\s*[}]$/, '};'); // 结尾 } 替换为 };

        // 3. 安全执行解析（new Function 比 eval 更安全）
        const parseFn = new Function(cleanStr);
        // 4. 执行函数并断言为目标类型
        const result = parseFn();
        return result;
    } catch (error) {
        // 5. 异常捕获：解析失败时返回 null，避免页面崩溃
        console.error('解析 JS 对象字符串失败：', error);
        return {};
    }
};

const NodeTemplateModel: React.FC<NodeTemplateModelProps> = ({
    visible,
    onCancel,
    onOk,
    initialValues,
    title = '编辑数据',
}) => {
    const [nodeTypeActiveKey, setNodeTypeActiveKey] = useState('svgImage');
    // 创建表单实例
    const [form] = Form.useForm();

    // 预览图状态
    const [imageDefaultBase64, setImageDefaultBase64] = useState<string>('');
    const [imageStopBase64, setImageStopBase64] = useState<string>('');
    const [imageStartBase64, setImageStartBase64] = useState<string>('');
    const [imageDefaultSvgBase64, setImageDefaultSvgBase64] = useState<string>('');
    const [imageStopSvgBase64, setImageStopSvgBase64] = useState<string>('');
    const [imageStartSvgBase64, setImageStartSvgBase64] = useState<string>('');
    const [imageIconBase64, setImageIconBase64] = useState<string>('');
    const [formValues, setFormValues] = useState<DataType>({} as DataType)


    // 初始化表单和预览状态
    const initFormAndPreview = useCallback(async () => {
        if (visible && initialValues) {
            setFormValues(initialValues);
            // // 1. 设置表单字段值
            await form.setFieldsValue({
                ...initialValues,
                // 兼容key和id的映射
                id: initialValues.id || (initialValues.key ? Number(initialValues.key) : undefined),
            });

            // 2. 设置节点类型
            setNodeTypeActiveKey(initialValues.shape || 'svgImage');

        } else if (!visible) {
            // 重置表单和预览状态
            form.resetFields();
            setImageDefaultBase64('');
            setImageStopBase64('');
            setImageStartBase64('');
            setImageDefaultSvgBase64('');
            setImageStopSvgBase64('');
            setImageStartSvgBase64('');
            setImageIconBase64('');
        }
    }, [visible, initialValues, form]);

    // 当初始值或可见性变化时初始化
    useEffect(() => {
        initFormAndPreview();
    }, [visible, initialValues, initFormAndPreview]);

    // 处理确认按钮点击
    const handleOk = async () => {
        try {
            // 验证并获取表单所有字段值（包括隐藏字段）
            const values = await form.validateFields();
            console.log('表单所有值:', values); // 调试用：查看是否包含id
            onOk(values as DataType);
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    const onChange = (key: string) => {
        console.log(key);
    };

    // 重构createImageByTemplate，支持传入svgTemplate参数
    const createImageByTemplate = (styleStr: string, svgTemplate?: string): string => {
        const template = svgTemplate || form.getFieldValue('svgTemplate') ||
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>';

        // 将style字符串转换为对象
        const styleObj = parseJsObjectStr(styleStr);
        // 在styleObj中增加默认width和height属性
        styleObj['width'] = 100;
        styleObj['height'] = 100;
        // 替换svgTemplate中的样式变量
        // 去掉svgTemplate中的换行符和多余空格
        const cleanSvgTemplate = template.replace(/\s+/g, ' ').trim();
        let styledSvg = cleanSvgTemplate;
        for (const [key, val] of Object.entries(styleObj)) {
            const regex = new RegExp(`--${key}--`, 'g');
            styledSvg = styledSvg.replace(regex, String(val));
        }
        styledSvg = parseSvgFormula(styledSvg);
        // 将替换后的SVG内容转换为base64
        const svgBase64 = 'data:image/svg+xml;base64,' + btoa(styledSvg);
        return svgBase64;
    };

    const handleImageIconChange = (value: string) => {
        setImageIconBase64(value);
        form.setFieldsValue({ imageIcon: value });
    };
    // 自定义图片变更处理
    const handleImageDefaultChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setImageDefaultBase64(value);
        form.setFieldsValue({ imageDefault: value });
    };

    const handleImageStopChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setImageStopBase64(value);
        form.setFieldsValue({ imageStop: value });
    };

    const handleImageStartChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setImageStartBase64(value);
        form.setFieldsValue({ imageStart: value });
    };

    // SVG图片预览组件
    interface SvgImageProps {
        width?: string | number;
        height?: string | number;
        className?: string;
        style?: React.CSSProperties;
        svgBase64: string;
    }

    const SvgImage: React.FC<SvgImageProps> = ({
        width = 26,
        height = 26,
        className = '',
        style = {},
        svgBase64
    }) => {
        return (
            <div
                className={className}
                style={{
                    display: 'inline-block',
                    width,
                    height,
                    ...style,
                }}
            >
                {svgBase64 && svgBase64 !== "" && (
                    <img
                        src={svgBase64}
                        alt="Logo SVG"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                )}
            </div>
        );
    };

    // 自定义图片Tab项
    const imageItems: TabsProps['items'] = [
        {
            key: '1',
            label: '默认图片',
            children: (
                <Form.Item key='imageDefault' name='imageDefault'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入默认图片内容Base64编码'
                                rows={4}
                                style={{ resize: 'vertical' }}
                                value={form.getFieldValue('imageDefault') || ''}
                                onChange={handleImageDefaultChange}
                            />
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const imgSource = form.getFieldValue('imageDefault');
                                if (imgSource.startsWith('data:image')) {
                                    setImageDefaultBase64(imgSource);
                                } else {
                                    const base64 = createImageByTemplate("{}", imgSource)
                                    setImageDefaultBase64(base64);
                                }
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageDefaultBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
        {
            key: '2',
            label: '停止图片',
            children: (
                <Form.Item key='imageStop' name='imageStop'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入停止图片内容Base64编码'
                                rows={4}
                                style={{ resize: 'vertical' }}
                                value={form.getFieldValue('imageStop') || ''}
                                onChange={handleImageStopChange}
                            />
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const imgSource = form.getFieldValue('imageStop');
                                if (imgSource.startsWith('data:image')) {
                                    setImageStopBase64(imgSource);
                                } else {
                                    const base64 = createImageByTemplate("{}", imgSource)
                                    setImageStopBase64(base64);
                                }
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageStopBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
        {
            key: '3',
            label: '启动图片',
            children: (
                <Form.Item key='imageStart' name='imageStart'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入启动图片内容Base64编码'
                                rows={4}
                                style={{ resize: 'vertical' }}
                                value={form.getFieldValue('imageStart') || ''}
                                onChange={handleImageStartChange}
                            />
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const imgSource = form.getFieldValue('imageStart');
                                if (imgSource.startsWith('data:image')) {
                                    setImageStartBase64(imgSource);
                                } else {
                                    const base64 = createImageByTemplate("{}", imgSource)
                                    setImageStartBase64(base64);
                                }
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageStartBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
    ];

    // SVG样式Tab项
    const svgStyleItems: TabsProps['items'] = [
        {
            key: '1',
            label: '默认样式',
            children: (
                <Form.Item key='svgDefaultStyle' name='svgDefaultStyle'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入默认样式内容'
                                rows={2}
                                style={{ resize: 'vertical' }}
                                value={formValues.svgDefaultStyle}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setFormValues({ ...formValues, svgDefaultStyle: e.target.value })
                                }}
                            />
                            <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '8px' }}>
                                <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                    <code>{ESCAPED_SVG_STYLE}</code>
                                </pre>
                            </div>
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const defaultSvg = createImageByTemplate(formValues.svgDefaultStyle, formValues.svgTemplate);
                                setImageDefaultSvgBase64(defaultSvg);
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageDefaultSvgBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
        {
            key: '2',
            label: '停止样式',
            children: (
                <Form.Item key='svgStopStyle' name='svgStopStyle'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入停止样式内容'
                                rows={2}
                                style={{ resize: 'vertical' }}
                                value={formValues.svgStopStyle}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setFormValues({ ...formValues, svgStopStyle: e.target.value })
                                }}
                            />
                            <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '8px' }}>
                                <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                    <code>{ESCAPED_SVG_STYLE}</code>
                                </pre>
                            </div>
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const stopSvg = createImageByTemplate(formValues.svgStopStyle, formValues.svgTemplate);
                                setImageStopSvgBase64(stopSvg);
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageStopSvgBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
        {
            key: '3',
            label: '启动样式',
            children: (
                <Form.Item key='svgStartStyle' name='svgStartStyle'>
                    <div className="stroke-multi-row">
                        <div className="stroke-multi-row-text">
                            <Input.TextArea
                                placeholder='请输入启动样式内容'
                                rows={2}
                                style={{ resize: 'vertical' }}
                                value={formValues.svgStartStyle}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setFormValues({ ...formValues, svgStartStyle: e.target.value })
                                }}
                            />
                            <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '8px' }}>
                                <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                    <code>{ESCAPED_SVG_STYLE}</code>
                                </pre>
                            </div>
                        </div>
                        <div className="stroke-multi-row-actions">
                            <Button onClick={() => {
                                const startSvg = createImageByTemplate(formValues.svgStartStyle, formValues.svgTemplate);
                                setImageStartSvgBase64(startSvg);
                            }}>
                                应用
                            </Button>
                            <div className="stroke-multi-row-image">
                                <SvgImage
                                    width={90}
                                    height={90}
                                    svgBase64={imageStartSvgBase64}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '5px',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </Form.Item>
            ),
        },
    ];

    return (
        <Modal
            title={title}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={1000}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                validateMessages={{
                    required: '${label}为必填项',
                }}
            >
                {/* 隐藏的ID字段 */}
                <Form.Item
                    key='id'
                    label='节点编码'
                    name='id'
                    style={{ display: 'none' }}
                >
                    <Input placeholder='请输入节点编码' />
                </Form.Item>
                <div className="stroke-multi-row">
                    {/* 目录名称 */}
                    <Form.Item
                        key='folderName'
                        label='目录名称'
                        name='folderName'
                        rules={[{ required: true, message: `目录名称不能为空` }]}
                    >
                        <Select
                            style={{ minWidth: 150 }}
                            placeholder="请选择节点类型"
                            onChange={onChange}
                            options={[
                                { value: 'group1', label: '电力' },
                                { value: 'group2', label: '空调' },
                                { value: 'group3', label: '锅炉' },
                                { value: 'group4', label: '园区' },
                                { value: 'group5', label: '照明' },
                                { value: 'group6', label: '供排水' },
                            ]}
                        />
                    </Form.Item>

                    {/* 节点名称 */}
                    <Form.Item
                        key='label'
                        label='节点名称'
                        name='label'
                        rules={[{ required: true, message: `节点名称不能为空` }]}
                        style={{ flex: 1 }}
                    >
                        <Input placeholder='请输入节点名称' />
                    </Form.Item>

                    {/* 节点类型 */}
                    <Form.Item
                        key='shape'
                        label='节点类型'
                        name='shape'
                        rules={[{ required: true, message: `节点类型不能为空` }]}
                    >
                        <Select
                            style={{ minWidth: 150 }}
                            placeholder="请选择节点类型"
                            onChange={(value) => setNodeTypeActiveKey(value)}
                            options={[
                                { value: 'svgImage', label: '矢量图' },
                                { value: 'customImage', label: '自定义图标' },
                            ]}
                        />
                    </Form.Item>
                </div>
                <div className="stroke-multi-row">
                    <div className="stroke-multi-row-text">
                        <Form.Item
                            key='imageIcon'
                            label='图标图片（参考：https://www.sojson.com/image2base64.html）'
                            name='imageIcon'
                        >
                            <Input.TextArea
                                placeholder='请输入图片Base64编码，或者svg文本'
                                rows={3}
                                style={{ resize: 'vertical' }}
                                value={form.getFieldValue('imageIcon') || ''}
                            />
                        </Form.Item>
                    </div>
                    <div className="stroke-multi-row-actions">
                        <Button onClick={() => {
                            const imgSource = form.getFieldValue('imageIcon');
                            if (imgSource.startsWith('data:image')) {
                                setImageIconBase64(imgSource);
                            } else {
                                const base64 = createImageByTemplate("{}", imgSource)
                                setImageIconBase64(base64);
                            }
                        }}>
                            应用
                        </Button>
                        <div className="stroke-multi-row-image">
                            <SvgImage
                                width={90}
                                height={90}
                                svgBase64={imageIconBase64}
                                style={{
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    padding: '5px',
                                    backgroundColor: '#f5f5f5',
                                }}
                            />
                        </div>
                    </div>
                </div>
                {/* 图片/样式内容区域 */}
                <div>
                    {nodeTypeActiveKey === 'customImage' && (
                        <Card title="" style={{ top: 0, left: 0, right: 0 }}>
                            <Tabs defaultActiveKey="1" items={imageItems} />
                        </Card>
                    )}

                    {nodeTypeActiveKey === 'svgImage' && (
                        <Card title="" style={{ top: 0, left: 0, right: 0 }}>
                            <div className="stroke-multi-row">
                                <div className="stroke-multi-row-text">
                                    <Form.Item
                                        key='svgTemplate'
                                        label='svg模板'
                                        name='svgTemplate'
                                    >
                                        <Input.TextArea
                                            placeholder='请输入svg模板内容，变量用--变量名--代替，公式用两个大括号包裹'
                                            rows={3}
                                            style={{ resize: 'vertical' }}
                                            value={formValues.svgTemplate}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                setFormValues({ ...formValues, svgTemplate: e.target.value })
                                            }}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="stroke-multi-row-text">
                                    <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', marginTop: '8px' }}>
                                        <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                            <code>{ESCAPED_SVG_TEMPLATE}</code>
                                        </pre>
                                    </div>
                                </div>
                        </div>
                    <Tabs defaultActiveKey="1" items={svgStyleItems} />
                        </Card>
                    )}
                </div>
            </Form>
        </Modal>
    );
};

export default NodeTemplateModel;