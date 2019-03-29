import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, defaultSPAChecker,
    getKeywordsFromBodyAndTitle,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/noordholland';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `a.ankeiler__link, .articles-list article a:first-child`;

export const handler: SiteHandler = {
    shouldHandle: (location) => !location.pathname.startsWith('/alle-nieuws-over-') && !location.pathname.startsWith('/sport') && !location.pathname.startsWith('/opinie') && !location.pathname.startsWith('/stadsgids'),
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.article__body', title: '.article__header h1', city: '' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        (selector: string, dom: DocumentFragment) => {
            if (location.pathname.startsWith('/amsterdam')) {
                return 'Amsterdam';
            }
            return '';
        },
    ),
    updateElement: updateElementByTitlePrefix(
        '.ankeiler__body-text, .ankeiler__title, .article__header__title, .article__title'
    ),
    isArticlePage: containsSelector('.article.article--full'),
    isSPA: defaultSPAChecker,
    mutatablesSelector: '',
};
