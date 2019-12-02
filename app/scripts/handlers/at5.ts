import { ArticleLink, SiteHandler } from '../../entities/handlers';
import {
    containsSelector,
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
    shouldHandle: (location) => !location.pathname.startsWith('/ajax') && !location.pathname.startsWith('/112'),
    getUrls: getUrlsBySelector(linkSelector, (link: ArticleLink) => {
        return !link.url.match('/ajax') && !link.url.match('/112');
    }),
    getKeywords: getKeywordsFromBodyAndTitle(
        { body: '.detail__content', title: 'h1', city: '' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3),
        (selector, dom) => {
            return 'Amsterdam';
        },
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
    mutatablesSelector: '.news-list, main .detail-page .container'
};
