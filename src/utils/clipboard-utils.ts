import { Graph } from '@antv/x6';
import { copySelectedNodeToClipboard } from './node-utils';



/**
 * 获取剪贴板粘贴位置
 * @param e - 剪贴板事件
 * @param graph - 图实例
 * @returns 粘贴位置坐标
 */
export function getPastePosition(e: ClipboardEvent, graph: Graph): { x: number; y: number } {
    const container = graph.container;
    if (!container) {
        return { x: 100, y: 100 };
    }

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        return { x, y };
    }
    return { x: rect.width / 2, y: rect.height / 2 };
}

/**
 * 处理剪贴板数据
 * @param e - 剪贴板事件
 * @param graph - 图实例
 */
export async function handleClipboardData(e: ClipboardEvent, graph: Graph): Promise<void> {
    try {
        // 1. 获取剪贴板数据对象
        const clipboardData = e.clipboardData;
        if (!clipboardData) {
            return;
        }

        let hasImage = false;
        // 4. 检查图片文件
        const items = clipboardData.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        // 转换图片为DataURL
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                        if (graph) {
                            const position = getPastePosition(e, graph);
                            graph.addNode({
                                ...position,
                                shape: 'image',
                                width: 200,
                                height: 150,
                                imageUrl: dataUrl,
                                ports: { ...(await import('./node-utils')).nodePorts },
                            });
                        }
                    }
                    hasImage = true;
                    clipboardData.clearData();
                    navigator.clipboard.writeText('');
                    break; // 只处理第一个图片
                }
            }
        }
        if (!hasImage) {
            copySelectedNodeToClipboard(graph);
        }

    } catch (error) {
        console.error('剪贴板处理错误:', error);
    }
}
