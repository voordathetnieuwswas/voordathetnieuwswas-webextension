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
const linkSelector = `a.post--news, a.spklw-post-link, a.post`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.detail__content', title: 'h1.heading__title', city: '.detail__content' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityByFirstUpperCaseWord,
        (list) => {
            const newList: Element[] = [];
            list.forEach((node) => {
                // let paragraphTagFound = false;
                node.childNodes[0].childNodes.forEach((childNode: Element) => {
                    if (childNode.nodeName.toLowerCase() === 'p' && childNode.textContent && !childNode.textContent.match(/^Lees ook/)) {
                        newList.push(childNode);
                    }
                });
            });

            return newList;
        }
    ),
    updateElement: updateElementByTitlePrefix(
        '.post__title div span, .post__title, .spklw-post-title'
    ),
    isArticlePage: containsSelector('.detail-page'),
    isSPA: () => true,
    mutatablesSelector: '.news-list, main .detail-page .container',
};
