import { sendMessage } from './modules/api.js';
import { createMessageElement, addMessageWithAnimation, showConfirmDialog, processMessages } from './modules/ui.js';
import { saveMessage, loadMessages, clearMessages } from './modules/storage.js';

// 聊天应用类
class ChatApp {
    constructor() {
        // 初始化DOM元素引用
        this.chatWindow = document.getElementById('chat-window');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-btn');
        this.emptyChat = document.getElementById('empty-chat');
        this.clearChatBtn = document.getElementById('clear-chat-btn');
        
        // 状态变量
        this.isWaitingForResponse = false;
        this.lastTimestamp = null;
        
        // 使用requestIdleCallback延迟初始化非关键任务
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.init());
        } else {
            setTimeout(() => this.init(), 100);
        }
    }
    
    // 初始化应用
    init() {
        this.setupEventListeners();
        this.checkEmptyChatState();
        this.loadHistoryMessagesInBatches();
    }
    
    // 分批加载历史消息，避免一次性加载过多导致卡顿
    loadHistoryMessagesInBatches() {
        const messages = loadMessages();
        
        if (messages.length === 0) return;
        
        this.hideEmptyChat();
        const fragment = document.createDocumentFragment();
        const batchSize = 10;
        let currentBatch = 0;
        
        const processNextBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, messages.length);
            
            for (let i = start; i < end; i++) {
                const msg = messages[i];
                const messageObjects = createMessageElement(
                    msg.sender,
                    msg.content,
                    new Date(msg.timestamp)
                );
                
                // 处理所有消息元素
                this.lastTimestamp = processMessages(
                    messageObjects, 
                    fragment, 
                    addMessageWithAnimation, 
                    this.lastTimestamp
                );
            }
            
            currentBatch++;
            
            if (currentBatch * batchSize < messages.length) {
                if ('requestAnimationFrame' in window) {
                    requestAnimationFrame(processNextBatch);
                } else {
                    setTimeout(processNextBatch, 16);
                }
            } else {
                this.chatWindow.appendChild(fragment);
                this.scrollToBottom();
            }
        };
        
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
        
        // 监听账单修改结果事件
        document.addEventListener('bill-edit-result', (e) => {
            this.handleBillEditResult(e.detail);
        });
    }
    
    // 处理账单编辑结果事件
    async handleBillEditResult(detail) {
        const { originalData, updatedData, success = false, errorMessage = '未找到匹配的账单' } = detail;
        
        // 自动构建AI回复内容
        let aiMessage = '';
        
        if (success) {
            aiMessage = `✅ 账单修改成功！\n原账单"${originalData.title}"(${originalData.amount}元)已更新为"${updatedData.title}"(${updatedData.amount}元)。`;
            
            // 判断金额变化
            if (parseFloat(updatedData.amount) > parseFloat(originalData.amount)) {
                aiMessage += `\n看来花费增加了${(parseFloat(updatedData.amount) - parseFloat(originalData.amount)).toFixed(2)}元，希望是值得的花费哦！`;
            } else if (parseFloat(updatedData.amount) < parseFloat(originalData.amount)) {
                aiMessage += `\n减少了${(parseFloat(originalData.amount) - parseFloat(updatedData.amount)).toFixed(2)}元的支出，很好的节约！`;
            }
            
            // 直接显示AI回复
            this.addMessage('ai', aiMessage);
            
            // 紧接着发送账单卡片
            setTimeout(() => {
                // 处理日期格式，转换为YYYY-MM-DD格式
                let formattedDate = updatedData.date;
                if (formattedDate && formattedDate.includes('T')) {
                    formattedDate = formattedDate.split('T')[0];
                }
                
                // 构建账单卡片的JSON
                const billCardJson = JSON.stringify({
                    title: updatedData.title,
                    amount: updatedData.amount,
                    category: updatedData.category,
                    type: updatedData.type,
                    date: formattedDate // 使用格式化后的日期
                }, null, 2);
                
                // 添加一个新的AI消息，包含账单卡片的JSON
                this.addMessage('ai', `这是修改后的账单信息:\n${billCardJson}`);
            }, 300); // 短暂延迟以区分两条消息
        } else {
            aiMessage = `❌ 账单修改失败：${errorMessage}\n可能的原因：\n1. 原账单信息不准确\n2. 该账单已被删除\n\n您可以尝试重新创建一笔新账单。`;
            
            // 直接显示AI回复
            this.addMessage('ai', aiMessage);
        }
    }
    
    // 处理发送消息
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isWaitingForResponse) return;
        
        // 保存焦点状态
        const hadFocus = document.activeElement === this.messageInput;
        
        // 保存消息内容
        const messageToSend = message;
        
        // 清空输入框
        this.messageInput.value = '';
        
        try {
            // 发送消息
            await this.sendMessageToAI(messageToSend);
        } finally {
            // 无论发送成功或失败，都确保输入框重新获得焦点
            if (hadFocus) {
                // 使用较短的延迟确保焦点恢复
                setTimeout(() => {
                    this.messageInput.focus();
                }, 10);
            }
        }
    }
    
    // 发送消息到AI并处理响应
    async sendMessageToAI(message) {
        // 添加用户消息
        this.addMessage('user', message);
        
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
        
        // 创建消息元素
        const messageObjects = createMessageElement(sender, message, timestamp);
        
        // 处理并添加消息
        this.lastTimestamp = processMessages(messageObjects, this.chatWindow, addMessageWithAnimation, this.lastTimestamp);
        
        // 保存消息到localStorage
        if (shouldSave) {
            saveMessage(sender, message, timestamp);
        }
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    // 滚动到底部
    scrollToBottom() {
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
        clearMessages();
        this.chatWindow.innerHTML = '';
        this.showEmptyChat();
    }
}

