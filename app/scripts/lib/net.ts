import { getDom } from './dom';

/**
 * Get the html for an body or an empty string if anything went wrong
 * @param url
 */
export const getArticleBody = (url: string): Promise<DocumentFragment | null | void> => {
    return fetch(url)
        .then((response) => {
            if (response.ok) {
                return response.text()
                    .then(body => getDom(body.replace(/[\n\r]/g, '')));
            }

            return Promise.resolve(null);
        })
        .catch((e) => {
            console.log(e);
        });
};
