import { getOptions } from './options';
import { getDefaultCache } from './cache';

const BASE_URL_SEARCH = 'https://api.openraadsinformatie.nl/v1/elastic';
// const BASE_URL_LOOKUP = 'https://id.openraadsinformatie.nl';
const MAX_RESULT_SIZE = 10000;
const DATE_INTERVAL_DAYS = 14;

let relatedItems: Promise<string[]>;

export interface Document {
    _id: string;
    _index: string;
    _source: object;
    highlight?: object;
}

export interface SearchResponse {
    hits: {
        hits: Document[];
        total: {
            value: number;
        };
    };
    timed_out: boolean;
}

export interface Organization {
    id: string;
    name: string;
    classification: string;
    collection: string;
}

export interface BasicOrganizations {
    provinces: { [id: string]: string };
    municipalities: { [id: string]: string };
}

export interface MediaObject {
    id: string;
    index: string;
    name: string;
    content_type: string;
    url: string;
    size_in_bytes: number;
    highlight: {
        name?: string[];
        text?: string[];
    };
    date_modified?: string;
}

const mediaObjectsQuery = async (keywords: string[]) => ({
    bool: {
        must: [
            {
                match: {
                    '@type': 'MediaObject'
                }
            },
            {
                simple_query_string: {
                    fields: ['text', 'name'],
                    default_operator: 'and',
                    query: keywords.join(' ')
                }
            },
            {
                exists: {
                    field: 'url'
                }
            },
            {
                terms: {
                    isReferencedBy: await getRelatedItems()
                }
            }
        ]
    }
});

const getRelatedItems = () => {
    if (relatedItems === undefined) {
        relatedItems = findRelatedItems();
    }

    return relatedItems;
};

const findRelatedItems = async () => {
    const cache = await getDefaultCache();
    const cachedItems = cache.get('referencedItemIds');
    if (cachedItems) {
        return cachedItems.keywords;
    }

    const query = {
        query: {
            bool: {
                must: [
                    {
                        range: {
                            start_date: {
                                gte: `now-${DATE_INTERVAL_DAYS}d/d`
                            }
                        }
                    },
                    {
                        exists: {
                            field: 'attachment'
                        }
                    }
                ]
            }
        },
        size: MAX_RESULT_SIZE,
        _source: false
    };

    const result = await sendSearchRequest(query);
    const ids = result.hits.hits.map(hit => hit._id);
    const cacheItem = cache.create();
    cacheItem.keywords = ids;
    cache.set('referencedItemIds', cacheItem);

    return ids;
};

export const findCount = async (keywords: string[]): Promise<number> => {
    const query = {
        query: await mediaObjectsQuery(keywords),
        size: 0,
    };

    const result = await sendSearchRequest(query);

    return result.hits.total.value;
};

export const findResults = async (keywords: string[]): Promise<MediaObject[]> => {
    const response = await sendSearchRequest({
        query: await mediaObjectsQuery(keywords),
        highlight: {
            fields: {
                name: {},
                text: {}
            }
        },
        size: 10,
        _source: [
            'content_type',
            'date_modified',
            'id',
            'name',
            'size_in_bytes',
            'url',
            'isReferencedBy'
        ]
    });

    return response.hits.hits.map((hit: Document) => ({
        id: hit._id,
        index: hit._index,
        highlight: hit.highlight,
        ...hit._source
    } as MediaObject));
};

const getEnabledIndices = async (): Promise<string> => {
    const options = await getOptions();

    if (options.filterOrganizations) {
        return options.enabledProvinces.map(province => `osi_${province}_*`)
            .concat(options.enabledMunicipalities.map(municipality => `ori_${municipality}_*`))
            .join(',');
    }

    return 'osi_*';
};

export const findOrganizations = async (types: string | string[]): Promise<Organization[]> => {
    if (!Array.isArray(types)) {
        types = [types];
    }

    const response = await sendSearchRequest(
        {
            size: MAX_RESULT_SIZE,
            query: {
                bool: {
                    should: types.map(type => ({
                        match: {
                            classification: type
                        }
                    }))
                }
            },
            _source: [
                'name',
                'classification',
                'collection'
            ]
        },
        true
    );

    return response.hits.hits.map((hit: Document) => ({
        id: hit._id,
        index: hit._index,
        ...hit._source
    } as unknown as Organization));
};

let cachedOrganizations: BasicOrganizations;
export const findOrganizationsBasic = async (): Promise<BasicOrganizations> => {
    if (!cachedOrganizations) {
        const result: BasicOrganizations = {
            municipalities: {},
            provinces: {}
        };
        const data = await findOrganizations(['Municipality', 'Province']);
        data.sort((a, b) => a.name.localeCompare(b.name));

        data.map(organization => {
            const index = organization.classification === 'Province' ? 'provinces' : 'municipalities';
            result[index][organization.collection] = organization.name;
        });

        cachedOrganizations = result;
    }

    return cachedOrganizations;
};

const sendSearchRequest = async (query: object, global: boolean = false): Promise<SearchResponse> => {
    const path = global ? '_search' : `${await getEnabledIndices()}/_search`;

    const response = await fetch(`${BASE_URL_SEARCH}/${path}`, {
        method: 'POST',
        body: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json',
        }
    });

    return await response.json();
};
