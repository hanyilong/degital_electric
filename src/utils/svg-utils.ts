import { Node } from '@antv/x6';
// import { type NodeDataType } from '../graph-context';

/**
 * 解析SVG模板中的{{}}公式并计算，返回替换后的SVG字符串
 * @param {string} svgTemplate - 包含{{}}公式的SVG模板字符串
 * @returns {string} 公式计算后的完整SVG字符串
 */
export function parseSvgFormula(svgTemplate: string): string {
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
            const result = eval(cleanFormula);
            // 确保返回数值类型（避免非数值结果）
            return typeof result === 'number' ? result.toString() : match;
        } catch (error) {
            // 公式计算失败时，保留原{{}}内容并打印错误
            console.error(`公式计算失败：${formula}，错误信息：${(error as Error).message}`);
            return match;
        }
    });

    return parsedSvg;
}

/**
 * 更新SVG节点样式，生成新的DataURL
 * @param node - 节点对象
 * @param nodeData - 节点数据
 * @param width - 节点宽度
 * @param height - 节点高度
 * @returns 生成的SVG DataURL
 */
export function updateSvgNodeStyle(node: Node, nodeData: NodeDataType, width: number, height: number): string {
    if (!nodeData || !nodeData.defaultStyle || !nodeData.defaultStyle.svgTemplate) {
        return '';
    }
    const defaultStyle = nodeData.defaultStyle;
    let svgData = defaultStyle.svgTemplate;
    const r = height / 2;
    const cx = width / 2;
    const cy = height / 2;

    // 将svgData中的变量进行替换，比如--width--替换为${height}，--height--替换为${height}
    svgData = svgData.replace(/--width--/g, `${width}`);
    svgData = svgData.replace(/--height--/g, `${height}`);
    svgData = svgData.replace(/--r--/g, `${r}`);
    svgData = svgData.replace(/--cx--/g, `${cx}`);
    svgData = svgData.replace(/--cy--/g, `${cy}`);
    svgData = svgData.replace(/--fillColor--/g, `${defaultStyle.fillColor}`);
    svgData = svgData.replace(/--stroke--/g, `${defaultStyle.stroke}`);
    svgData = svgData.replace(/--strokeWidth--/g, `${defaultStyle.strokeWidth}`);

    svgData = parseSvgFormula(svgData);

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
}
