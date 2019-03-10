/**
 * Remove tags that will trigger network or rendering calls for optimizing the parsing
 * @param html
 */
export const getDom = (html: string): DocumentFragment => {
    // remove complete Tag blocks
    html = html.replace(/<\s*(script|object|iframe|svg|style|link|textarea)[^>]*>[\w\W]*?<\/\s*\1\s*>/gi, '');
    // remove tags that are closed immediately
    html = html.replace(/<\s*(?:script|object|img|link|input)[^>]*\/>/gi, '');
    // remove elements that dont have to be closed tags
    html = html.replace(/<\s*(?:link|img)[^>]*\/?>/gi, '');
    // remove style attributes
    html = html.replace(/(<[^>]+?)\s*style=(?:"[^"]+"|'[^']+')([^>]*?>)/gi, '$1$2');
    // remove comments, not strictly necessary but they bothered me personally
    html = html.replace(/<!--.*?-->/gi, '');

    // create html5 template attribute as a container
    const template = document.createElement('template');
    // set content to cleaned html, which will render a new usable DocumentFragment that will support query selectors
    template.innerHTML = html.trim();
    return template.content;
};

/**
 * Select elements from DOM and return array of those elements
 * @param selector
 * @param dom
 */
export const getElementsBySelector = (selector: string, dom: DocumentFragment): Element[] => {
    return Array.from(dom.querySelectorAll(selector));
};

/**
 * Select element from DOM
 * @param selector
 * @param dom
 */
export const getElementBySelector = (selector: string, dom: DocumentFragment): Element | null => {
    return dom.querySelector(selector);
};

/**
 * Filter function to be used with the getMetaTags function to get specific meta tags based on the name
 */
export const getMetaTagNameFilter = (names: string[] = []) => {
    return (element: Element) => {
        const name = (element.getAttribute('name') || '').toLowerCase();

        if (name && names.length) {
            for (const n of names) {
                if (n.toLowerCase() === name) {
                    return true;
                }
            }
        }

        return false;
    };
};

/**
 * Get the meta tags from a given html page
 */
export const getMetaTags = (dom: DocumentFragment, filter: (element: Element) => boolean): Element[] => {
    const list = getElementsBySelector('meta', dom);

    if (filter) {
        return list.filter(filter);
    } else {
        return list;
    }
};