// 页面加载完成后初始化聊天应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    
    // 获取关键DOM元素
    const messageInput = document.getElementById('message-input');
    const inputArea = document.getElementById('input-area');
    const chatWindow = document.getElementById('chat-window');
    const sendButton = document.getElementById('send-btn');
    
    // 创建一个变量来跟踪输入法状态
    let isKeyboardVisible = false;
    
    // 输入框获得焦点时显示输入法
    messageInput.addEventListener('focus', () => {
        isKeyboardVisible = true;
        document.body.classList.add('keyboard-open');
        
        // 稍微延迟滚动，等待布局稳定
        setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 300);
    });
    
    // 监听输入框失去焦点
    messageInput.addEventListener('blur', (e) => {
        // 检查是否是因为点击发送按钮导致的失去焦点
        // 如果是，则阻止默认行为，保持焦点
        const activeElement = document.activeElement;
        if (activeElement === sendButton || sendButton.contains(activeElement)) {
            e.preventDefault();
            setTimeout(() => {
                messageInput.focus();
            }, 10);
        }
    });
    
    // 直接处理发送按钮的点击事件
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 调用发送消息方法
        app.handleSendMessage();
        
        // 重要：确保输入框保持焦点
        setTimeout(() => {
            messageInput.focus();
        }, 10);
        
        return false;
    });
    
    // 阻止发送按钮的mousedown事件，防止输入框失去焦点
    sendButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    // 同样阻止触摸事件
    sendButton.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    
    // 点击输入区域内的任何元素都不会隐藏输入法
    inputArea.addEventListener('mousedown', (e) => {
        // 如果点击的是发送按钮，已经有专门的处理
        if (e.target === sendButton || sendButton.contains(e.target)) {
            return;
        }
        
        // 阻止事件冒泡
        e.stopPropagation();
    });
    
    // 同样处理触摸事件
    inputArea.addEventListener('touchstart', (e) => {
        // 如果点击的是发送按钮，已经有专门的处理
        if (e.target === sendButton || sendButton.contains(e.target)) {
            return;
        }
        
        // 阻止事件冒泡
        e.stopPropagation();
    });
    
    // 点击输入区域外的任何地方都会隐藏输入法
    document.addEventListener('mousedown', (e) => {
        if (isKeyboardVisible && !inputArea.contains(e.target)) {
            isKeyboardVisible = false;
            document.body.classList.remove('keyboard-open');
        }
    });
    
    // 同样处理触摸事件
    document.addEventListener('touchstart', (e) => {
        if (isKeyboardVisible && !inputArea.contains(e.target)) {
            isKeyboardVisible = false;
            document.body.classList.remove('keyboard-open');
        }
    });
    
    // 监听窗口大小变化，防止键盘显示/隐藏导致的布局问题
    window.addEventListener('resize', () => {
        if (isKeyboardVisible) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    });
});
