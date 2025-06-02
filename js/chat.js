import { sendMessage } from './modules/api.js';
import { shouldShowTimeDivider, formatMessageTime } from './modules/messageHandler.js';
import { createMessageElement, addMessageWithAnimation, showConfirmDialog } from './modules/ui.js';
import { saveMessage, loadMessages, clearMessages } from './modules/storage.js';

// 聊天应用类
class ChatApp {
    constructor() {
        this.chatWindow = document.getElementById('chat-window');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-btn');
        this.emptyChat = document.getElementById('empty-chat');
        this.clearChatBtn = document.getElementById('clear-chat-btn');
        this.isWaitingForResponse = false;
        
        // 使用requestIdleCallback延迟初始化非关键任务
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.init());
        } else {
            // 降级处理
            setTimeout(() => this.init(), 100);
        }
    }
    
    // 初始化应用
    init() {
        // 设置事件监听
        this.setupEventListeners();
        
        // 检查是否显示空聊天提示
        this.checkEmptyChatState();
        
        // 使用分批加载历史消息
        this.loadHistoryMessagesInBatches();
    }
    
    // 分批加载历史消息，避免一次性加载过多导致卡顿
    loadHistoryMessagesInBatches() {
        const messages = loadMessages();
        
        if (messages.length === 0) return;
        
        // 隐藏空聊天提示
        this.hideEmptyChat();
        
        // 创建文档片段
        const fragment = document.createDocumentFragment();
        
        // 分批处理，每批处理10条消息
        const batchSize = 10;
        let currentBatch = 0;
        
        const processNextBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, messages.length);
            
            // 处理当前批次的消息
            for (let i = start; i < end; i++) {
                const msg = messages[i];
                const { messageContainer } = createMessageElement(
                    msg.sender,
                    msg.content,
                    new Date(msg.timestamp)
                );
                fragment.appendChild(messageContainer);
            }
            
            // 更新批次计数
            currentBatch++;
            
            // 如果还有更多批次，则计划处理下一批
            if (currentBatch * batchSize < messages.length) {
                if ('requestAnimationFrame' in window) {
                    requestAnimationFrame(() => {
                        // 在下一帧继续处理
                        processNextBatch();
                    });
                } else {
                    setTimeout(processNextBatch, 16); // 约60fps
                }
            } else {
                // 所有批次处理完毕，添加到DOM
                this.chatWindow.appendChild(fragment);
                this.scrollToBottom();
            }
        };
        
        // 开始处理第一批
        processNextBatch();
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 发送按钮点击事件
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // 回车发送功能
        this.messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleSendMessage();
            }
        });
        
        // 清空聊天记录按钮事件
        if (this.clearChatBtn) {
            this.clearChatBtn.addEventListener('click', () => this.showClearConfirmDialog());
        }
        
        // 返回按钮事件
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }
    
    // 处理发送消息
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isWaitingForResponse) return;
        
        // 添加用户消息
        this.addMessage('user', message);
        this.messageInput.value = '';
        
        // 显示AI正在输入的动画
        this.showTypingIndicator();
        
        // 禁用输入框和发送按钮
        this.setInputState(false);
        
        try {
            // 发送请求到API
            const aiMessage = await sendMessage(message);
            
            // 移除输入指示器
            this.hideTypingIndicator();
            
            // 添加AI回复
            this.addMessage('ai', aiMessage);
        } catch (error) {
            console.error('Error:', error);
            
            // 移除输入指示器
            this.hideTypingIndicator();
            
            this.addMessage('ai', '抱歉，出现了一些问题，请稍后再试。');
        } finally {
            // 启用输入框和发送按钮
            this.setInputState(true);
        }
    }
    
    // 设置输入状态（启用/禁用）
    setInputState(enabled) {
        this.isWaitingForResponse = !enabled;
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
    }
    
    // 显示AI正在输入的动画
    showTypingIndicator() {
        // 创建容器
        const container = document.createElement('div');
        container.className = 'typing-indicator-container';
        container.id = 'typing-indicator';
        
        // 创建AI头像
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        // 使用Remix Icon替代图片头像
        const aiIcon = document.createElement('i');
        aiIcon.className = 'ri-robot-fill';
        avatar.appendChild(aiIcon);
        
        // 创建输入指示器
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        
        // 添加三个点
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-indicator-dot';
            indicator.appendChild(dot);
        }
        
        // 组装元素
        container.appendChild(avatar);
        container.appendChild(indicator);
        
        // 添加到聊天窗口
        this.chatWindow.appendChild(container);
        
        // 隐藏空聊天提示
        this.hideEmptyChat();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    // 隐藏AI正在输入的动画
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 添加消息到聊天窗口
    addMessage(sender, message, timestamp = new Date(), shouldSave = true) {
        // 隐藏空聊天提示
        this.hideEmptyChat();
        
        // 获取最后一条消息的时间戳
        const lastMessage = this.chatWindow.querySelector('.message-container:last-child');
        const lastTimestamp = lastMessage ? new Date(lastMessage.dataset.timestamp) : null;
        const currentTime = timestamp;
        
        // 判断是否需要显示时间分割线
        if (shouldShowTimeDivider(lastTimestamp, currentTime)) {
            const timeDivider = document.createElement('div');
            timeDivider.classList.add('time-divider');
            timeDivider.textContent = formatMessageTime(currentTime);
            this.chatWindow.appendChild(timeDivider);
        }
        
        // 创建并添加消息元素
        const { messageContainer, messageElement } = createMessageElement(sender, message, currentTime);
        addMessageWithAnimation(messageContainer, messageElement, this.chatWindow);
        
        // 保存消息到localStorage
        if (shouldSave) {
            saveMessage(sender, message, currentTime);
        }
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    // 滚动到底部
    scrollToBottom() {
        // 使用requestAnimationFrame确保在下一帧渲染前滚动，提高流畅度
        requestAnimationFrame(() => {
            this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
        });
    }
    
    // 检查是否显示空聊天提示
    checkEmptyChatState() {
        const messages = loadMessages();
        if (messages.length === 0) {
            this.showEmptyChat();
        } else {
            this.hideEmptyChat();
        }
    }
    
    // 显示空聊天提示
    showEmptyChat() {
        if (this.emptyChat) {
            this.emptyChat.style.display = 'flex';
        }
    }
    
    // 隐藏空聊天提示
    hideEmptyChat() {
        if (this.emptyChat) {
            this.emptyChat.style.display = 'none';
        }
    }
    
    // 显示清空聊天记录确认对话框
    showClearConfirmDialog() {
        showConfirmDialog(
            '确定要清空所有聊天记录吗？此操作无法撤销。',
            () => this.clearChat()
        );
    }
    
    // 清空聊天记录
    clearChat() {
        // 清空本地存储
        clearMessages();
        
        // 清空聊天窗口
        this.chatWindow.innerHTML = '';
        
        // 显示空聊天提示
        this.showEmptyChat();
    }
}

// 页面加载完成后初始化聊天应用
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
