/**
 * Get key/value pairs from a string. f.e. x=1 foo="bar" bee='boo"'
 * Since we lack a good client side dom parser and regular expressions are not supported fully enough
 * we do it old school, character by character.
 * @param str
 */
export const parse = (str: string) => {
    const result: any = {};
    const chars = str.split('');

    let state = {
        KEY_CHAR: 1,
        VAL_CHAR: 0,
        SINGLE_QUOTE_OPEN: 0,
        DOUBLE_QUOTE_OPEN: 0,
        ESCAPED_CHAR: 0,
    };

    // save the key while building it or the value
    let key: string = '';
    // the current string being built
    let current: string = '';

    // loops over each character
    chars.forEach((char) => {
        // if there is no special character, or it is being escaped, just add the character to the current string
        if ((char !== '=' && char !== ' ' && char !== '\t' && char !== '\'' && char != '"' && char != '\\') || state.ESCAPED_CHAR) {
            current += char;
            // if a character would be escaped it is now done
            state = { ...state, ESCAPED_CHAR: 0 };
        } else {
            // handle special cases
            switch (char) {

                case '=':
                    if (!state.SINGLE_QUOTE_OPEN && !state.DOUBLE_QUOTE_OPEN) {
                        state = { ...state, KEY_CHAR: 0, VAL_CHAR: 1 };
                        key = current;
                        current = '';
                    } else {
                        current += char;
                    }
                    break;
                case ' ':
                case '\t':
                    if (!state.SINGLE_QUOTE_OPEN && !state.DOUBLE_QUOTE_OPEN) {
                        if (state.KEY_CHAR) {
                            result[current] = null;
                        } else {
                            result[key] = current;
                        }

                        key = '';
                        current = '';
                        state = { ...state, KEY_CHAR: 1, VAL_CHAR: 0 };
                    } else {
                        current += char;
                    }
                    break;
                case '"':
                    if (!state.DOUBLE_QUOTE_OPEN && !state.SINGLE_QUOTE_OPEN) {
                        state = { ...state, DOUBLE_QUOTE_OPEN: 1 };
                    } else if (state.DOUBLE_QUOTE_OPEN) {
                        state = { ...state, DOUBLE_QUOTE_OPEN: 0 };
                    } else {
                        current += char;
                    }
                    break;
                case '\'':
                    if (!state.SINGLE_QUOTE_OPEN && !state.DOUBLE_QUOTE_OPEN) {
                        state = { ...state, SINGLE_QUOTE_OPEN: 1 };
                    } else if (state.SINGLE_QUOTE_OPEN) {
                        state = { ...state, SINGLE_QUOTE_OPEN: 0 };
                    } else {
                        current += char;
                    }
                    break;
                case '\\':
                    state = { ...state, ESCAPED_CHAR: 1 };
                    break;
            }
        }
    });

    if (!state.SINGLE_QUOTE_OPEN && !state.DOUBLE_QUOTE_OPEN) {
        if (state.KEY_CHAR) {
            result[current] = null;
        } else {
            result[key] = current;
        }
    }

    return result;
};
