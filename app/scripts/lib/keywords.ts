import { DynamicWordList, GetKeywordsMethod, Keywords, TokenWords, WordList } from '../../entities/handlers';

/**
 * Replace accented characters with their non-accented counter part
 * @param str
 */
export const removeDiacritics = (str: string): string => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Just returns the first {maximum} words
 * @param maximum
 */
export const getKeywordsByDefault = (maximum: number): GetKeywordsMethod => (text: string, tokens: TokenWords) => tokens.slice(0, maximum);

/**
 * Does the given token list match any of the given regexps
 * @param wordList
 * @param tokens
 */
export const matchesKeywords = (tokens: TokenWords, wordList: DynamicWordList) => {
    return tokens.reduce((acc: any, word: string) => {
        if (!acc && wordList.find((regex: RegExp) => {
            return !!word.match(regex);
        })) {
            acc = true;
        }

        return acc;
    }, false);
};

/**
 * Match the text against a given list of words to match
 * @param wordList
 * @param dynamicWordList
 * @param maximum
 */
export const getKeywordsByWordList = (wordList: WordList, dynamicWordList: DynamicWordList, maximum: number = 5): GetKeywordsMethod => (text: string, tokens: TokenWords): Keywords => {
    // find keywords from word list
    const foundKeywords = tokens.reduce((acc: any, word: string) => {
        if (wordList.indexOf(word) > -1 || dynamicWordList.find((regex: RegExp) => {
            return !!word.match(regex);
        })) {
            if (!acc[word]) {
                acc[word] = 1;
            } else {
                acc[word]++;
            }
        }

        return acc;
    }, {});

    // determine priority of found keywords by word count. If they are equal, look at the length of the word, bigger is better
    const keyWordIndex = Object.keys(foundKeywords).sort((a: string, b: string) => {
        const pointsA = getWordScore(a, foundKeywords[a]);
        const pointsB = getWordScore(b, foundKeywords[b]);

        if (pointsA === pointsB) {
            // position is higher
            return a.length >= b.length ? -1 : 1;
        }

        // word count is higher
        return pointsB > pointsB ? -1 : 1;
    });

    // return the top maximum keywords based on count and priority
    return keyWordIndex.slice(0, maximum);
};

/**
 * Match the text on words with common street name endings. Such names are likely to match more related documents
 * @param tokens
 */
export const getStreetName = (tokens: TokenWords): string => {
    const streetNames = tokens.filter((token: string) => {
        return token.match(/^.+(?:straat|weg|laan|pad|plein|dijk|singel|gracht|baan|tunnel|hof|molen|plantsoen|kade|steeg|werf|brug|wal|markt|dreef|boulevard|buurt|wijk|park|viaduct)$/);
    }).reduce((acc: any, streetName: string) => {
        if (!acc[streetName]) {
            acc[streetName] = 1;
        } else {
            acc[streetName]++;
        }
        return acc;
    }, {});

    const mostUsed: any = Object.keys(streetNames).reduce((acc: any, streetName: string) => {
        if (streetNames[streetName] > acc.count) {
            acc = { name: streetName, count: streetNames[streetName] };
        }
        return acc;
    }, { name: '', count: 0 });

    return mostUsed.count > 0 ? mostUsed.name : '';
};

/**
 * Split text in separate words and normalize those
 * @param text
 */
export const textToTokens = (text: string): TokenWords => cleanWords(text.split(/\W+/).map(word => normalize(word)));

/**
 * Transform text into list of lowercase simple asci character words
 * @param word
 */
export const normalize = (word: string) => removeDiacritics(word.trim().toLowerCase());

/**
 * Cut down the number of words to match
 * @param keywords
 */
const cleanWords = (keywords: Keywords): Keywords => {
    keywords = removeCommonWords(keywords);
    keywords = applyBlocklist(keywords);
    keywords = removeNumbers(keywords);
    return keywords;
};

/**
 * Remove common words from the text
 * @param keywords
 */
