import { getSiteHandler } from './handlers';
import { SiteHandler } from '../entities/handlers';
import { handleArticleLinks } from './lib/content';
import { handleCurrentArticle } from './lib/content';
import OpenStateCache from './lib/cache';
import { getOptions, Options} from './lib/options';
import { buildSidebar, updateSidebarResults } from '../views/sidebar';
import { BasicOrganizations, findOrganizationsBasic } from './lib/openstate';

// initialize cache
const cache = new OpenStateCache();
// get the handler for this site if we support it
const siteHandler: SiteHandler | null = getSiteHandler(location.hostname);

// @ts-ignore Typing incorrectly specifies string parameter
const comPort = browser.runtime.connect({ name: 'vhnw-port' });

let currentUrl: string = '';
let organizations: BasicOrganizations;
let options: Options;

// observer to listen to changing nodes
const mutationObserver: MutationObserver = new MutationObserver((mutationsList: any, observer: MutationObserver) => {
    // node flattener callback
    const flattenNodes = (acc: Node[], node: Node) => {
        acc.push(node);
        // flatten child nodes recursively
        if (node.childNodes.length) {
            Array.from(node.childNodes).reduce(flattenNodes, acc);
        }
        return acc;
    };

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const list: Node[] = Array.from(mutation.addedNodes);
            const flattened: Node[] = list.reduce(flattenNodes, []);
            if (flattened.some((el: Node) => el.nodeName === 'A')) {
                setup();
                break;
            }
        }
    }
});

/**
 * Run on page load
 */
export const init = async () => {
    // Get and setup extension options
    [organizations, options] = await Promise.all([
        findOrganizationsBasic(),
        getOptions(),
        cache.init()
    ]);

    await setup();
};

const setup = async () => {
    let results = null;
    let autoOpen = false;

    // Check if already initialized on this page
    const existingFrame = document.querySelector('iframe.vhnw-frame');
    const alreadyLoaded = !!existingFrame;

    if (siteHandler) {
        // TODO: remove before release
        // cache.clear();

        // remove vhnw markers
        if (alreadyLoaded) {
            document.querySelectorAll('.vhnw-indicator-img').forEach(element => {
                element.remove();
            });
        }

        // we found a handler, but should it actually handle?
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

// setup listeners for lazy loaded elements
const setupContentMutationListeners = () => {
    // removed old observes nodes
    mutationObserver.disconnect();

    if (siteHandler && siteHandler.mutatablesSelector.length) {
        // Select the node that will be observed for mutations
        const updatingNodes: NodeListOf<Element> = document.querySelectorAll(siteHandler.mutatablesSelector);
        updatingNodes.forEach((node: Node) => {
            mutationObserver.observe(node, { attributes: false, childList: true, subtree: true });
        });
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

    if (siteHandler && siteHandler.isSPA()) {
        setInterval(() => {
            if (location.href !== currentUrl) {
                currentUrl = location.href;

                // the url is updated, reset everything. The timeout is a bit nasty, but we can setup the mutation listeners before the elements are there
                const iframe = document.querySelector('iframe.vhnw-frame');
                if (iframe) {
                    iframe.remove();
                }
                comPort.postMessage({ hasResults: false });

                setTimeout(() => setup().then(setupContentMutationListeners), 500);
            }
        }, 50);
    }

    document.onreadystatechange = function () {
        console.log(document.readyState);
    }

    setupContentMutationListeners();
});
