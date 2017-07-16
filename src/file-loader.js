"use strict";

/**
 * Helper class to asynchronously load binary files.
 */
class FileLoader {

    /**
     * @param {string} fileName
     * @return {Promise<ArrayBuffer>}
     */
    static async load(fileName) {
        return new Promise((resolve) => {
            const client = new XMLHttpRequest();
            client.open('GET', fileName, true);
            client.responseType = 'arraybuffer';
            client.addEventListener('readystatechange', () => {
                if (client.readyState === XMLHttpRequest.DONE) {
                    resolve(client.response);
                }
            });
            client.send();
        });
    }
}
