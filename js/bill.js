// 首部导入相关依赖和从modules导出函数
import { extractAllJsonFromText } from './modules/ui.js';

// 账单管理类
export class BillManager {
    constructor() {
        this.bills = this.loadBills();
        this.filterOptions = {
            startDate: null,
            endDate: null,
            type: 'all',
            category: null
        };
        
        // 检测是否在bill.html页面
        if (document.getElementById('bill-list')) {
            this.setupEventListeners();
            this.renderBills();
            this.updateStatistics();
        }
        
        // 暴露全局实例供UI组件使用
        window.billManager = this;
    }
    
    // 加载账单数据
    loadBills() {
        try {
            const data = localStorage.getItem('bills');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('加载账单数据失败:', error);
            return [];
        }
    }

    // 保存账单数据
    saveBills() {
        try {
        localStorage.setItem('bills', JSON.stringify(this.bills));
            return true;
        } catch (error) {
            console.error('保存账单数据失败:', error);
            return false;
        }
    }

    // 处理日期格式
    processDate(dateStr) {
        if (!dateStr || dateStr === '今天' || dateStr === 'today') {
            return new Date().toISOString().split('T')[0]; // 只返回YYYY-MM-DD部分
        }
        
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 
            new Date().toISOString().split('T')[0] : 
            date.toISOString().split('T')[0]; // 只返回YYYY-MM-DD部分
    }

    // 添加账单
    addBill(title, amount, category, type, date) {
        // 创建新账单对象
        const newBill = {
            id: Date.now().toString(),
            title: title,
            amount: parseFloat(amount),
            category: category,
            type: type.toLowerCase(),
            date: this.processDate(date)
        };
        
        // 添加到账单列表
        this.bills.push(newBill);
        
        // 保存账单数据
        this.saveBills();
        
        // 如果在账单页面，更新UI
        if (document.getElementById('bill-list')) {
            this.renderBills();
            this.updateStatistics();
        }
        
        return newBill;
    }
    
    // 根据标题和金额查找账单
    findBillByTitleAndAmount(title, amount) {
        // 查找匹配的账单
        const matchedBills = this.bills.filter(bill => {
            return bill.title === title && Math.abs(bill.amount - amount) < 0.01;
        });
        
        if (matchedBills.length > 0) {
            // 找到匹配的账单，返回最新的一条
            return matchedBills.reduce((latest, bill) => {
                return new Date(bill.date) > new Date(latest.date) ? bill : latest;
            }, matchedBills[0]);
        }
        
        return null;
    }

    // 更新账单
    updateBill(id, updatedData) {
        // 查找要更新的账单索引
        const index = this.bills.findIndex(bill => bill.id === id);
        
        if (index === -1) {
            console.error('未找到要更新的账单:', id);
            return false;
        }
        
        // 更新账单数据
        this.bills[index] = {
            ...this.bills[index],
            title: updatedData.title || this.bills[index].title,
            amount: parseFloat(updatedData.amount) || this.bills[index].amount,
            category: updatedData.category || this.bills[index].category,
            type: (updatedData.type || this.bills[index].type).toLowerCase(),
            date: updatedData.date ? this.processDate(updatedData.date) : this.bills[index].date
        };
        
        // 保存账单数据
        this.saveBills();
        
        // 如果在账单页面，更新UI
        if (document.getElementById('bill-list')) {
            this.renderBills();
            this.updateStatistics();
        }
        
        return true;
    }
    
    // 删除账单
    deleteBill(id) {
        // 查找要删除的账单索引
        const index = this.bills.findIndex(bill => bill.id === id);
        
        if (index === -1) {
            console.error('未找到要删除的账单:', id);
            return false;
        }
        
        // 删除账单
        this.bills.splice(index, 1);
        
        // 保存账单数据
        this.saveBills();
        
        // 如果在账单页面，更新UI
        if (document.getElementById('bill-list')) {
            this.renderBills();
            this.updateStatistics();
        }
        
        return true;
    }
    
    // 设置筛选选项
    setFilterOptions(options) {
        this.filterOptions = {
            ...this.filterOptions,
            ...options
        };
        
        // 重新渲染账单
        this.renderBills();
    }
    