const removeCommonWords = (keywords: Keywords): Keywords => {
    const common = [
        '', 'a', 'aan', 'aangaande', 'aangezien', 'achter', 'achterna', 'aen', 'af', 'afd', 'afgelopen', 'agter', 'al', 'aldaar', 'aldus', 'alhoewel', 'alias', 'alle', 'allebei', 'alleen', 'alleenlyk', 'allen', 'alles', 'als', 'alsnog', 'altijd', 'altoos', 'altyd', 'ander', 'andere', 'anderen', 'anders', 'anderszins', 'anm', 'b', 'behalve', 'behoudens', 'beide', 'beiden', 'ben', 'beneden', 'bent', 'bepaald', 'beter', 'betere', 'betreffende', 'bij', 'bijna', 'bijvoorbeeld', 'bijv', 'binnen', 'binnenin', 'bizonder', 'bizondere', 'bl', 'blz', 'boven', 'bovenal', 'bovendien', 'bovengenoemd', 'bovenstaand', 'bovenvermeld', 'buiten', 'by', 'daar', 'daarheen', 'daarin', 'daarna', 'daarnet', 'daarom', 'daarop', 'daarvanlangs', 'daer', 'dan', 'dat', 'de', 'deeze', 'den', 'der', 'ders', 'derzelver', 'des', 'deszelfs', 'deszelvs', 'deze', 'dezelfde', 'dezelve', 'dezelven', 'dezen', 'dezer', 'dezulke', 'die', 'dien', 'dikwijls', 'dikwyls', 'dit', 'dl', 'doch', 'doen', 'doet', 'dog', 'door', 'doorgaand', 'doorgaans', 'dr', 'dra', 'ds', 'dus', 'echter', 'ed', 'een', 'eene', 'eenen', 'eener', 'eenig', 'eenige', 'eens', 'eer', 'eerdat', 'eerder', 'eerlang', 'eerst', 'eerste', 'eersten', 'effe', 'egter', 'eigen', 'eigene', 'elk', 'elkanderen', 'elkanderens', 'elke', 'en', 'enig', 'enige', 'enigerlei', 'enigszins', 'enkel', 'enkele', 'enz', 'er', 'erdoor', 'et', 'etc', 'even', 'eveneens', 'evenwel', 'ff', 'gauw', 'ge', 'gebragt', 'gedurende', 'geen', 'geene', 'geenen', 'gegeven', 'gehad', 'geheel', 'geheele', 'gekund', 'geleden', 'gelijk', 'gelyk', 'gemoeten', 'gemogen', 'geven', 'geweest', 'gewoon', 'gewoonweg', 'geworden', 'gezegt', 'gij', 'gt', 'gy', 'haar', 'had', 'hadden', 'hadt', 'haer', 'haere', 'haeren', 'haerer', 'hans', 'hare', 'heb', 'hebben', 'hebt', 'heeft', 'hele', 'hem', 'hen', 'het', 'hier', 'hierbeneden', 'hierboven', 'hierin', 'hij', 'hoe', 'hoewel', 'hun', 'hunne', 'hunner', 'hy', 'ibid', 'idd', 'ieder', 'iemand', 'iet', 'iets', 'ii', 'iig', 'ik', 'ikke', 'ikzelf', 'in', 'indien', 'inmiddels', 'inz', 'inzake', 'is', 'ja', 'je', 'jezelf', 'jij', 'jijzelf', 'jou', 'jouw', 'jouwe', 'juist', 'jullie', 'kan', 'klaar', 'kon', 'konden', 'krachtens', 'kunnen', 'kunt', 'laetste', 'lang', 'later', 'liet', 'liever', 'like', 'm', 'maar', 'maeken', 'maer', 'mag', 'martin', 'me', 'mede', 'meer', 'meesten', 'men', 'menigwerf', 'met', 'mezelf', 'mij', 'mijn', 'mijnent', 'mijner', 'mijzelf', 'min', 'minder', 'misschien', 'mocht', 'mochten', 'moest', 'moesten', 'moet', 'moeten', 'mogelijk', 'mogelyk', 'mogen', 'my', 'myn', 'myne', 'mynen', 'myner', 'myzelf', 'na', 'naar', 'nabij', 'nadat', 'naer', 'net', 'niet', 'niets', 'nimmer', 'nit', 'no', 'noch', 'nog', 'nogal', 'nooit', 'nr', 'nu', 'o', 'of', 'ofschoon', 'om', 'omdat', 'omhoog', 'omlaag', 'omstreeks', 'omtrent', 'omver', 'onder', 'ondertussen', 'ongeveer', 'ons', 'onszelf', 'onze', 'onzen', 'onzer', 'ooit', 'ook', 'oorspr', 'op', 'opdat ', 'opnieuw', 'opzij', 'opzy', 'over', 'overeind', 'overigens', 'p', 'pas', 'pp', 'precies', 'pres', 'prof', 'publ', 'reeds', 'rond', 'rondom', 'rug', 's', 'sedert', 'sinds', 'sindsdien', 'sl', 'slechts', 'sommige', 'spoedig', 'st', 'steeds', 'sy', 't', 'tamelijk', 'tamelyk', 'te', 'tegen', 'tegens', 'ten', 'tenzij', 'ter', 'terwijl', 'terwyl', 'thans', 'tijdens', 'toch', 'toe', 'toen', 'toenmaals', 'toenmalig', 'tot', 'totdat', 'tusschen', 'tussen', 'tydens', 'u', 'uit', 'uitg', 'uitgezonderd', 'uw', 'uwe', 'uwen', 'uwer', 'vaak', 'vaakwat', 'vakgr', 'van', 'vanaf', 'vandaan', 'vanuit', 'vanwege', 'veel', 'veeleer', 'veelen', 'verder', 'verre', 'vert', 'vervolgens', 'vgl', 'vol', 'volgens', 'voor', 'vooraf', 'vooral', 'vooralsnog', 'voorbij', 'voorby', 'voordat', 'voordezen', 'voordien', 'voorheen', 'voorop', 'voort', 'voortgez', 'voorts', 'voortz', 'vooruit', 'vrij', 'vroeg', 'vry', 'waar', 'waarom', 'wanneer', 'want', 'waren', 'was', 'wat', 'we', 'weer', 'weg', 'wege', 'wegens', 'weinig', 'weinige', 'wel', 'weldra', 'welk', 'welke', 'welken', 'welker', 'werd', 'werden', 'werdt', 'wezen', 'wie', 'wiens', 'wier', 'wierd', 'wierden', 'wij', 'wijzelf', 'wil', 'wilde', 'worden', 'wordt', 'wy', 'wyze', 'wyzelf', 'zal', 'ze', 'zeer', 'zei', 'zeker', 'zekere', 'zelf', 'zelfde', 'zelfs', 'zelve', 'zelven', 'zelvs', 'zich', 'zichzelf', 'zichzelve', 'zichzelven', 'zie', 'zig', 'zij', 'zijn', 'zijnde', 'zijne', 'zijner', 'zo', 'zo'n', 'zoals', 'zodra', 'zommige', 'zommigen', 'zonder', 'zoo', 'zou', 'zoude', 'zouden', 'zoveel', 'zowat', 'zulk', 'zulke', 'zulks', 'zullen', 'zult', 'zy', 'zyn', 'zynde', 'zyne', 'zynen', 'zyner', 'zyns'
    ];

    return keywords.filter((keyword) => {
        return common.indexOf(keyword.toLowerCase()) === -1;
    });
};

