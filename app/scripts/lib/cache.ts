import md5 from 'md5';
import { CacheItem } from '../../entities/handlers';

export default class OpenStateCache {
    static LOCAL = 'local';
    static SYNCED = 'sync';
    static MANAGED = 'managed';

    duration: any = null;
    cache: any = null;
    storage: any = null;

    constructor(type = OpenStateCache.LOCAL, duration = 60 * 60 * 1000) {
        switch (type) {
            case OpenStateCache.LOCAL:
                this.storage = browser.storage.local;
                break;
            case OpenStateCache.SYNCED:
                this.storage = browser.storage.sync;
                break;
            case OpenStateCache.MANAGED:
                this.storage = browser.storage.managed;
                break;
        }
        this.duration = duration;
    }

    init(): Promise<any> {
        return this.storage.get(null).then((data: any) => {
            this.cache = data;

            // Clear cache when organization filter settings change
            browser.storage.onChanged.addListener((changes, area) => {
                if (area === 'sync' &&
                    // @ts-ignore Typing incorrectly specifies changes parameter
                    (changes.filterOrganizations || changes.enabledProvinces || changes.enabledMunicipalities)
                ) {
                    this.clear();
                }
            });

            // Remove expired data
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    if (!this.isValid(key)) {
                        this.remove(key);
                    }

                    delete data[data];
                }
            }

            return data;
        });
    }

    get(key: string): CacheItem | null {
        const hashedKey = this.hash(key);

        if (this.isValid(hashedKey)) {
            return this.cache[hashedKey];
        }

        this.remove(key);
        return null;
    }

    set(key: string, value: CacheItem): Promise<void> {
        key = this.hash(key);
        this.cache[key] = value;
        return this.storage.set(this.cache);
    }

    remove(key: string) {
        key = this.hash(key);

        delete this.cache[key];
        return this.storage.remove(key);
    }

    clear() {
        return this.storage.clear();
    }

    create(): CacheItem {
        return { results: null, count: null, time: (new Date()).getTime(), keywords: [] };
    }

    private isValid(key: string) {
        const now = (new Date()).getTime();
        return this.cache[key] && this.cache[key].time > now - this.duration;
    }

    private hash(key: string) {
        return md5(key);
    }
}

let defaultCache: Promise<OpenStateCache>;

const initDefaultCache = async () => {
    const cache = new OpenStateCache();
    await cache.init();

    return cache;
};

export const getDefaultCache = async () => {
    if (defaultCache === undefined) {
        defaultCache = initDefaultCache();
    }

    return defaultCache;
};
