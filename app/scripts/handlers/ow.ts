import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, getCityByFirstUpperCaseWord,
    getKeywordsByMetaAndBody,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/zuidholland';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `.block-news > a, .spotlight-news .spotlight-item > a, .newsitems li > a`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsByMetaAndBody(
        ['keywords'],
        { body: '.article-content .intro, .article-content .newsitem-customhtml', title: 'h1.article-title', city: '.article-content .intro' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityByFirstUpperCaseWord,
    ),
    updateElement: updateElementByTitlePrefix('h3'),
    isArticlePage: containsSelector('.newsitem-template'),
};
