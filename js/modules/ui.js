// UI交互模块
// 引入从messageHandler.js合并的函数
// import { formatMessageTime } from './messageHandler.js';

// 消息元素缓存
const svgCache = {
    backBtn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    settingsBtn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    clearChat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

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

/**
 * 处理消息添加到聊天窗口
 * @param {Array} messageObjects - 消息对象数组
 * @param {HTMLElement} chatWindow - 聊天窗口元素
 * @param {Function} addMessageWithAnimation - 添加消息的动画函数
 * @param {Date|null} lastTimestamp - 上一条消息的时间戳
 * @returns {Date} - 最后一条消息的时间戳
 */
export function processMessages(messageObjects, chatWindow, addMessageWithAnimation, lastTimestamp) {
    if (!messageObjects || messageObjects.length === 0) return lastTimestamp;
    
    // 获取第一条消息的时间戳
    const firstMessageTimestamp = new Date(messageObjects[0].messageContainer.dataset.timestamp);
    
    // 检查是否需要添加时间分割线
    if (shouldShowTimeDivider(lastTimestamp, firstMessageTimestamp)) {
        const timeDivider = document.createElement('div');
        timeDivider.className = 'time-divider';
        timeDivider.textContent = formatMessageTime(firstMessageTimestamp);
        chatWindow.appendChild(timeDivider);
    }
    
    // 添加所有消息
    addMessageWithAnimation(messageObjects, chatWindow);
    
    // 返回最后一条消息的时间戳
    return new Date(messageObjects[messageObjects.length - 1].messageContainer.dataset.timestamp);
}

/**
 * 从文本中提取所有JSON数据
 * @param {string} text - 要解析的文本
 * @returns {Array} - 解析出的JSON对象数组
 */
export function extractAllJsonFromText(text) {
    const jsonObjects = [];
    const jsonRegex = /\{[\s\S]*?\}/g;
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
        try {
            const jsonObj = JSON.parse(match[0]);
            jsonObjects.push({
                json: jsonObj,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        } catch (e) {
            console.log('提取JSON数据失败:', e);
        }
    }
    
    return jsonObjects;
}

/**
 * 创建账单卡片元素
 * @param {Object} billData - 账单数据
 * @returns {HTMLElement} - 账单卡片元素
 */
function createBillCard(billData) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'bill-card';
    
    // 创建卡片头部
    const header = document.createElement('div');
    header.className = 'bill-card-header';
    
    // 创建标题
    const title = document.createElement('div');
    title.className = 'bill-card-title';
    
    // 添加图标
    const icon = document.createElement('i');
    if (billData.type && billData.type.toLowerCase() === 'income') {
        icon.className = 'ri-arrow-up-circle-fill';
    } else {
        icon.className = 'ri-arrow-down-circle-fill';
    }
    title.appendChild(icon);
    
    // 添加标题文本
    const titleText = document.createElement('span');
    titleText.textContent = billData.title || '未命名账单';
    title.appendChild(titleText);
    
    // 创建金额
    const amount = document.createElement('div');
    amount.className = 'bill-card-amount';
    if (billData.type && billData.type.toLowerCase() === 'income') {
        amount.classList.add('income');
        amount.textContent = `+￥${billData.amount || '0.00'}`;
    } else {
        amount.textContent = `-￥${billData.amount || '0.00'}`;
    }
    
    // 组装头部
    header.appendChild(title);
    header.appendChild(amount);
    card.appendChild(header);
    
    // 创建详情
    const details = document.createElement('div');
    details.className = 'bill-card-details';
    
    // 添加类别
    if (billData.category) {
        const categoryDetail = document.createElement('div');
        categoryDetail.className = 'bill-card-detail';
        
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'bill-card-detail-label';
        categoryLabel.textContent = '类别:';
        
        const categoryValue = document.createElement('div');
        categoryValue.className = 'bill-card-detail-value';
        categoryValue.textContent = billData.category;
        
        categoryDetail.appendChild(categoryLabel);
        categoryDetail.appendChild(categoryValue);
        details.appendChild(categoryDetail);
    }
    
    // 添加日期
    if (billData.date) {
        const dateDetail = document.createElement('div');
        dateDetail.className = 'bill-card-detail';
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'bill-card-detail-label';
        dateLabel.textContent = '日期:';
        
        const dateValue = document.createElement('div');
        dateValue.className = 'bill-card-detail-value';
        
        // 格式化日期，确保只显示YYYY-MM-DD部分
        let formattedDate = billData.date;
        if (formattedDate && formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
        }
        dateValue.textContent = formattedDate;
        
        dateDetail.appendChild(dateLabel);
        dateDetail.appendChild(dateValue);
        details.appendChild(dateDetail);
    }
    
    // 添加类型
    if (billData.type) {
        const typeDetail = document.createElement('div');
        typeDetail.className = 'bill-card-detail';
        
        const typeLabel = document.createElement('div');
        typeLabel.className = 'bill-card-detail-label';
        typeLabel.textContent = '类型:';
        
        const typeValue = document.createElement('div');
        typeValue.className = 'bill-card-detail-value';
        typeValue.textContent = billData.type === 'income' ? '收入' : '支出';
        
        typeDetail.appendChild(typeLabel);
        typeDetail.appendChild(typeValue);
        details.appendChild(typeDetail);
    }
    
    card.appendChild(details);
    
    // 添加操作区域
    const actions = document.createElement('div');
    actions.className = 'bill-card-actions';
    
    // 添加修改按钮
    const editButton = document.createElement('button');
    editButton.className = 'bill-card-edit-btn';
    editButton.innerHTML = '<i class="ri-edit-line"></i> 修改';
    editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditBillDialog(billData);
    });
    
    actions.appendChild(editButton);
    card.appendChild(actions);
    
    return card;
}

