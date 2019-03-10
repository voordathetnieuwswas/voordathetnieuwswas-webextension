import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, getCityByFirstUpperCaseWord,
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
const linkSelector = `.post`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.detail__content', title: 'h1.heading__title', city: '.detail__content' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityByFirstUpperCaseWord,
    ),
    updateElement: updateElementByTitlePrefix(
        '.post__title'
    ),
    isArticlePage: containsSelector('.detail-page'),
};
