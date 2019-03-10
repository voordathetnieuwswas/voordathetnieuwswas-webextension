import { DocumentResult } from '../scripts/lib/openstate';

export interface SiteHandler {
    getUrls: GetUrlsFunction;
    getKeywords: GetKeywords;
    updateElement: UpdateElement;
    isArticlePage: IsArticlePage;
    shouldHandle: (location: HTMLHyperlinkElementUtils|Location) => boolean;
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
export type GetKeywordsMethod = (text: string, tokens: TokenWords) => Keywords;
export type GetCityMethod = (selector: string, dom: DocumentFragment) => string;
export type UrlElementValidator = (link: ArticleLink) => boolean;
export type BodyElementCleaner = (nodes:NodeListOf<Element>) => Element[];

export interface CacheItem {
    count: number | null;
    results: DocumentResult[] | null;
    time: number;
    keywords: Keywords;
}

export interface Source {
    description: string;
    note: string;
    url: string;
}

export interface OpenStateEvent {
    id: string;
    name: string;
    classification: string;
    sources: Source[];
    meta: {
        highlight?: {
            [key: string]: string[];
        };
        collection: string;
    };
    start_date?: string;
}

export interface HitCounts {
    province: number;
    municipality: number;
}


