// Data Management
class IPOTracker {
    constructor() {
        this.ipos = this.loadData();
        this.currentEditId = null;
    }

    loadData() {
        const data = localStorage.getItem('ipoData');
        return data ? JSON.parse(data) : [];
    }

    saveData() {
        localStorage.setItem('ipoData', JSON.stringify(this.ipos));
    }

    addIPO(ipoData) {
        const id = Date.now().toString();
        this.ipos.push({ id, ...ipoData });
        this.saveData();
        return id;
    }

    updateIPO(id, ipoData) {
        const index = this.ipos.findIndex(ipo => ipo.id === id);
        if (index !== -1) {
            this.ipos[index] = { id, ...ipoData };
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
        return this.ipos.sort((a, b) => new Date(a.lastDate) - new Date(b.lastDate));
    }

    toggleApplicationStatus(ipoId, appIndex) {
        const ipo = this.getIPO(ipoId);
        if (ipo && ipo.applications[appIndex]) {
            ipo.applications[appIndex].isSuccessful = !ipo.applications[appIndex].isSuccessful;
            this.saveData();
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.ipos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipo-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
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
            return false;
        }
    }
}

// Initialize tracker
const tracker = new IPOTracker();

// DOM Elements
const modal = document.getElementById('ipoModal');
const addIpoBtn = document.getElementById('addIpoBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const ipoForm = document.getElementById('ipoForm');
const ipoList = document.getElementById('ipoList');
const addApplicationBtn = document.getElementById('addApplicationBtn');
const applicationsList = document.getElementById('applicationsList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Check if date has passed
function hasDatePassed(dateString) {
    return new Date(dateString) < new Date();
}

// Create application entry in form
function createApplicationEntry(accountName = '', upiId = '', isSuccessful = false) {
    const div = document.createElement('div');
    div.className = 'application-entry';
    div.innerHTML = `
        <div class="application-entry-header">
            <strong>Application Details</strong>
            <button type="button" class="icon-btn remove-app-btn" title="Remove">❌</button>
        </div>
        <div class="form-group">
            <label>Account Holder Name*</label>
            <input type="text" class="app-account-input" value="${accountName}" required placeholder="e.g., My Account, Father's Account">
        </div>
        <div class="form-group">
            <label>UPI ID / Bank Used*</label>
            <input type="text" class="app-upi-input" value="${upiId}" required placeholder="e.g., SBI, Axis UPI">
        </div>
    `;

    // Remove button handler
    div.querySelector('.remove-app-btn').addEventListener('click', () => {
        div.remove();
    });

    return div;
}

// Show modal
function showModal(editId = null) {
    tracker.currentEditId = editId;
    const modalTitle = document.getElementById('modalTitle');

    // Clear form
    document.getElementById('ipoName').value = '';
    document.getElementById('lastDate').value = '';
    document.getElementById('listingDate').value = '';
    applicationsList.innerHTML = '';

    if (editId) {
        // Edit mode
        modalTitle.textContent = 'Edit IPO';
        const ipo = tracker.getIPO(editId);
        if (ipo) {
            document.getElementById('ipoName').value = ipo.name;
            document.getElementById('lastDate').value = ipo.lastDate;
            document.getElementById('listingDate').value = ipo.listingDate;

            ipo.applications.forEach(app => {
                applicationsList.appendChild(
                    createApplicationEntry(app.accountName, app.upiId, app.isSuccessful)
                );
            });
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New IPO';
        // Add one default application entry
        applicationsList.appendChild(createApplicationEntry());
    }

    modal.style.display = 'block';
}

// Hide modal
function hideModal() {
    modal.style.display = 'none';
    tracker.currentEditId = null;
}

// Render IPO list
function renderIPOList() {
    const ipos = tracker.getAllIPOs();

    if (ipos.length === 0) {
        ipoList.innerHTML = `
            <div class="empty-state">
                <h3>No IPOs tracked yet</h3>
                <p>Click "Add New IPO" to start tracking your applications</p>
            </div>
        `;
        return;
    }

    ipoList.innerHTML = ipos.map(ipo => {
        const lastDatePassed = hasDatePassed(ipo.lastDate);
        const applicationsHTML = ipo.applications.map((app, index) => `
            <div class="application-item">
                <input type="checkbox"
                       class="app-checkbox"
                       data-ipo-id="${ipo.id}"
                       data-app-index="${index}"
                       ${app.isSuccessful ? 'checked' : ''}>
                <div class="app-details">
                    <div class="app-account">${app.accountName}</div>
                    <div class="app-upi">🏦 ${app.upiId}</div>
                </div>
                <span class="status-badge ${app.isSuccessful ? 'status-success' : 'status-pending'}">
                    ${app.isSuccessful ? '✓ Success' : '⏳ Pending'}
                </span>
            </div>
        `).join('');

        return `
            <div class="ipo-card" data-id="${ipo.id}">
                <div class="ipo-header">
                    <div class="ipo-name">${ipo.name}</div>
                    <div class="ipo-actions">
                        <button class="icon-btn edit-btn" data-id="${ipo.id}" title="Edit">✏️</button>
                        <button class="icon-btn delete-btn" data-id="${ipo.id}" title="Delete">🗑️</button>
                    </div>
                </div>

                <div class="ipo-dates">
                    <div class="date-item">
                        <span class="date-label">Last Date:</span>
                        <span class="date-value" style="color: ${lastDatePassed ? '#e74c3c' : '#27ae60'}">
                            ${formatDate(ipo.lastDate)}
                        </span>
                    </div>
                    <div class="date-item">
                        <span class="date-label">Listing Date:</span>
                        <span class="date-value">${formatDate(ipo.listingDate)}</span>
                    </div>
                </div>

                <div class="applications">
                    <h4>Applications (${ipo.applications.length})</h4>
                    ${applicationsHTML}
                </div>
            </div>
        `;
    }).join('');

    // Attach event listeners
    attachIPOCardListeners();
}

// Attach event listeners to IPO cards
function attachIPOCardListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showModal(btn.dataset.id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this IPO?')) {
                tracker.deleteIPO(btn.dataset.id);
                renderIPOList();
            }
        });
    });

    // Checkboxes
    document.querySelectorAll('.app-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const ipoId = e.target.dataset.ipoId;
            const appIndex = parseInt(e.target.dataset.appIndex);
            tracker.toggleApplicationStatus(ipoId, appIndex);
            renderIPOList();
        });
    });
}

