class DataAnalyzer {
    constructor() {
        this.bills = JSON.parse(localStorage.getItem('bills') || '[]');
        console.log('加载到的账单数据：', this.bills);
        this.chartInstances = {};
        this.currentView = {
            trend: 'month',
            compare: 'month'
        };
        this.initUIElements();
        this.initCharts();
        this.updateStatistics();
        this.generateInsights();
        this.setupEventListeners();
        console.log('图表初始化完成');
    }

    initUIElements() {
        // 获取页面元素引用
        this.monthlyIncomeElement = document.getElementById('monthlyIncome');
        this.monthlyExpenseElement = document.getElementById('monthlyExpense');
        this.incomeChangeElement = document.getElementById('incomeChange');
        this.expenseChangeElement = document.getElementById('expenseChange');
        this.monthlyBalanceElement = document.getElementById('monthlyBalance');
        this.budgetUsageElement = document.getElementById('budgetUsage');
        this.progressFillElement = document.getElementById('progressFill');
        this.categoryLegendElement = document.getElementById('categoryLegend');
        this.insightCardsElement = document.getElementById('insightCards');
    }

    initCharts() {
        this.initTrendChart();
        this.initCategoryChart();
        this.initCompareChart();
    }

    getMonthlyData(month = new Date().getMonth(), year = new Date().getFullYear()) {
        return this.bills.filter(bill => {
            const d = new Date(bill.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });
    }

    // 获取过去7天的数据
    getWeeklyData() {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        
        return this.bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= sevenDaysAgo && billDate <= now;
        });
    }

    // 获取全年数据
    getYearlyData(year = new Date().getFullYear()) {
        return this.bills.filter(bill => {
            const d = new Date(bill.date);
            return d.getFullYear() === year;
        });
    }

    updateStatistics() {
        // 获取本月和上月数据
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const currentMonthData = this.getMonthlyData(currentMonth, currentYear);
        
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth < 0) {
            previousMonth = 11;
            previousYear -= 1;
        }
        
        const previousMonthData = this.getMonthlyData(previousMonth, previousYear);
        
        // 计算本月收支
        const currentIncome = currentMonthData
            .filter(b => b.type === 'income')
            .reduce((sum, b) => sum + b.amount, 0);
            
        const currentExpense = currentMonthData
            .filter(b => b.type === 'expense')
            .reduce((sum, b) => sum + b.amount, 0);
            
        // 计算上月收支
        const previousIncome = previousMonthData
            .filter(b => b.type === 'income')
            .reduce((sum, b) => sum + b.amount, 0);
            
        const previousExpense = previousMonthData
            .filter(b => b.type === 'expense')
            .reduce((sum, b) => sum + b.amount, 0);
            
        // 计算环比变化
        const incomeChange = previousIncome === 0 ? 100 : 
            Math.round((currentIncome - previousIncome) / previousIncome * 100);
            
        const expenseChange = previousExpense === 0 ? 100 : 
            Math.round((currentExpense - previousExpense) / previousExpense * 100);
            
        // 更新UI
        this.monthlyIncomeElement.textContent = `¥${currentIncome.toFixed(2)}`;
        this.monthlyExpenseElement.textContent = `¥${currentExpense.toFixed(2)}`;
        
        this.incomeChangeElement.textContent = `${Math.abs(incomeChange)}%`;
        this.expenseChangeElement.textContent = `${Math.abs(expenseChange)}%`;
        
        // 更新收支类的图标方向
        if (incomeChange >= 0) {
            this.incomeChangeElement.parentElement.classList.remove('negative');
            this.incomeChangeElement.parentElement.classList.add('positive');
            this.incomeChangeElement.parentElement.querySelector('i').className = 'ri-arrow-up-line';
        } else {
            this.incomeChangeElement.parentElement.classList.remove('positive');
            this.incomeChangeElement.parentElement.classList.add('negative');
            this.incomeChangeElement.parentElement.querySelector('i').className = 'ri-arrow-down-line';
        }
        
        if (expenseChange >= 0) {
            this.expenseChangeElement.parentElement.classList.remove('negative');
            this.expenseChangeElement.parentElement.classList.add('positive');
            this.expenseChangeElement.parentElement.querySelector('i').className = 'ri-arrow-up-line';
        } else {
            this.expenseChangeElement.parentElement.classList.remove('positive');
            this.expenseChangeElement.parentElement.classList.add('negative');
            this.expenseChangeElement.parentElement.querySelector('i').className = 'ri-arrow-down-line';
        }
        
        // 更新结余和预算使用
        const monthlyBalance = currentIncome - currentExpense;
        this.monthlyBalanceElement.textContent = `¥${monthlyBalance.toFixed(2)}`;
        
        // 模拟预算使用率
        const budgetUsage = Math.min(Math.round((currentExpense / (currentIncome || 1)) * 100), 100);
        this.budgetUsageElement.textContent = `${budgetUsage}%`;
        
        // 更新进度条
        this.progressFillElement.style.width = `${budgetUsage}%`;
        
        // 根据预算使用情况更改进度条颜色
        if (budgetUsage < 50) {
            this.progressFillElement.style.background = 'linear-gradient(90deg, #52c41a, #95de64)';
        } else if (budgetUsage < 80) {
            this.progressFillElement.style.background = 'linear-gradient(90deg, #faad14, #ffc53d)';
        } else {
            this.progressFillElement.style.background = 'linear-gradient(90deg, #ff4d4f, #ff7875)';
        }
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        
        // 获取本月数据
        this.updateTrendChart('month');
    }

    updateTrendChart(viewType) {
        const ctx = document.getElementById('trendChart');
        
        // 销毁现有图表实例
        if (this.chartInstances.trend) {
            this.chartInstances.trend.destroy();
        }
        
        let data, labels;
        
        if (viewType === 'month') {
            // 获取本月数据并按日期分组
            const monthlyData = this.getMonthlyData();
            const dailyData = {};
            
            // 获取当前月的天数
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            
            // 初始化每一天的数据
            for (let i = 1; i <= daysInMonth; i++) {
                dailyData[i] = { income: 0, expense: 0 };
            }
            
            // 填充实际数据
            monthlyData.forEach(bill => {
                const day = new Date(bill.date).getDate();
                bill.type === 'income' 
                    ? dailyData[day].income += bill.amount 
                    : dailyData[day].expense += bill.amount;
            });
            
            data = {
                income: Object.values(dailyData).map(d => d.income),
                expense: Object.values(dailyData).map(d => d.expense)
            };
            
            labels = Object.keys(dailyData).map(day => `${day}日`);
        } else {
            // 获取最近7天数据
            const weeklyData = this.getWeeklyData();
            const dailyData = {};
            
            // 初始化最近7天的数据
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dailyData[dateStr] = { income: 0, expense: 0 };
            }
            
            // 填充实际数据
            weeklyData.forEach(bill => {
                const dateStr = bill.date.split('T')[0];
                if (dailyData[dateStr]) {
                    bill.type === 'income' 
                        ? dailyData[dateStr].income += bill.amount 
                        : dailyData[dateStr].expense += bill.amount;
                }
            });
            
            data = {
                income: Object.values(dailyData).map(d => d.income),
                expense: Object.values(dailyData).map(d => d.expense)
            };
            
            labels = Object.keys(dailyData).map(dateStr => {
                const date = new Date(dateStr);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });
        }

        // 创建图表
        this.chartInstances.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    this.createDataset('收入', '#52c41a', data.income),
                    this.createDataset('支出', '#ff4d4f', data.expense)
                ]
            },
            options: this.getChartOptions(viewType === 'month' ? '本月每日收支' : '最近七天收支')
        });
        
        // 更新当前视图状态
        this.currentView.trend = viewType;
        
        // 更新按钮状态
        const monthBtn = document.getElementById('trendMonthBtn');
        const weekBtn = document.getElementById('trendWeekBtn');
        
        monthBtn.classList.toggle('active', viewType === 'month');
        weekBtn.classList.toggle('active', viewType === 'week');
    }

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        
        // 获取支出分类数据
        const categories = this.bills
            .filter(bill => bill.type === 'expense')
            .reduce((acc, bill) => {
                acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
                return acc;
            }, {});
            
        // 排序并获取前5个分类
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        const labels = sortedCategories.map(c => c[0]);
        const values = sortedCategories.map(c => c[1]);
        const backgroundColor = labels.map((_, i) => this.getCategoryColor(i));
        
        // 创建图表
        this.chartInstances.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColor,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
        
        // 生成图例
        this.generateCategoryLegend(labels, values, backgroundColor);
    }

    generateCategoryLegend(labels, values, colors) {
        // 清空现有图例
        this.categoryLegendElement.innerHTML = '';
        
        // 计算总额
        const total = values.reduce((a, b) => a + b, 0);
        
        // 创建每个分类的图例项
        labels.forEach((label, i) => {
            const percentage = Math.round((values[i] / total) * 100);
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colors[i];
            
            const labelText = document.createElement('span');
            labelText.textContent = `${label}: ${percentage}%`;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(labelText);
            
            this.categoryLegendElement.appendChild(legendItem);
        });
    }

    initCompareChart() {
        const ctx = document.getElementById('compareChart');
        
        // 默认显示月度对比
        this.updateCompareChart('month');
    }

    updateCompareChart(viewType) {
        const ctx = document.getElementById('compareChart');
        
        // 销毁现有图表实例
        if (this.chartInstances.compare) {
            this.chartInstances.compare.destroy();
        }
        
        let labels, incomeData, expenseData;
        
        if (viewType === 'month') {
            // 获取最近6个月的数据
            const months = [];
            const monthLabels = [];
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                
                const month = date.getMonth();
                const year = date.getFullYear();
                
                months.push({ month, year });
                monthLabels.push(`${month + 1}月`);
            }
            
            // 计算每月收支
            incomeData = months.map(({ month, year }) => {
                return this.getMonthlyData(month, year)
                    .filter(b => b.type === 'income')
                    .reduce((sum, b) => sum + b.amount, 0);
            });
            
            expenseData = months.map(({ month, year }) => {
                return this.getMonthlyData(month, year)
                    .filter(b => b.type === 'expense')
                    .reduce((sum, b) => sum + b.amount, 0);
            });
            
            labels = monthLabels;
        } else {
            // 按季度汇总年度数据
            const now = new Date();
            const currentYear = now.getFullYear();
            
            const quarterlyData = [
                { label: 'Q1', income: 0, expense: 0 },
                { label: 'Q2', income: 0, expense: 0 },
                { label: 'Q3', income: 0, expense: 0 },
                { label: 'Q4', income: 0, expense: 0 }
            ];
            
            // 获取年度数据并按季度分组
            const yearData = this.getYearlyData(currentYear);
            
            yearData.forEach(bill => {
                const month = new Date(bill.date).getMonth();
                const quarter = Math.floor(month / 3);
                
                if (bill.type === 'income') {
                    quarterlyData[quarter].income += bill.amount;
                } else {
                    quarterlyData[quarter].expense += bill.amount;
                }
            });
            
            labels = quarterlyData.map(q => q.label);
            incomeData = quarterlyData.map(q => q.income);
            expenseData = quarterlyData.map(q => q.expense);
        }

        // 创建图表
        this.chartInstances.compare = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '收入',
                        data: incomeData,
                        backgroundColor: 'rgba(82, 196, 26, 0.7)',
                        borderRadius: 6
                    },
                    {
                        label: '支出',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 77, 79, 0.7)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: viewType === 'month' ? '最近6个月收支对比' : '今年季度收支对比',
                        font: {
                            size: 14
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ¥${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            callback: value => '¥' + value
                        }
                    }
                }
            }
        });
        
        // 更新当前视图状态
        this.currentView.compare = viewType;
        
        // 更新按钮状态
        const monthBtn = document.getElementById('compareMonthBtn');
        const yearBtn = document.getElementById('compareYearBtn');
        
        monthBtn.classList.toggle('active', viewType === 'month');
        yearBtn.classList.toggle('active', viewType === 'year');
    }

    createDataset(label, color, data) {
        return {
            label,
            data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true
        };
    }

    getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: { 
                    display: true, 
                    text: title,
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ¥${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        callback: value => '¥' + value
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        };
    }

    getCategoryColor(index) {
        const colors = [
            '#ff7875', '#ff9c6e', '#ffc069', '#fff566', '#d3f261', 
            '#95de64', '#5cdbd3', '#69b1ff', '#85a5ff', '#b37feb'
        ];
        return colors[index % colors.length];
    }
    
    setupEventListeners() {
        // 趋势图切换按钮
        const trendMonthBtn = document.getElementById('trendMonthBtn');
        const trendWeekBtn = document.getElementById('trendWeekBtn');
        
        trendMonthBtn.addEventListener('click', () => this.updateTrendChart('month'));
        trendWeekBtn.addEventListener('click', () => this.updateTrendChart('week'));
        
        // 对比图切换按钮
        const compareMonthBtn = document.getElementById('compareMonthBtn');
        const compareYearBtn = document.getElementById('compareYearBtn');
        
        compareMonthBtn.addEventListener('click', () => this.updateCompareChart('month'));
        compareYearBtn.addEventListener('click', () => this.updateCompareChart('year'));
        
        // 类别图查看更多按钮
        const categoryMoreBtn = document.getElementById('categoryMoreBtn');
        if (categoryMoreBtn) {
            categoryMoreBtn.addEventListener('click', () => {
                // 实现查看更多类别功能
                alert('功能开发中，敬请期待！');
            });
        }
        
        // 初始化激活状态
        trendMonthBtn.classList.add('active');
        compareMonthBtn.classList.add('active');
    }

    // 添加智能洞察生成方法
    generateInsights() {
        // 清空现有洞察卡片
        if (this.insightCardsElement) {
            this.insightCardsElement.innerHTML = '';
        } else {
            console.warn('未找到洞察卡片容器元素');
            return;
        }

        // 获取本月和上月数据
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth < 0) {
            previousMonth = 11;
            previousYear -= 1;
        }
        
        const currentMonthData = this.getMonthlyData(currentMonth, currentYear);
        const previousMonthData = this.getMonthlyData(previousMonth, previousYear);
        
        // 按分类统计本月支出
        const currentCategoryExpenses = this.getCategoryExpenses(currentMonthData);
        const previousCategoryExpenses = this.getCategoryExpenses(previousMonthData);
        
        // 计算总支出
        const currentTotalExpense = Object.values(currentCategoryExpenses).reduce((sum, value) => sum + value, 0);
        const previousTotalExpense = Object.values(previousCategoryExpenses).reduce((sum, value) => sum + value, 0);
        
        // 生成洞察
        const insights = [];
        
        // 如果没有足够的数据，显示提示信息
        if (currentMonthData.length === 0 && previousMonthData.length === 0) {
            this.createEmptyInsightCard();
            return;
        }
        
        // 分析每个类别的变化
        for (const category in currentCategoryExpenses) {
            const currentAmount = currentCategoryExpenses[category] || 0;
            const previousAmount = previousCategoryExpenses[category] || 0;
            
            // 计算占比变化
            const currentPercentage = currentTotalExpense ? (currentAmount / currentTotalExpense) * 100 : 0;
            const previousPercentage = previousTotalExpense ? (previousAmount / previousTotalExpense) * 100 : 0;
            const percentageChange = currentPercentage - previousPercentage;
            
            // 计算金额变化
            const amountChange = currentAmount - previousAmount;
            const amountChangePercentage = previousAmount ? (amountChange / previousAmount) * 100 : 0;
            
            // 只关注有意义的变化
            if (Math.abs(percentageChange) >= 1 || Math.abs(amountChangePercentage) >= 5) {
                insights.push({
                    category,
                    percentageChange,
                    amountChange,
                    amountChangePercentage,
                    currentAmount,
                    previousAmount
                });
            }
        }
        
        // 查找新增的类别
        for (const category in currentCategoryExpenses) {
            if (!previousCategoryExpenses[category] && currentCategoryExpenses[category] > 0) {
                const newInsight = insights.find(i => i.category === category);
                if (!newInsight) {
                    insights.push({
                        category,
                        isNew: true,
                        currentAmount: currentCategoryExpenses[category]
                    });
                }
            }
        }
        
        // 排序洞察：新类别优先，然后按变化幅度排序
        insights.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return Math.abs(b.percentageChange || 0) - Math.abs(a.percentageChange || 0);
        });
        
        // 限制展示的洞察数量
        const maxInsights = Math.min(3, insights.length);
        
        // 创建洞察卡片
        if (insights.length === 0) {
            this.createEmptyInsightCard();
        } else {
            for (let i = 0; i < maxInsights; i++) {
                this.createInsightCard(insights[i]);
            }
        }
    }
    
    // 获取按分类统计的支出
    getCategoryExpenses(bills) {
        return bills
            .filter(bill => bill.type === 'expense')
            .reduce((acc, bill) => {
                const category = bill.category || '其他';
                acc[category] = (acc[category] || 0) + bill.amount;
                return acc;
            }, {});
    }
    
    // 创建空洞察卡片
    createEmptyInsightCard() {
        const card = document.createElement('div');
        card.className = 'insight-card empty-insight';
        
        const icon = document.createElement('div');
        icon.className = 'insight-icon';
        icon.innerHTML = '<i class="ri-information-line"></i>';
        
        const content = document.createElement('div');
        content.className = 'insight-content';
        
        const title = document.createElement('div');
        title.className = 'insight-title';
        title.textContent = '暂无洞察';
        
        const text = document.createElement('div');
        text.className = 'insight-text';
        text.textContent = '记录更多账单数据，即可获得消费洞察分析';
        
        content.appendChild(title);
        content.appendChild(text);
        
        card.appendChild(icon);
        card.appendChild(content);
        
        this.insightCardsElement.appendChild(card);
    }
    
    // 创建洞察卡片
    createInsightCard(insight) {
        const card = document.createElement('div');
        card.className = 'insight-card';
        
        // 如果是新增分类，添加特殊样式类
        if (insight.isNew) {
            card.classList.add('new-category');
        }
        
        const icon = document.createElement('div');
        icon.className = 'insight-icon';
        
        // 根据分类选择图标
        const iconClass = this.getCategoryIconClass(insight.category);
        icon.innerHTML = `<i class="${iconClass}"></i>`;
        
        const content = document.createElement('div');
        content.className = 'insight-content';
        
        const title = document.createElement('div');
        title.className = 'insight-title';
        title.textContent = `${insight.category}支出`;
        
        const text = document.createElement('div');
        text.className = 'insight-text';
        
        if (insight.isNew) {
            text.innerHTML = `本月新增支出类别，共支出<span class="highlight increase">¥${insight.currentAmount.toFixed(2)}</span>`;
        } else {
            const formatChange = Math.abs(insight.amountChangePercentage).toFixed(0);
            const changeDirection = insight.amountChange > 0 ? '增加' : '减少';
            const changeClass = insight.amountChange > 0 ? 'increase' : 'decrease';
            
            text.innerHTML = `本月${insight.category}支出较上月<span class="highlight ${changeClass}">${changeDirection}${formatChange}%</span>`;
        }
        
        content.appendChild(title);
        content.appendChild(text);
        
        card.appendChild(icon);
        card.appendChild(content);
        
        this.insightCardsElement.appendChild(card);
    }
    
    // 根据分类获取对应图标类
    getCategoryIconClass(category) {
        const categoryMap = {
            '餐饮': 'ri-restaurant-line',
            '食物': 'ri-restaurant-line',
            '饮食': 'ri-restaurant-line',
            '购物': 'ri-shopping-bag-line',
            '服装': 'ri-t-shirt-line',
            '交通': 'ri-taxi-line',
            '娱乐': 'ri-film-line',
            '旅游': 'ri-flight-takeoff-line',
            '住宿': 'ri-home-line',
            '教育': 'ri-book-open-line',
            '医疗': 'ri-heart-pulse-line',
            '通讯': 'ri-smartphone-line',
            '水电': 'ri-flashlight-line',
            '其他': 'ri-more-line'
        };
        
        // 如果找不到匹配的分类，返回默认图标
        return categoryMap[category] || 'ri-file-list-line';
    }
}

// 初始化图表
document.addEventListener('DOMContentLoaded', () => new DataAnalyzer());