// Popup script for Pixie.Browser
class PixiePopup {
	constructor() {
		this.currentTab = null;
		this.isMonitoring = false;
		this.init();
	}

	async init() {
		await this.loadCurrentTab();
		await this.updateUI();
		this.setupEventListeners();
		await this.loadRecentChanges();
	}

	async loadCurrentTab() {
		try {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			this.currentTab = tab;

			// Update tab info in UI
			document.getElementById('currentTabTitle').textContent = tab.title || 'Untitled';
			document.getElementById('currentTabUrl').textContent = tab.url || '';
		} catch (error) {
			console.error('Error loading current tab:', error);
		}
	}

	async updateUI() {
		try {
			// Check if current tab is being monitored
			const response = await chrome.runtime.sendMessage({ action: 'getMonitoredTabs' });
			const monitoredTabs = response.tabs || [];

			this.isMonitoring = this.currentTab && monitoredTabs.includes(this.currentTab.id);

			// Update button states
			const startBtn = document.getElementById('startMonitoring');
			const stopBtn = document.getElementById('stopMonitoring');

			if (this.isMonitoring) {
				startBtn.classList.add('hidden');
				stopBtn.classList.remove('hidden');
			} else {
				startBtn.classList.remove('hidden');
				stopBtn.classList.add('hidden');
			}

			// Update status indicator
			const statusDot = document.getElementById('statusDot');
			const statusText = document.getElementById('statusText');

			if (this.isMonitoring) {
				statusDot.classList.add('active');
				statusText.textContent = 'Monitoring active';
			} else {
				statusDot.classList.remove('active');
				statusText.textContent = 'Not monitoring';
			}

			// Update monitored count
			document.getElementById('monitoredCount').textContent = monitoredTabs.length;

		} catch (error) {
			console.error('Error updating UI:', error);
		}
	}

	setupEventListeners() {
		// Start monitoring button
		document.getElementById('startMonitoring').addEventListener('click', async () => {
			if (this.currentTab) {
				await chrome.runtime.sendMessage({
					action: 'startMonitoring',
					tabId: this.currentTab.id
				});
				await this.updateUI();
			}
		});

		// Stop monitoring button
		document.getElementById('stopMonitoring').addEventListener('click', async () => {
			if (this.currentTab) {
				await chrome.runtime.sendMessage({
					action: 'stopMonitoring',
					tabId: this.currentTab.id
				});
				await this.updateUI();
			}
		});

		// Capture now button
		document.getElementById('captureNow').addEventListener('click', async () => {
			if (this.currentTab) {
				await chrome.runtime.sendMessage({
					action: 'captureSnapshot',
					tabId: this.currentTab.id
				});
				this.showNotification('Snapshot captured!');
			}
		});

		// Options button
		document.getElementById('openOptions').addEventListener('click', () => {
			chrome.runtime.openOptionsPage();
		});

		// View history button
		document.getElementById('viewHistory').addEventListener('click', () => {
			chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
		});
	}

	async loadRecentChanges() {
		try {
			const { changeHistory = [] } = await chrome.storage.local.get('changeHistory');
			const changesList = document.getElementById('changesList');

			if (changeHistory.length === 0) {
				changesList.innerHTML = '<p class="no-changes">No changes detected yet</p>';
				return;
			}

			// Show last 3 changes
			const recentChanges = changeHistory.slice(0, 3);
			changesList.innerHTML = recentChanges.map(change => `
        <div class="change-item">
          <div class="change-title">${this.escapeHtml(change.title)}</div>
          <div class="change-time">${this.formatTime(change.timestamp)}</div>
        </div>
      `).join('');

		} catch (error) {
			console.error('Error loading recent changes:', error);
		}
	}

	formatTime(timestamp) {
		const now = Date.now();
		const diff = now - timestamp;

		if (diff < 60000) {
			return 'Just now';
		} else if (diff < 3600000) {
			return `${Math.floor(diff / 60000)}m ago`;
		} else if (diff < 86400000) {
			return `${Math.floor(diff / 3600000)}h ago`;
		} else {
			return `${Math.floor(diff / 86400000)}d ago`;
		}
	}

	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	showNotification(message) {
		// Simple notification - could be enhanced with a toast component
		const originalText = document.getElementById('captureNow').textContent;
		document.getElementById('captureNow').textContent = message;
		setTimeout(() => {
			document.getElementById('captureNow').textContent = originalText;
		}, 1500);
	}
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new PixiePopup();
});
