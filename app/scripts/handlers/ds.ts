import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, defaultSPAChecker,
    getKeywordsFromBodyAndTitle,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWordsUtrecht } from '../../words/utrecht';
import { words as provinceWordsFlevoland } from '../../words/flevoland';

const provinceWords = provinceWordsUtrecht.concat(provinceWordsFlevoland);

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `a.ankeiler__link`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
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
    isSPA: defaultSPAChecker,
    mutatablesSelector: '',
};
