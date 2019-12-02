import {
    ArticleLink,
    ArticleSelectors,
    BodyElementCleaner,
    GetCityMethod,
    GetKeywords,
    GetKeywordsMethod,
    GetUrlsFunction,
    IsArticlePage,
    Keywords,
    TokenWords,
    UpdateElement,
    UrlElementValidator
} from '../../entities/handlers';
import { getMetaTagNameFilter, getMetaTags } from './dom';
import {
    getKeywordsByDefault,
    getStreetName, matchesKeywords,
    normalize,
    removeDoubles,
    textToTokens
} from './keywords';
import { weedCutterWords } from '../../words/wordlist';

/**
 * Expect a selector that selects an array of anchor elements
 * @param {*} selector
 * @param validator // validates the given element
 */
export const getUrlsBySelector = (selector: string, validator: UrlElementValidator = defaultUrlElementValidator): GetUrlsFunction => {
    return () => {
        const urls: ArticleLink[] = [];
        document.querySelectorAll(selector).forEach((item: HTMLAnchorElement) => {
            const href = item.href;

            // only unique urls are collected
            if (href && !urls.find((link: ArticleLink) => link.url === href)) {
                const articleLink = {
                    element: item,
                    url: href
                };
                if (!validator || validator(articleLink)) {
                    urls.push(articleLink);
                }
            }
        });

        return urls;
    };
};

/**
 * Returns function that gets the keywords from body and meta tags
 * @param metaTagsNames
 * @param selectors
 * @param keywordExtractionMethod
 * @param cityExtractionMethod
 * @param bodyElementCleaner
 */
export const getKeywordsByMetaAndBody = (
    metaTagsNames: string[],
    // the different selectors to find the title and body and possibly the city in the dom
    selectors: ArticleSelectors,
    // the text from the body will be handled by this method to extract the keywords
    keywordExtractionMethod: GetKeywordsMethod = getKeywordsByDefault(5),
    // the city will be extracted by this method
    cityExtractionMethod: GetCityMethod = getCityBySelector,
    bodyElementCleaner: BodyElementCleaner = (list) => Array.from(list)
): GetKeywords => {
    return (dom): Keywords => {
        // get the keywords from the meta tags
        const metaKeyWords: string[] = getKeywordsFromMetaTags(metaTagsNames, keywordExtractionMethod)(dom);
        // get the keywords from the body and title
        const bodyKeyWords: string[] = getKeywordsFromBodyAndTitle(selectors, keywordExtractionMethod, cityExtractionMethod, bodyElementCleaner)(dom);

        // we only want to do anything if there were keywords found in the body text
        if (bodyKeyWords.length) {
            return removeDoubles([...metaKeyWords.slice(0, 1), ...bodyKeyWords]);
        }

        return [];
    };
};


/**
 * Return function that loops through all the meta tags, checks if the name attribute is in the given list and then
 * splits the content on a comma, resulting in a list of unique keywords
 * @param metaTagNames
 * @param method
 */
export const getKeywordsFromMetaTags = (metaTagNames: string[] = [], method: GetKeywordsMethod = getKeywordsByDefault(2)): GetKeywords => {
    return (dom): Keywords => {
        const keywordTags = getMetaTags(dom, getMetaTagNameFilter(metaTagNames));
        const result: string[] = [];

        keywordTags.forEach((tag: Element) => {
            const keywords = tag.getAttribute('content');
            if (keywords) {
                keywords.split(/,\s*/).forEach((keyword: string) => {
                    if (result.indexOf(keyword) === -1) {
                        result.push(keyword);
                    }
                });
            }
        });

        const text = result.join(' ');
        return method(text, textToTokens(text));
    };
};

/**
 * Return function that gets the keywords from the body by selecting an element by selector, getting the text content from it and
 * using a rake algorithm extract keywords from it
 * @param selectors
 * @param keywordExtractionMethod
 * @param cityExtractionMethod
 * @param bodyElementCleaner
 */
