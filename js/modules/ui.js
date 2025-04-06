// UI交互模块
export function createMessageElement(sender, message, timestamp) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    messageContainer.dataset.timestamp = timestamp.toISOString();
    if (sender === 'user') {
        messageContainer.classList.add('user-message-container');
    }

    const avatar = document.createElement('img');
    avatar.classList.add('avatar');
    avatar.src = sender === 'user' ? 'img/user-avatar.svg' : 'img/ai-avatar.svg';
    avatar.alt = sender === 'user' ? '用户头像' : 'AI头像';
    messageContainer.appendChild(avatar);

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    return { messageContainer, messageElement };
}

export function addMessageWithAnimation(messageContainer, messageElement, chatWindow) {
    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px)';
    setTimeout(() => {
        messageElement.style.transition = 'all 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 10);
}

export function initializeNavBar(chatWindow) {
    const navBar = document.createElement('div');
    navBar.id = 'nav-bar';
    
    const backBtn = document.createElement('button');
    backBtn.id = 'back-btn';
    backBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
    navBar.appendChild(backBtn);
    
    const navTitle = document.createElement('div');
    navTitle.id = 'nav-title';
    navTitle.textContent = '记账助手';
    navBar.appendChild(navTitle);
    
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settings-btn';
    settingsBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    navBar.appendChild(settingsBtn);
    
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    
    const clearChatItem = document.createElement('div');
    clearChatItem.classList.add('settings-item');
    clearChatItem.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>清理聊天记录';
    settingsPanel.appendChild(clearChatItem);
    
    document.body.appendChild(settingsPanel);
    document.body.insertBefore(navBar, document.body.firstChild);
    
    let isPanelVisible = false;
    
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    settingsBtn.addEventListener('click', () => {
        isPanelVisible = !isPanelVisible;
        settingsPanel.classList.toggle('show', isPanelVisible);
    });
    
    document.addEventListener('click', (event) => {
        if (!settingsBtn.contains(event.target) && !settingsPanel.contains(event.target)) {
            isPanelVisible = false;
            settingsPanel.classList.remove('show');
        }
    });
    
    clearChatItem.addEventListener('click', () => {
        if (window.confirm('确定要清理所有聊天记录吗？')) {
            import('./storage.js').then(({ clearMessages }) => {
                if (clearMessages()) {
                    chatWindow.innerHTML = '';
                    isPanelVisible = false;
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
}

import { formatMessageTime } from './messageHandler.js';