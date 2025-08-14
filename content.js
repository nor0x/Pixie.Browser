// Content script for Pixie.Browser
class PixieContent {
	constructor() {
		this.isMonitored = false;
		this.init();
	}

	init() {
		// Listen for messages from background script
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			this.handleMessage(request, sender, sendResponse);
			return true; // Keep message channel open
		});

		// Check if this tab is being monitored
		this.checkMonitoringStatus();
	}

	async checkMonitoringStatus() {
		try {
			const response = await chrome.runtime.sendMessage({ action: 'getMonitoredTabs' });
			const monitoredTabs = response.tabs || [];

			// Get current tab ID (this is a bit tricky from content script)
			// We'll rely on the background script to manage this

		} catch (error) {
			console.error('Error checking monitoring status:', error);
		}
	}

	handleMessage(request, sender, sendResponse) {
		switch (request.action) {
			case 'getPageInfo':
				sendResponse({
					title: document.title,
					url: window.location.href,
					lastModified: document.lastModified
				});
				break;

			case 'checkForChanges':
				// This could be used for more sophisticated change detection
				// For now, we rely on visual screenshots
				sendResponse({ hasChanges: false });
				break;

			case 'highlightChanges':
				// Future feature: highlight changed elements
				this.highlightChanges(request.changes);
				sendResponse({ success: true });
				break;
		}
	}

	highlightChanges(changes) {
		// Future implementation: highlight changed DOM elements
		console.log('Highlighting changes:', changes);
	}

	// Utility method to get page hash for basic change detection
	getPageHash() {
		// Simple hash of page content - could be enhanced
		const content = document.documentElement.innerHTML;
		return this.simpleHash(content);
	}

	simpleHash(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	// Monitor DOM changes (future enhancement)
	startDOMObserver() {
		const observer = new MutationObserver((mutations) => {
			// Future: detect and report DOM changes
			console.log('DOM mutations detected:', mutations.length);
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		});

		return observer;
	}
}

// Initialize content script
new PixieContent();
