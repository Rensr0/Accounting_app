// 消息存储模块
const MAX_MESSAGES = 100;
const STORAGE_KEY = 'chat_messages';

export function loadMessages() {
    try {
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
        console.error('加载历史消息失败:', error);
        return [];
    }
}

export function saveMessage(sender, content, timestamp) {
    try {
        let messages = loadMessages();
        
        messages.push({
            sender,
            content,
            timestamp: timestamp.toISOString()
        });

        if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('保存消息失败:', error);
    }
}

export function clearMessages() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('清理消息失败:', error);
        return false;
    }
}