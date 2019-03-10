import { getOptions, Options } from './options';
import { OpenStateEvent } from '../../entities/handlers';

const BASE_URL = 'https://api.openraadsinformatie.nl/v0/search';
const MAX_RESULT_SIZE = 500;
const DATE_INTERVAL_DAYS = 14;

interface ResultMeta {
    took: number;
    total: number;
}

export interface Organization {
    id: string;
    name: string;
    classification: string;
    description: string;
    meta: {
        collection: string;
    };
}

export interface BasicOrganizations {
    provinces: { [id: string]: string };
    municipalities: { [id: string]: string };
}

interface SearchResponse {
    meta: ResultMeta;
    organizations?: Organization[];
    events?: OpenStateEvent[];
}

interface DateFilter {
    from: string; // Format: Y-m-d
    to: string; // Format: Y-m-d
}

interface TermsFilter {
    terms: string[];
}

interface SearchParameters {
    query?: string;
    filters?: {
        processing_started?: DateFilter;
        processing_finished?: DateFilter;
        source?: TermsFilter;
        collection?: TermsFilter;
        rights?: TermsFilter;
        index?: TermsFilter;
        types?: TermsFilter;
        start_date?: DateFilter;
        organization_id?: TermsFilter;
        classification?: TermsFilter;
    };
    facets?: any; // Not specified since we don't use this at the moment
    sort?: string;
    order?: string;
    size?: number;
    from?: number;
}

export interface DocumentResult {
    source: {
        note: string;
        url: string;
    };
    event: {
        name: string;
        collection: string;
        classification: string;
        startDate?: string;
    };
    highlights: string[];
}

export const findCount = async (keywords: string[], daysAgo: number = DATE_INTERVAL_DAYS): Promise<number> => {
    const options = await getOptions();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysAgo);

    const params: SearchParameters = {
        filters: {
            types: {
                terms: [
                    'events'
                ]
            },
            collection: {
                terms: await collectionTerms(options)
            },
            start_date: {
                from: fromDate.toISOString().substr(0, 10),
                to: (new Date()).toISOString().substr(0, 10)
            }
        },
        size: 0,
        query: keywords.map(keyword => `"${keyword}"`).join(' ')
    };

    const result = await sendSearchRequest(params);

    return result.meta.total;
};

export const findResults = async (keywords: string[], offset: number = 0, daysAgo: number = DATE_INTERVAL_DAYS): Promise<SearchResponse> => {
    const options = await getOptions();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysAgo);

    const params: SearchParameters = {
        filters: {
            types: {
                terms: [
                    'events'
                ]
            },
            collection: {
                terms: await collectionTerms(options)
            },
            start_date: {
                from: fromDate.toISOString().substr(0, 10),
                to: (new Date()).toISOString().substr(0, 10)
            }
        },
        size: 10,
        from: offset,
        query: keywords.map(keyword => `"${keyword}"`).join(' ')
    };

    return sendSearchRequest(params);
};

const collectionTerms = async (options: Options): Promise<string[]> => {
    if (options.filterOrganizations) {
        return options.enabledProvinces.concat(options.enabledMunicipalities);
    } else {
        const organizations = await findOrganizationsBasic();
        return Object.keys(organizations.provinces);
    }
};

/**
 * Attempts to find 10 DocumentResults for the given keywords.
 * Will run repeated API requests in case not enough valid documents can be extracted from the initial result set.
 */
export const findDocumentResults = async (keywords: string[], daysAgo: number = DATE_INTERVAL_DAYS): Promise<DocumentResult[]> => {
    const results: DocumentResult[] = [];
    const sourceUrls: string[] = [];
    let i = 0;
    let totalResults = 1000;

    while (results.length < 10 && totalResults > (i + 1) * 10) {
        const searchResult = await findResults(keywords, i * 10, daysAgo);
        const events = searchResult.events;
        totalResults = searchResult.meta.total;

        events && events.map((event: OpenStateEvent) => {
            if (event.meta.highlight && event.meta.highlight['sources.description']) {
                // Remove duplicates
                const highlights = Array.from(new Set(event.meta.highlight['sources.description']));

                event.sources.map(source => {
                    if (!source.description || sourceUrls.includes(source.url)) {
                        return;
                    }

                    const matchedHighlights = highlights.filter(highlight => {
                        const cleanHighlight = highlight.replace(/<\/?em>/g, '');
                        return source.description.includes(cleanHighlight);
                    });

                    if (!matchedHighlights || !matchedHighlights.length) {
                        return;
                    }

                    results.push({
                        source: {
                            note: source.note,
                            url: source.url
                        },
                        event: {
                            name: event.name,
                            collection: event.meta.collection,
                            classification: event.classification,
                            startDate: event.start_date
                        },
                        highlights: matchedHighlights
                    });
                    sourceUrls.push(source.url);
                });
            }
        });

        i++;
    }

    return results.slice(0, 10);
};

export const findOrganizations = async (types: string | string[]): Promise<Organization[]> => {
    if (!Array.isArray(types)) {
        types = [types];
    }

    const result = await sendSearchRequest({
        filters: {
            classification: {
                terms: types
            }
        },
        size: MAX_RESULT_SIZE,
        sort: 'meta.source_id',
        order: 'asc'
    }, '/organizations');

    return result.organizations || [];
};

let cachedOrganizations: BasicOrganizations;
export const findOrganizationsBasic = async (): Promise<BasicOrganizations> => {
    if (!cachedOrganizations) {
        const result: BasicOrganizations = {
            municipalities: {},
            provinces: {}
        };
        const data = await findOrganizations(['Municipality', 'Province']);

        data.map(organization => {
            const index = organization.classification === 'Province' ? 'provinces' : 'municipalities';
            result[index][organization.meta.collection] = organization.name;
        });

        cachedOrganizations = result;
    }

    return cachedOrganizations;
};

const sendSearchRequest = async (params: SearchParameters, path: string = '', repeated: boolean = false): Promise<SearchResponse> => {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        body: JSON.stringify(params)
    });

    // the calls often fail without reason
    if (response.status !== 200 && !repeated) {
        return sendSearchRequest(params, path, true);
    }

    return await response.json();
};