    // 获取筛选后的账单
    getFilteredBills() {
        return this.bills.filter(bill => {
            // 筛选日期范围
            if (this.filterOptions.startDate && new Date(bill.date) < new Date(this.filterOptions.startDate)) {
                return false;
            }
            
            if (this.filterOptions.endDate && new Date(bill.date) > new Date(this.filterOptions.endDate)) {
                return false;
            }
            
            // 筛选类型
            if (this.filterOptions.type !== 'all' && bill.type !== this.filterOptions.type) {
                return false;
            }
            
            // 筛选分类
            if (this.filterOptions.category && bill.category !== this.filterOptions.category) {
                return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期降序排序
    }
    
    // 计算统计数据
    calculateStatistics() {
        // 获取当前月份
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // 本月开始和结束日期
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        
        // 计算本月收入和支出
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        
        this.bills.forEach(bill => {
            const billDate = new Date(bill.date);
            
            // 检查是否在本月范围内
            if (billDate >= monthStart && billDate <= monthEnd) {
                if (bill.type === 'income') {
                    monthlyIncome += bill.amount;
                } else {
                    monthlyExpense += bill.amount;
                }
            }
        });
        
        return {
            monthlyIncome,
            monthlyExpense
        };
    }
    
    // 更新统计显示
    updateStatistics() {
        const { monthlyIncome, monthlyExpense } = this.calculateStatistics();
        
        // 更新DOM元素
        const incomeElement = document.querySelector('.stat-card .income');
        const expenseElement = document.querySelector('.stat-card .expense');
        
        if (incomeElement) {
            incomeElement.textContent = `¥${monthlyIncome.toFixed(2)}`;
        }
        
        if (expenseElement) {
            expenseElement.textContent = `¥${monthlyExpense.toFixed(2)}`;
        }
    }
    
    // 渲染账单列表
    renderBills() {
        const billList = document.getElementById('bill-list');
        if (!billList) return;
        
        // 获取筛选后的账单
        const filteredBills = this.getFilteredBills();
        
        // 清空账单列表
        billList.innerHTML = '';
        
        // 如果没有账单，显示提示
        if (filteredBills.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = '暂无账单数据';
            billList.appendChild(emptyMessage);
            return;
        }
        
        // 按日期分组
        const billsByDate = this.groupBillsByDate(filteredBills);
        
        // 渲染每个日期组
        Object.keys(billsByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
            // 创建日期组容器
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            // 创建日期标题
            const dateTitle = document.createElement('div');
            dateTitle.className = 'date-title';
            
            // 格式化日期
            const formattedDate = this.formatDate(date);
            dateTitle.textContent = formattedDate;
            
            // 创建账单组
            const billGroup = document.createElement('div');
            billGroup.className = 'bill-group';
            
            // 计算日期组的收入和支出
            let dailyIncome = 0;
            let dailyExpense = 0;
            
            billsByDate[date].forEach(bill => {
                if (bill.type === 'income') {
                    dailyIncome += bill.amount;
        } else {
                    dailyExpense += bill.amount;
                }
                
                // 创建账单项
                const billItem = this.createBillItem(bill);
                billGroup.appendChild(billItem);
            });
            
            // 创建日期组统计
            const dateStats = document.createElement('div');
            dateStats.className = 'date-stats';
            
            if (dailyIncome > 0) {
                const incomeStats = document.createElement('div');
                incomeStats.className = 'date-stat income';
                incomeStats.textContent = `收入: ¥${dailyIncome.toFixed(2)}`;
                dateStats.appendChild(incomeStats);
            }
            
            if (dailyExpense > 0) {
                const expenseStats = document.createElement('div');
                expenseStats.className = 'date-stat expense';
                expenseStats.textContent = `支出: ¥${dailyExpense.toFixed(2)}`;
                dateStats.appendChild(expenseStats);
            }
            
            // 组装日期组
            dateTitle.appendChild(dateStats);
            dateGroup.appendChild(dateTitle);
            dateGroup.appendChild(billGroup);
            
            // 添加到账单列表
            billList.appendChild(dateGroup);
        });
    }
    
    // 按日期分组账单
    groupBillsByDate(bills) {
        const groups = {};
        
        bills.forEach(bill => {
            // 提取日期部分（去掉时间）
            const date = bill.date.split('T')[0];
            
            // 如果该日期组不存在，创建一个空数组
            if (!groups[date]) {
                groups[date] = [];
            }
            
            // 将账单添加到对应的日期组
            groups[date].push(bill);
        });
        
        return groups;
    }
    
    // 格式化日期
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // 格式化为今天、昨天或具体日期
        if (date.toDateString() === now.toDateString()) {
            return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        } else {
            // 格式化为月日格式
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }
    
    // 创建账单项元素
    createBillItem(bill) {
        // 创建账单项容器
        const billItem = document.createElement('div');
        billItem.className = 'bill-item';
        billItem.dataset.id = bill.id;
        
        // 创建左侧信息
        const leftInfo = document.createElement('div');
        leftInfo.className = 'bill-item-left';
        
        // 创建标题
        const title = document.createElement('div');
        title.className = 'bill-item-title';
        title.textContent = bill.title;
        
        // 创建分类
        const category = document.createElement('div');
        category.className = 'bill-item-category';
        category.textContent = bill.category;
        
        // 组装左侧信息
        leftInfo.appendChild(title);
        leftInfo.appendChild(category);
        
        // 创建右侧信息
        const rightInfo = document.createElement('div');
        rightInfo.className = 'bill-item-right';
        
        // 创建金额
        const amount = document.createElement('div');
        amount.className = `bill-item-amount ${bill.type}`;
        amount.textContent = bill.type === 'income' ? `+¥${bill.amount.toFixed(2)}` : `-¥${bill.amount.toFixed(2)}`;
        
        // 创建操作按钮
        const actions = document.createElement('div');
        actions.className = 'bill-item-actions';
        
        // 创建编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="ri-edit-line"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditDialog(bill);
        });
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDeleteConfirm(bill.id);
        });
        
        // 组装操作按钮
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        // 组装右侧信息
        rightInfo.appendChild(amount);
        rightInfo.appendChild(actions);
        
        // 组装账单项
        billItem.appendChild(leftInfo);
        billItem.appendChild(rightInfo);
        
        // 点击账单项显示详情
        billItem.addEventListener('click', () => {
            this.showBillDetails(bill);
        });
        
        return billItem;
    }
    
    // 显示账单详情
    showBillDetails(bill) {
        // 创建模态对话框
        const dialog = document.createElement('div');
        dialog.className = 'bill-dialog';
        
        // 格式化日期
        const date = new Date(bill.date);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 设置对话框内容
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>账单详情</h3>
                <div class="bill-details">
                    <div class="detail-item">
                        <div class="detail-label">标题:</div>
                        <div class="detail-value">${bill.title}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">金额:</div>
                        <div class="detail-value ${bill.type}">${bill.type === 'income' ? '+' : '-'}¥${bill.amount.toFixed(2)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">分类:</div>
                        <div class="detail-value">${bill.category}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">类型:</div>
                        <div class="detail-value">${bill.type === 'income' ? '收入' : '支出'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">日期:</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                </div>
                <div class="dialog-buttons">
                    <button class="edit-btn">编辑</button>
                    <button class="delete-btn">删除</button>
                    <button class="close-btn">关闭</button>
                </div>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(dialog);
        
        // 设置按钮事件
        const editBtn = dialog.querySelector('.edit-btn');
        const deleteBtn = dialog.querySelector('.delete-btn');
        const closeBtn = dialog.querySelector('.close-btn');
        
        editBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.showEditDialog(bill);
        });
        
        deleteBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.showDeleteConfirm(bill.id);
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    // 显示编辑对话框
    showEditDialog(bill) {
        // 创建模态对话框
        const dialog = document.createElement('div');
        dialog.className = 'add-bill-dialog';
        
        // 格式化日期
        const dateValue = bill.date ? bill.date.split('T')[0] : new Date().toISOString().split('T')[0];
        
        // 设置对话框内容
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>编辑账单</h3>
                <form id="edit-bill-form">
                    <div class="form-group">
                        <label>类型</label>
                        <select name="type" required>
                            <option value="expense" ${bill.type === 'expense' ? 'selected' : ''}>支出</option>
                            <option value="income" ${bill.type === 'income' ? 'selected' : ''}>收入</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" name="title" required placeholder="请输入标题" value="${bill.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>金额</label>
                        <input type="number" name="amount" required step="0.01" placeholder="请输入金额" value="${bill.amount || ''}">
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <input type="text" name="category" required placeholder="请输入分类" value="${bill.category || ''}">
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" name="date" required value="${dateValue}">
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">取消</button>
                        <button type="submit" class="submit-btn">保存</button>
                    </div>
                </form>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(dialog);
    
        // 设置表单提交事件
        const form = dialog.querySelector('#edit-bill-form');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(form);
            
            // 更新账单
            this.updateBill(bill.id, {
                title: formData.get('title'),
                amount: formData.get('amount'),
                category: formData.get('category'),
                type: formData.get('type'),
                date: formData.get('date')
            });
            
            // 关闭对话框
            document.body.removeChild(dialog);
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    // 显示添加账单对话框
    showAddDialog() {
        // 创建模态对话框
        const dialog = document.createElement('div');
        dialog.className = 'add-bill-dialog';
        
        // 获取当前日期
        const today = new Date().toISOString().split('T')[0];
        
        // 设置对话框内容
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>添加账单</h3>
                <form id="add-bill-form">
                    <div class="form-group">
                        <label>类型</label>
                        <select name="type" required>
                            <option value="expense" selected>支出</option>
                            <option value="income">收入</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" name="title" required placeholder="请输入标题">
                    </div>
                    <div class="form-group">
                        <label>金额</label>
                        <input type="number" name="amount" required step="0.01" placeholder="请输入金额">
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <input type="text" name="category" required placeholder="请输入分类">
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" name="date" required value="${today}">
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">取消</button>
                        <button type="submit" class="submit-btn">保存</button>
                    </div>
                </form>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);
    
        // 设置表单提交事件
        const form = dialog.querySelector('#add-bill-form');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(form);
            
            // 添加账单
            this.addBill(
                formData.get('title'),
                formData.get('amount'),
                formData.get('category'),
                formData.get('type'),
                formData.get('date')
            );
            
            // 关闭对话框
            document.body.removeChild(dialog);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    // 显示删除确认对话框
    showDeleteConfirm(id) {
        if (confirm('确定要删除这笔账单吗？此操作不可撤销。')) {
            this.deleteBill(id);
        }
    }
    
    // 显示筛选对话框
    showFilterDialog() {
        // 创建模态对话框
        const dialog = document.createElement('div');
        dialog.className = 'filter-dialog';
        
        // 获取当前日期
        const today = new Date().toISOString().split('T')[0];
        
        // 设置对话框内容
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>筛选账单</h3>
                <form id="filter-form">
                    <div class="form-group">
                        <label>类型</label>
                        <select name="type">
                            <option value="all" ${this.filterOptions.type === 'all' ? 'selected' : ''}>全部</option>
                            <option value="expense" ${this.filterOptions.type === 'expense' ? 'selected' : ''}>支出</option>
                            <option value="income" ${this.filterOptions.type === 'income' ? 'selected' : ''}>收入</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>开始日期</label>
                        <input type="date" name="startDate" value="${this.filterOptions.startDate || ''}">
                    </div>
                    <div class="form-group">
                        <label>结束日期</label>
                        <input type="date" name="endDate" value="${this.filterOptions.endDate || ''}">
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">取消</button>
                        <button type="button" class="reset-btn">重置</button>
                        <button type="submit" class="submit-btn">应用筛选</button>
                    </div>
                </form>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(dialog);
        
        // 设置表单提交事件
        const form = dialog.querySelector('#filter-form');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const resetBtn = dialog.querySelector('.reset-btn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(form);
            
            // 设置筛选选项
            this.setFilterOptions({
                startDate: formData.get('startDate') || null,
                endDate: formData.get('endDate') || null,
                type: formData.get('type')
            });
            
            // 关闭对话框
            document.body.removeChild(dialog);
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        resetBtn.addEventListener('click', () => {
            // 重置筛选选项
            this.setFilterOptions({
                startDate: null,
                endDate: null,
                type: 'all',
                category: null
            });
            
            // 关闭对话框
            document.body.removeChild(dialog);
        });
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 添加账单按钮
        const addBillBtn = document.getElementById('add-bill-btn');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => {
                this.showAddDialog();
            });
        }
        
        // 筛选按钮
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showFilterDialog();
            });
        }
    }
}

// 页面加载完成后初始化BillManager
document.addEventListener('DOMContentLoaded', () => {
    new BillManager();
});
