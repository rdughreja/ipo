// ==========================================================================
// IPO Vault PRO - Multi-Account IPO & Allotment Tracker
// ==========================================================================

class IPOTracker {
    constructor() {
        this.ipos = this.loadData();
        this.currentEditId = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
    }

    loadData() {
        try {
            const data = localStorage.getItem('ipoData');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading localStorage:', e);
            return [];
        }
    }

    saveData() {
        try {
            localStorage.setItem('ipoData', JSON.stringify(this.ipos));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            showToast('Failed to save to local storage', 'danger');
        }
    }

    addIPO(ipoData) {
        const id = 'ipo_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        this.ipos.unshift({ id, createdAt: new Date().toISOString(), ...ipoData });
        this.saveData();
        return id;
    }

    updateIPO(id, ipoData) {
        const index = this.ipos.findIndex(ipo => ipo.id === id);
        if (index !== -1) {
            this.ipos[index] = { ...this.ipos[index], ...ipoData, updatedAt: new Date().toISOString() };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteIPO(id) {
        this.ipos = this.ipos.filter(ipo => ipo.id !== id);
        this.saveData();
    }

    getIPO(id) {
        return this.ipos.find(ipo => ipo.id === id);
    }

    getAllIPOs() {
        return [...this.ipos];
    }

    toggleApplicationStatus(ipoId, appIndex) {
        const ipo = this.getIPO(ipoId);
        if (ipo && ipo.applications && ipo.applications[appIndex] !== undefined) {
            ipo.applications[appIndex].isSuccessful = !ipo.applications[appIndex].isSuccessful;
            this.saveData();
            return ipo.applications[appIndex].isSuccessful;
        }
        return null;
    }

    exportData() {
        const dataStr = JSON.stringify(this.ipos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipo-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                this.ipos = data;
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Import parse error:', error);
            return false;
        }
    }
}

// Initialize Tracker
const tracker = new IPOTracker();

// DOM Elements
const modal = document.getElementById('ipoModal');
const modalTitle = document.getElementById('modalTitle');
const addIpoBtn = document.getElementById('addIpoBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const ipoForm = document.getElementById('ipoForm');
const ipoList = document.getElementById('ipoList');
const addApplicationBtn = document.getElementById('addApplicationBtn');
const applicationsList = document.getElementById('applicationsList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterTabs = document.querySelectorAll('.filter-tab');

// Stat Elements
const statTotalIpos = document.getElementById('statTotalIpos');
const statTotalApps = document.getElementById('statTotalApps');
const statSuccessApps = document.getElementById('statSuccessApps');
const statSuccessRate = document.getElementById('statSuccessRate');

// Filter count elements
const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countAllotted = document.getElementById('countAllotted');
const countClosed = document.getElementById('countClosed');

// ==========================================================================
// Utility Helpers
// ==========================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✨' : type === 'danger' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3200);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const date = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDaysRemaining(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    let target;
    if (parts.length === 3) {
        target = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
    } else {
        target = new Date(dateString);
    }
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function hasDatePassed(dateString) {
    if (!dateString) return false;
    const days = getDaysRemaining(dateString);
    return days !== null && days < 0;
}

function getBankClass(upiString) {
    if (!upiString) return 'bank-generic';
    const upi = upiString.toLowerCase();
    if (upi.includes('sbi')) return 'bank-sbi';
    if (upi.includes('axis')) return 'bank-axis';
    if (upi.includes('hdfc')) return 'bank-hdfc';
    if (upi.includes('icici')) return 'bank-icici';
    if (upi.includes('kotak')) return 'bank-kotak';
    return 'bank-generic';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Confetti Cannon for Allotment Celebration
function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

    for (let i = 0; i < 90; i++) {
        pieces.push({
            x: canvas.width * 0.5 + (Math.random() - 0.5) * 300,
            y: canvas.height * 0.4 + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.8) * 18,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            gravity: 0.38,
            opacity: 1
        });
    }

    let animationFrame;
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.012;

            if (p.opacity > 0 && p.y < canvas.height) {
                alive = true;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (alive) {
            animationFrame = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrame);
        }
    }
    render();
}

// ==========================================================================
// Modal & Application Form Entries
// ==========================================================================

function updateEntryCardNumbers() {
    const cards = applicationsList.querySelectorAll('.application-entry-card');
    cards.forEach((card, idx) => {
        const title = card.querySelector('.entry-card-title');
        if (title) {
            title.textContent = `Account #${idx + 1}`;
        }
    });
}

function createApplicationEntry(accountName = '', upiId = '') {
    const div = document.createElement('div');
    div.className = 'application-entry-card';
    div.innerHTML = `
        <div class="entry-card-header">
            <span class="entry-card-title">Account</span>
            <button type="button" class="remove-app-btn" title="Remove account">&times;</button>
        </div>
        <div class="form-row">
            <div class="form-group" style="margin-bottom: 0;">
                <label>Account Holder Name <span class="req">*</span></label>
                <input type="text" class="app-account-input" value="${escapeHtml(accountName)}" required placeholder="e.g. Myself, Father">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Bank / UPI ID <span class="req">*</span></label>
                <input type="text" class="app-upi-input" value="${escapeHtml(upiId)}" required placeholder="e.g. SBI UPI, Axis Netbanking">
            </div>
        </div>
    `;

    div.querySelector('.remove-app-btn').addEventListener('click', () => {
        const totalCards = applicationsList.querySelectorAll('.application-entry-card').length;
        if (totalCards <= 1) {
            showToast('Each IPO requires at least one account application', 'info');
            return;
        }
        div.remove();
        updateEntryCardNumbers();
    });

    return div;
}

function showModal(editId = null) {
    tracker.currentEditId = editId;

    // Reset Form Fields
    document.getElementById('ipoName').value = '';
    document.getElementById('lastDate').value = '';
    document.getElementById('listingDate').value = '';
    applicationsList.innerHTML = '';

    if (editId) {
        modalTitle.textContent = 'Edit IPO Details';
        const ipo = tracker.getIPO(editId);
        if (ipo) {
            document.getElementById('ipoName').value = ipo.name || '';
            document.getElementById('lastDate').value = ipo.lastDate || '';
            document.getElementById('listingDate').value = ipo.listingDate || '';

            if (ipo.applications && ipo.applications.length > 0) {
                ipo.applications.forEach(app => {
                    applicationsList.appendChild(
                        createApplicationEntry(app.accountName, app.upiId)
                    );
                });
            } else {
                applicationsList.appendChild(createApplicationEntry());
            }
        }
    } else {
        modalTitle.textContent = 'Add New IPO';
        // Add one empty default account entry
        applicationsList.appendChild(createApplicationEntry('', ''));
    }

    updateEntryCardNumbers();
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.getElementById('ipoName').focus();
}
window.showModal = showModal;

function hideModal() {
    modal.classList.remove('active');
    modal.style.display = 'none';
    tracker.currentEditId = null;
}

// Preset chips click handler
document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const account = chip.dataset.account;
        const upi = chip.dataset.upi;

        // Check if there is an empty card first
        const entries = applicationsList.querySelectorAll('.application-entry-card');
        let filled = false;
        for (const entry of entries) {
            const accInput = entry.querySelector('.app-account-input');
            const upiInput = entry.querySelector('.app-upi-input');
            if (accInput && upiInput && !accInput.value.trim() && !upiInput.value.trim()) {
                accInput.value = account;
                upiInput.value = upi;
                filled = true;
                break;
            }
        }

        if (!filled) {
            const newCard = createApplicationEntry(account, upi);
            applicationsList.appendChild(newCard);
            updateEntryCardNumbers();
        }

        showToast(`Added ${account} preset`, 'info');
    });
});

