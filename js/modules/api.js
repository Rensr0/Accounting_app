// API通信模块
import { loadMessages } from './storage.js';
import { API_CONFIG } from '../config/api.config.js';
import { BillManager } from '../bill.js';
import { extractAllJsonFromText } from './ui.js';

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
 * 向AI发送消息
 * @param {string} message - 用户消息
 * @returns {Promise<string>} - AI响应
 */
export async function sendMessage(message) {
    try {
        // 在这里进行本地处理，模拟AI响应
        const response = await processMessage(message);
        return response;
    } catch (error) {
        console.error('发送消息失败:', error);
        throw error;
    }
}

/**
 * 本地处理消息，模拟AI响应
 * @param {string} message - 用户消息
 * @returns {Promise<string>} - 处理后的响应
 */
async function processMessage(message) {
    // 简单延迟模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 关键词处理
    const lowerMessage = message.toLowerCase();
    
    // 记账相关关键词
    if (containsKeywords(lowerMessage, ['记账', '记一笔', '添加账单', '支出', '花费', '消费'])) {
        return processAccountingMessage(message);
    }
    
    // 查询类关键词
    if (containsKeywords(lowerMessage, ['查询', '支出情况', '消费情况', '账单情况', '花了多少'])) {
        return '您可以在账单管理页面查看详细的消费记录，也可以在数据分析页面查看消费统计图表。';
    }
    
    // 其他常见问题
    if (containsKeywords(lowerMessage, ['你是谁', '你能做什么'])) {
        return '我是AI记账助手，可以帮您记录日常支出和收入，生成账单，分析消费习惯，提供理财建议等。';
    }
    
    // 默认回复
    return getDefaultResponse();
}

/**
 * 处理记账相关消息
 * @param {string} message - 用户消息
 * @returns {string} - 处理后的响应
 */
function processAccountingMessage(message) {
    try {
        // 基本信息提取
        const expenseMatch = message.match(/(\d+)(元|块|￥|¥)?/);
        const amount = expenseMatch ? parseFloat(expenseMatch[1]) : getRandomAmount();
        
        // 类别提取
        const categories = ['餐饮', '购物', '交通', '娱乐', '住宿'];
        const categoryMatch = categories.find(cat => message.includes(cat));
        const category = categoryMatch || categories[Math.floor(Math.random() * categories.length)];
        
        // 标题提取或生成
        let title = '';
        if (message.includes('在') && message.indexOf('在') < message.length - 1) {
            const afterAt = message.substring(message.indexOf('在') + 1);
            const endIndex = Math.min(
                afterAt.indexOf('花') > -1 ? afterAt.indexOf('花') : Infinity,
                afterAt.indexOf('消费') > -1 ? afterAt.indexOf('消费') : Infinity,
                afterAt.indexOf('元') > -1 ? afterAt.indexOf('元') : Infinity,
                10
            );
            title = afterAt.substring(0, endIndex > 0 ? endIndex : 5).trim();
        }
        
        if (!title) {
            const titles = {
                '餐饮': ['午餐', '晚餐', '早餐', '下午茶', '夜宵'],
                '购物': ['衣服', '日用品', '电子产品', '化妆品', '零食'],
                '交通': ['打车', '公交', '地铁', '火车票', '飞机票'],
                '娱乐': ['电影', '游戏', '演唱会', 'KTV', '酒吧'],
                '住宿': ['酒店', '民宿', '公寓', '短租', '度假村']
            };
            const options = titles[category] || titles['餐饮'];
            title = options[Math.floor(Math.random() * options.length)];
        }
        
        // 生成账单数据
        const billData = {
            title,
            amount,
            category,
            type: 'expense',
            date: new Date().toISOString().split('T')[0]
        };
        
        // 检查是否应该生成收入账单
        if (message.includes('收入') || message.includes('工资') || message.includes('收款')) {
            billData.type = 'income';
            billData.category = '工资';
            billData.title = '月薪';
        }
        
        // 组装回复，确保账单数据以代码块形式返回
        const billJson = JSON.stringify(billData, null, 2);
        let response = `我已帮您记录了这笔${billData.type === 'income' ? '收入' : '支出'}，明细如下：\n\n`;
        response += "```json\n" + billJson + "\n```\n\n";
        response += "您可以点击「修改」按钮调整具体内容。";
        
        return response;
    } catch (error) {
        console.error('处理记账消息失败:', error);
        return '抱歉，我无法理解您的记账请求，请尝试更清晰的表达，例如"午餐消费35元"。';
    }
}

/**
 * 检查消息是否包含任意关键词
 * @param {string} message - 消息内容
 * @param {Array} keywords - 关键词数组
 * @returns {boolean} - 是否包含
 */
function containsKeywords(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
}

/**
 * 生成随机金额
 * @returns {number} - 随机金额
 */
function getRandomAmount() {
    return Math.floor(Math.random() * 200) + 10;
}

/**
 * 获取默认回复
 * @returns {string} - 默认回复
 */
function getDefaultResponse() {
    const responses = [
        '您好，我是您的AI记账助手，请告诉我您想记录的收支情况，例如"午餐消费35元"。',
        '需要记账吗？您可以直接告诉我收支情况，例如"今天购物花了128元"。',
        '我可以帮您记录日常收支，请直接告诉我消费内容和金额，例如"打车花了32元"。',
        '想要记录收支情况，可以直接告诉我，例如"收到工资3000元"或"买衣服花了199元"。'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}