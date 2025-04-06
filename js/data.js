
class DataAnalyzer {
    constructor() {
        this.bills = JSON.parse(localStorage.getItem('bills') || '[]');
        console.log('加载到的账单数据：', this.bills);
        this.initCharts();
        console.log('图表初始化完成');
    }

    initCharts() {
        this.initTrendChart();
        this.initCategoryChart();
        this.initCompareChart();
    }

    getMonthlyData() {
        const now = new Date();
        return this.bills.filter(bill => {
            const d = new Date(bill.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        const data = this.getMonthlyData();
        
        const dailyData = data.reduce((acc, bill) => {
            const day = new Date(bill.date).getDate();
            acc[day] = acc[day] || { income: 0, expense: 0 };
            bill.type === 'income' ? acc[day].income += bill.amount : acc[day].expense += bill.amount;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(dailyData).map(day => `${day}日`),
                datasets: [
                    this.createDataset('收入', '#52c41a', Object.values(dailyData).map(d => d.income)),
                    this.createDataset('支出', '#ff4d4f', Object.values(dailyData).map(d => d.expense))
                ]
            },
            options: this.getChartOptions('每日趋势')
        });
    }

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        const categories = this.bills
            .filter(bill => bill.type === 'expense')
            .reduce((acc, bill) => {
                acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
                return acc;
            }, {});

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: Object.keys(categories)
                        .map((_, i) => this.getCategoryColor(i))
                }]
            },
            options: this.getChartOptions('分类占比')
        });
    }

    initCompareChart() {
        const ctx = document.getElementById('compareChart');
        const monthlyData = this.getMonthlyData();
        const income = monthlyData.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0);
        const expense = monthlyData.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['收入 vs 支出'],
                datasets: [
                    this.createDataset('收入', '#52c41a', [income]),
                    this.createDataset('支出', '#ff4d4f', [expense])
                ]
            },
            options: this.getChartOptions('收支对比')
        });
    }

    createDataset(label, color, data) {
        return {
            label,
            data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            pointRadius: 5,
            tension: 0.4
        };
    }

    getChartOptions(title) {
        return {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: title }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '¥' + value }
                }
            }
        };
    }

    getCategoryColor(index) {
        const colors = ['#ff7875', '#ff9c6e', '#ffc069', '#fff566', '#d3f261', '#95de64', '#5cdbd3', '#69b1ff', '#85a5ff', '#b37feb'];
        return colors[index % colors.length];
    }
}

// 初始化图表
window.addEventListener('DOMContentLoaded', () => new DataAnalyzer());