// ==========================================================================
// Stats Calculation & Dashboard Rendering
// ==========================================================================

function updateStatsAndCounts() {
    const allIpos = tracker.getAllIPOs();
    let totalApps = 0;
    let successApps = 0;
    let activeCount = 0;
    let allottedCount = 0;
    let closedCount = 0;

    allIpos.forEach(ipo => {
        const isClosed = hasDatePassed(ipo.lastDate);
        if (!isClosed) {
            activeCount++;
        } else {
            closedCount++;
        }

        let ipoHasSuccess = false;
        if (ipo.applications && Array.isArray(ipo.applications)) {
            totalApps += ipo.applications.length;
            ipo.applications.forEach(app => {
                if (app.isSuccessful) {
                    successApps++;
                    ipoHasSuccess = true;
                }
            });
        }

        if (ipoHasSuccess) {
            allottedCount++;
        }
    });

    // Update stat cards
    if (statTotalIpos) statTotalIpos.textContent = allIpos.length;
    if (statTotalApps) statTotalApps.textContent = totalApps;
    if (statSuccessApps) statSuccessApps.textContent = successApps;

    const rate = totalApps > 0 ? Math.round((successApps / totalApps) * 100) : 0;
    if (statSuccessRate) statSuccessRate.textContent = `${rate}%`;

    // Update filter pill counts
    if (countAll) countAll.textContent = allIpos.length;
    if (countActive) countActive.textContent = activeCount;
    if (countAllotted) countAllotted.textContent = allottedCount;
    if (countClosed) countClosed.textContent = closedCount;
}

