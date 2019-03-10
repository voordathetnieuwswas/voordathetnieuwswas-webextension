import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, getCityBySelector,
    getKeywordsFromBodyAndTitle,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/limburg';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `article.article-teaser a, div.widget--mostread li a`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.article__body', title: '.article__header h1', city: '.widget--avl-regio-header .section-title' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityBySelector,
    ),
    updateElement: updateElementByTitlePrefix(),
    isArticlePage: containsSelector('.article__body'),
};
