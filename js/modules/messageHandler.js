// 消息处理模块
export function shouldShowTimeDivider(lastTimestamp, currentTimestamp) {
    if (!lastTimestamp) return true;
    const timeDiff = currentTimestamp - lastTimestamp;
    return timeDiff >= 5 * 60 * 1000; // 5分钟间隔
}

export function formatMessageTime(timestamp) {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (messageDate.getFullYear() !== now.getFullYear()) {
        return messageDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    if (diffInDays >= 7) {
        return messageDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }

    if (diffInDays > 0 && diffInDays <= 2) {
        const dayText = diffInDays === 1 ? '昨天' : '前天';
        return `${dayText} ${messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (diffInDays > 0) {
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `周${weekDays[messageDate.getDay()]} ${messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (diffInMinutes < 1) {
        return '刚刚';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}分钟前`;
    } else {
        return messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
}
