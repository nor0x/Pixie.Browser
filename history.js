// History script for Pixie.Browser
class PixieHistory {
	constructor() {
		this.changeHistory = [];
		this.filteredHistory = [];
		this.currentPage = 1;
		this.itemsPerPage = 20;
		this.init();
	}

	async init() {
		await this.loadHistory();
		this.updateStats();
		this.renderHistory();
		this.setupEventListeners();
	}

	async loadHistory() {
		try {
			const { changeHistory = [] } = await chrome.storage.local.get('changeHistory');
			this.changeHistory = changeHistory;
			this.filteredHistory = [...changeHistory];
		} catch (error) {
			console.error('Error loading history:', error);
			this.changeHistory = [];
			this.filteredHistory = [];
		}
	}

	updateStats() {
		const total = this.changeHistory.length;
		const today = this.getTodayChanges();
		const uniquePages = this.getUniquePages();

		document.getElementById('totalChanges').textContent = total;
		document.getElementById('todayChanges').textContent = today;
		document.getElementById('uniquePages').textContent = uniquePages;
	}

	getTodayChanges() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayTimestamp = today.getTime();

		return this.changeHistory.filter(change =>
			change.timestamp >= todayTimestamp
		).length;
	}

	getUniquePages() {
		const uniqueUrls = new Set();
		this.changeHistory.forEach(change => {
			uniqueUrls.add(change.url);
		});
		return uniqueUrls.size;
	}

	renderHistory() {
		const historyList = document.getElementById('historyList');

		if (this.filteredHistory.length === 0) {
			historyList.innerHTML = `
        <div class="no-history">
          <h3>No changes found</h3>
          <p>No page changes have been detected yet.</p>
        </div>
      `;
			document.getElementById('pagination').classList.add('hidden');
			return;
		}

		// Calculate pagination
		const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const pageItems = this.filteredHistory.slice(startIndex, endIndex);

		// Render items
		historyList.innerHTML = pageItems.map(change => `
      <div class="history-item">
        <div class="history-header">
          <div>
            <div class="history-title">${this.escapeHtml(change.title)}</div>
            <a href="${change.url}" class="history-url" target="_blank" rel="noopener">
              ${this.escapeHtml(change.url)}
            </a>
          </div>
          <div class="history-time">${this.formatTime(change.timestamp)}</div>
        </div>
        <div class="history-actions">
          <button class="btn btn-small btn-primary" onclick="pixieHistory.visitPage('${change.url}')">
            Visit Page
          </button>
          <button class="btn btn-small btn-outline" onclick="pixieHistory.deleteChange(${change.timestamp})">
            Delete
          </button>
        </div>
      </div>
    `).join('');

		// Update pagination
		this.updatePagination(totalPages);
	}

	updatePagination(totalPages) {
		const pagination = document.getElementById('pagination');
		const pageInfo = document.getElementById('pageInfo');
		const prevBtn = document.getElementById('prevPage');
		const nextBtn = document.getElementById('nextPage');

		if (totalPages <= 1) {
			pagination.classList.add('hidden');
			return;
		}

		pagination.classList.remove('hidden');
		pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

		prevBtn.disabled = this.currentPage === 1;
		nextBtn.disabled = this.currentPage === totalPages;
	}

	setupEventListeners() {
		// Search functionality
		const searchInput = document.getElementById('searchInput');
		const searchBtn = document.getElementById('searchBtn');

		const performSearch = () => {
			const query = searchInput.value.toLowerCase().trim();
			this.filterHistory(query, document.getElementById('timeFilter').value);
		};

		searchBtn.addEventListener('click', performSearch);
		searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				performSearch();
			}
		});

		// Time filter
		document.getElementById('timeFilter').addEventListener('change', (e) => {
			this.filterHistory(searchInput.value.toLowerCase().trim(), e.target.value);
		});

		// Clear all history
		document.getElementById('clearAll').addEventListener('click', () => {
			this.clearAllHistory();
		});

		// Export history
		document.getElementById('exportHistory').addEventListener('click', () => {
			this.exportHistory();
		});

		// Pagination
		document.getElementById('prevPage').addEventListener('click', () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.renderHistory();
			}
		});

		document.getElementById('nextPage').addEventListener('click', () => {
			const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
			if (this.currentPage < totalPages) {
				this.currentPage++;
				this.renderHistory();
			}
		});
	}

	filterHistory(searchQuery, timeFilter) {
		let filtered = [...this.changeHistory];

		// Apply search filter
		if (searchQuery) {
			filtered = filtered.filter(change =>
				change.title.toLowerCase().includes(searchQuery) ||
				change.url.toLowerCase().includes(searchQuery)
			);
		}

		// Apply time filter
		if (timeFilter !== 'all') {
			const now = Date.now();
			let cutoffTime;

			switch (timeFilter) {
				case 'today':
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					cutoffTime = today.getTime();
					break;
				case 'week':
					cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
					break;
				case 'month':
					cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
					break;
			}

			if (cutoffTime) {
				filtered = filtered.filter(change => change.timestamp >= cutoffTime);
			}
		}

		this.filteredHistory = filtered;
		this.currentPage = 1;
		this.renderHistory();
	}

	visitPage(url) {
		chrome.tabs.create({ url });
	}

	async deleteChange(timestamp) {
		if (!confirm('Are you sure you want to delete this change record?')) {
			return;
		}

		try {
			// Remove from current arrays
			this.changeHistory = this.changeHistory.filter(change => change.timestamp !== timestamp);
			this.filteredHistory = this.filteredHistory.filter(change => change.timestamp !== timestamp);

			// Update storage
			await chrome.storage.local.set({ changeHistory: this.changeHistory });

			// Update UI
			this.updateStats();
			this.renderHistory();

		} catch (error) {
			console.error('Error deleting change:', error);
			alert('Failed to delete change record.');
		}
	}

	async clearAllHistory() {
		if (!confirm('Are you sure you want to delete all change history? This action cannot be undone.')) {
			return;
		}

		try {
			await chrome.storage.local.remove('changeHistory');
			this.changeHistory = [];
			this.filteredHistory = [];
			this.updateStats();
			this.renderHistory();
		} catch (error) {
			console.error('Error clearing history:', error);
			alert('Failed to clear history.');
		}
	}

	exportHistory() {
		if (this.changeHistory.length === 0) {
			alert('No history to export.');
			return;
		}

		const data = {
			exportDate: new Date().toISOString(),
			totalChanges: this.changeHistory.length,
			changes: this.changeHistory
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `pixie-browser-history-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	formatTime(timestamp) {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now - date;

		if (diff < 60000) {
			return 'Just now';
		} else if (diff < 3600000) {
			return `${Math.floor(diff / 60000)}m ago`;
		} else if (diff < 86400000) {
			return `${Math.floor(diff / 3600000)}h ago`;
		} else if (diff < 604800000) {
			return `${Math.floor(diff / 86400000)}d ago`;
		} else {
			return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
		}
	}

	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
}

// Global instance for onclick handlers
let pixieHistory;

// Initialize history page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	pixieHistory = new PixieHistory();
});
