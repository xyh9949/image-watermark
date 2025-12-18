// 文件重命名工具函数

/**
 * 文件名模板配置
 */
export interface FileNameTemplate {
    template: string;
    prefix?: string;
    suffix?: string;
}

/**
 * 默认文件名模板
 */
export const DEFAULT_FILENAME_TEMPLATE = 'watermarked-{name}';

/**
 * 解析文件名模板并生成最终文件名
 * 
 * 支持的变量:
 * - {name} - 原始文件名（不含扩展名）
 * - {index} - 序号（从1开始）
 * - {index:N} - 序号（N位数，补零）
 * - {date} - 当前日期 (YYYY-MM-DD)
 * - {time} - 当前时间 (HH-mm-ss)
 * - {datetime} - 日期时间 (YYYY-MM-DD_HH-mm-ss)
 * 
 * @param template 模板字符串
 * @param originalName 原始文件名（不含扩展名）
 * @param index 序号（从1开始）
 * @returns 解析后的文件名（不含扩展名）
 */
export function parseFileNameTemplate(
    template: string,
    originalName: string,
    index: number
): string {
    const now = new Date();

    // 格式化日期和时间
    const date = formatDate(now);
    const time = formatTime(now);
    const datetime = `${date}_${time}`;

    let result = template;

    // 替换 {name}
    result = result.replace(/\{name\}/gi, originalName);

    // 替换 {index:N} (带补零的序号)
    result = result.replace(/\{index:(\d+)\}/gi, (_, digits) => {
        const padLength = parseInt(digits, 10);
        return String(index).padStart(padLength, '0');
    });

    // 替换 {index} (普通序号)
    result = result.replace(/\{index\}/gi, String(index));

    // 替换 {date}
    result = result.replace(/\{date\}/gi, date);

    // 替换 {time}
    result = result.replace(/\{time\}/gi, time);

    // 替换 {datetime}
    result = result.replace(/\{datetime\}/gi, datetime);

    // 清理非法字符（文件名不能包含的字符）
    result = sanitizeFileName(result);

    return result;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH-mm-ss
 */
function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}-${minutes}-${seconds}`;
}

/**
 * 清理文件名中的非法字符
 */
function sanitizeFileName(fileName: string): string {
    // Windows 和 Unix 文件名不允许的字符
    return fileName.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * 从完整文文件名中提取不带扩展名的名称
 */
export function getFileNameWithoutExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * 生成预览文件名（用于 UI 展示）
 */
export function generatePreviewFileName(
    template: string,
    sampleName: string = 'example'
): string {
    return parseFileNameTemplate(template, sampleName, 1);
}

/**
 * 验证模板是否有效
 */
export function isValidTemplate(template: string): boolean {
    if (!template || template.trim().length === 0) {
        return false;
    }

    // 检查是否有未闭合的大括号
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
        return false;
    }

    // 生成预览来检查是否会报错
    try {
        const preview = parseFileNameTemplate(template, 'test', 1);
        return preview.length > 0;
    } catch {
        return false;
    }
}
