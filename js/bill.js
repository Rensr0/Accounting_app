// 账单数据管理模块
export class BillManager {
    constructor() {
        this.bills = [];
        this.loadBills();
        // 等待DOM加载完成后再初始化事件监听和更新UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initEventListeners();
                this.updateUI();
            });
        } else {
            this.initEventListeners();
            this.updateUI();
        }
    }

    // 从localStorage加载账单数据
    loadBills() {
        const savedBills = localStorage.getItem('bills');
        this.bills = savedBills ? JSON.parse(savedBills) : [];
    }

    // 保存账单数据到localStorage
    saveBills() {
        localStorage.setItem('bills', JSON.stringify(this.bills));
    }

    // 处理日期格式
    processDate(dateStr) {
        if (dateStr === '今天' || dateStr === 'today') {
            return new Date().toISOString();
        }
        try {
            // 尝试解析日期字符串
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return new Date().toISOString();
            }
            return date.toISOString();
        } catch (e) {
            return new Date().toISOString();
        }
    }

    // 添加新账单
    addBill(title, amount, category, type, date = new Date().toISOString()) {
        const processedDate = this.processDate(date);
        const bill = {
            id: Date.now().toString(),
            title,
            amount: parseFloat(amount),
            category,
            type,
            date: processedDate
        };
        this.bills.push(bill);
        this.saveBills();
        this.updateUI();
    }

    // 删除账单
    deleteBill(id) {
        this.bills = this.bills.filter(bill => bill.id !== id);
        this.saveBills();
        this.updateUI();
    }

    // 格式化金额显示
    formatAmount(amount) {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(Math.abs(amount));
    }

    // 计算月度统计数据
    calculateMonthlyStats() {
        const now = new Date();
        const thisMonth = this.bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.getMonth() === now.getMonth() &&
                   billDate.getFullYear() === now.getFullYear();
        });

        const income = thisMonth
            .filter(bill => bill.type === 'income')
            .reduce((sum, bill) => sum + bill.amount, 0);

        const expense = thisMonth
            .filter(bill => bill.type === 'expense')
            .reduce((sum, bill) => sum + bill.amount, 0);

        return { income, expense };
    }

    // 按日期对账单进行分组
    groupBillsByDate() {
        const groups = {};
        this.bills.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.bills.forEach(bill => {
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const dayStr = date.toLocaleDateString('zh-CN', { weekday: 'long' });
            
            if (!groups[dateStr]) {
                groups[dateStr] = {
                    date: dateStr,
                    day: dayStr,
                    bills: []
                };
            }
            groups[dateStr].bills.push(bill);
        });

        return groups;
    }

    // 更新UI显示
    updateUI() {
        const billList = document.getElementById('bill-list');
        if (!billList) return;

        // 更新统计数据
        const stats = this.calculateMonthlyStats();
        const expenseElement = document.querySelector('.amount.expense');
        const incomeElement = document.querySelector('.amount.income');
        
        if (expenseElement) expenseElement.textContent = this.formatAmount(stats.expense);
        if (incomeElement) incomeElement.textContent = this.formatAmount(stats.income);

        // 更新账单列表
        billList.innerHTML = '';

        const groups = this.groupBillsByDate();
        for (const dateStr in groups) {
            const group = groups[dateStr];
            const groupElement = this.createBillGroup(group);
            billList.appendChild(groupElement);
        }
    }

    // 创建账单组元素
    createBillGroup(group) {
        const groupElement = document.createElement('div');
        groupElement.className = 'bill-group';
        groupElement.innerHTML = `
            <div class="date-header">
                <span class="date">${group.date}</span>
                <span class="day">${group.day}</span>
            </div>
        `;

        group.bills.forEach(bill => {
            const billElement = this.createBillElement(bill);
            groupElement.appendChild(billElement);
        });

        return groupElement;
    }

    // 创建单个账单元素
    createBillElement(bill) {
        const billElement = document.createElement('div');
        billElement.className = 'bill-item';
        billElement.dataset.id = bill.id;
        
        const iconPath = bill.type === 'expense' ?
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z' :
            'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z';

        billElement.innerHTML = `
            <div class="bill-icon ${bill.type}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="${iconPath}" fill="currentColor"/>
                </svg>
            </div>
            <div class="bill-content">
                <div class="bill-title">${bill.title}</div>
                <div class="bill-category">${bill.category}</div>
            </div>
            <div class="bill-amount ${bill.type}">${bill.type === 'expense' ? '-' : '+'}${Math.abs(bill.amount).toFixed(2)}</div>
        `;

        return billElement;
    }

    // 初始化事件监听
    initEventListeners() {
        // 添加账单按钮点击事件
        const addBillBtn = document.getElementById('add-bill-btn');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => this.showAddBillDialog());
        }

        // 长按删除功能
        let longPressTimer;
        const billList = document.getElementById('bill-list');
        if (billList) {
            billList.addEventListener('touchstart', (e) => {
                const billItem = e.target.closest('.bill-item');
                if (!billItem) return;

                longPressTimer = setTimeout(() => {
                    if (confirm('确定要删除这条账单记录吗？')) {
                        this.deleteBill(billItem.dataset.id);
                    }
                }, 800);
            });

            billList.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
            });

            billList.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            });
        }
    }

    // 显示添加账单对话框
    showAddBillDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'add-bill-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>添加新账单</h3>
                <form id="add-bill-form">
                    <div class="form-group">
                        <label>类型</label>
                        <select name="type" required>
                            <option value="expense">支出</option>
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
                        <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">取消</button>
                        <button type="submit" class="submit-btn">确定</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        // 表单提交事件
        const form = dialog.querySelector('#add-bill-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.addBill(
                formData.get('title'),
                formData.get('amount'),
                formData.get('category'),
                formData.get('type'),
                formData.get('date')
            );
            document.body.removeChild(dialog);
        });

        // 取消按钮事件
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
}

// 页面加载完成后初始化账单管理器
document.addEventListener('DOMContentLoaded', () => {
    window.billManager = new BillManager();
});