export const getKeywordsFromBodyAndTitle = (
    // the different selectors to find the title and body and possibly the city in the dom
    selectors: ArticleSelectors,
    // the text from the body will be handled by this method to extract the keywords
    keywordExtractionMethod: GetKeywordsMethod = getKeywordsByDefault(5),
    // the city will be extracted by this method
    cityExtractionMethod: GetCityMethod = getCityBySelector,
    bodyElementCleaner: BodyElementCleaner = (list) => Array.from(list)
): GetKeywords => {
    return (dom): Keywords => {
        // get keywords from the body using the given algorithm
        const articleTitle = dom.querySelector(selectors.title);
        const articleBodyNodes = bodyElementCleaner(dom.querySelectorAll(selectors.body));

        if (articleTitle && articleBodyNodes) {
            // double word value for title
            const text: string = (articleTitle.textContent + ' ' || '').repeat(2) + extractTextFromNodes(articleBodyNodes);
            const tokens: TokenWords = textToTokens(text);

            // we will only match keywords if any of the weed cutter words have been found. This will limit the number of matches greatly
            if (matchesKeywords(tokens, weedCutterWords)) {
                const keywords: Keywords = keywordExtractionMethod(text, tokens);

                // we are interested in the city
                const city = cityExtractionMethod(selectors.city, dom);
                if (city) {
                    keywords.unshift(city.toLowerCase());
                }

                // add street name to keywords if one is found in the text, but only one
                const streetName: string = getStreetName(tokens);
                if (streetName) {
                    keywords.push(streetName.toLowerCase());
                }

                const uniqueKeywords = removeDoubles(keywords);

                // if we dont get a minimum of 3 it is unlikely we will be getting relevant results
                if (uniqueKeywords.length >= 3) {
                    return uniqueKeywords;
                } else {
                    return [];
                }
            }
        }

        return [];
    };
};

/**
 * Find the city by css selector
 * @param selector
 * @param dom
 */
export const getCityBySelector: GetCityMethod = (selector: string, dom: DocumentFragment) => {
    if (selector) {
        const cityElement = dom.querySelector(selector);
        const city = cityElement ? normalize(cityElement.textContent || '') : '';
        return city;
    }
    return '';
};

/**
 * Find for the first upper cased words of the text selected by the given selector
 * @param selector
 * @param dom
 */
export const getCityByFirstUpperCaseWord: GetCityMethod = (selector: string, dom: DocumentFragment) => {
    if (selector) {
        const article = dom.querySelector(selector);
        if (article) {
            const articleText = (article.textContent || '').trim();
            const city = articleText.match(/^[A-Z][A-Z ]+[A-Z]/);
            if (city) {
                return city.toString();
            }
        }
    }
    return '';
};

/**
 * Returns a function that checks for the existence of an element within the document
 * @param selector
 */
export const containsSelector = (selector: string): IsArticlePage => {
    return () => document.querySelector(selector) !== null;
};

/**
 * Returns function that performs a simple update of the element by prefixing the content with the result data
 */
export const updateElementByTitlePrefix = (childSelector?: string): UpdateElement => {
    return (count, element) => {
        if (count > 0) {
            const className = 'vhnw-indicator-img';
            const childElement = childSelector && element.querySelector(childSelector);
            const elementToUpdate = childElement || element;

            // check if the element does not have a marker yet
            if (!elementToUpdate.querySelector(`img.${className}`)) {
                const indicator = document.createElement('img') as HTMLImageElement;
                indicator.src = browser.extension.getURL('images/icon.svg');
                indicator.className = className;
                indicator.title = '[Voordat het nieuws was] Resultaten gevonden voor dit artikel';
                indicator.alt = 'Voordat het nieuws was indicator';

                elementToUpdate.appendChild(indicator);
            }
        }
    };
};

/**
 * Default validator to check validity of found url elements
 * @param link
 */
export const defaultUrlElementValidator = (link: ArticleLink) => true;

/**
 * default to not a single page application
 */
export const defaultSPAChecker = () => false;

/**
 * Concat all nodes to one text string
 * @param nodes
 */
const extractTextFromNodes = (nodes: Element[]) => nodes.reduce((acc: string, node: Element) => acc + (node.textContent || ''), '');
