// UI交互模块
import { formatMessageTime } from './messageHandler.js';

// 消息元素缓存
const svgCache = {
    backBtn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    settingsBtn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    clearChat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

/**
 * 创建消息元素
 * @param {string} sender - 发送者 ('user' 或 'ai')
 * @param {string} content - 消息内容
 * @param {Date} timestamp - 时间戳
 * @returns {Object} - 包含消息容器和消息元素的对象
 */
export function createMessageElement(sender, content, timestamp) {
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${sender}-message-container`;
    messageContainer.dataset.timestamp = timestamp.toISOString();
    
    // 创建头像
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    // 使用Remix Icon替代图片头像
    if (sender === 'user') {
        // 用户头像使用"用户"图标
        const userIcon = document.createElement('i');
        userIcon.className = 'ri-user-fill';
        avatar.appendChild(userIcon);
    } else {
        // AI头像使用"机器人"图标
        const aiIcon = document.createElement('i');
        aiIcon.className = 'ri-robot-fill';
        avatar.appendChild(aiIcon);
    }
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    messageElement.textContent = content;
    
    // 创建时间标签
    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formatTime(timestamp);
    
    // 组装元素
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageElement);
    messageContainer.appendChild(timestampElement);
    
    return { messageContainer, messageElement };
}

/**
 * 使用动画添加消息
 * @param {HTMLElement} container - 消息容器
 * @param {HTMLElement} message - 消息元素
 * @param {HTMLElement} chatWindow - 聊天窗口
 */
export function addMessageWithAnimation(container, message, chatWindow) {
    // 设置初始透明度为0
    message.style.opacity = '0';
    
    // 添加到聊天窗口
    chatWindow.appendChild(container);
    
    // 触发动画
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * 格式化时间为小时:分钟格式
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的时间字符串
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 初始化导航栏
 * 注意：现在导航栏已经在HTML中直接定义，此函数不再创建导航栏
 * @param {HTMLElement} chatWindow - 聊天窗口元素
 */
export function initializeNavBar() {
    // 导航栏现在在HTML中直接定义，不需要在JS中创建
    // 此函数保留为空，以保持向后兼容性
}

/**
 * 创建设置面板
 * @param {HTMLElement} chatWindow - 聊天窗口元素
 * @returns {HTMLElement} 设置面板元素
 */
export function createSettingsPanel(chatWindow) {
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    
    // 清理聊天记录选项
    const clearChatItem = document.createElement('div');
    clearChatItem.classList.add('settings-item', 'danger');
    clearChatItem.innerHTML = `${svgCache.clearChat}清理聊天记录`;
    
    // 添加清理聊天记录事件
    clearChatItem.addEventListener('click', () => {
        if (window.confirm('确定要清理所有聊天记录吗？')) {
            import('./storage.js').then(({ clearMessages }) => {
                if (clearMessages()) {
                    chatWindow.innerHTML = '';
                    settingsPanel.classList.remove('show');
                    alert('聊天记录已清理完成');
                } else {
                    alert('清理聊天记录失败，请稍后重试');
                }
            }).catch(error => {
                console.error('导入clearMessages失败:', error);
                alert('清理聊天记录失败，请稍后重试');
            });
        }
    });
    
    settingsPanel.appendChild(clearChatItem);
    
    // 导出聊天记录选项
    const exportChatItem = document.createElement('div');
    exportChatItem.classList.add('settings-item');
    exportChatItem.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>导出聊天记录';
    
    // 添加导出聊天记录事件
    exportChatItem.addEventListener('click', () => {
        import('./storage.js').then(({ exportMessages }) => {
            if (!exportMessages()) {
                alert('没有可导出的聊天记录');
            }
            settingsPanel.classList.remove('show');
        }).catch(error => {
            console.error('导入exportMessages失败:', error);
            alert('导出聊天记录失败，请稍后重试');
        });
    });
    
    settingsPanel.appendChild(exportChatItem);
    
    return settingsPanel;
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {Function} onConfirm - 确认回调
 * @param {Function} onCancel - 取消回调
 */
export function showConfirmDialog(message, onConfirm, onCancel = () => {}) {
    // 获取模板
    const template = document.getElementById('confirm-dialog-template');
    if (!template) return;
    
    // 创建对话框
    const dialogClone = template.content.cloneNode(true);
    const dialog = dialogClone.querySelector('.confirm-dialog');
    
    // 设置消息
    const messageElement = dialog.querySelector('.confirm-dialog-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    // 获取按钮
    const cancelBtn = dialog.querySelector('.confirm-dialog-cancel');
    const confirmBtn = dialog.querySelector('.confirm-dialog-confirm');
    
    // 添加事件
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        onCancel();
    });
    
    confirmBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        onConfirm();
    });
    
    // 显示对话框
    document.body.appendChild(dialog);
}