// ==========================================================================
// IPO Cards Rendering
// ==========================================================================

function renderIPOList() {
    updateStatsAndCounts();
    const allIpos = tracker.getAllIPOs();

    // Filter by Tab and Search
    const filteredIpos = allIpos.filter(ipo => {
        // Tab Filter
        const isClosed = hasDatePassed(ipo.lastDate);
        const hasAllotment = ipo.applications && ipo.applications.some(a => a.isSuccessful);

        if (tracker.currentFilter === 'active' && isClosed) return false;
        if (tracker.currentFilter === 'closed' && !isClosed) return false;
        if (tracker.currentFilter === 'allotted' && !hasAllotment) return false;

        // Search Query Filter
        if (tracker.searchQuery) {
            const query = tracker.searchQuery.toLowerCase();
            const nameMatch = ipo.name && ipo.name.toLowerCase().includes(query);
            const appMatch = ipo.applications && ipo.applications.some(a =>
                (a.accountName && a.accountName.toLowerCase().includes(query)) ||
                (a.upiId && a.upiId.toLowerCase().includes(query))
            );
            if (!nameMatch && !appMatch) return false;
        }

        return true;
    });

    if (filteredIpos.length === 0) {
        const isFiltering = tracker.searchQuery || tracker.currentFilter !== 'all';
        ipoList.innerHTML = `
            <div class="empty-state">
                <div class="empty-illustration">📊</div>
                <h3>${isFiltering ? 'No matching IPOs found' : 'No IPOs tracked yet'}</h3>
                <p>${isFiltering ? 'Try clearing your search query or switching filter tabs.' : 'Click "Add New IPO" above to begin tracking your applications across all Demat accounts.'}</p>
                ${!isFiltering ? `<button type="button" class="btn btn-primary" onclick="showModal()">+ Add Your First IPO</button>` : ''}
            </div>
        `;
        return;
    }

    ipoList.innerHTML = filteredIpos.map(ipo => {
        const daysLeft = getDaysRemaining(ipo.lastDate);
        const isClosed = daysLeft !== null && daysLeft < 0;
        const isListingPassed = hasDatePassed(ipo.listingDate);

        // Status pill
        let statusClass = 'status-pill-open';
        let statusText = `${daysLeft === 0 ? 'Closes Today' : daysLeft === 1 ? '1 Day Left' : daysLeft + ' Days Left'}`;
        let statusPulse = '<span class="pulse-dot"></span>';

        if (isListingPassed) {
            statusClass = 'status-pill-listed';
            statusText = 'Listed';
            statusPulse = '';
        } else if (isClosed) {
            statusClass = 'status-pill-closed';
            statusText = 'Closed';
            statusPulse = '';
        }

        // Days left badge
        let daysBadge = '';
        if (!isClosed && daysLeft !== null) {
            const urgentClass = daysLeft <= 1 ? 'days-left-urgent' : 'days-left-normal';
            daysBadge = `<span class="days-left-badge ${urgentClass}">${daysLeft === 0 ? 'Today' : `${daysLeft}d left`}</span>`;
        }

        // Applications HTML
        const applications = ipo.applications || [];
        const allottedCount = applications.filter(a => a.isSuccessful).length;

        const applicationsHTML = applications.map((app, index) => {
            const avatarLetter = (app.accountName && app.accountName.trim().length > 0)
                ? app.accountName.trim().charAt(0).toUpperCase()
                : 'A';
            const bankClass = getBankClass(app.upiId);

            return `
                <div class="app-row ${app.isSuccessful ? 'is-allotted' : ''}">
                    <div class="app-left">
                        <div class="account-avatar">${escapeHtml(avatarLetter)}</div>
                        <div class="app-info">
                            <div class="app-account-name" title="${escapeHtml(app.accountName)}">${escapeHtml(app.accountName)}</div>
                            <span class="app-upi-badge ${bankClass}">🏦 ${escapeHtml(app.upiId)}</span>
                        </div>
                    </div>
                    <label class="switch-container" title="Toggle allotment result">
                        <span class="allotment-status-text ${app.isSuccessful ? 'status-allotted-text' : 'status-pending-text'}">
                            ${app.isSuccessful ? '🎉 Allotted' : 'Pending'}
                        </span>
                        <input type="checkbox"
                               class="switch-input app-checkbox"
                               data-ipo-id="${ipo.id}"
                               data-app-index="${index}"
                               ${app.isSuccessful ? 'checked' : ''}>
                        <span class="switch-track">
                            <span class="switch-thumb"></span>
                        </span>
                    </label>
                </div>
            `;
        }).join('');

        return `
            <div class="ipo-card" data-id="${ipo.id}">
                <div class="ipo-card-top">
                    <div class="ipo-name-container">
                        <h2 class="ipo-name">${escapeHtml(ipo.name)}</h2>
                        <div class="ipo-status-pill ${statusClass}">
                            ${statusPulse}${statusText}
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="card-action-btn edit-btn" data-id="${ipo.id}" title="Edit IPO">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="card-action-btn delete-btn" data-id="${ipo.id}" title="Delete IPO">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="ipo-timeline-box">
                    <div class="date-row">
                        <span class="date-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Last Date
                        </span>
                        <span class="date-val">
                            ${formatDate(ipo.lastDate)}
                            ${daysBadge}
                        </span>
                    </div>
                    <div class="date-row">
                        <span class="date-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Listing Date
                        </span>
                        <span class="date-val">${formatDate(ipo.listingDate)}</span>
                    </div>
                </div>

                <div class="card-applications-header">
                    <span class="card-applications-title">Applications (${applications.length})</span>
                    <span class="card-allotment-score ${allottedCount > 0 ? 'has-success' : ''}">
                        ${allottedCount} / ${applications.length} Allotted
                    </span>
                </div>

                <div class="card-applications-list">
                    ${applicationsHTML}
                </div>
            </div>
        `;
    }).join('');

    attachCardEventListeners();
}

function attachCardEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal(btn.dataset.id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const ipo = tracker.getIPO(id);
            const name = ipo ? ipo.name : 'this IPO';
            if (confirm(`Are you sure you want to delete "${name}"?`)) {
                tracker.deleteIPO(id);
                showToast(`Deleted ${name}`, 'danger');
                renderIPOList();
            }
        });
    });

    // Allotment toggle checkboxes
    document.querySelectorAll('.app-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const ipoId = e.target.dataset.ipoId;
            const appIndex = parseInt(e.target.dataset.appIndex, 10);
            const isSuccess = tracker.toggleApplicationStatus(ipoId, appIndex);

            if (isSuccess) {
                triggerConfetti();
                showToast('🎉 Allotment Confirmed! Congratulations!', 'success');
            } else {
                showToast('Status changed to pending', 'info');
            }

            renderIPOList();
        });
    });
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================

// Open Modal
if (addIpoBtn) {
    addIpoBtn.addEventListener('click', () => showModal());
}

// Close Modal
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', hideModal);
}

// Close Modal when clicking backdrop
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            hideModal();
        }
    });
}

// Add Account Application Entry inside Modal
if (addApplicationBtn) {
    addApplicationBtn.addEventListener('click', () => {
        applicationsList.appendChild(createApplicationEntry());
        updateEntryCardNumbers();
    });
}

