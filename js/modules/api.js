// API通信模块
import { loadMessages } from './storage.js';
import { API_CONFIG } from '../config/api.config.js';
import { BillManager } from '../bill.js';

const MAX_CONTEXT_MESSAGES = 10; // 最大上下文消息数量

/**
 * 检查账单数据是否完整有效
 * @param {Object} billData - 账单数据
 * @returns {boolean} - 是否有效
 */
function isValidBillData(billData) {
    if (!billData || typeof billData !== 'object') return false;
    
    // 提取数字金额
    const amount = parseFloat(String(billData.amount).replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) return false;
    
    // 检查其他必要字段
    return Boolean(billData.title && billData.category && billData.type);
}

/**
 * 处理账单数据格式
 * @param {Object} billData - 原始账单数据
 * @returns {Object} - 处理后的账单数据
 */
function processBillData(billData) {
    return {
        ...billData,
        amount: parseFloat(String(billData.amount).replace(/[^0-9.]/g, '')),
        date: billData.date || new Date().toISOString(),
        type: billData.type.toLowerCase()
    };
}

/**
 * 创建请求体
 * @param {string} message - 用户消息
 * @returns {Object} - API请求体
 */
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
        
        // 检查是否是账单修改的系统提示
        const isEditMessage = message.includes("[系统提示：");
        
        // 只有在非修改消息时处理可能的JSON账单数据
        if (!isEditMessage) {
            try {
                const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    const billData = JSON.parse(jsonMatch[0]);
                    if (isValidBillData(billData)) {
                        const processedData = processBillData(billData);
                        
                        // 添加新账单
                        const billManager = new BillManager();
                        const newBill = billManager.addBill(
                            processedData.title,
                            processedData.amount,
                            processedData.category,
                            processedData.type,
                            processedData.date
                        );
                        
                        // 在账单创建成功后，添加系统提示，表明这是新创建的账单
                        if (newBill) {
                            // 如果AI响应中包含系统提示关键词，则替换为正确的创建消息
                            if (aiResponse.includes("[系统提示：账单已成功修改]")) {
                                aiResponse = aiResponse.replace("[系统提示：账单已成功修改]", "[系统提示：账单已成功创建]");
                            } 
                            // 如果没有包含系统提示但含有JSON数据，在JSON前添加创建成功提示
                            else if (jsonMatch) {
                                const beforeJson = aiResponse.substring(0, jsonMatch.index);
                                const afterJson = aiResponse.substring(jsonMatch.index + jsonMatch[0].length);
                                aiResponse = beforeJson + "[系统提示：账单已成功创建] " + afterJson;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('JSON解析错误:', e);
            }
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