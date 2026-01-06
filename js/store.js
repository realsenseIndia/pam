class Store {
    static get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
            alert('Error: Could not save data. Your browser storage might be full.');
        }
    }

    static init() {
        if (!this.get(CONFIG.KEYS.SOURCES)) {
            // Seed initial sources if empty
            const initialSources = CONFIG.DEFAULTS.SOURCE_TYPES.map(name => ({
                id: Utils.generateId(),
                name: name,
                totalAmount: 0,
                history: [] // { date, amount, note }
            }));
            this.set(CONFIG.KEYS.SOURCES, initialSources);
        }

        if (!this.get(CONFIG.KEYS.EXPENSES)) {
            this.set(CONFIG.KEYS.EXPENSES, []);
        }

        if (!this.get(CONFIG.KEYS.PAYMENTS)) {
            this.set(CONFIG.KEYS.PAYMENTS, []);
        }

        if (!this.get(CONFIG.KEYS.RENEWALS)) {
            this.set(CONFIG.KEYS.RENEWALS, []);
        }

        if (!this.get(CONFIG.KEYS.CUSTOM_TYPES)) {
            this.set(CONFIG.KEYS.CUSTOM_TYPES, {
                expense: [],
                payment: [],
                todo: []
            });
        }
    }

    // Generic Add
    static add(key, item) {
        const items = this.get(key) || [];
        items.push(item);
        this.set(key, items);
    }

    // Generic Update
    static update(key, id, updates) {
        const items = this.get(key) || [];
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.set(key, items);
        }
    }

    // Generic Delete
    static delete(key, id) {
        const items = this.get(key) || [];
        const filtered = items.filter(i => i.id !== id);
        this.set(key, filtered);
    }

    static addCustomType(category, typeName) {
        const customTypes = this.get(CONFIG.KEYS.CUSTOM_TYPES) || { expense: [], payment: [], todo: [] };
        if (!customTypes[category]) customTypes[category] = [];

        if (!customTypes[category].includes(typeName)) {
            customTypes[category].push(typeName);
            this.set(CONFIG.KEYS.CUSTOM_TYPES, customTypes);
        }
    }

    static getCombinedTypes(category, defaultList) {
        const customTypes = this.get(CONFIG.KEYS.CUSTOM_TYPES) || { expense: [], payment: [], todo: [] };
        const custom = customTypes[category] || [];
        // Combine and dedup
        return [...new Set([...defaultList, ...custom])].sort();
    }
}
