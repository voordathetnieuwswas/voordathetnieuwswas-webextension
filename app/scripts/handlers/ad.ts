import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector,
    getKeywordsFromBodyAndTitle,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/zuidholland';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `a.ankeiler__link`;

export const handler: SiteHandler = {
    shouldHandle: (location) => !!location.pathname.match(/^\/?(?:rotterdam|utrecht)/i),
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.article__wrapper', title: 'h1.article__title', city: '.article__intro' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        (selector, dom) => '',
    ),
    updateElement: updateElementByTitlePrefix(
        '.ankeiler__title'
    ),
    isArticlePage: containsSelector('.article__wrapper'),
};