// Submit Form (Add / Edit IPO)
if (ipoForm) {
    ipoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('ipoName');
        const lastDateInput = document.getElementById('lastDate');
        const listingDateInput = document.getElementById('listingDate');

        const ipoData = {
            name: nameInput.value.trim(),
            lastDate: lastDateInput.value,
            listingDate: listingDateInput.value,
            applications: []
        };

        if (!ipoData.name) {
            showToast('Please enter the IPO company name', 'danger');
            nameInput.focus();
            return;
        }

        if (!ipoData.lastDate || !ipoData.listingDate) {
            showToast('Please select both application and listing dates', 'danger');
            return;
        }

        // Collect all applications
        const entryCards = applicationsList.querySelectorAll('.application-entry-card');
        entryCards.forEach(card => {
            const accInput = card.querySelector('.app-account-input');
            const upiInput = card.querySelector('.app-upi-input');
            const accountName = accInput ? accInput.value.trim() : '';
            const upiId = upiInput ? upiInput.value.trim() : '';

            if (accountName && upiId) {
                ipoData.applications.push({
                    accountName,
                    upiId,
                    isSuccessful: false
                });
            }
        });

        if (ipoData.applications.length === 0) {
            showToast('Please add at least one account application', 'danger');
            return;
        }

        if (tracker.currentEditId) {
            // Edit Mode: Preserve existing allotment success statuses
            const existing = tracker.getIPO(tracker.currentEditId);
            if (existing && existing.applications) {
                ipoData.applications = ipoData.applications.map((newApp, index) => {
                    const existingApp = existing.applications[index];
                    return {
                        ...newApp,
                        isSuccessful: existingApp ? existingApp.isSuccessful : false
                    };
                });
            }
            tracker.updateIPO(tracker.currentEditId, ipoData);
            showToast(`Updated "${ipoData.name}" successfully!`, 'success');
        } else {
            // Add Mode
            tracker.addIPO(ipoData);
            showToast(`Added "${ipoData.name}" with ${ipoData.applications.length} applications!`, 'success');
        }

        hideModal();
        renderIPOList();
    });
}

// Search Functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        tracker.searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = tracker.searchQuery ? 'block' : 'none';
        }
        renderIPOList();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        tracker.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderIPOList();
        searchInput.focus();
    });
}

// Filter Tabs
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tracker.currentFilter = tab.dataset.filter || 'all';
        renderIPOList();
    });
});

// Export Data
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const ipos = tracker.getAllIPOs();
        if (ipos.length === 0) {
            showToast('No IPO data to export', 'info');
            return;
        }
        tracker.exportData();
        showToast('Exported backup file successfully!', 'success');
    });
}

// Import Data
if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (tracker.importData(event.target.result)) {
                    showToast('Data imported successfully!', 'success');
                    renderIPOList();
                } else {
                    showToast('Invalid JSON backup file format', 'danger');
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
}

// Keyboard shortcuts (Escape to close modal)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        hideModal();
    }
});

// Initial Render
renderIPOList();
