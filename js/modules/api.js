// API通信模块
import { loadMessages } from './storage.js';
import { API_CONFIG } from '../config/api.config.js';
import { BillManager } from '../bill.js';

const MAX_CONTEXT_MESSAGES = 10; // 最大上下文消息数量

// 格式化日期为ISO格式
function formatDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

// 检查账单数据是否完整
function isValidBillData(billData) {
    if (!billData || typeof billData !== 'object') return false;
    
    // 检查金额是否有效
    if (!billData.amount) return false;
    
    // 提取数字金额
    const amount = parseFloat(String(billData.amount).replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) return false;
    
    // 检查其他必要字段
    return Boolean(billData.title && billData.category && billData.type);
}

// 处理账单数据
function processBillData(billData) {
    return {
        ...billData,
        amount: parseFloat(String(billData.amount).replace(/[^0-9.]/g, '')),
        date: formatDate(billData.date),
        type: billData.type.toLowerCase()
    };
}

// 从AI响应中提取JSON数据
function extractBillDataFromResponse(aiResponse) {
    try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        const billData = JSON.parse(jsonMatch[0]);
        return isValidBillData(billData) ? processBillData(billData) : null;
    } catch (e) {
        console.log('未找到账单数据或数据格式不正确:', e);
        return null;
    }
}

// 创建请求体
function createRequestBody(message) {
    // 获取历史消息作为上下文
    const messages = loadMessages();
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    
    // 添加当前时间戳信息
    const now = new Date();
    const timeInfo = `[当前时间：${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日]\n`;
    const messageWithTime = timeInfo + message;

    // 构建带上下文的请求体
    return {
        model: API_CONFIG.model,
        messages: [
            { role: 'system', content: API_CONFIG.systemPrompt },
            ...recentMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: messageWithTime }
        ],
        temperature: API_CONFIG.temperature,
        max_tokens: API_CONFIG.maxTokens
    };
}

/**
 * 发送消息到API并获取回复
 * @param {string} message - 用户消息
 * @returns {Promise<string>} - AI回复的消息
 */
export async function sendMessage(message) {
    try {
        // 构建请求体
        const requestBody = createRequestBody(message);
        
        // 发送请求到AI服务
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `API请求失败: ${response.status} ${response.statusText}\n` +
                `详细信息: ${errorData.error?.message || '未知错误'}`
            );
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // 处理可能的账单数据
        const billData = extractBillDataFromResponse(aiResponse);
        if (billData) {
            const billManager = new BillManager();
            billManager.addBill(
                billData.title,
                billData.amount,
                billData.category,
                billData.type,
                billData.date
            );
        }

        return aiResponse;
    } catch (error) {
        console.error('API错误:', error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error('网络连接失败，请检查网络设置或API配置是否正确');
        }
        throw error;
    }
}