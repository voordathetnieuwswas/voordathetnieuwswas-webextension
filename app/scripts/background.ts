const activePorts: { [id: number]: browser.runtime.Port } = {};

browser.runtime.onInstalled.addListener(details => {
    // Clear the cache whenever the extension is updated
    browser.storage.local.clear();
});

// Handle incoming connections from our content script
browser.runtime.onConnect.addListener(port => {
    const tabId = port.sender && port.sender.tab && port.sender.tab.id;
    if (!tabId) {
        return;
    }
    activePorts[tabId] = port;

    // @ts-ignore Typing incorrectly specifies no parameters
    port.onMessage.addListener((message: any) => {
        if (message.hasResults) {
            browser.browserAction.setIcon({
                tabId,
                path: {
                    16: 'images/icon-16.png',
                    32: 'images/icon-32.png',
                    64: 'images/icon-64.png',
                    128: 'images/icon-128.png'
                }
            });
        } else {
            browser.browserAction.setIcon({
                tabId,
                path: {
                    16: 'images/icon-disabled-16.png',
                    32: 'images/icon-disabled-32.png',
                    64: 'images/icon-disabled-64.png',
                    128: 'images/icon-disabled-128.png'
                }
            });
        }
    });

    port.onDisconnect.addListener(() => {
        delete activePorts[tabId];
    });
});

// Addon icon click action
browser.browserAction.onClicked.addListener((tab: browser.tabs.Tab) => {
    if (!tab.id) {
        return;
    }

    if (activePorts[tab.id]) {
        // Already loaded, trigger sidebar toggle
        activePorts[tab.id].postMessage({ action: 'toggleSidebar' });
    } else {
        // Not loaded, inject CSS and script
        browser.tabs.insertCSS({
            file: '/styles/contentscript.css',
        });
        browser.tabs.executeScript({
            file: '/scripts/contentscript.js',
            allFrames: false
        });
    }
});

export {};
