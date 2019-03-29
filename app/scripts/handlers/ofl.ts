import { ArticleLink, SiteHandler } from '../../entities/handlers';
import {
    containsSelector, defaultSPAChecker, getCityBySelector,
    getKeywordsFromBodyAndTitle,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/flevoland';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `.list__cards li a`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector, (link: ArticleLink) => {
        return !!link.url.match(/^\/?nieuws/);
    }),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.article__content', title: 'article header h2', city: 'article header .card__info span.t--red.t--strong.t--capitalize' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityBySelector,
    ),
    updateElement: updateElementByTitlePrefix('h3'),
    isArticlePage: containsSelector('.article__content'),
    isSPA: defaultSPAChecker,
    mutatablesSelector: '',
};
