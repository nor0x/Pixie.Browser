# Pixie.Browser - a browser extension for page change detection and alerts

Pixie.Browser is a browser extension that can periodically snapshot webpages and compares them to detect changes. It can alert you when a change is detected on monitored pages.

## Features

- **Periodic page snapshots** - Automatically captures screenshots of monitored pages
- **Change detection using pixel comparison** - Compares screenshots to detect visual changes
- **Notifications for detected changes** - Desktop notifications when changes are found
- **User-friendly interface** - Easy-to-use popup and options pages
- **Options for customizing snapshot intervals** - Configure how often to check for changes
- **Support for multiple tabs** - Monitor multiple pages simultaneously
- **Lightweight and efficient** - Minimal resource usage
- **Change history** - Keep track of all detected changes with timestamps
- **Export functionality** - Export change history as JSON

## Stack

- **Vanilla JavaScript** - No external dependencies
- **HTML5 & CSS3** - Modern web standards
- **WebExtension APIs** - Chrome/Firefox compatible extension APIs
- **Manifest V3** - Latest extension manifest format

## Installation

### For Development

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory
5. The extension will be installed and ready to use

### For Distribution

1. Create icon files in the `icons/` directory:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels) 
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Test the extension thoroughly
3. Package the extension for distribution via Chrome Web Store

## Usage

1. **Start Monitoring**: Click the Pixie.Browser icon in your toolbar and click "Start Monitoring" for the current tab
2. **Configure Settings**: Right-click the extension icon and select "Options" to configure check intervals and sensitivity
3. **View Changes**: Click the extension icon to see recent changes, or click "View History" for a complete log
4. **Stop Monitoring**: Click "Stop Monitoring" in the popup to stop watching a page

## Configuration Options

- **Check Interval**: How often to check for changes (1 minute to 1 hour)
- **Change Sensitivity**: How sensitive the detection should be (Low/Medium/High)
- **Notifications**: Enable/disable desktop notifications
- **History Limits**: Maximum number of changes and snapshots to keep

## File Structure

```
Pixie.Browser/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.css           # Settings styles  
├── options.js            # Settings functionality
├── history.html          # Change history page
├── history.css           # History styles
├── history.js            # History functionality
├── content.js            # Content script (injected into pages)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Development

### Key Components

- **Background Script** (`background.js`): Manages alarms, captures screenshots, detects changes
- **Popup** (`popup.html/js/css`): Main user interface for starting/stopping monitoring
- **Options Page** (`options.html/js/css`): Configuration interface
- **History Page** (`history.html/js/css`): View and manage change history
- **Content Script** (`content.js`): Injected into web pages (for future enhancements)

### Chrome APIs Used

- `chrome.tabs` - Access to browser tabs
- `chrome.alarms` - Periodic checking
- `chrome.storage` - Settings and history storage
- `chrome.notifications` - Desktop notifications
- `chrome.runtime` - Extension messaging

### Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Firefox**: Compatible with minor modifications
- **Edge**: Compatible (Chromium-based)

## Privacy

- No data is sent to external servers
- All snapshots and history are stored locally
- Only websites you explicitly monitor are accessed
- No tracking or analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. See LICENSE file for details.

## Troubleshooting

**Extension not working?**
- Ensure you've granted necessary permissions
- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the extension

**No changes detected?**
- Verify the page actually changed
- Try adjusting sensitivity settings
- Check that monitoring is active for the tab

**Performance issues?**
- Increase check interval in settings
- Reduce number of monitored tabs
- Clear old history entries