/**
 * 显示编辑账单对话框
 * @param {Object} billData - 账单数据
 */
function showEditBillDialog(billData) {
    const dialog = document.createElement('div');
    dialog.className = 'add-bill-dialog';
    
    // 处理日期格式，确保只使用YYYY-MM-DD部分
    let formattedDate = billData.date || new Date().toISOString().split('T')[0];
    if (formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
    }
    
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>修改账单</h3>
            <form id="edit-bill-form">
                <div class="form-group">
                    <label>类型</label>
                    <select name="type" required>
                        <option value="expense" ${billData.type === 'expense' ? 'selected' : ''}>支出</option>
                        <option value="income" ${billData.type === 'income' ? 'selected' : ''}>收入</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" name="title" required placeholder="请输入标题" value="${billData.title || ''}">
                </div>
                <div class="form-group">
                    <label>金额</label>
                    <input type="number" name="amount" required step="0.01" placeholder="请输入金额" value="${billData.amount || ''}">
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <input type="text" name="category" required placeholder="请输入分类" value="${billData.category || ''}">
                </div>
                <div class="form-group">
                    <label>日期</label>
                    <input type="date" name="date" required value="${formattedDate}">
                </div>
                <div class="dialog-buttons">
                    <button type="button" class="cancel-btn">取消</button>
                    <button type="submit" class="submit-btn">保存</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(dialog);
    setupEditDialogEvents(dialog, billData);
}

/**
 * 设置编辑对话框事件
 * @param {HTMLElement} dialog - 对话框元素
 * @param {Object} billData - 账单数据
 */
function setupEditDialogEvents(dialog, billData) {
    const form = dialog.querySelector('#edit-bill-form');
    const cancelBtn = dialog.querySelector('.cancel-btn');
    
    // 表单提交事件
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        const updatedData = {
            title: formData.get('title'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            type: formData.get('type'),
            date: formData.get('date')
        };
        
        // 关闭对话框
        document.body.removeChild(dialog);
        
        // 检查是否有实际修改
        const hasChanges = 
            billData.title !== updatedData.title || 
            parseFloat(billData.amount) !== parseFloat(updatedData.amount) ||
            billData.category !== updatedData.category ||
            billData.type !== updatedData.type ||
            (billData.date && new Date(billData.date).toISOString().split('T')[0] !== updatedData.date);
        
        // 只有在有实际修改时才处理
        if (hasChanges) {
            // 获取全局BillManager实例
            const billManager = window.billManager;
            if (billManager) {
                // 查找并修改账单
                const found = billManager.findBillByTitleAndAmount(billData.title, billData.amount);
                if (found) {
                    // 更新账单
                    billManager.updateBill(found.id, updatedData);
                    
                    // 获取更新后的完整账单数据
                    const updatedBill = billManager.bills.find(bill => bill.id === found.id);
                    
                    // 触发自定义事件，通知AI显示成功消息，不向用户输入框添加内容
                    const event = new CustomEvent('bill-edit-result', {
                        detail: {
                            success: true,
                            originalData: billData,
                            updatedData: updatedBill || updatedData // 使用完整的账单数据
                        },
                        bubbles: true
                    });
                    document.dispatchEvent(event);
                } else {
                    // 触发自定义事件，通知AI账单未找到
                    const event = new CustomEvent('bill-edit-result', {
                        detail: {
                            success: false,
                            originalData: billData,
                            updatedData: updatedData,
                            errorMessage: '未找到匹配的账单'
                        },
                        bubbles: true
                    });
                    document.dispatchEvent(event);
                }
            } else {
                console.error('未找到BillManager实例');
                // 触发错误事件
                const event = new CustomEvent('bill-edit-result', {
                    detail: {
                        success: false,
                        originalData: billData,
                        updatedData: updatedData,
                        errorMessage: '系统错误：未找到账单管理器'
                    },
                    bubbles: true
                });
                document.dispatchEvent(event);
            }
        }
    });
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
}

/**
 * 处理AI消息内容，美化账单数据
 * @param {string} content - 原始消息内容
 * @returns {Array} - 处理后的消息元素数组
 */
