const App = {
    init: () => {
        Store.init();
        App.setupNavigation();
        App.navigateTo('dashboard');
    },

    setupNavigation: () => {
        const navItems = document.querySelectorAll('.nav-item');
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

        const handleNavClick = (item, items) => {
            const view = item.dataset.view;
            App.navigateTo(view);
        };

        navItems.forEach(item => {
            item.addEventListener('click', () => handleNavClick(item, navItems));
        });

        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => handleNavClick(item, bottomNavItems));
        });

        // Mobile Menu Toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        // Add overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        menuToggle?.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    },

    navigateTo: (view) => {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = ''; // Clear current content
        mainContent.className = 'main-content fade-in'; // Reset animation

        // Sync Active UI States
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Close sidebar on mobile after navigation
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');

        switch (view) {
            case 'dashboard':
                mainContent.innerHTML = Renderers.renderDashboard();
                break;
            case 'income':
                mainContent.innerHTML = Renderers.renderIncomeView();
                break;
            case 'expenses':
                mainContent.innerHTML = Renderers.renderExpensesView();
                break;
            case 'payments':
                mainContent.innerHTML = Renderers.renderPaymentsView();
                break;
            case 'renewals':
                mainContent.innerHTML = Renderers.renderRenewalsView();
                break;
            case 'todo':
                mainContent.innerHTML = Renderers.renderTodoView();
                break;
            case 'reports':
                mainContent.innerHTML = Renderers.renderReportsView();
                break;
            case 'diary':
                mainContent.innerHTML = Renderers.renderDiaryView();
                App.loadDiaryEntry(new Date().toISOString().split('T')[0]); // Load today by default
                break;
            case 'notepad':
                mainContent.innerHTML = Renderers.renderNotepadView();
                App.loadNotesList();
                break;
            case 'settings':
                mainContent.innerHTML = Renderers.renderSettingsView();
                break;
            default:
                mainContent.innerHTML = Renderers.renderDashboard();
        }
    },

    // Modal Handling
    openModal: (content) => {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay active" onclick="if(event.target === this) App.closeModal()">
                ${content}
            </div>
        `;
    },


    closeModal: () => {
        const container = document.getElementById('modal-container');
        container.innerHTML = '';
    },

    // ... (existing code) ...

    // To Do Actions
    openAddTodoModal: () => {
        App.openModal(Renderers.renderAddTodoModal());
    },

    saveTodo: () => {
        const date = document.getElementById('todo-date').value;
        const particulars = document.getElementById('todo-part').value;
        const category = document.getElementById('todo-category').value;
        const daysRequired = parseInt(document.getElementById('todo-days').value);
        const status = document.getElementById('todo-status').value;

        if (!date || !particulars || isNaN(daysRequired)) return alert('Please fill in required fields');

        Store.add(CONFIG.KEYS.TODO, {
            id: Utils.generateId(),
            date,
            particulars,
            category,
            daysRequired,
            status,
            isCompleted: false
        });

        App.closeModal();
        App.navigateTo('todo');
    },

    addNewTodoCategory: (returnContext = 'add') => {
        const newCat = prompt("Enter new category name:");
        if (newCat) {
            Store.addCustomType('todo', newCat);
            App.closeModal();

            if (returnContext.startsWith('update:')) {
                const id = returnContext.split(':')[1];
                App.openModal(Renderers.renderUpdateTodoCategoryModal(id));
            } else {
                App.openAddTodoModal(); // Default to Add Modal
            }
        }
    },

    filterTodo: (category) => {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = Renderers.renderTodoView(category);
    },

    openUpdateTodoStatusModal: (id) => {
        App.openModal(Renderers.renderUpdateTodoStatusModal(id));
    },

    saveTodoStatus: (id) => {
        const status = document.getElementById('todo-update-status').value;
        if (!status) return alert('Please enter a status');

        Store.update(CONFIG.KEYS.TODO, id, { status });
        App.closeModal();
        App.navigateTo('todo');
    },

    openUpdateTodoCategoryModal: (id) => {
        App.openModal(Renderers.renderUpdateTodoCategoryModal(id));
    },

    saveTodoCategory: (id) => {
        const category = document.getElementById('todo-update-category').value;
        if (!category) return alert('Please select a category');

        Store.update(CONFIG.KEYS.TODO, id, { category });
        App.closeModal();
        App.navigateTo('todo');
    },

    toggleTodoComplete: (id, isCompleted) => {
        Store.update(CONFIG.KEYS.TODO, id, { isCompleted });
        App.navigateTo('todo');
    },

    deleteTodo: (id) => {
        if (confirm('Are you sure you want to delete this task?')) {
            Store.delete(CONFIG.KEYS.TODO, id);
            App.navigateTo('todo');
        }
    },

    openTodoShareMenu: (id) => {
        const todos = Store.get(CONFIG.KEYS.TODO) || [];
        const todo = todos.find(t => t.id === id);
        if (todo) {
            App.openModal(Renderers.renderTodoShareModal(todo));
        }
    },

    shareTodo: (id, platform) => {
        const todos = Store.get(CONFIG.KEYS.TODO) || [];
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const date = Utils.formatDate(todo.date);
        const particulars = todo.particulars;
        const status = todo.status || 'Pending';
        const message = `Reminder: ${particulars}\nDate: ${date}\nStatus: ${status}\nShared from PAM.`;
        const encodedMsg = encodeURIComponent(message);

        let url = '';
        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodedMsg}`;
                break;
            case 'sms':
                url = `sms:?body=${encodedMsg}`;
                break;
            case 'email':
                const subject = encodeURIComponent(`Task Reminder: ${particulars}`);
                url = `mailto:?subject=${subject}&body=${encodedMsg}`;
                break;
        }

        if (url) {
            window.open(url, '_blank');
        }
    },

    // Source Actions
    openAddSourceModal: () => {
        App.openModal(Renderers.renderAddSourceModal());
    },

    openEditSourceModal: (id) => {
        App.openModal(Renderers.renderEditSourceModal(id));
    },

    updateSource: (id) => {
        const nameInput = document.getElementById('edit-source-name');
        const name = nameInput.value.trim();
        if (!name) return alert('Please enter a source name');

        Store.update(CONFIG.KEYS.SOURCES, id, { name });

        App.closeModal();
        App.navigateTo('income');
    },

    saveNewSource: () => {
        const nameInput = document.getElementById('new-source-name');
        const name = nameInput.value.trim();
        if (!name) return alert('Please enter a source name');

        Store.add(CONFIG.KEYS.SOURCES, {
            id: Utils.generateId(),
            name: name,
            totalAmount: 0,
            history: []
        });

        App.closeModal();
        App.navigateTo('income');
    },

    openAddAmountModal: (id) => {
        App.openModal(Renderers.renderAddAmountModal(id));
    },

    saveSourceAmount: (id) => {
        const amount = parseFloat(document.getElementById('add-amount-value').value);
        const date = document.getElementById('add-amount-date').value;
        const note = document.getElementById('add-amount-note').value;

        if (!amount || !date) return alert('Please enter amount and date');

        const sources = Store.get(CONFIG.KEYS.SOURCES);
        const sourceIndex = sources.findIndex(s => s.id === id);

        if (sourceIndex !== -1) {
            const source = sources[sourceIndex];
            source.totalAmount = (parseFloat(source.totalAmount) || 0) + amount;
            if (!source.history) source.history = [];
            source.history.push({
                id: Utils.generateId(), // Add ID for future editing
                date,
                amount,
                note
            });
            Store.set(CONFIG.KEYS.SOURCES, sources);
        }

        App.closeModal();
        App.navigateTo('income');
    },

    viewSourceHistory: (id) => {
        App.openModal(Renderers.renderSourceHistoryModal(id));
    },

    openEditIncomeEntryModal: (sourceId, entryId) => {
        try {
            const content = Renderers.renderEditIncomeEntryModal(sourceId, entryId);
            if (!content) {
                console.warn('Could not find entry to edit');
                return alert('Selected entry could not be found.');
            }
            App.openModal(content);
        } catch (e) {
            console.error('Error opening edit modal:', e);
            alert('An error occurred while opening the edit window.');
        }
    },

    updateIncomeEntry: (sourceId, entryId) => {
        try {
            const amountInput = document.getElementById('edit-inc-amount');
            const dateInput = document.getElementById('edit-inc-date');
            const noteInput = document.getElementById('edit-inc-note');

            if (!amountInput || !dateInput) return;

            const amount = parseFloat(amountInput.value);
            const date = dateInput.value;
            const note = noteInput.value;

            if (isNaN(amount) || !date) return alert('Please enter a valid amount and date');

            const sources = Store.get(CONFIG.KEYS.SOURCES) || [];
            const sourceIndex = sources.findIndex(s => s.id === sourceId);

            if (sourceIndex !== -1) {
                const source = sources[sourceIndex];
                if (!source.history) source.history = [];
                const entryIndex = source.history.findIndex(h => h.id === entryId);

                if (entryIndex !== -1) {
                    const oldAmount = parseFloat(source.history[entryIndex].amount) || 0;
                    source.totalAmount = (parseFloat(source.totalAmount) || 0) - oldAmount + amount;

                    source.history[entryIndex] = {
                        ...source.history[entryIndex],
                        date,
                        amount: amount,
                        note
                    };

                    Store.set(CONFIG.KEYS.SOURCES, sources);
                    App.closeModal();
                    App.navigateTo('income');
                } else {
                    alert('Entry not found. Please refresh and try again.');
                }
            }
        } catch (e) {
            console.error('Error updating income entry:', e);
            alert('Failed to update entry: ' + e.message);
        }
    },

    deleteIncomeEntry: (sourceId, entryId) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        const sources = Store.get(CONFIG.KEYS.SOURCES);
        const sourceIndex = sources.findIndex(s => s.id === sourceId);

        if (sourceIndex !== -1) {
            const source = sources[sourceIndex];
            const entryIndex = source.history.findIndex(h => h.id === entryId);

            if (entryIndex !== -1) {
                // Adjust total
                const oldAmount = parseFloat(source.history[entryIndex].amount);
                source.totalAmount = (parseFloat(source.totalAmount) || 0) - oldAmount;

                source.history.splice(entryIndex, 1);
                Store.set(CONFIG.KEYS.SOURCES, sources);
            }
        }
        App.closeModal(); // Close history modal
        App.navigateTo('income');
    },

    // Expense Actions
    openAddExpenseModal: () => {
        App.openModal(Renderers.renderAddExpenseModal());
    },

    openEditExpenseModal: (id) => {
        App.openModal(Renderers.renderEditExpenseModal(id));
    },

    updateExpense: (id) => {
        const date = document.getElementById('edit-exp-date').value;
        const particulars = document.getElementById('edit-exp-part').value;
        const type = document.getElementById('edit-exp-type').value;
        const amount = parseFloat(document.getElementById('edit-exp-amount').value);
        const remark = document.getElementById('edit-exp-remark').value;

        if (!date || !particulars || !amount) return alert('Please fill in required fields');

        Store.update(CONFIG.KEYS.EXPENSES, id, {
            date, particulars, type, amount, remark
        });

        App.closeModal();
        App.navigateTo('expenses');
    },

    addNewExpenseType: () => {
        const newType = prompt("Enter new expense type name:");
        if (newType) {
            Store.addCustomType('expense', newType);
            App.closeModal();
            App.openAddExpenseModal();
        }
    },

    saveExpense: () => {
        const date = document.getElementById('exp-date').value;
        const particulars = document.getElementById('exp-part').value;
        const type = document.getElementById('exp-type').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const remark = document.getElementById('exp-remark').value;

        if (!date || !particulars || !amount) return alert('Please fill in required fields');

        Store.add(CONFIG.KEYS.EXPENSES, {
            id: Utils.generateId(),
            date,
            particulars,
            type,
            amount,
            remark
        });

        App.closeModal();
        App.navigateTo('expenses');
    },

    deleteExpense: (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            Store.delete(CONFIG.KEYS.EXPENSES, id);
            App.navigateTo('expenses'); // Refresh
        }
    },

    // Payment Actions
    openAddPaymentModal: () => {
        App.openModal(Renderers.renderAddPaymentModal());
    },

    openEditPaymentModal: (id) => {
        App.openModal(Renderers.renderEditPaymentModal(id));
    },

    updatePayment: (id) => {
        const date = document.getElementById('edit-pay-date').value;
        const particulars = document.getElementById('edit-pay-part').value;
        const type = document.getElementById('edit-pay-type').value;
        const amount = parseFloat(document.getElementById('edit-pay-amount').value || 0);

        if (!date || !particulars) return alert('Please fill in required fields');

        Store.update(CONFIG.KEYS.PAYMENTS, id, {
            date, particulars, type, amount
        });

        App.closeModal();
        App.navigateTo('payments');
    },

    deletePayment: (id) => {
        if (confirm('Are you sure you want to delete this payment?')) {
            Store.delete(CONFIG.KEYS.PAYMENTS, id);
            App.navigateTo('payments');
        }
    },

    addNewPaymentType: () => {
        const newType = prompt("Enter new payment type name:");
        if (newType) {
            Store.addCustomType('payment', newType);
            App.closeModal();
            App.openAddPaymentModal();
        }
    },

    savePayment: () => {
        const date = document.getElementById('pay-date').value;
        const particulars = document.getElementById('pay-part').value;
        const type = document.getElementById('pay-type').value;
        const amount = parseFloat(document.getElementById('pay-amount').value || 0);

        if (!date || !particulars) return alert('Please fill in required fields');

        Store.add(CONFIG.KEYS.PAYMENTS, {
            id: Utils.generateId(),
            date,
            particulars,
            type,
            amount,
            isDone: false
        });

        App.closeModal();
        App.navigateTo('payments');
    },

    togglePaymentStatus: (id, isDone) => {
        Store.update(CONFIG.KEYS.PAYMENTS, id, { isDone });
        App.navigateTo('payments'); // Refresh to update styles
    },

    // Renewal Actions
    openAddRenewalModal: () => {
        App.openModal(Renderers.renderAddRenewalModal());
    },

    openEditRenewalModal: (id) => {
        App.openModal(Renderers.renderEditRenewalModal(id));
    },

    updateRenewal: (id) => {
        const date = document.getElementById('edit-ren-date').value;
        const particulars = document.getElementById('edit-ren-part').value;
        const amount = parseFloat(document.getElementById('edit-ren-amount').value);

        if (!date || !particulars) return alert('Please fill in required fields');

        Store.update(CONFIG.KEYS.RENEWALS, id, {
            date, particulars, amount: amount || 0
        });

        App.closeModal();
        App.navigateTo('renewals');
    },

    deleteRenewal: (id) => {
        if (confirm('Are you sure you want to delete this reminder?')) {
            Store.delete(CONFIG.KEYS.RENEWALS, id);
            App.navigateTo('renewals');
        }
    },

    saveRenewal: () => {
        const date = document.getElementById('ren-date').value;
        const particulars = document.getElementById('ren-part').value;
        const amount = parseFloat(document.getElementById('ren-amount').value);

        if (!date || !particulars) return alert('Please fill in required fields');

        Store.add(CONFIG.KEYS.RENEWALS, {
            id: Utils.generateId(),
            date,
            particulars,
            amount: amount || 0,
            isDone: false
        });

        App.closeModal();
        App.navigateTo('renewals');
    },

    toggleRenewalStatus: (id, isDone) => {
        Store.update(CONFIG.KEYS.RENEWALS, id, { isDone });
        App.navigateTo('renewals');
    },

    // Diary Logic
    loadDiaryEntry: (date) => {
        const diary = Store.get(CONFIG.KEYS.DIARY) || {};
        const entry = diary[date] || '';

        const titleEl = document.getElementById('diary-title');
        const contentEl = document.getElementById('diary-content');
        const dateInput = document.getElementById('diary-date');
        const lastSavedEl = document.getElementById('diary-last-saved');

        if (titleEl) titleEl.textContent = `Entry for ${Utils.formatDate(date)}`;
        if (contentEl) contentEl.value = entry;
        if (dateInput) dateInput.value = date;
        if (lastSavedEl) lastSavedEl.textContent = ''; // Reset status

        App.renderDiaryList();
    },

    saveDiaryEntry: () => {
        const date = document.getElementById('diary-date').value;
        const content = document.getElementById('diary-content').value;
        const lastSavedEl = document.getElementById('diary-last-saved');

        if (!date) return alert('Please select a date');

        const diary = Store.get(CONFIG.KEYS.DIARY) || {};
        diary[date] = content;

        Store.set(CONFIG.KEYS.DIARY, diary);

        if (lastSavedEl) {
            lastSavedEl.textContent = 'Saved at ' + new Date().toLocaleTimeString();
            lastSavedEl.style.color = 'var(--color-success)';
        }
        App.renderDiaryList();
    },

    renderDiaryList: () => {
        const listEl = document.getElementById('diary-list');
        if (!listEl) return;

        const diary = Store.get(CONFIG.KEYS.DIARY) || {};
        const dates = Object.keys(diary).sort((a, b) => new Date(b) - new Date(a)); // new to old

        const html = dates.slice(0, 10).map(d => { // Show last 10
            return `
                <div onclick="App.loadDiaryEntry('${d}')" style="padding:0.5rem; border-bottom:1px solid var(--color-border); cursor:pointer; color:var(--color-primary);">
                    ${Utils.formatDate(d)}
                </div>
            `;
        }).join('');

        listEl.innerHTML = html || '<div style="color:var(--color-text-muted); font-size:0.9rem;">No previous entries</div>';
    },

    // Notepad Logic
    loadNotesList: () => {
        const listEl = document.getElementById('note-list');
        if (!listEl) return;

        const notes = Store.get(CONFIG.KEYS.NOTEPAD) || [];

        const html = notes.map((n, index) => {
            return `
                <div onclick="App.loadNote(${index})" style="padding:1rem; border-bottom:1px solid var(--color-border); cursor:pointer; hover:bg-black;">
                    <div style="font-weight:bold;">${n.title || 'Untitled'}</div>
                    <div style="font-size:0.8rem; color:var(--color-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n.content ? n.content.substring(0, 30) : 'No content'}...</div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = html || '<div style="padding:1rem; color:var(--color-text-muted); text-align:center;">No notes created</div>';
    },

    createNewNote: () => {
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-title').dataset.index = '-1'; // -1 means new
    },

    loadNote: (index) => {
        const notes = Store.get(CONFIG.KEYS.NOTEPAD) || [];
        const note = notes[index];
        if (!note) return;

        const titleEl = document.getElementById('note-title');
        const contentEl = document.getElementById('note-content');

        titleEl.value = note.title;
        contentEl.value = note.content;
        titleEl.dataset.index = index;
    },

    saveCurrentNote: () => {
        const titleEl = document.getElementById('note-title');
        const contentEl = document.getElementById('note-content');

        const title = titleEl.value.trim();
        const content = contentEl.value;
        const index = parseInt(titleEl.dataset.index || '-1');

        if (!title) return alert('Please enter a title');

        let notes = Store.get(CONFIG.KEYS.NOTEPAD) || [];

        if (index === -1) {
            // Create New
            notes.unshift({ title, content }); // Add to top
        } else {
            // Update
            notes[index] = { title, content };
        }

        Store.set(CONFIG.KEYS.NOTEPAD, notes);
        App.loadNotesList();

        // If it was new, now it has an index (0 since we unshifted)
        if (index === -1) {
            titleEl.dataset.index = 0;
        }

        alert('Note saved');
    },

    deleteCurrentNote: () => {
        const titleEl = document.getElementById('note-title');
        const index = parseInt(titleEl.dataset.index || '-1');

        if (index === -1) return;

        if (confirm('Delete this note?')) {
            let notes = Store.get(CONFIG.KEYS.NOTEPAD) || [];
            notes.splice(index, 1);
            Store.set(CONFIG.KEYS.NOTEPAD, notes);

            App.createNewNote(); // Reset editor
            App.loadNotesList();
        }
    },

    // Reporting
    generateReport: (rangeType) => {
        const resultsContainer = document.getElementById('report-results');

        // Get Selected Filter Type
        const filterTypeSelect = document.getElementById('report-filter-type');
        const filterType = filterTypeSelect ? filterTypeSelect.value : 'All';

        if (rangeType === 'custom') {
            const fromStr = document.getElementById('report-from-date').value;
            const toStr = document.getElementById('report-to-date').value;

            if (!fromStr || !toStr) {
                return alert('Please select both From and To dates');
            }

            const fromDate = new Date(fromStr);
            const toDate = new Date(toStr);

            if (fromDate > toDate) {
                return alert('From Date cannot be later than To Date');
            }

            resultsContainer.innerHTML = Renderers.renderReportResults({ from: fromDate, to: toDate }, filterType);
        } else {
            resultsContainer.innerHTML = Renderers.renderReportResults(rangeType, filterType);
        }
    },

    // Notifications (Browser Alert for now, could be improved)

    // Data Management
    downloadData: (format = 'json') => {
        const data = {
            [CONFIG.KEYS.SOURCES]: Store.get(CONFIG.KEYS.SOURCES),
            [CONFIG.KEYS.EXPENSES]: Store.get(CONFIG.KEYS.EXPENSES),
            [CONFIG.KEYS.PAYMENTS]: Store.get(CONFIG.KEYS.PAYMENTS),
            [CONFIG.KEYS.RENEWALS]: Store.get(CONFIG.KEYS.RENEWALS),
            timestamp: new Date().toISOString()
        };

        const content = JSON.stringify(data, null, 2);
        const type = format === 'txt' ? 'text/plain' : 'application/json';
        const ext = format === 'txt' ? 'txt' : 'json';

        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pam_backup_${new Date().toISOString().slice(0, 10)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    exportReportToCSV: () => {
        const fromDate = document.getElementById('report-from-date').value;
        const toDate = document.getElementById('report-to-date').value;
        const filterType = document.getElementById('report-filter-type').value;

        if (!fromDate || !toDate) return alert('Please select a date range first');

        const sources = Store.get(CONFIG.KEYS.SOURCES) || [];
        const expenses = Store.get(CONFIG.KEYS.EXPENSES) || [];

        const filteredIncome = [];
        sources.forEach(source => {
            (source.history || []).forEach(inc => {
                if (inc.date >= fromDate && inc.date <= toDate) {
                    filteredIncome.push({ ...inc, sourceName: source.name });
                }
            });
        });

        const filteredExpenses = expenses.filter(exp => {
            const dateMatch = exp.date >= fromDate && exp.date <= toDate;
            const typeMatch = filterType === 'All' || exp.type === filterType;
            return dateMatch && typeMatch;
        });

        // Generate CSV
        let csv = "INCOME REPORT (" + fromDate + " to " + toDate + ")\n";
        csv += "Date,Source,Amount,Note\n";
        filteredIncome.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(i => {
            csv += `"${i.date}","${i.sourceName}","${i.amount}","${i.note || '-'}"\n`;
        });

        csv += "\nEXPENSE REPORT (" + fromDate + " to " + toDate + ", Type: " + filterType + ")\n";
        csv += "Date,Type,Particulars,Amount,Payment Mode,Note\n";
        filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => {
            csv += `"${e.date}","${e.type}","${e.particulars}","${e.amount}","${e.paymentMode || '-'}","${e.note || '-'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pam_report_${fromDate}_to_${toDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    importData: (input) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate basic structure
                if (data[CONFIG.KEYS.SOURCES] && Array.isArray(data[CONFIG.KEYS.SOURCES])) {
                    if (confirm("This will overwrite your current data. Are you sure?")) {
                        Store.set(CONFIG.KEYS.SOURCES, data[CONFIG.KEYS.SOURCES]);
                        Store.set(CONFIG.KEYS.EXPENSES, data[CONFIG.KEYS.EXPENSES] || []);
                        Store.set(CONFIG.KEYS.PAYMENTS, data[CONFIG.KEYS.PAYMENTS] || []);
                        Store.set(CONFIG.KEYS.RENEWALS, data[CONFIG.KEYS.RENEWALS] || []);

                        alert("Data restored successfully!");
                        location.reload();
                    }
                } else {
                    alert("Invalid backup file format.");
                }
            } catch (err) {
                console.error(err);
                alert("Error reading file: " + err.message);
            }
        };
        reader.readAsText(file);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', App.init);
