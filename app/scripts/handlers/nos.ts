import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, defaultSPAChecker,
    getKeywordsByMetaAndBody,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `#featured a, a[href*="/artikel"]`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsByMetaAndBody(
        ['keywords', 'news_keywords'],
        { body: '[class^=contentBody]', title: 'h1', city: '' }
    ),
    updateElement: updateElementByTitlePrefix('[class*="__title"]'),
    isArticlePage: containsSelector('.page-article'),
    isSPA: defaultSPAChecker,
    mutatablesSelector: '',
};
