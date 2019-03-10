import { SiteHandler } from '../../entities/handlers';

declare var require: any;

const sourceList = require('./sourceList');

/**
 * Match the given host name to our sources. If it is found require the SiteHandler and return the interface
 * @param host
 */
export const getSiteHandler = (host: string): SiteHandler | null => {
    // @todo fix type definition for sourceList in a .d.ts file or something...
    const foo: any = sourceList;
    if (Object.keys(sourceList).indexOf(host) > -1) {
        return require(`./${foo[host]}`).handler;
    }

    return null;
};
