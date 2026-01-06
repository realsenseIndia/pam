const Renderers = {
    renderDashboard: () => {
        const sources = Store.get(CONFIG.KEYS.SOURCES) || [];
        const expenses = Store.get(CONFIG.KEYS.EXPENSES) || [];

        // Calculate Total Income
        const totalIncome = sources.reduce((sum, start) => sum + (parseFloat(start.totalAmount) || 0), 0);

        // Calculate Total Expenses
        const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        // Current Cash
        const currentCash = totalIncome - totalExpenses;

        // Get Upcoming Payments for Dashboard
        const payments = Store.get(CONFIG.KEYS.PAYMENTS) || [];
        payments.sort((a, b) => new Date(a.date) - new Date(b.date));

        const upcomingPayments = payments.filter(p => !p.isDone).slice(0, 5); // Top 5 pending

        const paymentListItems = upcomingPayments.map(p => {
            const days = Utils.daysUntil(p.date);
            let badgeClass = 'badge-upcoming';
            let timeText = `${days} days left`;

            if (days < 0) { badgeClass = 'badge-danger'; timeText = 'Overdue'; }
            else if (days === 0) { badgeClass = 'badge-danger'; timeText = 'Today'; }
            else if (days <= 7) { badgeClass = 'badge-warning'; }

            return `
                <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);">
                    <div>
                        <div style="font-weight:500;">${p.particulars}</div>
                        <div style="font-size:0.8rem; color:var(--color-text-muted);">${Utils.formatDate(p.date)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600;">${p.amount ? Utils.formatCurrency(p.amount) : '-'}</div>
                        <span class="badge ${badgeClass}">${timeText}</span>
                    </div>
                </div>
             `;
        }).join('');

        return `
            <div class="header">
                <h1 class="page-title">Dashboard</h1>
                <div class="current-date">${Utils.formatDate(new Date())}</div>
            </div>

            <div class="card-grid">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Current Cash In Account</span>
                        <i class="fa-solid fa-wallet brand-icon"></i>
                    </div>
                    <div class="card-value text-success">${Utils.formatCurrency(currentCash)}</div>
                </div>
                 <div class="card">
                    <div class="card-header">
                        <span class="card-title">Total Income Recorded</span>
                         <i class="fa-solid fa-arrow-trend-up text-success"></i>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(totalIncome)}</div>
                </div>
                 <div class="card">
                    <div class="card-header">
                        <span class="card-title">Total Expenses</span>
                        <i class="fa-solid fa-arrow-trend-down text-danger"></i>
                    </div>
                    <div class="card-value text-danger">${Utils.formatCurrency(totalExpenses)}</div>
                </div>
            </div>
            
            <div class="card" style="margin-top:2rem;">
                 <div class="card-header">
                        <span class="card-title">Upcoming Payments</span>
                        <i class="fa-solid fa-bell text-warning"></i>
                </div>
                <div>
                    ${paymentListItems.length ? paymentListItems : '<div style="color:var(--color-text-muted); padding:1rem; text-align:center;">No upcoming payments</div>'}
                </div>
            </div>
        `;
    },

    renderIncomeView: () => {
        const sources = Store.get(CONFIG.KEYS.SOURCES) || [];

        const rows = sources.map(source => `
            <tr>
                <td>${source.name}</td>
                <td>${Utils.formatCurrency(source.totalAmount)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="App.openAddAmountModal('${source.id}')" title="Add Income">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="App.viewSourceHistory('${source.id}')" title="View History">
                        <i class="fa-solid fa-list"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="App.openEditSourceModal('${source.id}')" title="Edit Source Name">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="header">
                <h1 class="page-title">Income Sources</h1>
                <button class="btn btn-primary" onclick="App.openAddSourceModal()">
                    <i class="fa-solid fa-plus"></i> Add New Source
                </button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Source Name</th>
                            <th>Total Amount Received</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    renderSourceHistoryModal: (sourceId) => {
        const source = (Store.get(CONFIG.KEYS.SOURCES) || []).find(s => s.id === sourceId);
        if (!source) return '';

        const history = [...(source.history || [])];
        // Ensure all history entries have IDs
        let changed = false;
        history.forEach(h => {
            if (!h.id) {
                h.id = Utils.generateId();
                changed = true;
            }
        });
        if (changed) {
            const sources = Store.get(CONFIG.KEYS.SOURCES) || [];
            const idx = sources.findIndex(s => s.id === sourceId);
            if (idx !== -1) {
                sources[idx].history = history;
                Store.set(CONFIG.KEYS.SOURCES, sources);
            }
        }

        // Sort by date desc (using a copy to avoid mutation issues even though we spread above)
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        const rows = history.map(h => `
            <tr>
                <td>${Utils.formatDate(h.date)}</td>
                <td>${Utils.formatCurrency(h.amount)}</td>
                <td>${h.note || '-'}</td>
                <td>
                    <button onclick="App.openEditIncomeEntryModal('${sourceId}', '${h.id}')" style="background:none; border:none; color:var(--color-primary); cursor:pointer; margin-right:0.5rem;">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="App.deleteIncomeEntry('${sourceId}', '${h.id}')" style="background:none; border:none; color:var(--color-accent); cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>History: ${source.name}</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Note</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length ? rows : '<tr><td colspan="4" style="text-align:center">No entries yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderExpensesView: () => {
        const expenses = Store.get(CONFIG.KEYS.EXPENSES) || [];
        // Sort by date desc
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        const rows = expenses.map(exp => `
            <tr>
                <td>${Utils.formatDate(exp.date)}</td>
                <td>${exp.particulars}</td>
                <td><span class="badge badge-warning">${exp.type}</span></td>
                <td>${Utils.formatCurrency(exp.amount)}</td>
                <td>${exp.remark || '-'}</td>
                <td>
                   <button onclick="App.openEditExpenseModal('${exp.id}')" style="background:none; border:none; color:var(--color-primary); cursor:pointer; margin-right:0.5rem;">
                        <i class="fa-solid fa-pen"></i>
                   </button>
                   <button onclick="App.deleteExpense('${exp.id}')" style="background:none; border:none; color:var(--color-accent); cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                   </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="header">
                <h1 class="page-title">Expenses</h1>
                <button class="btn btn-primary" onclick="App.openAddExpenseModal()">
                    <i class="fa-solid fa-plus"></i> Add Expense
                </button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Particulars</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Remark</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length ? rows : '<tr><td colspan="6" style="text-align:center">No expenses recorded</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderPaymentsView: () => {
        const payments = Store.get(CONFIG.KEYS.PAYMENTS) || [];
        payments.sort((a, b) => new Date(a.date) - new Date(b.date));

        const rows = payments.map(p => {
            const daysLeft = Utils.daysUntil(p.date);
            let statusBadge = '';

            if (p.isDone) {
                statusBadge = '<span class="badge badge-success">Done</span>';
            } else if (daysLeft < 0) {
                statusBadge = '<span class="badge badge-danger">Overdue</span>';
            } else if (daysLeft === 0) {
                statusBadge = '<span class="badge badge-danger">Today</span>';
            } else if (daysLeft <= 7) {
                statusBadge = `<span class="badge badge-warning">In ${daysLeft} days</span>`;
            } else {
                statusBadge = `<span class="badge badge-upcoming">${daysLeft} days left</span>`;
            }

            return `
            <tr class="${p.isDone ? 'opacity-50' : ''}">
                <td>${Utils.formatDate(p.date)}</td>
                <td>${p.particulars}</td>
                <td>${p.type}</td>
                <td>${p.amount ? Utils.formatCurrency(p.amount) : '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <input type="checkbox" onchange="App.togglePaymentStatus('${p.id}', this.checked)" ${p.isDone ? 'checked' : ''} style="transform:scale(1.5); cursor:pointer;">
                </td>
                <td>
                   <button onclick="App.openEditPaymentModal('${p.id}')" style="background:none; border:none; color:var(--color-primary); cursor:pointer; margin-right:0.5rem;">
                        <i class="fa-solid fa-pen"></i>
                   </button>
                   <button onclick="App.deletePayment('${p.id}')" style="background:none; border:none; color:var(--color-accent); cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                   </button>
                </td>
            </tr>
        `}).join('');

        return `
            <div class="header">
                <h1 class="page-title">Upcoming Payments</h1>
                <button class="btn btn-primary" onclick="App.openAddPaymentModal()">
                    <i class="fa-solid fa-plus"></i> Add Payment
                </button>
            </div>

             <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Particulars</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status/Alert</th>
                            <th>Mark Done</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         ${rows.length ? rows : '<tr><td colspan="7" style="text-align:center">No upcoming payments</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderRenewalsView: () => {
        const renewals = Store.get(CONFIG.KEYS.RENEWALS) || [];
        renewals.sort((a, b) => new Date(a.date) - new Date(b.date));

        const rows = renewals.map(r => {
            const daysLeft = Utils.daysUntil(r.date);
            let statusBadge = '';

            if (r.isDone) {
                statusBadge = '<span class="badge badge-success">Done</span>';
            } else if (daysLeft < 0) {
                statusBadge = '<span class="badge badge-danger">Overdue</span>';
            } else if (daysLeft === 0) {
                statusBadge = '<span class="badge badge-danger">Today</span>';
            } else if (daysLeft <= 7) {
                statusBadge = `<span class="badge badge-warning">In ${daysLeft} days</span>`;
            } else {
                statusBadge = `<span class="badge badge-upcoming">${daysLeft} days left</span>`;
            }

            return `
            <tr class="${r.isDone ? 'opacity-50' : ''}">
                <td>${Utils.formatDate(r.date)}</td>
                <td>${r.particulars}</td>
                <td>${Utils.formatCurrency(r.amount)}</td>
                <td>${statusBadge}</td>
                <td>
                    <input type="checkbox" onchange="App.toggleRenewalStatus('${r.id}', this.checked)" ${r.isDone ? 'checked' : ''} style="transform:scale(1.5); cursor:pointer;">
                </td>
                <td>
                   <button onclick="App.openEditRenewalModal('${r.id}')" style="background:none; border:none; color:var(--color-primary); cursor:pointer; margin-right:0.5rem;">
                        <i class="fa-solid fa-pen"></i>
                   </button>
                   <button onclick="App.deleteRenewal('${r.id}')" style="background:none; border:none; color:var(--color-accent); cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                   </button>
                </td>
            </tr>
        `}).join('');

        return `
            <div class="header">
                <h1 class="page-title">Renewal Reminders</h1>
                <button class="btn btn-primary" onclick="App.openAddRenewalModal()">
                    <i class="fa-solid fa-plus"></i> Add New Item
                </button>
            </div>

             <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Renewal Date</th>
                            <th>Particulars</th>
                            <th>Amount</th>
                            <th>Status/Alert</th>
                            <th>Mark Done</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length ? rows : '<tr><td colspan="6" style="text-align:center">No renewal reminders</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderReportsView: () => {
        // Prepare options for the dropdown
        const defaultTypes = CONFIG.DEFAULTS.EXPENSE_TYPES || [];
        // Get any custom types used in recorded expenses OR defined in custom types
        const expenses = Store.get(CONFIG.KEYS.EXPENSES) || [];
        const usedTypes = [...new Set(expenses.map(e => e.type))];
        const combinedTypes = Store.getCombinedTypes('expense', defaultTypes);
        const allTypes = [...new Set([...combinedTypes, ...usedTypes])].sort();

        const typeOptions = allTypes.map(t => `<option value="${t}">${t}</option>`).join('');

        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.substring(0, 8) + '01';

        return `
            <div class="header">
                <h1 class="page-title">Reports</h1>
                <div style="display:flex; gap:0.5rem;">
                     <button class="btn btn-secondary" onclick="App.exportReportToCSV()">
                        <i class="fa-solid fa-file-csv"></i> CSV
                    </button>
                    <button class="btn btn-secondary" onclick="window.print()">
                        <i class="fa-solid fa-print"></i> Print
                    </button>
                </div>
            </div>
            
            <div class="card no-print" style="margin-bottom: var(--spacing-md);">
                <div class="card-header">
                    <span class="card-title">Filter Reports</span>
                </div>
                <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom: 1rem;">
                    <button class="btn btn-secondary" onclick="App.generateReport('lastWeek')">Last Week</button>
                    <button class="btn btn-secondary" onclick="App.generateReport('lastMonth')">Last Month</button>
                    <button class="btn btn-secondary" onclick="App.generateReport('last3Months')">Last 3 Months</button>
                    <button class="btn btn-secondary" onclick="App.generateReport('lastYear')">Last Year</button>
                </div>
                 <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end; border-top: 1px solid var(--color-border); padding-top: 1rem;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">From Date</label>
                        <input type="date" id="report-from-date" class="form-control" value="${monthStart}">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">To Date</label>
                        <input type="date" id="report-to-date" class="form-control" value="${today}">
                    </div>
                     <div class="form-group" style="margin-bottom:0; min-width: 150px;">
                        <label class="form-label">Expense Type</label>
                        <select id="report-filter-type" class="form-control">
                            <option value="All">All Types</option>
                            ${typeOptions}
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="App.generateReport('custom')">
                        <i class="fa-solid fa-filter"></i> Generate Report
                    </button>
                </div>
            </div>

            <div id="report-results" class="fade-in">
                <!-- Results injected here -->
                <div style="text-align:center; padding: 2rem; color: var(--color-text-muted);">
                    Select a time range above to generate a report.
                </div>
            </div>
        `;
    },

    renderReportResults: (rangeOrType, filterType = 'All') => {
        let range;
        if (typeof rangeOrType === 'string') {
            range = Utils.getDateRange(rangeOrType);
        } else {
            range = rangeOrType;
        }

        if (!range) return '<div style="text-align:center; padding: 2rem; color: var(--color-text-muted);">Invalid Date Range</div>';

        const expenses = Store.get(CONFIG.KEYS.EXPENSES) || [];
        const sources = Store.get(CONFIG.KEYS.SOURCES) || [];

        // Income filtering (Income is not filtered by expense type, generally speaking, 
        // but if the user wants "Expense Report for Type X", maybe they don't want income?
        // Usually reports show P&L. If I filter expenses by type, P&L Balance will be skewed if I show all Income.
        // However, the request is "report filter based on expenses type".
        // I will keep Income as is (showing all income in that date range) or maybe I should hide it?
        // Usually if I drill down into an expense category, I just want to see those expenses. 
        // But let's stick to showing Income for context unless it looks weird.
        // Actually, if I select "Credit Card" expenses, seeing "Salary" income is fine, 
        // but "Profit" (Income - Expense) will be meaningless. 
        // Let's just filter expenses and show Income as is for the period. 

        let allIncome = [];
        sources.forEach(s => {
            if (s.history && Array.isArray(s.history)) {
                s.history.forEach(h => {
                    allIncome.push({ ...h, sourceName: s.name });
                });
            }
        });

        // Filter Expenses
        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            const matchesDate = d >= range.from && d <= range.to;
            const matchesType = (filterType && filterType !== 'All') ? e.type === filterType : true;

            return matchesDate && matchesType;
        });

        const filteredIncome = allIncome.filter(i => {
            const d = new Date(i.date);
            return d >= range.from && d <= range.to;
        });

        // Calculate Totals
        const totalExp = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalInc = filteredIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0);

        // Sort by Date Ascending (Chronological)
        filteredIncome.sort((a, b) => new Date(a.date) - new Date(b.date));
        filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Render Tables
        const incomeRows = filteredIncome.map(i => `
            <tr>
                <td>${Utils.formatDate(i.date)}</td>
                <td>${i.sourceName}</td>
                <td>${Utils.formatCurrency(i.amount)}</td>
                <td>${i.note || '-'}</td>
            </tr>
        `).join('');

        const expenseRows = filteredExpenses.map(e => `
            <tr>
                <td>${Utils.formatDate(e.date)}</td>
                <td>${e.particulars}</td>
                <td>${e.type}</td>
                <td>${Utils.formatCurrency(e.amount)}</td>
            </tr>
        `).join('');

        return `
            <h3 style="margin-bottom:1rem; color:var(--color-primary);">Report: ${Utils.formatDate(range.from)} - ${Utils.formatDate(range.to)}</h3>
            
            <div class="card-grid">
                <div class="card">
                     <div class="card-header"><span class="card-title">Income in Period</span></div>
                     <div class="card-value text-success">${Utils.formatCurrency(totalInc)}</div>
                </div>
                <div class="card">
                     <div class="card-header"><span class="card-title">Expenses in Period</span></div>
                     <div class="card-value text-danger">${Utils.formatCurrency(totalExp)}</div>
                </div>
                <div class="card">
                     <div class="card-header"><span class="card-title">Net Balance</span></div>
                     <div class="card-value ${totalInc >= totalExp ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(totalInc - totalExp)}</div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h4 style="margin-bottom:0.5rem;">Income Details</h4>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Note</th></tr></thead>
                        <tbody>${incomeRows.length ? incomeRows : '<tr><td colspan="4">No income records in this period</td></tr>'}</tbody>
                    </table>
                </div>
            </div>

             <div>
                <h4 style="margin-bottom:0.5rem;">Expense Details</h4>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Particulars</th><th>Type</th><th>Amount</th></tr></thead>
                        <tbody>${expenseRows.length ? expenseRows : '<tr><td colspan="4">No expense records in this period</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTodoView: (activeCategory = 'All') => {
        let todos = Store.get(CONFIG.KEYS.TODO) || [];

        // Filter by Category
        if (activeCategory !== 'All') {
            todos = todos.filter(t => t.category === activeCategory);
        }

        // Sort: Open first, then by urgency (days remaining)
        // Split open/completed
        const openTodos = todos.filter(t => !t.isCompleted);
        const completedTodos = todos.filter(t => t.isCompleted);

        // Sort Open: Default by due date (implied by date + days required)
        openTodos.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const dueA = new Date(dateA.getTime() + (a.daysRequired * 86400000));
            const dueB = new Date(dateB.getTime() + (b.daysRequired * 86400000));
            return dueA - dueB;
        });

        // Sort Completed: By date desc
        completedTodos.sort((a, b) => new Date(b.date) - new Date(a.date));

        const renderRow = (t, isOpen) => {
            const entryDate = new Date(t.date);
            const daysReq = parseInt(t.daysRequired) || 0;
            const dueDate = new Date(entryDate.getTime() + (daysReq * 86400000));

            // Calculate days remaining
            const today = new Date();
            // Reset times for accurate day diff
            const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dueReset = new Date(dueDate.getTime() ? dueDate.getFullYear() : today.getFullYear(), dueDate.getTime() ? dueDate.getMonth() : today.getMonth(), dueDate.getTime() ? dueDate.getDate() : today.getDate());

            const diffTime = dueReset - todayReset;
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (isNaN(daysRemaining)) return ''; // Skip invalid rows

            let colorStyle = '';
            let rowStyle = '';

            if (isOpen) {
                if (daysRemaining <= 1) {
                    colorStyle = 'color: var(--color-accent); font-weight: 700;'; // Red Bold
                } else if (daysRemaining < 3) {
                    colorStyle = 'color: #ea580c; font-weight: 600;'; // Orange (Tailwind orange-600 approx)
                } else if (daysRemaining < 7) {
                    colorStyle = 'color: var(--color-warning);'; // Yellow
                }
            }

            return `
            <tr>
                <td>${Utils.formatDate(t.date)}</td>
                <td>
                    ${t.particulars}
                    <div style="font-size:0.75rem; color:var(--color-primary); cursor:pointer; text-decoration:underline;" onclick="App.openUpdateTodoCategoryModal('${t.id}')">
                        ${t.category || 'Uncategorized'} <i class="fa-solid fa-pen" style="font-size:0.6rem;"></i>
                    </div>
                </td>
                <td style="${colorStyle}">
                    ${daysRemaining} days left (${daysReq} days req)
                </td>
                <td>
                    <span style="font-size:0.9rem; cursor:pointer; text-decoration:underline;" onclick="App.openUpdateTodoStatusModal('${t.id}')">
                        ${t.status || 'Pending'} <i class="fa-solid fa-pen-to-square" style="font-size:0.75rem; margin-left:4px;"></i>
                    </span>
                </td>
                <td>
                    ${isOpen ? `
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" onchange="App.toggleTodoComplete('${t.id}', this.checked)" style="transform:scale(1.5); cursor:pointer;">
                        <span style="font-size:0.8rem; color:var(--color-text-muted);">Mark Done</span>
                    </div>
                    ` : '<span class="badge badge-success">Completed</span>'}
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <button onclick="App.openTodoShareMenu('${t.id}')" style="background:none; border:none; color:var(--color-primary); cursor:pointer;" title="Share/Remind">
                            <i class="fa-solid fa-share-nodes"></i>
                        </button>
                        <button onclick="App.deleteTodo('${t.id}')" style="background:none; border:none; color:var(--color-accent); cursor:pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        };

        const openRows = openTodos.map(t => renderRow(t, true)).join('');
        const completedRows = completedTodos.map(t => renderRow(t, false)).join('');

        // Category Options
        // Merge defaults with any custom categories found in ALL tasks (before filtering)
        const allStoredTodos = Store.get(CONFIG.KEYS.TODO) || [];
        const usedCategories = [...new Set(allStoredTodos.map(t => t.category))].filter(c => c);
        const uniqueCategories = [...new Set([...(CONFIG.DEFAULTS.TODO_CATEGORIES || ['Personal', 'Official']), ...usedCategories])];

        const categoryOptions = uniqueCategories.map(c => `<option value="${c}" ${c === activeCategory ? 'selected' : ''}>${c}</option>`).join('');


        return `
            <div class="header">
                <h1 class="page-title">To Do List</h1>
                <button class="btn btn-primary" onclick="App.openAddTodoModal()">
                    <i class="fa-solid fa-plus"></i> Add New Task
                </button>
            </div>
            
            <div style="margin-bottom: var(--spacing-md); display:flex; align-items:center; gap:1rem;">
                <label class="form-label" style="margin-bottom:0;">Filter by Category:</label>
                <select class="form-control" style="width:auto; min-width:200px;" onchange="App.filterTodo(this.value)">
                    <option value="All">All Categories</option>
                    ${categoryOptions}
                </select>
            </div>

            <div class="card" style="margin-bottom: var(--spacing-lg);">
                <div class="card-header">
                    <span class="card-title">Open Tasks</span>
                    <i class="fa-solid fa-list text-warning"></i>
                </div>
                <div class="table-container" style="margin-top:0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Particulars</th>
                                <th>Days Left</th>
                                <th>Status</th>
                                <th>Complete</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${openRows.length ? openRows : '<tr><td colspan="6" style="text-align:center">No open tasks</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Completed Tasks</span>
                     <i class="fa-solid fa-check-double text-success"></i>
                </div>
                 <div class="table-container" style="margin-top:0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Particulars</th>
                                <th>Time Taken</th>
                                <th>Status</th>
                                <th>State</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                             ${completedRows.length ? completedRows : '<tr><td colspan="6" style="text-align:center">No completed tasks</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderDiaryView: () => {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="header">
                <h1 class="page-title">Daily Diary</h1>
            </div>

            <div class="card-grid" style="grid-template-columns: 250px 1fr; align-items: start;">
                 <!-- Sidebar: Date Picker & Past Entries List (Simple for now) -->
                <div class="card" style="height: calc(100vh - 150px); overflow-y: auto;">
                    <div class="form-group">
                        <label class="form-label">Select Date</label>
                        <input type="date" id="diary-date" class="form-control" value="${today}" onchange="App.loadDiaryEntry(this.value)">
                    </div>
                    
                    <div style="margin-top:2rem;">
                         <label class="form-label" style="margin-bottom:0.5rem;">Recent Entries</label>
                         <div id="diary-list">
                            <!-- Populated by App.js -->
                         </div>
                    </div>
                </div>

                <!-- Main: Editor -->
                <div class="card" style="height: calc(100vh - 150px); display:flex; flex-direction:column;">
                     <div class="card-header">
                        <span class="card-title" id="diary-title">Entry for ${Utils.formatDate(today)}</span>
                        <div style="font-size:0.8rem; color:var(--color-text-muted);" id="diary-last-saved"></div>
                    </div>
                    <textarea id="diary-content" style="flex:1; background:var(--color-bg); border:1px solid var(--color-border); color:var(--color-text); padding:1rem; resize:none; border-radius:var(--radius-sm); font-family: inherit; line-height:1.6;" placeholder="Write about your day..."></textarea>
                    <div style="margin-top:1rem; text-align:right;">
                        <button class="btn btn-primary" onclick="App.saveDiaryEntry()">
                            <i class="fa-solid fa-save"></i> Save Entry
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderNotepadView: () => {
        return `
            <div class="header">
                <h1 class="page-title">Notepad</h1>
            </div>

            <div class="card-grid" style="grid-template-columns: 250px 1fr; align-items: start;">
                 <!-- Sidebar: Notes List -->
                <div class="card" style="height: calc(100vh - 150px); display:flex; flex-direction:column;">
                    <button class="btn btn-primary" style="width:100%; margin-bottom:1rem;" onclick="App.createNewNote()">
                        <i class="fa-solid fa-plus"></i> New Note
                    </button>
                    <div id="note-list" style="flex:1; overflow-y:auto; border-top:1px solid var(--color-border);">
                         <!-- Populated by App.js -->
                    </div>
                </div>

                <!-- Main: Editor -->
                <div class="card" style="height: calc(100vh - 150px); display:flex; flex-direction:column;">
                     <div style="margin-bottom:1rem;">
                        <input type="text" id="note-title" class="form-control" placeholder="Note Title" style="font-weight:bold; font-size:1.2rem;">
                    </div>
                    <textarea id="note-content" style="flex:1; background:var(--color-bg); border:1px solid var(--color-border); color:var(--color-text); padding:1rem; resize:none; border-radius:var(--radius-sm); font-family: inherit; line-height:1.6;" placeholder="Start typing..."></textarea>
                    
                    <div style="margin-top:1rem; display:flex; justify-content:space-between;">
                        <button class="btn btn-secondary" style="color:var(--color-accent);" onclick="App.deleteCurrentNote()">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-primary" onclick="App.saveCurrentNote()">
                            <i class="fa-solid fa-save"></i> Save Note
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Modal Generators
    renderAddSourceModal: () => {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add New Source</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Source Name</label>
                    <input type="text" id="new-source-name" class="form-control" placeholder="e.g. Freelance">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveNewSource()">Add Source</button>
            </div>
        `;
    },

    renderAddAmountModal: (id) => {
        const source = (Store.get(CONFIG.KEYS.SOURCES) || []).find(s => s.id === id);
        const sourceName = source ? source.name : 'Unknown Source';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add Income to ${sourceName}</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="add-amount-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="add-amount-value" class="form-control" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label class="form-label">Note</label>
                    <input type="text" id="add-amount-note" class="form-control" placeholder="Optional note">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveSourceAmount('${id}')">Save Income</button>
            </div>
        `;
    },

    renderAddExpenseModal: () => {
        const typeList = Store.getCombinedTypes('expense', CONFIG.DEFAULTS.EXPENSE_TYPES);
        const types = typeList.map(t => `<option value="${t}">${t}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add New Expense</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="exp-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="exp-part" class="form-control" placeholder="What was purchased?">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <div style="display:flex; gap:0.5rem;">
                        <select id="exp-type" class="form-control">
                            ${types}
                        </select>
                        <button class="btn btn-secondary" onclick="App.addNewExpenseType()" title="Add new type">+</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount (in Rs.)</label>
                    <input type="number" id="exp-amount" class="form-control" placeholder="0.00">
                </div>
                 <div class="form-group">
                    <label class="form-label">Remark</label>
                    <input type="text" id="exp-remark" class="form-control" placeholder="Optional">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveExpense()">Save Expense</button>
            </div>
    `;
    },

    renderAddPaymentModal: () => {
        const typeList = Store.getCombinedTypes('payment', CONFIG.DEFAULTS.PAYMENT_TYPES);
        const types = typeList.map(t => `<option value="${t}">${t}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add Upcoming Payment</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Payment</label>
                    <input type="date" id="pay-date" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="pay-part" class="form-control" placeholder="Bill Name">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                     <div style="display:flex; gap:0.5rem;">
                        <select id="pay-type" class="form-control">
                            ${types}
                        </select>
                        <button class="btn btn-secondary" onclick="App.addNewPaymentType()" title="Add new type">+</button>
                    </div>
                </div>
                 <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="pay-amount" class="form-control" placeholder="0.00">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.savePayment()">Add Payment</button>
            </div >
    `;
    },

    renderEditPaymentModal: (id) => {
        const payment = (Store.get(CONFIG.KEYS.PAYMENTS) || []).find(p => p.id === id);
        if (!payment) return '';

        const typeList = Store.getCombinedTypes('payment', CONFIG.DEFAULTS.PAYMENT_TYPES);
        const types = typeList.map(t => `<option value="${t}" ${t === payment.type ? 'selected' : ''}>${t}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Upcoming Payment</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Payment</label>
                    <input type="date" id="edit-pay-date" class="form-control" value="${payment.date}">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="edit-pay-part" class="form-control" value="${payment.particulars}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                     <select id="edit-pay-type" class="form-control">
                        ${types}
                    </select>
                </div>
                 <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="edit-pay-amount" class="form-control" value="${payment.amount || 0}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.updatePayment('${id}')">Update Payment</button>
            </div >
    `;
    },

    renderAddRenewalModal: () => {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add Renewal Reminder</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Renewal Date</label>
                    <input type="date" id="ren-date" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="ren-part" class="form-control" placeholder="Item Name">
                </div>
                 <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="ren-amount" class="form-control" placeholder="0.00">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveRenewal()">Add Reminder</button>
            </div >
    `;
    },

    renderEditRenewalModal: (id) => {
        const renewal = (Store.get(CONFIG.KEYS.RENEWALS) || []).find(r => r.id === id);
        if (!renewal) return '';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Renewal Reminder</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Renewal Date</label>
                    <input type="date" id="edit-ren-date" class="form-control" value="${renewal.date}">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="edit-ren-part" class="form-control" value="${renewal.particulars}">
                </div>
                 <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="edit-ren-amount" class="form-control" value="${renewal.amount || 0}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.updateRenewal('${id}')">Update Reminder</button>
            </div >
    `;
    },

    renderAddTodoModal: () => {
        const catList = Store.getCombinedTypes('todo', CONFIG.DEFAULTS.TODO_CATEGORIES || ['Personal', 'Official']);
        const categories = catList.map(c => `<option value="${c}">${c}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add New Task</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="todo-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="todo-part" class="form-control" placeholder="Task description">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                     <div style="display:flex; gap:0.5rem;">
                        <select id="todo-category" class="form-control">
                            ${categories}
                        </select>
                        <button class="btn btn-secondary" onclick="App.addNewTodoCategory()" title="Add new category">+</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Days Required</label>
                    <input type="number" id="todo-days" class="form-control" placeholder="e.g. 3">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <input type="text" id="todo-status" class="form-control" value="Pending">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveTodo()">Save Task</button>
            </div >
    `;
    },

    renderUpdateTodoCategoryModal: (id) => {
        const todo = (Store.get(CONFIG.KEYS.TODO) || []).find(t => t.id === id);
        if (!todo) return '';

        const catList = Store.getCombinedTypes('todo', CONFIG.DEFAULTS.TODO_CATEGORIES || ['Personal', 'Official']);
        const categories = catList.map(c => `<option value="${c}" ${c === todo.category ? 'selected' : ''}>${c}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Update Category</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                     <label class="form-label">Category</label>
                     <div style="display:flex; gap:0.5rem;">
                        <select id="todo-update-category" class="form-control">
                            ${categories}
                        </select>
                        <button class="btn btn-secondary" onclick="App.addNewTodoCategory('update:${id}')" title="Add new category">+</button>
                    </div>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveTodoCategory('${id}')">Update Category</button>
            </div>
        `;
    },

    renderUpdateTodoStatusModal: (id) => {
        const todo = (Store.get(CONFIG.KEYS.TODO) || []).find(t => t.id === id);
        if (!todo) return '';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Update Status</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Current Status</label>
                    <input type="text" id="todo-update-status" class="form-control" value="${todo.status || 'Pending'}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.saveTodoStatus('${id}')">Update Status</button>
            </div >
    `;
    },

    renderEditExpenseModal: (id) => {
        const exp = (Store.get(CONFIG.KEYS.EXPENSES) || []).find(e => e.id === id);
        if (!exp) return '';

        const typeList = Store.getCombinedTypes('expense', CONFIG.DEFAULTS.EXPENSE_TYPES);
        const types = typeList.map(t => `<option value="${t}" ${t === exp.type ? 'selected' : ''}>${t}</option>`).join('');

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Expense</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="edit-exp-date" class="form-control" value="${exp.date}">
                </div>
                <div class="form-group">
                    <label class="form-label">Particulars</label>
                    <input type="text" id="edit-exp-part" class="form-control" value="${exp.particulars}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select id="edit-exp-type" class="form-control">
                        ${types}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount (in Rs.)</label>
                    <input type="number" id="edit-exp-amount" class="form-control" value="${exp.amount}">
                </div>
                 <div class="form-group">
                    <label class="form-label">Remark</label>
                    <input type="text" id="edit-exp-remark" class="form-control" value="${exp.remark || ''}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.updateExpense('${id}')">Update Expense</button>
            </div >
    `;
    },

    renderEditIncomeEntryModal: (sourceId, entryId) => {
        const source = (Store.get(CONFIG.KEYS.SOURCES) || []).find(s => s.id === sourceId);
        if (!source || !source.history) return '';
        const entry = source.history.find(h => h.id === entryId);
        if (!entry) return '';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Income Entry (${source.name})</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="edit-inc-amount" class="form-control" value="${entry.amount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="edit-inc-date" class="form-control" value="${entry.date}">
                </div>
                 <div class="form-group">
                    <label class="form-label">Note</label>
                    <input type="text" id="edit-inc-note" class="form-control" value="${entry.note || ''}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.updateIncomeEntry('${sourceId}', '${entryId}')">Update Entry</button>
            </div >
    `;
    },

    renderSettingsView: () => {
        return `
            <div class="header">
        <h1 class="page-title">Settings</h1>
            </div >

    <div class="card-grid">
        <div class="card">
            <div class="card-header">
                <span class="card-title">Data Backup & Restore</span>
                <i class="fa-solid fa-database brand-icon"></i>
            </div>
            <p style="color:var(--color-text-muted); margin-bottom:1rem;">
                Download a backup of all your data or restore from a previously saved file.
            </p>
            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="App.downloadData('json')">
                        <i class="fa-solid fa-download"></i> Download (.JSON)
                    </button>
                    <button class="btn btn-primary" onclick="App.downloadData('txt')">
                        <i class="fa-solid fa-file-lines"></i> Download (.TXT)
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                        <i class="fa-solid fa-upload"></i> Upload Data
                    </button>
                </div>
                <input type="file" id="import-file" style="display:none" onchange="App.importData(this)" accept=".json,.txt">
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <span class="card-title">Application Info</span>
                <i class="fa-solid fa-info-circle brand-icon"></i>
            </div>
            <div style="margin-bottom:1rem;">
                <p><strong>Personal Account Manager</strong> v1.0</p>
                <p style="color:var(--color-text-muted);">Developed by RealSense Trading Solutions</p>
            </div>
            <button class="btn btn-secondary" onclick="alert('System Ready')">Check Updates</button>
        </div>
    </div>
`;
    },
    renderEditSourceModal: (sourceId) => {
        const source = (Store.get(CONFIG.KEYS.SOURCES) || []).find(s => s.id === sourceId);
        if (!source) return '';

        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Income Source</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">Source Name</label>
                    <input type="text" id="edit-source-name" class="form-control" value="${source.name}">
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="App.updateSource('${sourceId}')">Update Source</button>
            </div>
        `;
    },
    renderTodoShareModal: (todo) => {
        return `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Share Task</h3>
                    <button class="close-modal" onclick="App.closeModal()">&times;</button>
                </div>
                <div style="padding: 1.5rem; text-align: center;">
                    <p style="margin-bottom: 1.5rem; color: var(--color-text-muted);">How would you like to share this task?</p>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                        <button class="btn btn-secondary" onclick="App.shareTodo('${todo.id}', 'whatsapp')" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; border-color: #25D366; color: #25D366;">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </button>
                        <button class="btn btn-secondary" onclick="App.shareTodo('${todo.id}', 'sms')" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; border-color: #3b82f6; color: #3b82f6;">
                            <i class="fa-solid fa-comment-sms"></i> SMS
                        </button>
                        <button class="btn btn-secondary" onclick="App.shareTodo('${todo.id}', 'email')" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; border-color: #ef4444; color: #ef4444;">
                            <i class="fa-solid fa-envelope"></i> Email
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};
