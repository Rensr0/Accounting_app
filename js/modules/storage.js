// 存储模块
const STORAGE_KEY = 'chat_messages';
const MAX_MESSAGES = 100; // 最大存储消息数量

/**
 * 保存消息到本地存储
 * @param {string} sender - 发送者 ('user' 或 'ai')
 * @param {string} content - 消息内容
 * @param {Date} timestamp - 消息时间戳
 * @returns {boolean} - 是否保存成功
 */
export function saveMessage(sender, content, timestamp = new Date()) {
    try {
        // 获取现有消息
        const messages = loadMessages();
        
        // 添加新消息
        messages.push({
            sender,
            content,
            timestamp: timestamp.toISOString()
        });
        
        // 如果消息超过限制，删除最早的消息
        while (messages.length > MAX_MESSAGES) {
            messages.shift();
        }
        
        // 保存到localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        return true;
    } catch (error) {
        console.error('保存消息失败:', error);
        return false;
    }
}

/**
 * 从本地存储加载消息
 * @returns {Array} - 消息数组
 */
export function loadMessages() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('加载消息失败:', error);
        return [];
    }
}

/**
 * 清空所有消息
 * @returns {boolean} - 是否清空成功
 */
export function clearMessages() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('清空消息失败:', error);
        return false;
    }
}

/**
 * 导出消息到文件
 * @returns {boolean} - 是否导出成功
 */
export function exportMessages() {
    try {
        const messages = loadMessages();
        
        // 检查是否有消息
        if (messages.length === 0) {
            return false;
        }
        
        // 格式化消息为可读文本
        const formattedMessages = messages.map(msg => {
            const date = new Date(msg.timestamp);
            const formattedDate = date.toLocaleString('zh-CN');
            const sender = msg.sender === 'user' ? '用户' : 'AI';
            
            return `[${formattedDate}] ${sender}:\n${msg.content}\n`;
        }).join('\n---\n\n');
        
        // 创建Blob
        const blob = new Blob([formattedMessages], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const now = new Date();
        const fileName = `聊天记录_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.txt`;
        
        // 创建下载链接并触发点击
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('导出消息失败:', error);
        return false;
    }
}
