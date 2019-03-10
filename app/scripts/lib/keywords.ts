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

    // console.log('foundKeywords', foundKeywords);

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
    keywords = removeNumbers(keywords);
    return keywords;
};

/**
 * Remove common words from the text
 * @param keywords
 */
const removeCommonWords = (keywords: Keywords): Keywords => {
    const common = [
        '', 'de', 'het', 'een', 'dit', 'dat', 'die', 'dus', 'er', 'op', 'in', 'aan', 'met', 'van', 'ter', 'is', 'tot', 'om', 'rond', 'hen', 'hun', 'haar', 'zijn', 'mijn', 'jullie', 'ze', 'we',
        'al', 'veel', 'moet', 'wordt', 'worden', 'zijn', 'door', 'waar', 'en', 'bij'
    ];

    return keywords.filter((keyword) => {
        return common.indexOf(keyword.toLowerCase()) === -1;
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
