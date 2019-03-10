import { getSiteHandler } from './handlers';
import { SiteHandler } from '../entities/handlers';
import { handleArticleLinks } from './lib/content';
import { handleCurrentArticle } from './lib/content';
import OpenStateCache from './lib/cache';
import { getOptions } from './lib/options';
import { buildSidebar, updateSidebarResults } from '../views/sidebar';
import { findOrganizationsBasic } from './lib/openstate';

// initialize cache
const cache = new OpenStateCache();
// get the handler for this site if we support it
const siteHandler: SiteHandler | null = getSiteHandler(location.hostname);

// @ts-ignore Typing incorrectly specifies string parameter
const comPort = browser.runtime.connect({ name: 'vhnw-port' });

/**
 * Run on page load
 */
export const init = async () => {
    // Get and setup extension options
    const [organizations, options] = await Promise.all([
        findOrganizationsBasic(),
        getOptions(),
        cache.init()
    ]);

    let results = null;
    let autoOpen = false;

    // Check if already initialized on this page
    const existingFrame = document.querySelector('iframe.vhnw-frame');
    const alreadyLoaded = !!existingFrame;

    if (siteHandler) {
        // TODO: remove before release
        // cache.clear();

        // we found a handler, but will it actually handle?
        if (siteHandler.shouldHandle(location)) {
            if (siteHandler.isArticlePage()) {
                // get the open state results for the current main article
                results = await handleCurrentArticle(siteHandler, cache);

                if (results && results.results && results.results.length) {
                    autoOpen = options.autoOpenPanel;
                    // Update addon icon
                    comPort.postMessage({ hasResults: true });
                }
            }

            if (alreadyLoaded) {
                document.querySelectorAll('.vhnw-indicator-img').forEach(element => {
                    element.remove();
                });
                updateSidebarResults(results, options, organizations);
            }

            if (options.showOverviewIcons) {
                // check all news links on the page
                handleArticleLinks(siteHandler, cache);
            }
        }
    } else {
        // If this site has no handler, the script was injected by clicking the addon icon, so open the sidebar
        autoOpen = true;
    }

    if (!options.hideWelcomePanel) {
        autoOpen = true;
    }

    if (!alreadyLoaded) {
        buildSidebar(results, !!siteHandler, autoOpen, options, organizations);
    }
};

// Run init then bind sidebar toggle to addon icon
init().then(() => {
    // @ts-ignore Typing incorrectly specifies no parameters
    comPort.onMessage.addListener(message => {
        if (message.action && message.action === 'toggleSidebar') {
            const iframe = document.querySelector('iframe.vhnw-frame') as HTMLIFrameElement | null;

            if (iframe) {
                iframe.style.display = iframe.style.display === 'none' ? 'initial' : 'none';
            }
        }
    });
});