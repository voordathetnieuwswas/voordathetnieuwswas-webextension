import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, getCityBySelector, getKeywordsByMetaAndBody,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/limburg';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `.node-article .article-title a`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsByMetaAndBody(
        ['news_keywords'],
        { body: '.article-detail-wrapper .article-lead, .article-detail-wrapper .article-body', title: '.view-mode-full h1', city: '' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityBySelector,
    ),
    updateElement: updateElementByTitlePrefix(),
    isArticlePage: containsSelector('.article-detail-wrapper'),
};
