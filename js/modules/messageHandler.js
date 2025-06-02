// 消息处理模块

/**
 * 判断是否需要显示时间分割线
 * @param {Date|null} lastTimestamp - 上一条消息的时间戳
 * @param {Date} currentTimestamp - 当前消息的时间戳
 * @returns {boolean} - 是否需要显示时间分割线
 */
export function shouldShowTimeDivider(lastTimestamp, currentTimestamp) {
    // 如果没有上一条消息，则显示时间分割线
    if (!lastTimestamp) return true;
    
    // 计算时间差（毫秒）
    const timeDiff = currentTimestamp - lastTimestamp;
    
    // 如果时间差超过15分钟，则显示时间分割线
    return timeDiff > 15 * 60 * 1000;
}

/**
 * 格式化消息时间为友好显示格式
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的时间字符串
 */
export function formatMessageTime(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 格式化选项
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const dateOptions = { month: 'long', day: 'numeric' };
    const fullOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    
    // 判断日期范围
    if (date >= today) {
        // 今天
        return `今天 ${date.toLocaleTimeString('zh-CN', timeOptions)}`;
    } else if (date >= yesterday) {
        // 昨天
        return `昨天 ${date.toLocaleTimeString('zh-CN', timeOptions)}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        // 今年的其他日期
        return date.toLocaleDateString('zh-CN', dateOptions);
    } else {
        // 更早的日期
        return date.toLocaleDateString('zh-CN', fullOptions);
    }
}
