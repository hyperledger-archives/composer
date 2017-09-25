import { ConnectionProfileStore } from 'composer-common';

/**
 * The playground connection profile store provides a combined view over a connection
 * profile store persisted in the web browser
 */
export class BrowserConnectionProfileStore extends ConnectionProfileStore {

    private webStorage: Storage;
    private prefix = 'connection-profile';

    constructor() {
        super();

        this.webStorage = window.localStorage;
    }

    /**
     * Loads connectOptions for a given connection profile.
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile): Promise<any> {
        let item = this.webStorage ? this.webStorage.getItem(this.prefix + connectionProfile) : null;
        if (!item || item === 'null') {
            return Promise.reject('does not exist ' + connectionProfile);
        }

        return Promise.resolve(JSON.parse(item));
    }

    /**
     * Save connectOptions for a given connection profile.
     * @param {string} connectionProfile The name of the connection profile to save
     * @param {Object} connectOptions The connection options object
     * @return {Promise} A promise that once the data is written
     */
    save(connectionProfile, connectOptions): Promise<void> {
        return Promise.resolve(this.webStorage.setItem(this.prefix + connectionProfile, JSON.stringify(connectOptions)));
    }

    /**
     * Loads all of the connection profiles.
     * @return {Promise} A promise that is resolved with a JS Object where the
     * keys are the connection profiles, and the values are the connection options.
     */
    loadAll(): Promise<any> {
        let prefixLength = this.prefix.length;
        let connectionProfiles = {};

        let keys = Object.keys(this.webStorage);

        return keys.reduce((promise, key) => {
            return promise.then(() => {
                if (key.substr(0, prefixLength) === this.prefix) {
                    let name = key.substr(prefixLength);
                    return this.load(name).then((data) => {
                        return connectionProfiles[name] = data;
                    });
                }
            });
        }, Promise.resolve()).then(() => {
            return connectionProfiles;
        });
    }

    /**
     * Delete the given connection profile.
     * @param {string} connectionProfile The name of the connection profile to delete
     * @return {Promise} A promise that is resolved when the connection profile
     * is deleted.
     */
    delete(connectionProfile): Promise<void> {
        return Promise.resolve(this.webStorage.removeItem(this.prefix + connectionProfile));
    }
}
