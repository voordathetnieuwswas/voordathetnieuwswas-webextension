import { MediaObject } from '../scripts/lib/openstate';

export interface SiteHandler {
    getUrls: GetUrlsFunction;
    getKeywords: GetKeywords;
    mutatablesSelector: string;
    updateElement: UpdateElement;
    isArticlePage: IsArticlePage;
    isSPA: IsSinglePageApplication;
    shouldHandle: (location: HTMLHyperlinkElementUtils | Location) => boolean;
}

export interface ArticleLink {
    element: Element;
    url: string;
}

export interface ArticleSelectors {
    title: string;
    body: string;
    city: string;
}

export type Keywords = string[];
export type TokenWords = string[];
export type WordList = string[];
export type DynamicWordList = RegExp[];
export type GetUrlsFunction = () => ArticleLink[];
export type GetKeywords = (dom: DocumentFragment) => Keywords;
export type UpdateElement = (count: number, element: Element) => void;
export type IsArticlePage = () => boolean;
export type IsSinglePageApplication = () => boolean;
export type GetKeywordsMethod = (text: string, tokens: TokenWords) => Keywords;
export type GetCityMethod = (selector: string, dom: DocumentFragment) => string;
export type UrlElementValidator = (link: ArticleLink) => boolean;
export type BodyElementCleaner = (nodes: NodeListOf<Element>) => Element[];

export interface CacheItem {
    count: number | null;
    results: MediaObject[] | null;
    time: number;
    keywords: Keywords;
}
