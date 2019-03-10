import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector,
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
        { body: 'main > body', title: '.article__title', city: '' }
    ),
    updateElement: updateElementByTitlePrefix('[class*="__title"]'),
    isArticlePage: containsSelector('.article_body'),
};
