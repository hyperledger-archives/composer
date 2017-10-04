import { ConnectionProfileStore } from 'composer-common';
import { BrowserConnectionProfileStore } from './browserconnectionprofilestore';
/* tslint:disable:no-var-requires */
const ProxyConnectionProfileStore = require('composer-connector-proxy').ProxyConnectionProfileStore;

/**
 * The playground connection profile store provides a combined view over a connection
 * profile store persisted in the web browser (for web connection profiles) and a
 * connection profile store persisted in the connector server (for other connection
 * profile types).
 */
export class PlaygroundConnectionProfileStore extends ConnectionProfileStore {

    browserConnectionProfileStore: ConnectionProfileStore = null;
    proxyConnectionProfileStore: ConnectionProfileStore = null;

    constructor() {
        super();
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyConnectionProfileStore.setConnectorServerURL(window.location.origin);
        }
        this.browserConnectionProfileStore = new BrowserConnectionProfileStore();
        this.proxyConnectionProfileStore = new ProxyConnectionProfileStore();
    }

    /**
     * Loads connectOptions for a given connection profile.
     * @param {string} connectionProfile The name of the connection profile to load
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    load(connectionProfile): Promise<any> {
        // Try loading it from the browser first.
        return this.browserConnectionProfileStore.load(connectionProfile)
            .catch((error) => {
                // No - try loading it from the connector server instead.
                return this.proxyConnectionProfileStore.load(connectionProfile);
            });
    }

    /**
     * Save connectOptions for a given connection profile.
     * @param {string} connectionProfile The name of the connection profile to save
     * @param {Object} connectOptions The connection options object
     * @return {Promise} A promise that once the data is written
     */
    save(connectionProfile, connectOptions): Promise<void> {
        if (connectOptions.type === 'web') {
            // Web connection profile - save to the browser.
            return this.browserConnectionProfileStore.save(connectionProfile, connectOptions);
        } else {
            // Any other connection profile - save it to the connector server.
            return this.proxyConnectionProfileStore.save(connectionProfile, connectOptions);
        }
    }

    /**
     * Loads all of the connection profiles.
     * @return {Promise} A promise that is resolved with a JS Object where the
     * keys are the connection profiles, and the values are the connection options.
     */
    loadAll(): Promise<any> {
        const result = {};
        // Load all of the browser connection profiles.
        return this.browserConnectionProfileStore.loadAll()
            .then((profiles) => {
                Object.assign(result, profiles);
                // Load all of the connector server connection profiles.
                return this.proxyConnectionProfileStore.loadAll();
            })
            .then((profiles) => {
                Object.assign(result, profiles);
                return result;
            });
    }

    /**
     * Delete the given connection profile.
     * @param {string} connectionProfile The name of the connection profile to delete
     * @return {Promise} A promise that is resolved when the connection profile
     * is deleted.
     */
    delete(connectionProfile): Promise<void> {
        // Load the connection profile first so we can figure out what type it is.
        return this.load(connectionProfile)
            .catch(() => {
                // Ignore error and just fall through.
            })
            .then((connectOptions) => {
                if (!connectOptions) {
                    // Don't do anything - connection profile doesn't exist.
                } else if (connectOptions.type === 'web') {
                    // Web connection profile - save to the browser.
                    return this.browserConnectionProfileStore.delete(connectionProfile);
                } else {
                    // Any other connection profile - save it to the connector server.
                    return this.proxyConnectionProfileStore.delete(connectionProfile);
                }
            });
    }
}
