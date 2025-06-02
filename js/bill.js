// 账单数据管理模块
export class BillManager {
    constructor() {
        // 核心数据
        this.bills = [];
        
        // 常量定义
        this.ICONS = {
            EXPENSE: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z',
            INCOME: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z'
        };
        
        // 设备检测
        this.isMobile = 'ontouchstart' in window;
        
        // 初始化
        this.loadBills();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.init.bind(this));
        } else {
            this.init();
        }
    }

    /**
     * 初始化应用
     */
    init() {
        this.initEventListeners();
        this.updateUI();
    }

    /**
     * 数据管理方法
     */
    
    // 从localStorage加载账单数据
    loadBills() {
        try {
            const savedBills = localStorage.getItem('bills');
            this.bills = savedBills ? JSON.parse(savedBills) : [];
        } catch (error) {
            console.error('加载账单数据失败:', error);
            this.bills = [];
        }
    }

    // 保存账单数据到localStorage
    saveBills() {
        localStorage.setItem('bills', JSON.stringify(this.bills));
    }

    // 处理日期格式
    processDate(dateStr) {
        if (!dateStr || dateStr === '今天' || dateStr === 'today') {
            return new Date().toISOString();
        }
        
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    // 添加新账单
    addBill(title, amount, category, type, date = new Date().toISOString()) {
        const bill = {
            id: Date.now().toString(),
            title,
            amount: parseFloat(amount),
            category,
            type,
            date: this.processDate(date)
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

    // 更新账单
    updateBill(id, updatedData) {
        const index = this.bills.findIndex(bill => bill.id === id);
        if (index !== -1) {
            this.bills[index] = {
                ...this.bills[index],
                ...updatedData,
                amount: parseFloat(updatedData.amount),
                date: this.processDate(updatedData.date)
            };
            this.saveBills();
            this.updateUI();
        }
    }

    // 获取账单详情
    getBill(id) {
        return this.bills.find(bill => bill.id === id);
    }

    /**
     * 数据处理与格式化方法
     */
    
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
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.bills.reduce((stats, bill) => {
            const billDate = new Date(bill.date);
            if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
                if (bill.type === 'income') {
                    stats.income += bill.amount;
                } else {
                    stats.expense += bill.amount;
                }
            }
            return stats;
        }, { income: 0, expense: 0 });
    }

    // 按日期对账单进行分组
    groupBillsByDate() {
        const groups = {};
        
        // 按日期降序排序
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
                groups[dateStr] = { date: dateStr, day: dayStr, bills: [] };
            }
            groups[dateStr].bills.push(bill);
        });

        return groups;
    }

    /**
     * UI 渲染方法
     */
    
    // 更新UI显示
    updateUI() {
        const billList = document.getElementById('bill-list');
        if (!billList) return;

        // 更新统计数据
        this.updateStatsUI();

        // 更新账单列表
        billList.innerHTML = '';
        
        // 使用文档片段提高性能
        const fragment = document.createDocumentFragment();
        const groups = this.groupBillsByDate();
        
        Object.values(groups).forEach(group => {
            fragment.appendChild(this.createBillGroup(group));
        });
        
        billList.appendChild(fragment);
    }
    
    // 更新统计数据UI
    updateStatsUI() {
        const stats = this.calculateMonthlyStats();
        const expenseElement = document.querySelector('.amount.expense');
        const incomeElement = document.querySelector('.amount.income');
        
        if (expenseElement) expenseElement.textContent = this.formatAmount(stats.expense);
        if (incomeElement) incomeElement.textContent = this.formatAmount(stats.income);
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

        const fragment = document.createDocumentFragment();
        group.bills.forEach(bill => {
            fragment.appendChild(this.createBillElement(bill));
        });
        
        groupElement.appendChild(fragment);
        return groupElement;
    }

    // 创建单个账单元素
    createBillElement(bill) {
        const billElement = document.createElement('div');
        billElement.className = 'bill-item';
        billElement.dataset.id = bill.id;
        
        const iconPath = bill.type === 'expense' ? this.ICONS.EXPENSE : this.ICONS.INCOME;
        const sign = bill.type === 'expense' ? '-' : '+';

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
            <div class="bill-amount ${bill.type}">${sign}${Math.abs(bill.amount).toFixed(2)}</div>
        `;

        return billElement;
    }

    /**
     * 事件处理方法
     */
    
    // 初始化事件监听
    initEventListeners() {
        // 添加账单按钮点击事件
        const addBillBtn = document.getElementById('add-bill-btn');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => this.showAddBillDialog());
        }

        // 设置账单项的交互事件
        this.setupBillItemEvents();
        
        // 添加右键菜单
        this.setupContextMenu();
        
        // 点击其他区域关闭菜单
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }
    
    // 设置账单项的交互事件
    setupBillItemEvents() {
        const billList = document.getElementById('bill-list');
        if (!billList) return;
        
        // 长按定时器
        let longPressTimer;
        const clearTimer = () => clearTimeout(longPressTimer);
        
        if (this.isMobile) {
            // 移动设备使用长按事件
            billList.addEventListener('touchstart', (e) => {
                const billItem = e.target.closest('.bill-item');
                if (!billItem) return;
                
                longPressTimer = setTimeout(() => {
                    this.showActionMenu(billItem, e.touches[0].clientX, e.touches[0].clientY);
                }, 600);
            });
            
            billList.addEventListener('touchend', clearTimer);
            billList.addEventListener('touchmove', clearTimer);
        } else {
            // 桌面设备使用点击和右键事件
            billList.addEventListener('click', (e) => {
                const billItem = e.target.closest('.bill-item');
                if (billItem) {
                    // 普通点击可以查看详情或其他操作
                    console.log('查看账单详情:', billItem.dataset.id);
                }
            });
        }
    }
    
    // 设置右键菜单
    setupContextMenu() {
        const billList = document.getElementById('bill-list');
        if (!billList) return;
        
        // 阻止默认右键菜单
        billList.addEventListener('contextmenu', (e) => {
            const billItem = e.target.closest('.bill-item');
            if (billItem) {
                e.preventDefault();
                this.showActionMenu(billItem, e.clientX, e.clientY);
            }
        });
    }
    
    // 处理文档点击事件
    handleDocumentClick(e) {
        const menu = document.querySelector('.bill-action-menu');
        const backdrop = document.querySelector('.menu-backdrop');
        
        // 如果点击的不是菜单内部元素，则关闭菜单
        if (menu && !menu.contains(e.target)) {
            // 如果点击的不是账单项，则移除选中状态
            const clickedBillItem = e.target.closest('.bill-item');
            const selectedItem = document.querySelector('.bill-item.selected');
            
            if (selectedItem && (!clickedBillItem || clickedBillItem !== selectedItem)) {
                selectedItem.classList.remove('selected');
            }
            
            menu.remove();
            if (backdrop) backdrop.remove();
        }
    }
    
    /**
     * 菜单与对话框方法
     */
    
    // 显示操作菜单
    showActionMenu(billItem, x, y) {
        this.clearExistingMenus();
        this.highlightSelectedItem(billItem);
        
        const billId = billItem.dataset.id;
        const menu = this.createActionMenu();
        
        // 如果是移动设备，添加背景遮罩
        if (this.isMobile) {
            this.createBackdrop(menu, billItem);
        }
        
        // 获取账单项的位置信息
        const billItemRect = billItem.getBoundingClientRect();
        
        // 根据设备类型设置不同的位置
        if (this.isMobile) {
            this.positionMobileMenu(menu, billItemRect);
        } else {
            this.positionDesktopMenu(menu, x, y);
        }
        
        // 添加菜单项事件
        this.setupMenuItemEvents(menu, billId, billItem);
    }
    
    // 清除现有菜单
    clearExistingMenus() {
        const existingMenu = document.querySelector('.bill-action-menu');
        if (existingMenu) existingMenu.remove();
        
        const existingBackdrop = document.querySelector('.menu-backdrop');
        if (existingBackdrop) existingBackdrop.remove();
    }
    
    // 高亮选中的账单项
    highlightSelectedItem(billItem) {
        const selectedItem = document.querySelector('.bill-item.selected');
        if (selectedItem) selectedItem.classList.remove('selected');
        billItem.classList.add('selected');
    }
    
    // 创建操作菜单
    createActionMenu() {
        const menu = document.createElement('div');
        menu.className = 'bill-action-menu';
        menu.innerHTML = `
            <div class="menu-item edit-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>编辑账单</span>
            </div>
            <div class="menu-item delete-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>删除账单</span>
            </div>
        `;
        menu.style.position = 'absolute';
        document.body.appendChild(menu);
        return menu;
    }
    
    // 创建背景遮罩
    createBackdrop(menu, billItem) {
        const backdrop = document.createElement('div');
        backdrop.className = 'menu-backdrop';
        backdrop.addEventListener('click', () => {
            backdrop.remove();
            menu.remove();
            billItem.classList.remove('selected');
        });
        document.body.appendChild(backdrop);
    }
    
    // 定位移动端菜单
    positionMobileMenu(menu, billItemRect) {
        const menuRect = menu.getBoundingClientRect();
        let position = 'right'; // 默认位置标记
        
        // 水平位置：优先显示在账单项右侧，如果空间不足则显示在左侧
        let leftPos = billItemRect.right + 10;
        if (leftPos + menuRect.width > window.innerWidth - 10) {
            leftPos = billItemRect.left - menuRect.width - 10;
            position = 'left';
        }
        
        // 如果左侧也放不下，则居中显示在账单项上方或下方
        if (leftPos < 10) {
            leftPos = billItemRect.left + (billItemRect.width - menuRect.width) / 2;
            position = 'center';
            
            // 判断是显示在上方还是下方（优先下方）
            let topPos = billItemRect.bottom + 10;
            if (topPos + menuRect.height > window.innerHeight - 10) {
                topPos = billItemRect.top - menuRect.height - 10;
                // 如果上方也放不下，则尽量居中显示
                if (topPos < 10) {
                    topPos = Math.max(10, (window.innerHeight - menuRect.height) / 2);
                }
            }
            menu.style.top = `${topPos}px`;
        } else {
            // 垂直位置：尽量与账单项垂直居中对齐
            let topPos = billItemRect.top + (billItemRect.height - menuRect.height) / 2;
            
            // 确保菜单不会超出屏幕顶部或底部
            if (topPos < 10) {
                topPos = 10;
            } else if (topPos + menuRect.height > window.innerHeight - 10) {
                topPos = window.innerHeight - menuRect.height - 10;
            }
            menu.style.top = `${topPos}px`;
        }
        
        menu.style.left = `${leftPos}px`;
        
        // 添加移动端特有的样式和位置标记
        menu.classList.add('mobile-menu');
        menu.dataset.position = position;
    }
    
    // 定位桌面端菜单
    positionDesktopMenu(menu, x, y) {
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        const menuRect = menu.getBoundingClientRect();
        
        // 确保菜单不会超出视口
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${x - menuRect.width}px`;
        }
        
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${y - menuRect.height}px`;
        }
    }
    
    // 设置菜单项事件
    setupMenuItemEvents(menu, billId, billItem) {
        const editItem = menu.querySelector('.edit-item');
        const deleteItem = menu.querySelector('.delete-item');
        
        editItem.addEventListener('click', () => {
            this.showEditBillDialog(billId);
            this.cleanupMenuAndSelection(menu, billItem);
        });
        
        deleteItem.addEventListener('click', () => {
            if (confirm('确定要删除这条账单记录吗？')) {
                this.deleteBill(billId);
            } else {
                billItem.classList.remove('selected');
            }
            this.cleanupMenuAndSelection(menu, billItem);
        });
    }
    
    // 清理菜单和选中状态
    cleanupMenuAndSelection(menu, billItem) {
        menu.remove();
        const backdrop = document.querySelector('.menu-backdrop');
        if (backdrop) backdrop.remove();
        billItem.classList.remove('selected');
    }
    
    // 显示编辑账单对话框
    showEditBillDialog(billId) {
        const bill = this.getBill(billId);
        if (!bill) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'add-bill-dialog';
        
        const dateValue = new Date(bill.date).toISOString().split('T')[0];
        
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
                        <input type="text" name="title" required placeholder="请输入标题" value="${bill.title}">
                    </div>
                    <div class="form-group">
                        <label>金额</label>
                        <input type="number" name="amount" required step="0.01" placeholder="请输入金额" value="${bill.amount}">
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <input type="text" name="category" required placeholder="请输入分类" value="${bill.category}">
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
        
        document.body.appendChild(dialog);
        this.setupEditDialogEvents(dialog, billId);
    }
    
    // 设置编辑对话框事件
    setupEditDialogEvents(dialog, billId) {
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
            
            this.updateBill(billId, updatedData);
            document.body.removeChild(dialog);
        });
        
        // 取消按钮事件
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    // 显示添加账单对话框
    showAddBillDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'add-bill-dialog';
        
        const today = new Date().toISOString().split('T')[0];
        
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
                        <input type="date" name="date" required value="${today}">
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">取消</button>
                        <button type="submit" class="submit-btn">确定</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);
        this.setupAddDialogEvents(dialog);
    }
    
    // 设置添加对话框事件
    setupAddDialogEvents(dialog) {
        const form = dialog.querySelector('#add-bill-form');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        // 表单提交事件
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
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
}

// 页面加载完成后初始化账单管理器
document.addEventListener('DOMContentLoaded', () => {
    window.billManager = new BillManager();
});
