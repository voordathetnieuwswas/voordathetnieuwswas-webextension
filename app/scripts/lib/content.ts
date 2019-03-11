import { ArticleLink, CacheItem, Keywords, SiteHandler } from '../../entities/handlers';
import { getArticleBody } from './net';
import { findCount, findDocumentResults } from './openstate';
import { getDom } from './dom';
import OpenStateCache from './cache';

export const handleArticleLinks = (siteHandler: SiteHandler, cache: OpenStateCache) => {
    // Get all links to a body from the SiteHandler
    siteHandler.getUrls().map((item: ArticleLink) => {
        const cacheItem = cache.get(item.url) || cache.create();

        if (cacheItem.count === null) {
            // fetch the body body from the url

            const loc = document.createElement('a');
            loc.href = item.url;

            if(siteHandler.shouldHandle(loc)){
                return getArticleBody(item.url).then((dom) => {
                    // extract keywords from the body body
                    if (dom) {
                        const keywords = getKeywordsFromSiteHandler(siteHandler, dom);
                        if (keywords && keywords.length) {
                            // search keywords on openstate api
                            // TODO: remove daysAgo before release
                            // findCount(keywords, 50)
                            findCount(keywords)
                                .then((count: number) => {
                                    siteHandler.updateElement(count, item.element);
                                    cache.set(item.url, { ...cacheItem, count, keywords });
                                });
                        }
                    }
                });
            } else {
                return Promise.resolve(null);
            }
        } else {
            // update the html on the visited page
            siteHandler.updateElement(cacheItem.count, item.element);
            return Promise.resolve(null);
        }
    });
};

export const handleCurrentArticle = async (siteHandler: SiteHandler, cache: OpenStateCache): Promise<CacheItem | null> => {
    const dom = getDom(document.documentElement.innerHTML);
    const keywords = getKeywordsFromSiteHandler(siteHandler, dom);

    // TODO remove
    // console.log('keywords: ', keywords)

    if(keywords && keywords.length){
        let cacheItem = cache.get(location.href) || cache.create();

        if (cacheItem.results === null) {
            // Search by keywords on Open State API
            // TODO: remove daysAgo before release
            // const data = await findDocumentResults(keywords, 50);
            const data = await findDocumentResults(keywords);
            if (data) {
                cacheItem = { ...cacheItem, results: data, keywords };
                cache.set(location.href, cacheItem);
            }
        }

        return cacheItem;
    }

    return null;
};

const getKeywordsFromSiteHandler = (siteHandler: SiteHandler, dom: DocumentFragment): Keywords => siteHandler.getKeywords(dom);