function processAIMessage(content) {
    // 移除连续的空白行，保留单个换行
    const processedContent = content.replace(/\n{2,}/g, '\n').trim();
    
    // 提取所有JSON数据
    const jsonObjects = extractAllJsonFromText(processedContent);
    
    // 如果没有找到账单数据，直接返回文本内容
    if (jsonObjects.length === 0) {
        const messageElement = document.createElement('div');
        messageElement.textContent = processedContent;
        return [{ type: 'text', element: messageElement }];
    }
    
    // 将消息分割成多个部分
    const messageParts = [];
    let lastIndex = 0;
    
    // 处理每个JSON对象及其前后文本
    for (let i = 0; i < jsonObjects.length; i++) {
        const { json, startIndex, endIndex } = jsonObjects[i];
        
        // 添加JSON前的文本（如果有）
        if (startIndex > lastIndex) {
            const beforeText = processedContent.substring(lastIndex, startIndex).trim();
            if (beforeText) {
                const textElement = document.createElement('div');
                textElement.textContent = beforeText;
                messageParts.push({ type: 'text', element: textElement });
            }
        }
        
        // 添加账单卡片
        const billCard = createBillCard(json);
        messageParts.push({ type: 'bill-card', element: billCard });
        
        lastIndex = endIndex;
    }
    
    // 添加最后一个JSON后的文本（如果有）
    if (lastIndex < processedContent.length) {
        const afterText = processedContent.substring(lastIndex).trim();
        if (afterText) {
            const textElement = document.createElement('div');
            textElement.textContent = afterText;
            messageParts.push({ type: 'text', element: textElement });
        }
    }
    
    return messageParts;
}

/**
 * 创建消息元素
 * @param {string} sender - 发送者 ('user' 或 'ai')
 * @param {string} content - 消息内容
 * @param {Date} timestamp - 时间戳
 * @returns {Array} - 包含消息容器和消息元素的对象数组
 */
export function createMessageElement(sender, content, timestamp) {
    // 处理用户消息
    if (sender === 'user') {
        // 创建消息容器
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${sender}-message-container`;
        messageContainer.dataset.timestamp = timestamp.toISOString();
        
        // 创建头像
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        // 用户头像使用"用户"图标
        const userIcon = document.createElement('i');
        userIcon.className = 'ri-user-fill';
        avatar.appendChild(userIcon);
        
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
        
        return [{ messageContainer, messageElement }];
    }
    
    // 处理AI消息
    const messageParts = processAIMessage(content);
    const results = [];
    
    // 为每个部分创建独立的消息容器
    messageParts.forEach((part, index) => {
        // 如果是账单卡片，直接创建一个特殊的容器
        if (part.type === 'bill-card') {
            // 创建账单卡片容器
            const cardContainer = document.createElement('div');
            cardContainer.className = 'bill-card-container';
            cardContainer.dataset.timestamp = timestamp.toISOString();
            
            // 创建头像
            const avatar = document.createElement('div');
            avatar.className = 'avatar bill-card-avatar';
            
            // AI头像使用"机器人"图标
            const aiIcon = document.createElement('i');
            aiIcon.className = 'ri-robot-fill';
            avatar.appendChild(aiIcon);
            
            // 创建卡片包装器
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'bill-card-wrapper';
            
            // 添加账单卡片
            cardWrapper.appendChild(part.element);
            
            // 组装元素
            cardContainer.appendChild(avatar);
            cardContainer.appendChild(cardWrapper);
            
            results.push({ messageContainer: cardContainer, messageElement: part.element });
            return;
        }
        
        // 处理普通文本消息
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${sender}-message-container`;
        messageContainer.dataset.timestamp = timestamp.toISOString();
        
        // 创建头像
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        // AI头像使用"机器人"图标
        const aiIcon = document.createElement('i');
        aiIcon.className = 'ri-robot-fill';
        avatar.appendChild(aiIcon);
        
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        // 添加内容
        messageElement.appendChild(part.element);
        
        // 创建时间标签
        const timestampElement = document.createElement('div');
        timestampElement.className = 'timestamp';
        timestampElement.textContent = formatTime(timestamp);
        
        // 组装元素
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(messageElement);
        messageContainer.appendChild(timestampElement);
        
        results.push({ messageContainer, messageElement });
    });
    
    return results;
}

/**
 * 使用动画添加消息
 * @param {Array|Object} messageObjects - 消息对象或消息对象数组
 * @param {HTMLElement} chatWindow - 聊天窗口
 */
export function addMessageWithAnimation(messageObjects, chatWindow) {
    // 确保messageObjects是数组
    const messageArray = Array.isArray(messageObjects) ? messageObjects : [messageObjects];
    
    // 依次添加每个消息
    messageArray.forEach((obj, index) => {
        const { messageContainer, messageElement } = obj;
        
        // 设置初始透明度为0
        if (messageContainer.classList.contains('bill-card-container')) {
            messageContainer.style.opacity = '0';
            
            // 添加到聊天窗口
            chatWindow.appendChild(messageContainer);
            
            // 触发动画
            setTimeout(() => {
                messageContainer.style.opacity = '1';
            }, 10 + index * 100);
        } else {
            messageElement.style.opacity = '0';
            
            // 添加到聊天窗口
            chatWindow.appendChild(messageContainer);
            
            // 触发动画
            setTimeout(() => {
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 10 + index * 100);
        }
    });
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