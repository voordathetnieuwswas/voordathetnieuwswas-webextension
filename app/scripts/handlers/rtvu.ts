import { SiteHandler } from '../../entities/handlers';
import {
    containsSelector, defaultSPAChecker, getCityByFirstUpperCaseWord,
    getKeywordsByMetaAndBody,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/utrecht';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `.spotlight-news h3 a, .news-block a, .newsitem a, .search-results li.visible a:first-child`;

export const handler: SiteHandler = {
    shouldHandle: (location) => true,
    getUrls: getUrlsBySelector(linkSelector),
    getKeywords: getKeywordsByMetaAndBody(
        ['keywords'],
        { body: '.article-content', title: 'h1.article-title', city: '' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        getCityByFirstUpperCaseWord,
        // the articles on this page contain to much information inside the main article node and needs to be cleaned up.
        // As soon as we encounter a p tag, the article content itself is over and the rest can be removed. Also all div's can be removed
        (list) => {
            const newList: Element[] = [];
            list.forEach((node) => {
                let paragraphTagFound = false;
                const newNode = document.createElement('div');
                node.childNodes.forEach((childNode: Element) => {
                    if (childNode.nodeName.toLowerCase() === 'p') {
                        paragraphTagFound = true;
                    }

                    if (!paragraphTagFound && childNode.nodeName.toLowerCase() !== 'div') {
                        newNode.appendChild(childNode);
                    }
                });

                newList.push(newNode);
            });

            return newList;
        }
    ),
    updateElement: updateElementByTitlePrefix(
        '.newsitem-title, .block-title a'
    ),
    isArticlePage: containsSelector('.article-content'),
    isSPA: defaultSPAChecker,
    mutatablesSelector: '',
};
