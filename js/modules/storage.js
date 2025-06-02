// 存储模块
const STORAGE_KEY = 'chat_messages';

/**
 * 保存消息到本地存储
 * @param {string} sender - 发送者 ('user' 或 'ai')
 * @param {string} content - 消息内容
 * @param {Date} timestamp - 时间戳
 */
export function saveMessage(sender, content, timestamp) {
    try {
        // 获取现有消息
        const messages = loadMessages();
        
        // 添加新消息
        messages.push({
            sender,
            content,
            timestamp: timestamp.toISOString()
        });
        
        // 保存到本地存储
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        
        return true;
    } catch (error) {
        console.error('保存消息失败:', error);
        return false;
    }
}

/**
 * 从本地存储加载消息
 * @returns {Array} 消息数组
 */
export function loadMessages() {
    try {
        const messagesJson = localStorage.getItem(STORAGE_KEY);
        return messagesJson ? JSON.parse(messagesJson) : [];
    } catch (error) {
        console.error('加载消息失败:', error);
        return [];
    }
}

/**
 * 清空所有聊天记录
 * @returns {boolean} 是否成功清空
 */
export function clearMessages() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('清空聊天记录失败:', error);
        return false;
    }
}

/**
 * 导出聊天记录为JSON文件
 * @returns {boolean} 是否成功导出
 */
export function exportMessages() {
    try {
        const messages = loadMessages();
        
        if (messages.length === 0) {
            return false;
        }
        
        // 创建下载链接
        const dataStr = JSON.stringify(messages, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `chat_export_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.style.display = 'none';
        
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        return true;
    } catch (error) {
        console.error('导出聊天记录失败:', error);
        return false;
    }
}