/**
 * Remove words that will match but shouldn't. F.E. words that match because they have the same suffix as a street name
 * @param keywords
 */
const applyBlocklist = (keywords: Keywords): Keywords => {
    const blocklist = ['simpelweg', 'gewoonweg', 'overslaan'];

    return keywords.filter((keyword) => {
        return blocklist.indexOf(keyword.toLowerCase()) === -1;
    });
};

/**
 * Remove words just consisting of numbers from the text
 * @param keywords
 */
const removeNumbers = (keywords: Keywords): Keywords => {
    return keywords.filter((keyword) => {
        return !keyword.match(/^\d+$/);
    });
};

/**
 * Make the keywords contain only unique words
 * @param keywords
 */
export const removeDoubles = (keywords: Keywords): Keywords => {
    const undoubled: string[] = [];
    return keywords.filter((keyword) => {
        if (undoubled.indexOf(keyword) === -1) {
            undoubled.push(keyword);
            return true;
        }
        return false;
    });
};

/**
 * Calculate the score based on length and number of times used
 * @param word
 * @param count
 */
const getWordScore = (word: string, count: number): number => {
    const wordCountMaxScore = 10;
    const wordLengthMaxScore = 10;
    // only if a word is bigger than 5 chars are we adding word length score
    const extraWordLength = Math.max(word.length - 5, 0);

    let points = Math.floor(Math.min(count / wordCountMaxScore, wordCountMaxScore));
    points += Math.floor(Math.min(extraWordLength / wordLengthMaxScore, wordLengthMaxScore));

    return points;
};
