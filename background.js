// Background service worker for Pixie.Browser
class PixieBackground {
	constructor() {
		this.snapshots = new Map();
		this.monitoredTabs = new Set();
		this.checkTimer = null;
		this.actualCheckInterval = 5; // Default 5 minutes
		this.init();
	}

	init() {
		// Set up alarm for periodic checks
		chrome.runtime.onInstalled.addListener(async () => {
			await this.loadSettings();
			// Chrome alarms minimum is 1 minute, so use that for sub-minute intervals
			const alarmInterval = Math.max(1, this.actualCheckInterval);
			chrome.alarms.create('pixieCheck', { periodInMinutes: alarmInterval });
			this.setupIntervalTimer();
		});

		// Listen for alarm events
		chrome.alarms.onAlarm.addListener((alarm) => {
			if (alarm.name === 'pixieCheck') {
				this.handleAlarmCheck();
			}
		});

		// Listen for tab updates
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (changeInfo.status === 'complete' && this.monitoredTabs.has(tabId)) {
				this.captureTabSnapshot(tabId);
			}
		});

		// Listen for messages from content script and popup
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			this.handleMessage(request, sender, sendResponse);
			return true; // Keep message channel open for async response
		});

		// Load settings on startup
		this.loadSettings();
	}

	async handleMessage(request, sender, sendResponse) {
		switch (request.action) {
			case 'startMonitoring':
				await this.startMonitoring(request.tabId);
				sendResponse({ success: true });
				break;
			case 'stopMonitoring':
				await this.stopMonitoring(request.tabId);
				sendResponse({ success: true });
				break;
			case 'getMonitoredTabs':
				sendResponse({ tabs: Array.from(this.monitoredTabs) });
				break;
			case 'captureSnapshot':
				await this.captureTabSnapshot(request.tabId);
				sendResponse({ success: true });
				break;
			case 'updateSettings':
				await this.loadSettings();
				this.setupIntervalTimer();
				sendResponse({ success: true });
				break;
		}
	}

	async loadSettings() {
		try {
			const { actualCheckInterval } = await chrome.storage.local.get('actualCheckInterval');
			if (actualCheckInterval !== undefined) {
				this.actualCheckInterval = actualCheckInterval;
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	setupIntervalTimer() {
		// Clear existing timer
		if (this.checkTimer) {
			clearInterval(this.checkTimer);
		}

		// If interval is less than 1 minute, use setInterval for more frequent checks
		if (this.actualCheckInterval < 1) {
			const intervalMs = this.actualCheckInterval * 60 * 1000; // Convert minutes to milliseconds
			this.checkTimer = setInterval(() => {
				this.checkAllMonitoredTabs();
			}, intervalMs);
		}
	}

	handleAlarmCheck() {
		// If interval is 1 minute or more, handle normally
		// If less than 1 minute, the setInterval timer handles it
		if (this.actualCheckInterval >= 1) {
			this.checkAllMonitoredTabs();
		}
	}

	async startMonitoring(tabId) {
		this.monitoredTabs.add(tabId);
		await this.captureTabSnapshot(tabId);

		// Save monitored tabs to storage
		await chrome.storage.local.set({
			monitoredTabs: Array.from(this.monitoredTabs)
		});
	}

	async stopMonitoring(tabId) {
		this.monitoredTabs.delete(tabId);
		this.snapshots.delete(tabId);

		// Save monitored tabs to storage
		await chrome.storage.local.set({
			monitoredTabs: Array.from(this.monitoredTabs)
		});
	}

	async captureTabSnapshot(tabId) {
		try {
			// Capture visible tab
			const dataUrl = await chrome.tabs.captureVisibleTab(null, {
				format: 'png',
				quality: 80
			});

			const previousSnapshot = this.snapshots.get(tabId);
			this.snapshots.set(tabId, dataUrl);

			if (previousSnapshot && previousSnapshot !== dataUrl) {
				await this.detectChanges(tabId, previousSnapshot, dataUrl);
			}
		} catch (error) {
			console.error('Error capturing snapshot:', error);
		}
	}

	async detectChanges(tabId, oldSnapshot, newSnapshot) {
		try {
			// Get tab info
			const tab = await chrome.tabs.get(tabId);

			// Simple change detection - in a real implementation, you'd want more sophisticated comparison
			if (oldSnapshot !== newSnapshot) {
				await this.notifyChange(tab);
			}
		} catch (error) {
			console.error('Error detecting changes:', error);
		}
	}

	async notifyChange(tab) {
		// Create notification
		await chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon48.png',
			title: 'Page Change Detected!',
			message: `Changes detected on: ${tab.title}`
		});

		// Store change event
		const changeEvent = {
			url: tab.url,
			title: tab.title,
			timestamp: Date.now()
		};

		const { changeHistory = [] } = await chrome.storage.local.get('changeHistory');
		changeHistory.unshift(changeEvent);

		// Keep only last 100 changes
		if (changeHistory.length > 100) {
			changeHistory.splice(100);
		}

		await chrome.storage.local.set({ changeHistory });
	}

	async checkAllMonitoredTabs() {
		for (const tabId of this.monitoredTabs) {
			try {
				const tab = await chrome.tabs.get(tabId);
				if (tab) {
					await this.captureTabSnapshot(tabId);
				}
			} catch (error) {
				// Tab might have been closed, remove from monitoring
				this.monitoredTabs.delete(tabId);
				this.snapshots.delete(tabId);
			}
		}
	}
}

// Initialize the background service
new PixieBackground();
