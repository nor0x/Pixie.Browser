// Options script for Pixie.Browser
class PixieOptions {
	constructor() {
		this.defaultSettings = {
			checkInterval: 5,
			sensitivity: 'medium',
			enableNotifications: true,
			enableSound: false,
			maxHistory: 100,
			maxSnapshots: 10,
			excludeAds: false,
			ignoreMinorChanges: true
		};

		this.init();
	}

	async init() {
		await this.loadSettings();
		this.setupEventListeners();
	}

	async loadSettings() {
		try {
			const { settings } = await chrome.storage.local.get('settings');
			const currentSettings = { ...this.defaultSettings, ...settings };

			// Update UI with current settings
			document.getElementById('checkInterval').value = currentSettings.checkInterval;
			document.getElementById('sensitivity').value = currentSettings.sensitivity;
			document.getElementById('enableNotifications').checked = currentSettings.enableNotifications;
			document.getElementById('enableSound').checked = currentSettings.enableSound;
			document.getElementById('maxHistory').value = currentSettings.maxHistory;
			document.getElementById('maxSnapshots').value = currentSettings.maxSnapshots;
			document.getElementById('excludeAds').checked = currentSettings.excludeAds;
			document.getElementById('ignoreMinorChanges').checked = currentSettings.ignoreMinorChanges;

		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	setupEventListeners() {
		// Save settings button
		document.getElementById('saveSettings').addEventListener('click', () => {
			this.saveSettings();
		});

		// Reset settings button
		document.getElementById('resetSettings').addEventListener('click', () => {
			this.resetSettings();
		});

		// Clear history button
		document.getElementById('clearHistory').addEventListener('click', () => {
			this.clearHistory();
		});

		// Auto-save on changes
		const inputs = document.querySelectorAll('select, input[type="checkbox"]');
		inputs.forEach(input => {
			input.addEventListener('change', () => {
				this.saveSettings(false); // Save without showing message
			});
		});
	}

	async saveSettings(showMessage = true) {
		try {
			const settings = {
				checkInterval: parseFloat(document.getElementById('checkInterval').value),
				sensitivity: document.getElementById('sensitivity').value,
				enableNotifications: document.getElementById('enableNotifications').checked,
				enableSound: document.getElementById('enableSound').checked,
				maxHistory: parseInt(document.getElementById('maxHistory').value),
				maxSnapshots: parseInt(document.getElementById('maxSnapshots').value),
				excludeAds: document.getElementById('excludeAds').checked,
				ignoreMinorChanges: document.getElementById('ignoreMinorChanges').checked
			};

			await chrome.storage.local.set({ settings });

			// Update alarm interval if changed
			await this.updateAlarmInterval(settings.checkInterval);

			// Notify background script of settings change
			chrome.runtime.sendMessage({ action: 'updateSettings' });

			if (showMessage) {
				this.showSaveMessage();
			}

		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}

	async updateAlarmInterval(minutes) {
		try {
			// Clear existing alarm
			await chrome.alarms.clear('pixieCheck');

			// Chrome alarms have a minimum period of 1 minute
			// For intervals less than 1 minute, we'll set a 1-minute alarm
			// and handle the sub-minute timing in the background script
			const alarmInterval = Math.max(1, minutes);

			// Create new alarm with updated interval
			await chrome.alarms.create('pixieCheck', { periodInMinutes: alarmInterval });

			// Store the actual desired interval for background script to use
			await chrome.storage.local.set({ actualCheckInterval: minutes });

		} catch (error) {
			console.error('Error updating alarm interval:', error);
		}
	}

	async resetSettings() {
		try {
			// Update UI with default settings
			document.getElementById('checkInterval').value = this.defaultSettings.checkInterval;
			document.getElementById('sensitivity').value = this.defaultSettings.sensitivity;
			document.getElementById('enableNotifications').checked = this.defaultSettings.enableNotifications;
			document.getElementById('enableSound').checked = this.defaultSettings.enableSound;
			document.getElementById('maxHistory').value = this.defaultSettings.maxHistory;
			document.getElementById('maxSnapshots').value = this.defaultSettings.maxSnapshots;
			document.getElementById('excludeAds').checked = this.defaultSettings.excludeAds;
			document.getElementById('ignoreMinorChanges').checked = this.defaultSettings.ignoreMinorChanges;

			// Save the default settings
			await this.saveSettings();

		} catch (error) {
			console.error('Error resetting settings:', error);
		}
	}

	async clearHistory() {
		try {
			const confirmed = confirm('Are you sure you want to clear all change history? This action cannot be undone.');

			if (confirmed) {
				await chrome.storage.local.remove('changeHistory');
				this.showSaveMessage('History cleared successfully!');
			}

		} catch (error) {
			console.error('Error clearing history:', error);
		}
	}

	showSaveMessage(message = 'Settings saved successfully!') {
		const messageEl = document.getElementById('saveMessage');
		messageEl.textContent = message;
		messageEl.classList.remove('hidden');

		setTimeout(() => {
			messageEl.classList.add('hidden');
		}, 3000);
	}
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new PixieOptions();
});