// Event Listeners
addIpoBtn.addEventListener('click', () => showModal());
closeBtn.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});

addApplicationBtn.addEventListener('click', () => {
    applicationsList.appendChild(createApplicationEntry());
});

ipoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const ipoData = {
        name: document.getElementById('ipoName').value.trim(),
        lastDate: document.getElementById('lastDate').value,
        listingDate: document.getElementById('listingDate').value,
        applications: []
    };

    // Collect all applications
    const appEntries = applicationsList.querySelectorAll('.application-entry');
    appEntries.forEach(entry => {
        const accountName = entry.querySelector('.app-account-input').value.trim();
        const upiId = entry.querySelector('.app-upi-input').value.trim();
        if (accountName && upiId) {
            ipoData.applications.push({
                accountName,
                upiId,
                isSuccessful: false
            });
        }
    });

    if (ipoData.applications.length === 0) {
        alert('Please add at least one application');
        return;
    }

    if (tracker.currentEditId) {
        // Update existing IPO - preserve checkbox states
        const existingIPO = tracker.getIPO(tracker.currentEditId);
        if (existingIPO) {
            // Match applications and preserve their success status
            ipoData.applications = ipoData.applications.map((newApp, index) => {
                if (existingIPO.applications[index]) {
                    return {
                        ...newApp,
                        isSuccessful: existingIPO.applications[index].isSuccessful
                    };
                }
                return newApp;
            });
        }
        tracker.updateIPO(tracker.currentEditId, ipoData);
    } else {
        tracker.addIPO(ipoData);
    }

    hideModal();
    renderIPOList();
});

// Export functionality
exportBtn.addEventListener('click', () => {
    tracker.exportData();
});

// Import functionality
importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (tracker.importData(event.target.result)) {
                alert('Data imported successfully!');
                renderIPOList();
            } else {
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
});

// Initial render
renderIPOList();
