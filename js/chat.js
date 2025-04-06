import { sendMessage } from './modules/api.js';
import { shouldShowTimeDivider, formatMessageTime } from './modules/messageHandler.js';
import { createMessageElement, addMessageWithAnimation, initializeNavBar } from './modules/ui.js';
import { saveMessage, loadMessages } from './modules/storage.js';
import { API_CONFIG } from './config/api.config.js';

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-btn');

    // 初始化导航栏
    initializeNavBar(chatWindow);

    // 加载历史消息
    const messages = loadMessages();
    messages.forEach(msg => {
        const { messageContainer, messageElement } = createMessageElement(
            msg.sender,
            msg.content,
            new Date(msg.timestamp)
        );
        chatWindow.appendChild(messageContainer);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;

    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        // 添加用户消息
        addMessage('user', message);
        messageInput.value = '';

        try {
            // 发送请求到API
            const aiMessage = await sendMessage(message);
            // 添加AI回复
            addMessage('ai', aiMessage);
        } catch (error) {
            console.error('Error:', error);
            addMessage('ai', '抱歉，出现了一些问题，请稍后再试。');
        }
    });

    // 添加回车发送功能
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    function addMessage(sender, message, timestamp = new Date(), shouldSave = true) {
        // 获取最后一条消息的时间戳
        const lastMessage = chatWindow.lastElementChild;
        const lastTimestamp = lastMessage ? new Date(lastMessage.dataset.timestamp) : null;
        const currentTime = timestamp;
        
        // 判断是否需要显示时间分割线
        if (shouldShowTimeDivider(lastTimestamp, currentTime)) {
            const timeDivider = document.createElement('div');
            timeDivider.classList.add('time-divider');
            timeDivider.textContent = formatMessageTime(currentTime);
            chatWindow.appendChild(timeDivider);
        }
        
        const { messageContainer, messageElement } = createMessageElement(sender, message, currentTime);
        addMessageWithAnimation(messageContainer, messageElement, chatWindow);

        // 保存消息到localStorage
        if (shouldSave) {
            saveMessage(sender, message, currentTime);
        }
    }
});
