const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    formatDate: (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },

    generateId: () => {
        try {
            return crypto.randomUUID();
        } catch (e) {
            return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        }
    },

    getDateRange: (rangeType) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate;

        switch (rangeType) {
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 7);
                break;
            case 'lastMonth':
                fromDate = new Date(today);
                fromDate.setMonth(today.getMonth() - 1);
                break;
            case 'last3Months':
                fromDate = new Date(today);
                fromDate.setMonth(today.getMonth() - 3);
                break;
            case 'lastYear':
                fromDate = new Date(today);
                fromDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                return null;
        }
        return { from: fromDate, to: today };
    },

    isDateInFuture: (dateString, daysOffset = 0) => {
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);

        const compareDate = new Date();
        compareDate.setHours(0, 0, 0, 0);
        compareDate.setDate(compareDate.getDate() + daysOffset);

        return target.getTime() === compareDate.getTime();
    },

    daysUntil: (dateString) => {
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
};
