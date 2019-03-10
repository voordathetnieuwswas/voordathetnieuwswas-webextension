import { ArticleLink, SiteHandler } from '../../entities/handlers';
import {
    containsSelector,
    getKeywordsByMetaAndBody,
    getUrlsBySelector,
    updateElementByTitlePrefix
} from '../lib/handlerservice';
import { getKeywordsByWordList } from '../lib/keywords';
import { words, dynamicWords } from '../../words/wordlist';
import { words as provinceWords } from '../../words/noordholland';

/**
 * These classes are used as link classes to articles on the homepage
 */
const linkSelector = `a.common-components-articleteasers_articleteaserlarge--link,
                a.common-components-articleteasers_articleteasermedium--link,
                a.common-components-articleteasers_articleteasersmall--link,
                a.common-components-articleteasers_articleteasersmallwide--link,
                a.common-components-articleteasers_articleteasermini--link`;


export const handler: SiteHandler = {
    shouldHandle: (location) => !location.pathname.startsWith('/sport'),
    getUrls: getUrlsBySelector(linkSelector, (link: ArticleLink) => {
        // premium box check
        // const premiumBox = link.element.querySelector('.common-components-articleteasers_articleteaserminiplus--plus, .common-components-articleteasers_articleteasersmallplus--plus');
        // return premiumBox ? false: true;

        // we do not want to check sport links
        return !link.element.closest('[data-mht-widget="wg-|-nhd-|-sportblok"]');
    }),
    getKeywords: getKeywordsByMetaAndBody(
        ['keywords', 'news_keywords'],
        { body: '.common-components-article_index--articlebody', title: 'h1', city: '.common-components-article_locationlabel--label' },
        getKeywordsByWordList(provinceWords.concat(words), dynamicWords, 3)
    ),
    updateElement: updateElementByTitlePrefix(
        '.common-components-articleteasers_articletitletext--text'
    ),
    isArticlePage: containsSelector('.common-components-article_index--articlebody'),
};
